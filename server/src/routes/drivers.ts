import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth";

const prisma = new PrismaClient();
const router = Router();

const driverSchema = z.object({
  name: z.string().min(2),
  licenseNumber: z.string().min(2),
  licenseCategory: z.string().default("Standard"),
  licenseExpiry: z.string().transform((s: string) => new Date(s)),
  phone: z.string().optional().nullable(),
  safetyScore: z.number().min(0).max(100).default(100),
  status: z.enum(["Available", "On Trip", "Off Duty", "Suspended"]).default("Available"),
  imageUrl: z.string().url().optional().nullable(),
});

// GET /api/drivers
router.get("/", authenticate, async (_req: Request, res: Response) => {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { trips: true } } },
    });
    res.json(drivers);
  } catch {
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

// POST /api/drivers
router.post("/", authenticate, authorize("Fleet Manager"), async (req: Request, res: Response) => {
  try {
    const body = driverSchema.parse(req.body);
    const exists = await prisma.driver.findUnique({ where: { licenseNumber: body.licenseNumber } });
    if (exists) {
      res.status(409).json({ error: "License number already registered" });
      return;
    }
    const driver = await prisma.driver.create({ data: body });
    res.status(201).json(driver);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: err.errors });
      return;
    }
    res.status(500).json({ error: "Failed to create driver" });
  }
});

// PUT /api/drivers/:id
router.put("/:id", authenticate, authorize("Fleet Manager"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = driverSchema.partial().parse(req.body);
    const driver = await prisma.driver.update({ where: { id }, data: body });
    res.json(driver);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: err.errors });
      return;
    }
    res.status(500).json({ error: "Failed to update driver" });
  }
});

export default router;
