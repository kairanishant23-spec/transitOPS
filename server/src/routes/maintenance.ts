import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth";

const prisma = new PrismaClient();
const router = Router();

const maintenanceSchema = z.object({
  vehicleId: z.string(),
  description: z.string().min(3),
  cost: z.number().min(0).default(0),
  date: z.string().transform((s) => new Date(s)).optional(),
});

// GET /api/maintenance
router.get("/", authenticate, async (_req: Request, res: Response) => {
  try {
    const logs = await prisma.maintenanceLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { vehicle: { select: { registrationNumber: true, model: true } } },
    });
    res.json(logs);
  } catch {
    res.status(500).json({ error: "Failed to fetch maintenance logs" });
  }
});

// POST /api/maintenance
router.post("/", authenticate, authorize("Fleet Manager", "Safety Officer"), async (req: Request, res: Response) => {
  try {
    const body = maintenanceSchema.parse(req.body);

    const vehicle = await prisma.vehicle.findUnique({ where: { id: body.vehicleId } });
    if (!vehicle) { res.status(404).json({ error: "Vehicle not found" }); return; }

    const [log] = await prisma.$transaction([
      prisma.maintenanceLog.create({ data: { ...body, status: "Open" } }),
      prisma.vehicle.update({ where: { id: body.vehicleId }, data: { status: "In Shop" } }),
      prisma.expense.create({
        data: { vehicleId: body.vehicleId, category: "Maintenance", amount: body.cost },
      }),
    ]);

    res.status(201).json(log);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: err.errors });
      return;
    }
    res.status(500).json({ error: "Failed to create maintenance log" });
  }
});

// PUT /api/maintenance/:id/close
router.put("/:id/close", authenticate, authorize("Fleet Manager", "Safety Officer"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const log = await prisma.maintenanceLog.findUnique({ where: { id } });
    if (!log) { res.status(404).json({ error: "Maintenance log not found" }); return; }
    if (log.status === "Closed") {
      res.status(400).json({ error: "Already closed" });
      return;
    }

    // Check if vehicle should remain retired
    const vehicle = await prisma.vehicle.findUnique({ where: { id: log.vehicleId } });
    const newStatus = vehicle?.status === "Retired" ? "Retired" : "Available";

    const [updated] = await prisma.$transaction([
      prisma.maintenanceLog.update({ where: { id }, data: { status: "Closed" } }),
      prisma.vehicle.update({ where: { id: log.vehicleId }, data: { status: newStatus } }),
    ]);

    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to close maintenance log" });
  }
});

export default router;
