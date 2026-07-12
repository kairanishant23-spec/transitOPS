import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth";

const prisma = new PrismaClient();
const router = Router();

const vehicleSchema = z.object({
  registrationNumber: z.string().min(2),
  model: z.string().min(1),
  type: z.enum(["Van", "Truck", "Trailer"]),
  capacity: z.number().min(0).default(0),
  odometer: z.number().min(0).default(0),
  acquisitionCost: z.number().min(0).default(0),
  status: z.enum(["Available", "On Trip", "In Shop", "Retired"]).default("Available"),
  imageUrl: z.string().url().optional().nullable(),
});

// GET /api/vehicles
router.get("/", authenticate, async (_req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { trips: true, maintenanceLogs: true } } },
    });
    res.json(vehicles);
  } catch {
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
});

// POST /api/vehicles
router.post("/", authenticate, authorize("Fleet Manager"), async (req: Request, res: Response) => {
  try {
    const body = vehicleSchema.parse(req.body);

    const exists = await prisma.vehicle.findUnique({
      where: { registrationNumber: body.registrationNumber },
    });
    if (exists) {
      res.status(409).json({ error: "Vehicle registration number must be unique" });
      return;
    }

    const vehicle = await prisma.vehicle.create({ data: body });
    res.status(201).json(vehicle);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: err.errors });
      return;
    }
    res.status(500).json({ error: "Failed to create vehicle" });
  }
});

// PUT /api/vehicles/:id
router.put("/:id", authenticate, authorize("Fleet Manager"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = vehicleSchema.partial().parse(req.body);

    if (body.registrationNumber) {
      const exists = await prisma.vehicle.findFirst({
        where: { registrationNumber: body.registrationNumber, NOT: { id } },
      });
      if (exists) {
        res.status(409).json({ error: "Vehicle registration number must be unique" });
        return;
      }
    }

    const vehicle = await prisma.vehicle.update({ where: { id }, data: body });
    res.json(vehicle);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: err.errors });
      return;
    }
    res.status(500).json({ error: "Failed to update vehicle" });
  }
});

// DELETE /api/vehicles/:id
router.delete("/:id", authenticate, authorize("Fleet Manager"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.vehicle.delete({ where: { id } });
    res.json({ message: "Vehicle deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete vehicle" });
  }
});

export default router;
