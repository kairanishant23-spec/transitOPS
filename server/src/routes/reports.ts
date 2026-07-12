import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";

const prisma = new PrismaClient();
const router = Router();

// GET /api/reports/dashboard — KPI aggregations
router.get("/dashboard", authenticate, async (_req: Request, res: Response) => {
  try {
    const [vehicles, drivers, trips, expenses] = await Promise.all([
      prisma.vehicle.findMany(),
      prisma.driver.findMany(),
      prisma.trip.findMany(),
      prisma.expense.findMany(),
    ]);

    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter((v) => v.status === "On Trip").length;
    const availableVehicles = vehicles.filter((v) => v.status === "Available").length;
    const inShopVehicles = vehicles.filter((v) => v.status === "In Shop").length;
    const retiredVehicles = vehicles.filter((v) => v.status === "Retired").length;

    const totalDrivers = drivers.length;
    const driversOnDuty = drivers.filter((d) => d.status === "On Trip" || d.status === "Available").length;
    const driversAvailable = drivers.filter((d) => d.status === "Available").length;

    const activeTrips = trips.filter((t) => t.status === "Dispatched").length;
    const pendingTrips = trips.filter((t) => t.status === "Draft").length;
    const completedTrips = trips.filter((t) => t.status === "Completed").length;

    const fleetUtilization = totalVehicles > 0
      ? Math.round(((activeVehicles + vehicles.filter((v) => v.status === "On Trip").length) / totalVehicles) * 100)
      : 0;

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalRevenue = trips.filter((t) => t.status === "Completed").reduce((s, t) => s + t.revenue, 0);

    // Expense breakdown by category
    const expenseByCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    });

    // Vehicle status distribution
    const vehicleStatusDist = { Available: availableVehicles, "On Trip": activeVehicles, "In Shop": inShopVehicles, Retired: retiredVehicles };

    res.json({
      kpis: {
        totalVehicles,
        activeVehicles,
        availableVehicles,
        inShopVehicles,
        retiredVehicles,
        totalDrivers,
        driversOnDuty,
        driversAvailable,
        activeTrips,
        pendingTrips,
        completedTrips,
        fleetUtilization,
        totalExpenses,
        totalRevenue,
      },
      charts: {
        vehicleStatusDist,
        expenseByCategory,
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to generate dashboard data" });
  }
});

// GET /api/reports/fuel — Fuel efficiency report
router.get("/fuel", authenticate, async (_req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { fuelLogs: true },
    });

    const report = vehicles.map((v) => {
      const totalLitres = v.fuelLogs.reduce((s, f) => s + f.litres, 0);
      const totalDistance = v.fuelLogs.reduce((s, f) => s + f.distance, 0);
      const totalCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
      const efficiency = totalLitres > 0 ? +(totalDistance / totalLitres).toFixed(2) : 0;

      return {
        vehicleId: v.id,
        registrationNumber: v.registrationNumber,
        model: v.model,
        totalLitres: +totalLitres.toFixed(2),
        totalDistance: +totalDistance.toFixed(2),
        totalCost: +totalCost.toFixed(2),
        efficiency, // km per litre
      };
    });

    res.json(report);
  } catch {
    res.status(500).json({ error: "Failed to generate fuel report" });
  }
});

// GET /api/reports/roi — Vehicle ROI report
router.get("/roi", authenticate, async (_req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { trips: true, expenses: true, maintenanceLogs: true, fuelLogs: true },
    });

    const report = vehicles.map((v) => {
      const revenue = v.trips.filter((t) => t.status === "Completed").reduce((s, t) => s + t.revenue, 0);
      const maintenanceCost = v.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
      const fuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
      const totalExpense = v.expenses.reduce((s, e) => s + e.amount, 0);
      const roi = v.acquisitionCost > 0
        ? +(((revenue - maintenanceCost - fuelCost) / v.acquisitionCost) * 100).toFixed(2)
        : 0;

      return {
        vehicleId: v.id,
        registrationNumber: v.registrationNumber,
        model: v.model,
        acquisitionCost: v.acquisitionCost,
        revenue,
        maintenanceCost,
        fuelCost,
        totalExpense,
        roi, // percentage
      };
    });

    res.json(report);
  } catch {
    res.status(500).json({ error: "Failed to generate ROI report" });
  }
});

// GET /api/reports/export — CSV export of trips
router.get("/export", authenticate, async (_req: Request, res: Response) => {
  try {
    const trips = await prisma.trip.findMany({
      include: {
        vehicle: { select: { registrationNumber: true } },
        driver: { select: { name: true } },
      },
    });

    const header = "Trip ID,Vehicle,Driver,Source,Destination,Distance,Cargo Weight,Status,Revenue,Fuel Consumed,Date\n";
    const rows = trips
      .map(
        (t) =>
          `${t.id},${t.vehicle.registrationNumber},"${t.driver.name}","${t.source}","${t.destination}",${t.distance},${t.cargoWeight},${t.status},${t.revenue},${t.fuelConsumed},${t.createdAt.toISOString().slice(0, 10)}`
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=transitops-trips-export.csv");
    res.send(header + rows);
  } catch {
    res.status(500).json({ error: "Failed to export data" });
  }
});

export default router;
