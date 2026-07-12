import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data for safe re-seeding
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ──
  const pw = (plain: string) => bcrypt.hashSync(plain, 10);
  await prisma.user.create({ data: { name: "Sarah Connor", email: "admin@transitops.com", passwordHash: pw("admin"), role: "Fleet Manager" } });
  await prisma.user.create({ data: { name: "Alex Mercer", email: "driver@transitops.com", passwordHash: pw("driver"), role: "Driver" } });
  await prisma.user.create({ data: { name: "John Doe", email: "safety@transitops.com", passwordHash: pw("safety"), role: "Safety Officer" } });
  await prisma.user.create({ data: { name: "Emma Watson", email: "finance@transitops.com", passwordHash: pw("finance"), role: "Financial Analyst" } });

  // ── Vehicles ──
  const v1 = await prisma.vehicle.create({ data: { registrationNumber: "KA-05-MA-1024", model: "Ford Transit", type: "Van", capacity: 500, odometer: 12000, acquisitionCost: 25000, status: "Available" } });
  const v2 = await prisma.vehicle.create({ data: { registrationNumber: "KA-03-TC-8899", model: "Volvo FH16", type: "Truck", capacity: 5000, odometer: 85000, acquisitionCost: 75000, status: "Available" } });
  const v3 = await prisma.vehicle.create({ data: { registrationNumber: "KA-01-SP-4433", model: "Mercedes Sprinter", type: "Van", capacity: 1200, odometer: 45000, acquisitionCost: 42000, status: "Available" } });
  const v4 = await prisma.vehicle.create({ data: { registrationNumber: "KA-02-RT-0011", model: "Tata Ultra Truck", type: "Truck", capacity: 3500, odometer: 110000, acquisitionCost: 35000, status: "In Shop" } });
  const v5 = await prisma.vehicle.create({ data: { registrationNumber: "TX-4471", model: "Volvo FH16", type: "Truck", capacity: 24000, odometer: 32000, acquisitionCost: 82000, status: "Available" } });
  const v6 = await prisma.vehicle.create({ data: { registrationNumber: "TX-8820", model: "Scania R450", type: "Truck", capacity: 18000, odometer: 67000, acquisitionCost: 71000, status: "Available" } });

  // ── Drivers ──
  const d1 = await prisma.driver.create({ data: { name: "Marcus Reid", licenseNumber: "DL-99231", licenseCategory: "Class A Commercial", licenseExpiry: new Date("2027-04-12"), phone: "9876543210", safetyScore: 96, status: "Available" } });
  const d2 = await prisma.driver.create({ data: { name: "Elena Torres", licenseNumber: "DL-77410", licenseCategory: "Class B Commercial", licenseExpiry: new Date("2026-11-03"), phone: "9876543211", safetyScore: 92, status: "Available" } });
  const d3 = await prisma.driver.create({ data: { name: "Sam Okafor", licenseNumber: "DL-55028", licenseCategory: "Standard", licenseExpiry: new Date("2028-02-21"), phone: "9876543212", safetyScore: 88, status: "Available" } });
  const d4 = await prisma.driver.create({ data: { name: "Priya Nair", licenseNumber: "DL-33817", licenseCategory: "Class A Commercial", licenseExpiry: new Date("2026-09-15"), phone: "9876543213", safetyScore: 94, status: "Off Duty" } });
  const d5 = await prisma.driver.create({ data: { name: "Dylan Cho", licenseNumber: "DL-11294", licenseCategory: "Class B Commercial", licenseExpiry: new Date("2027-07-30"), phone: "9876543214", safetyScore: 81, status: "Available" } });

  // ── Trips ──
  await prisma.trip.create({ data: { vehicleId: v1.id, driverId: d1.id, source: "Dallas", destination: "Houston", cargoWeight: 350, distance: 385, status: "Completed", revenue: 2400, fuelConsumed: 48 } });
  await prisma.trip.create({ data: { vehicleId: v2.id, driverId: d2.id, source: "Austin", destination: "San Antonio", cargoWeight: 2800, distance: 128, status: "Completed", revenue: 1200, fuelConsumed: 22 } });
  await prisma.trip.create({ data: { vehicleId: v3.id, driverId: d3.id, source: "Houston", destination: "El Paso", cargoWeight: 900, distance: 1180, status: "Completed", revenue: 5600, fuelConsumed: 142 } });
  await prisma.trip.create({ data: { vehicleId: v5.id, driverId: d5.id, source: "Bangalore", destination: "Chennai", cargoWeight: 15000, distance: 350, status: "Completed", revenue: 8500, fuelConsumed: 65 } });

  // ── Maintenance ──
  await prisma.maintenanceLog.create({ data: { vehicleId: v4.id, description: "Engine overhaul and transmission repair", cost: 4500, status: "Open" } });
  await prisma.maintenanceLog.create({ data: { vehicleId: v1.id, description: "Brake pad replacement", cost: 320, status: "Closed" } });

  // ── Fuel logs ──
  await prisma.fuelLog.create({ data: { vehicleId: v1.id, litres: 60, cost: 5400, distance: 385 } });
  await prisma.fuelLog.create({ data: { vehicleId: v2.id, litres: 28, cost: 2520, distance: 128 } });
  await prisma.fuelLog.create({ data: { vehicleId: v3.id, litres: 178, cost: 16020, distance: 1180 } });
  await prisma.fuelLog.create({ data: { vehicleId: v5.id, litres: 82, cost: 7380, distance: 350 } });

  // ── Expenses ──
  await prisma.expense.create({ data: { vehicleId: v1.id, category: "Fuel", amount: 5400, date: new Date("2026-07-08") } });
  await prisma.expense.create({ data: { vehicleId: v2.id, category: "Toll", amount: 680, date: new Date("2026-07-09") } });
  await prisma.expense.create({ data: { vehicleId: v4.id, category: "Maintenance", amount: 4500, date: new Date("2026-07-06") } });
  await prisma.expense.create({ data: { vehicleId: v5.id, category: "Fuel", amount: 7380, date: new Date("2026-07-10") } });
  await prisma.expense.create({ data: { vehicleId: v3.id, category: "Insurance", amount: 12000, date: new Date("2026-06-01") } });

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
