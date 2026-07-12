// ============================================================
// db.js — TransitOps LocalStorage Database Engine
// Supports: Vehicles, Drivers, Trips, Expenses, User Profile
// All data seeded in Indian format (INR, Indian names, RTO)
// ============================================================

// ─── DEFAULT SEED DATA ───────────────────────────────────────

const DEFAULT_PROFILE = {
  name: "Rajesh Sharma",
  role: "Fleet Manager / Admin",
  email: "rajesh.sharma@transitops.in"
};

const DEFAULT_VEHICLES = [
  {
    id: "v-1",
    regNumber: "KA-05-MA-1024",
    model: "Tata Ace Gold (Mini Van)",
    capacity: "500 kg",
    status: "Available"
  },
  {
    id: "v-2",
    regNumber: "KA-03-TC-8899",
    model: "Ashok Leyland 3520 (Heavy Truck)",
    capacity: "5000 kg",
    status: "Active"
  },
  {
    id: "v-3",
    regNumber: "KA-01-SP-4433",
    model: "Mahindra Supro Van",
    capacity: "1200 kg",
    status: "In Shop"
  },
  {
    id: "v-4",
    regNumber: "MH-14-DK-7721",
    model: "Tata Ultra 1918 (Heavy Truck)",
    capacity: "3500 kg",
    status: "Available"
  },
  {
    id: "v-5",
    regNumber: "TN-09-BC-3300",
    model: "Eicher Pro 3015 (Medium Truck)",
    capacity: "2000 kg",
    status: "Active"
  }
];

const DEFAULT_DRIVERS = [
  {
    id: "d-1",
    name: "Arjun Verma",
    license: "KA-2019-0055234",
    expiry: "2028-12-31",
    safetyScore: 95,
    status: "On Duty"
  },
  {
    id: "d-2",
    name: "Suresh Reddy",
    license: "MH-2020-0098822",
    expiry: "2027-05-15",
    safetyScore: 88,
    status: "On Duty"
  },
  {
    id: "d-3",
    name: "Ramesh Kumar",
    license: "TN-2021-0044311",
    expiry: "2029-08-20",
    safetyScore: 82,
    status: "Off Duty"
  },
  {
    id: "d-4",
    name: "Mohan Gupta",
    license: "DL-2018-0011233",
    expiry: "2025-06-01",
    safetyScore: 40,
    status: "Off Duty"
  },
  {
    id: "d-5",
    name: "Vikram Patil",
    license: "MH-2022-0077564",
    expiry: "2030-03-10",
    safetyScore: 91,
    status: "On Duty"
  }
];

const DEFAULT_TRIPS = [
  {
    id: "TR-1001",
    vehicleId: "v-2",
    driverId: "d-1",
    source: "Bangalore",
    destination: "Chennai",
    cargoWeight: 4200,
    distance: 348,
    cost: 12500,
    status: "Completed",
    date: "2026-07-01"
  },
  {
    id: "TR-1002",
    vehicleId: "v-5",
    driverId: "d-2",
    source: "Mumbai",
    destination: "Pune",
    cargoWeight: 1800,
    distance: 150,
    cost: 4800,
    status: "Completed",
    date: "2026-07-03"
  },
  {
    id: "TR-1003",
    vehicleId: "v-1",
    driverId: "d-3",
    source: "Delhi",
    destination: "Jaipur",
    cargoWeight: 450,
    distance: 281,
    cost: 7200,
    status: "Completed",
    date: "2026-07-05"
  },
  {
    id: "TR-1004",
    vehicleId: "v-2",
    driverId: "d-1",
    source: "Bangalore",
    destination: "Hyderabad",
    cargoWeight: 4800,
    distance: 570,
    cost: 18000,
    status: "Dispatched",
    date: "2026-07-10"
  },
  {
    id: "TR-1005",
    vehicleId: "v-5",
    driverId: "d-5",
    source: "Chennai",
    destination: "Coimbatore",
    cargoWeight: 1500,
    distance: 215,
    cost: 6500,
    status: "Dispatched",
    date: "2026-07-11"
  }
];

const DEFAULT_EXPENSES = [
  {
    id: "EX-001",
    vehicleId: "v-2",
    type: "Fuel",
    amount: 4500,
    date: "2026-07-01"
  },
  {
    id: "EX-002",
    vehicleId: "v-3",
    type: "Maintenance",
    amount: 12000,
    date: "2026-07-02"
  },
  {
    id: "EX-003",
    vehicleId: "v-5",
    type: "Fuel",
    amount: 3200,
    date: "2026-07-03"
  },
  {
    id: "EX-004",
    vehicleId: "v-1",
    type: "Toll",
    amount: 850,
    date: "2026-07-05"
  },
  {
    id: "EX-005",
    vehicleId: "v-4",
    type: "Fuel",
    amount: 5100,
    date: "2026-07-08"
  },
  {
    id: "EX-006",
    vehicleId: "v-2",
    type: "Maintenance",
    amount: 8500,
    date: "2026-07-09"
  }
];

// ─── STORAGE INITIALIZER ─────────────────────────────────────

function initStorage(key, defaultVal) {
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
  }
}

initStorage("to_profile",  DEFAULT_PROFILE);
initStorage("to_vehicles", DEFAULT_VEHICLES);
initStorage("to_drivers",  DEFAULT_DRIVERS);
initStorage("to_trips",    DEFAULT_TRIPS);
initStorage("to_expenses", DEFAULT_EXPENSES);

// ─── UNIQUE ID GENERATOR ─────────────────────────────────────

function genId(prefix) {
  return prefix + "-" + Date.now();
}

// ─── DB MODULE ───────────────────────────────────────────────

window.db = {

  // ── PROFILE ──────────────────────────────────────────────
  getProfile: () => JSON.parse(localStorage.getItem("to_profile")),
  saveProfile: (data) => localStorage.setItem("to_profile", JSON.stringify(data)),

  // ── VEHICLES ─────────────────────────────────────────────
  getVehicles: () => JSON.parse(localStorage.getItem("to_vehicles")),
  saveVehicles: (data) => localStorage.setItem("to_vehicles", JSON.stringify(data)),

  addVehicle(vehicle) {
    const list = this.getVehicles();
    // Business Rule: Registration number must be unique
    const exists = list.some(
      v => v.regNumber.trim().toLowerCase() === vehicle.regNumber.trim().toLowerCase()
    );
    if (exists) throw new Error("Registration Number already exists. Must be unique.");
    vehicle.id = genId("v");
    list.push(vehicle);
    this.saveVehicles(list);
    return vehicle;
  },

  updateVehicle(id, fields) {
    const list = this.getVehicles();
    const idx = list.findIndex(v => v.id === id);
    if (idx === -1) return;
    // Uniqueness check if reg number is changing
    if (fields.regNumber) {
      const duplicate = list.some(
        v => v.id !== id && v.regNumber.trim().toLowerCase() === fields.regNumber.trim().toLowerCase()
      );
      if (duplicate) throw new Error("Registration Number already exists. Must be unique.");
    }
    list[idx] = { ...list[idx], ...fields };
    this.saveVehicles(list);
    return list[idx];
  },

  deleteVehicle(id) {
    const list = this.getVehicles().filter(v => v.id !== id);
    this.saveVehicles(list);
  },

  getVehicleById: (id) => window.db.getVehicles().find(v => v.id === id) || null,

  // ── DRIVERS ──────────────────────────────────────────────
  getDrivers: () => JSON.parse(localStorage.getItem("to_drivers")),
  saveDrivers: (data) => localStorage.setItem("to_drivers", JSON.stringify(data)),

  addDriver(driver) {
    const list = this.getDrivers();
    driver.id = genId("d");
    list.push(driver);
    this.saveDrivers(list);
    return driver;
  },

  updateDriver(id, fields) {
    const list = this.getDrivers();
    const idx = list.findIndex(d => d.id === id);
    if (idx === -1) return;
    list[idx] = { ...list[idx], ...fields };
    this.saveDrivers(list);
    return list[idx];
  },

  deleteDriver(id) {
    const list = this.getDrivers().filter(d => d.id !== id);
    this.saveDrivers(list);
  },

  getDriverById: (id) => window.db.getDrivers().find(d => d.id === id) || null,

  // ── TRIPS ────────────────────────────────────────────────
  getTrips: () => JSON.parse(localStorage.getItem("to_trips")),
  saveTrips: (data) => localStorage.setItem("to_trips", JSON.stringify(data)),

  addTrip(trip) {
    const list = this.getTrips();
    const vehicles = this.getVehicles();
    const drivers  = this.getDrivers();
    const today = new Date();

    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    const driver  = drivers.find(d => d.id === trip.driverId);

    // ── Business Rule Validations ──
    if (!vehicle) throw new Error("Selected vehicle not found.");
    if (!driver)  throw new Error("Selected driver not found.");

    if (vehicle.status === "In Shop")
      throw new Error(`Vehicle [${vehicle.regNumber}] is currently In Shop and cannot be dispatched.`);

    if (vehicle.status === "Active")
      throw new Error(`Vehicle [${vehicle.regNumber}] is already On Trip.`);

    if (driver.status === "On Duty" && list.some(t => t.driverId === driver.id && t.status === "Dispatched"))
      throw new Error(`Driver [${driver.name}] is already assigned to an active trip.`);

    if (new Date(driver.expiry) < today)
      throw new Error(`Driver [${driver.name}] has an EXPIRED license (${driver.expiry}). Cannot dispatch.`);

    // Auto-set vehicle and driver to Active/On Duty
    this.updateVehicle(vehicle.id, { status: "Active" });
    this.updateDriver(driver.id, { status: "On Duty" });

    trip.id = "TR-" + (1000 + list.length + 1);
    trip.status = "Dispatched";
    trip.date = today.toISOString().split("T")[0];
    list.push(trip);
    this.saveTrips(list);
    return trip;
  },

  completeTrip(id) {
    const list = this.getTrips();
    const idx = list.findIndex(t => t.id === id);
    if (idx === -1) return;

    const trip = list[idx];
    list[idx].status = "Completed";
    this.saveTrips(list);

    // Release vehicle and driver back to Available / Off Duty
    this.updateVehicle(trip.vehicleId, { status: "Available" });
    this.updateDriver(trip.driverId, { status: "Off Duty" });

    return list[idx];
  },

  cancelTrip(id) {
    const list = this.getTrips();
    const idx = list.findIndex(t => t.id === id);
    if (idx === -1) return;

    const trip = list[idx];
    list[idx].status = "Cancelled";
    this.saveTrips(list);

    // Release vehicle and driver
    this.updateVehicle(trip.vehicleId, { status: "Available" });
    this.updateDriver(trip.driverId, { status: "Off Duty" });

    return list[idx];
  },

  getCompletedTrips: () => window.db.getTrips().filter(t => t.status === "Completed"),
  getActiveTrips:    () => window.db.getTrips().filter(t => t.status === "Dispatched"),

  // ── EXPENSES ─────────────────────────────────────────────
  getExpenses: () => JSON.parse(localStorage.getItem("to_expenses")),
  saveExpenses: (data) => localStorage.setItem("to_expenses", JSON.stringify(data)),

  addExpense(expense) {
    const list = this.getExpenses();
    expense.id = genId("EX");
    list.push(expense);
    this.saveExpenses(list);
    return expense;
  },

  getTotalExpenses() {
    return this.getExpenses().reduce((sum, e) => sum + Number(e.amount), 0);
  },

  getExpensesByType() {
    const types = { Fuel: 0, Toll: 0, Maintenance: 0 };
    this.getExpenses().forEach(e => {
      if (types[e.type] !== undefined) types[e.type] += Number(e.amount);
    });
    return types;
  },

  // ── DASHBOARD KPIs ───────────────────────────────────────
  getKPIs() {
    const vehicles   = this.getVehicles();
    const drivers    = this.getDrivers();
    const total      = vehicles.length;
    const active     = vehicles.filter(v => v.status === "Active").length;
    const available  = vehicles.filter(v => v.status === "Available").length;
    const inShop     = vehicles.filter(v => v.status === "In Shop").length;
    const onDuty     = drivers.filter(d => d.status === "On Duty").length;
    const utilization = total > 0 ? Math.round((active / total) * 100) : 0;
    const totalCost  = this.getTotalExpenses();

    return { active, available, inShop, onDuty, utilization, totalCost };
  }
};
