// db.js - LocalStorage Database for TransitOps (database part Only)

const DEFAULT_USERS = [
  { id: "u-1", email: "admin@transitops.com", password: "admin", name: "Sarah Connor", role: "Fleet Manager" },
  { id: "u-2", email: "driver@transitops.com", password: "driver", name: "Alex Mercer", role: "Driver" },
  { id: "u-3", email: "safety@transitops.com", password: "safety", name: "John Doe", role: "Safety Officer" },
  { id: "u-4", email: "finance@transitops.com", password: "finance", name: "Emma Watson", role: "Financial Analyst" }
];

const DEFAULT_VEHICLES = [
  { id: "v-1", registrationNumber: "KA-05-MA-1024", nameModel: "Van-05 (Ford Transit)", type: "Van", maxLoadCapacity: 500, odometer: 12000, acquisitionCost: 25000, status: "Available" },
  { id: "v-2", registrationNumber: "KA-03-TC-8899", nameModel: "Truck-02 (Volvo FH16)", type: "Truck", maxLoadCapacity: 5000, odometer: 85000, acquisitionCost: 75000, status: "Available" },
  { id: "v-3", registrationNumber: "KA-01-SP-4433", nameModel: "Mercedes Sprinter", type: "Van", maxLoadCapacity: 1200, odometer: 45000, acquisitionCost: 42000, status: "Available" },
  { id: "v-4", registrationNumber: "KA-02-RT-0011", nameModel: "Tata Ultra Truck", type: "Truck", maxLoadCapacity: 3500, odometer: 110000, acquisitionCost: 35000, status: "Retired" }
];

const DEFAULT_DRIVERS = [
  { id: "d-1", name: "Alex", licenseNumber: "DL-552341", licenseCategory: "Class A Commercial", licenseExpiryDate: "2028-12-31", contactNumber: "9876543210", safetyScore: 95, status: "Available" },
  { id: "d-2", name: "John", licenseNumber: "DL-998822", licenseCategory: "Class B Commercial", licenseExpiryDate: "2027-05-15", contactNumber: "9876543211", safetyScore: 88, status: "Available" },
  { id: "d-3", name: "Robert", licenseNumber: "DL-443311", licenseCategory: "Standard", licenseExpiryDate: "2029-08-20", contactNumber: "9876543212", safetyScore: 82, status: "Off Duty" },
  { id: "d-4", name: "Mike (Expired)", licenseNumber: "DL-112233", licenseCategory: "Class A Commercial", licenseExpiryDate: "2025-06-01", contactNumber: "9876543213", safetyScore: 40, status: "Suspended" }
];

// Initialize Storage
function initStorage(key, defaultVal) {
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
  }
}

initStorage("to_users", DEFAULT_USERS);
initStorage("to_vehicles", DEFAULT_VEHICLES);
initStorage("to_drivers", DEFAULT_DRIVERS);

// DB Helper Module
window.db = {
  getUsers: () => JSON.parse(localStorage.getItem("to_users")),
  getVehicles: () => JSON.parse(localStorage.getItem("to_vehicles")),
  getDrivers: () => JSON.parse(localStorage.getItem("to_drivers")),

  saveUsers: (data) => localStorage.setItem("to_users", JSON.stringify(data)),
  saveVehicles: (data) => localStorage.setItem("to_vehicles", JSON.stringify(data)),
  saveDrivers: (data) => localStorage.setItem("to_drivers", JSON.stringify(data)),

  addVehicle: (vehicle) => {
    const list = window.db.getVehicles();
    const exists = list.some(v => v.registrationNumber.toLowerCase() === vehicle.registrationNumber.toLowerCase());
    if (exists) throw new Error("Vehicle Registration Number must be unique.");
    vehicle.id = "v-" + Date.now();
    list.push(vehicle);
    window.db.saveVehicles(list);
    return vehicle;
  },

  updateVehicle: (id, updatedFields) => {
    const list = window.db.getVehicles();
    const idx = list.findIndex(v => v.id === id);
    if (idx !== -1) {
      if (updatedFields.registrationNumber) {
        const exists = list.some(v => v.id !== id && v.registrationNumber.toLowerCase() === updatedFields.registrationNumber.toLowerCase());
        if (exists) throw new Error("Vehicle Registration Number must be unique.");
      }
      list[idx] = { ...list[idx], ...updatedFields };
      window.db.saveVehicles(list);
    }
  },

  deleteVehicle: (id) => {
    const list = window.db.getVehicles();
    const updated = list.filter(v => v.id !== id);
    window.db.saveVehicles(updated);
  },

  addDriver: (driver) => {
    const list = window.db.getDrivers();
    driver.id = "d-" + Date.now();
    list.push(driver);
    window.db.saveDrivers(list);
    return driver;
  },

  updateDriver: (id, updatedFields) => {
    const list = window.db.getDrivers();
    const idx = list.findIndex(d => d.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedFields };
      window.db.saveDrivers(list);
    }
  },

  deleteDriver: (id) => {
    const list = window.db.getDrivers();
    const updated = list.filter(d => d.id !== id);
    window.db.saveDrivers(updated);
  }
};
