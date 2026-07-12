import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authenticate } from "../middleware/auth";

const prisma = new PrismaClient();
const router = Router();

// ─── Fuel Logs ───
const fuelSchema = z.object({
  vehicleId: z.string(),
  litres: z.number().min(0),
  cost: z.number().min(0),
  distance: z.number().min(0).default(0),
  date: z.string().transform((s) => new Date(s)).optional(),
});

router.get("/fuel", authenticate, async (_req: Request, res: Response) => {
  try {
    const logs = await prisma.fuelLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { vehicle: { select: { registrationNumber: true, model: true } } },
    });
    res.json(logs);
  } catch {
    res.status(500).json({ error: "Failed to fetch fuel logs" });
  }
});

router.post("/fuel", authenticate, async (req: Request, res: Response) => {
  try {
    const body = fuelSchema.parse(req.body);
    const [log] = await prisma.$transaction([
      prisma.fuelLog.create({ data: body }),
      prisma.expense.create({
        data: { vehicleId: body.vehicleId, category: "Fuel", amount: body.cost },
      }),
    ]);
    res.status(201).json(log);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: err.errors });
      return;
    }
    res.status(500).json({ error: "Failed to log fuel" });
  }
});

// ─── Expenses ───
const expenseSchema = z.object({
  vehicleId: z.string(),
  category: z.string(),
  amount: z.number().min(0),
  litres: z.number().min(0).optional().default(0),
  date: z.string().transform((s) => new Date(s)).optional(),
});

router.get("/expenses", authenticate, async (_req: Request, res: Response) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: "desc" },
      include: { vehicle: { select: { registrationNumber: true, model: true } } },
    });
    res.json(expenses);
  } catch {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

router.post("/expenses", authenticate, async (req: Request, res: Response) => {
  try {
    const body = expenseSchema.parse(req.body);
    const expense = await prisma.expense.create({ data: body });
    res.status(201).json(expense);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: err.errors });
      return;
    }
    res.status(500).json({ error: "Failed to log expense" });
  }
});

export default router;
