import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth";
import vehicleRoutes from "./routes/vehicles";
import driverRoutes from "./routes/drivers";
import tripRoutes from "./routes/trips";
import maintenanceRoutes from "./routes/maintenance";
import fuelExpenseRoutes from "./routes/fuelExpenses";
import reportRoutes from "./routes/reports";

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000"], credentials: true }));
app.use(express.json());

// ── Health ──
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api", fuelExpenseRoutes);        // /api/fuel, /api/expenses
app.use("/api/reports", reportRoutes);

// ── Start ──
app.listen(PORT, () => {
  console.log(`🚀 TransitOps API running on http://localhost:${PORT}`);
});
