import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth";

const prisma = new PrismaClient();
const router = Router();

const tripSchema = z.object({
  vehicleId: z.string(),
  driverId: z.string(),
  source: z.string().min(1),
  destination: z.string().min(1),
  cargoWeight: z.number().min(0).default(0),
  distance: z.number().min(0).default(0),
  revenue: z.number().min(0).default(0),
});

const completeSchema = z.object({
  endOdometer: z.number().min(0).optional(),
  fuelConsumed: z.number().min(0).default(0),
  revenue: z.number().min(0).default(0),
});

// GET /api/trips
router.get("/", authenticate, async (_req: Request, res: Response) => {
  try {
    const trips = await prisma.trip.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vehicle: { select: { registrationNumber: true, model: true } },
        driver: { select: { name: true } },
      },
    });
    res.json(trips);
  } catch {
    res.status(500).json({ error: "Failed to fetch trips" });
  }
});

// POST /api/trips — Create a new trip (Draft)
router.post("/", authenticate, authorize("Fleet Manager"), async (req: Request, res: Response) => {
  try {
    const body = tripSchema.parse(req.body);

    // Validate vehicle
    const vehicle = await prisma.vehicle.findUnique({ where: { id: body.vehicleId } });
    if (!vehicle) { res.status(404).json({ error: "Vehicle not found" }); return; }
    if (vehicle.status !== "Available") {
      res.status(400).json({ error: `Vehicle is ${vehicle.status}. Must be Available.` });
      return;
    }
    if (vehicle.status === "In Shop" || vehicle.status === "Retired") {
      res.status(400).json({ error: `Vehicle cannot be assigned: status is ${vehicle.status}` });
      return;
    }

    // Validate driver
    const driver = await prisma.driver.findUnique({ where: { id: body.driverId } });
    if (!driver) { res.status(404).json({ error: "Driver not found" }); return; }
    if (driver.status === "Suspended") {
      res.status(400).json({ error: "Driver is suspended and cannot be assigned" });
      return;
    }
    if (driver.status !== "Available") {
      res.status(400).json({ error: `Driver is ${driver.status}. Must be Available.` });
      return;
    }

    // Validate license expiry
    if (new Date(driver.licenseExpiry) < new Date()) {
      res.status(400).json({ error: "Driver's license has expired" });
      return;
    }

    // Validate cargo weight vs capacity
    if (body.cargoWeight > vehicle.capacity) {
      res.status(400).json({
        error: `Cargo weight (${body.cargoWeight}kg) exceeds vehicle capacity (${vehicle.capacity}kg)`,
      });
      return;
    }

    const trip = await prisma.trip.create({ data: { ...body, status: "Draft" } });
    res.status(201).json(trip);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: err.errors });
      return;
    }
    res.status(500).json({ error: "Failed to create trip" });
  }
});

// PUT /api/trips/:id/dispatch
router.put("/:id/dispatch", authenticate, authorize("Fleet Manager"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }
    if (trip.status !== "Draft") {
      res.status(400).json({ error: `Cannot dispatch: trip status is ${trip.status}` });
      return;
    }

    // Update trip, vehicle, and driver atomically
    const [updated] = await prisma.$transaction([
      prisma.trip.update({ where: { id }, data: { status: "Dispatched" } }),
      prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "On Trip" } }),
      prisma.driver.update({ where: { id: trip.driverId }, data: { status: "On Trip" } }),
    ]);

    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to dispatch trip" });
  }
});

// PUT /api/trips/:id/complete
router.put("/:id/complete", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = completeSchema.parse(req.body);

    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }
    if (trip.status !== "Dispatched") {
      res.status(400).json({ error: `Cannot complete: trip status is ${trip.status}` });
      return;
    }

    const [updated] = await prisma.$transaction([
      prisma.trip.update({
        where: { id },
        data: { status: "Completed", ...body },
      }),
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: {
          status: "Available",
          odometer: body.endOdometer ?? undefined,
        },
      }),
      prisma.driver.update({ where: { id: trip.driverId }, data: { status: "Available" } }),
      // Create fuel log
      ...(body.fuelConsumed > 0
        ? [
            prisma.fuelLog.create({
              data: {
                vehicleId: trip.vehicleId,
                litres: body.fuelConsumed,
                cost: body.fuelConsumed * 90, // ₹90/litre estimate
                distance: trip.distance,
              },
            }),
          ]
        : []),
    ]);

    res.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: err.errors });
      return;
    }
    res.status(500).json({ error: "Failed to complete trip" });
  }
});

// PUT /api/trips/:id/cancel
router.put("/:id/cancel", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }
    if (trip.status === "Completed" || trip.status === "Cancelled") {
      res.status(400).json({ error: `Cannot cancel: trip is already ${trip.status}` });
      return;
    }

    const txns: any[] = [
      prisma.trip.update({ where: { id }, data: { status: "Cancelled" } }),
    ];

    // Restore vehicle and driver if dispatched
    if (trip.status === "Dispatched") {
      txns.push(
        prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "Available" } }),
        prisma.driver.update({ where: { id: trip.driverId }, data: { status: "Available" } }),
      );
    }

    const [updated] = await prisma.$transaction(txns);
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to cancel trip" });
  }
});

export default router;
