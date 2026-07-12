// app.js - Main Application Controller for TransitOps (Part 1 Only)

let currentUser = null;

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  checkSession();
});

// Check if user is logged in
function checkSession() {
  const saved = localStorage.getItem("to_current_user");
  if (saved) {
    currentUser = JSON.parse(saved);
    showAppPage();
  } else {
    showLoginPage();
  }
}

// Show/Hide Pages
function showLoginPage() {
  document.getElementById("auth-page").style.display = "flex";
  document.getElementById("app-page").style.display = "none";
}

function showAppPage() {
  document.getElementById("auth-page").style.display = "none";
  document.getElementById("app-page").style.display = "flex";
  
  // Set user profile
  document.getElementById("user-name").textContent = currentUser.name;
  document.getElementById("user-role").textContent = currentUser.role;
  document.getElementById("user-avatar").textContent = currentUser.name.split(" ").map(n => n[0]).join("");

  applyRBAC();
  renderDashboard();
  switchView("dashboard-panel");
}

// Quick Login handler
function quickLogin(email, password) {
  document.getElementById("login-email").value = email;
  document.getElementById("login-password").value = password;
  handleLogin();
}

// Process Login
function handleLogin() {
  const email = document.getElementById("login-email").value;
  const pass = document.getElementById("login-password").value;
  const users = window.db.getUsers();

  const user = users.find(u => u.email === email && u.password === pass);
  if (user) {
    currentUser = user;
    localStorage.setItem("to_current_user", JSON.stringify(user));
    showAppPage();
  } else {
    alert("Invalid email or password.");
  }
}

// Logout
function logout() {
  currentUser = null;
  localStorage.removeItem("to_current_user");
  showLoginPage();
}

// Role-Based Access Control (RBAC) visibility
function applyRBAC() {
  const role = currentUser.role;
  
  // Hide all by default
  document.querySelectorAll(".rbac-mgr, .rbac-safety").forEach(el => {
    el.style.display = "none";
  });

  if (role === "Fleet Manager") {
    document.querySelectorAll(".rbac-mgr, .rbac-safety").forEach(el => {
      el.style.display = "";
    });
  } else if (role === "Safety Officer") {
    document.querySelectorAll(".rbac-safety").forEach(el => {
      el.style.display = "";
    });
  }
}

// View switcher
function switchView(panelId) {
  document.querySelectorAll(".view-panel").forEach(panel => {
    panel.classList.remove("active");
  });
  const activePanel = document.getElementById(panelId);
  activePanel.classList.add("active");

  // Update menu highlight
  document.querySelectorAll(".menu-item").forEach(item => {
    item.classList.remove("active");
    if (item.getAttribute("data-panel") === panelId) {
      item.classList.add("active");
    }
  });

  // Update Page Title
  const titles = {
    "dashboard-panel": "Operational Dashboard",
    "vehicles-panel": "Vehicle Registry",
    "drivers-panel": "Driver Management"
  };
  document.getElementById("navbar-page-title").textContent = titles[panelId];

  // Render correct panel contents
  if (panelId === "dashboard-panel") renderDashboard();
  else if (panelId === "vehicles-panel") renderVehicles();
  else if (panelId === "drivers-panel") renderDrivers();
}

// ================= EVENT LISTENERS SETUP =================
function setupEventListeners() {
  // Login form
  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    handleLogin();
  });

  // Sidebar navigation
  document.querySelectorAll(".menu-item").forEach(item => {
    item.addEventListener("click", () => {
      switchView(item.getAttribute("data-panel"));
    });
  });

  // Forms submissions
  document.getElementById("vehicle-form").addEventListener("submit", handleVehicleSubmit);
  document.getElementById("driver-form").addEventListener("submit", handleDriverSubmit);
}

// Theme Toggle helper
function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("to_dark_theme", isDark);
}

// Load Theme status on start
if (localStorage.getItem("to_dark_theme") === "true") {
  document.body.classList.add("dark-mode");
}

// ================= DASHBOARD CONTROLLER =================
function renderDashboard() {
  const vehicles = window.db.getVehicles();
  const drivers = window.db.getDrivers();
  
  // Computations
  const totalVehicles = vehicles.filter(v => v.status !== "Retired").length;
  const totalDrivers = drivers.length;

  // Render to DOM
  document.getElementById("kpi-total-vehicles").textContent = totalVehicles;
  document.getElementById("kpi-total-drivers").textContent = totalDrivers;
}

// ================= VEHICLE REGISTRY =================
function renderVehicles() {
  const query = document.getElementById("vehicle-search").value.toLowerCase();
  const filterType = document.getElementById("vehicle-filter-type").value;
  const filterStatus = document.getElementById("vehicle-filter-status").value;
  
  const list = window.db.getVehicles();
  const tbody = document.getElementById("vehicles-table-body");
  tbody.innerHTML = "";

  list.forEach(v => {
    // Apply filters
    if (query && !v.nameModel.toLowerCase().includes(query) && !v.registrationNumber.toLowerCase().includes(query)) return;
    if (filterType && v.type !== filterType) return;
    if (filterStatus && v.status !== filterStatus) return;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${v.registrationNumber}</strong></td>
      <td>${v.nameModel}</td>
      <td>${v.type}</td>
      <td>${v.maxLoadCapacity}</td>
      <td>${v.odometer.toLocaleString()} km</td>
      <td>$${v.acquisitionCost.toLocaleString()}</td>
      <td><span class="badge badge-${v.status.toLowerCase().replace(" ", "")}">${v.status}</span></td>
      <td class="rbac-mgr">
        <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="editVehicle('${v.id}')">✏️</button>
        <button class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="deleteVehicle('${v.id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  applyRBAC();
}

function openVehicleModal() {
  document.getElementById("vehicle-form").reset();
  document.getElementById("vehicle-id").value = "";
  document.getElementById("vehicle-modal-title").textContent = "Add Vehicle";
  document.getElementById("vehicle-modal").style.display = "flex";
}

function editVehicle(id) {
  const list = window.db.getVehicles();
  const v = list.find(item => item.id === id);
  if (!v) return;

  document.getElementById("vehicle-id").value = v.id;
  document.getElementById("vehicle-reg").value = v.registrationNumber;
  document.getElementById("vehicle-name").value = v.nameModel;
  document.getElementById("vehicle-type").value = v.type;
  document.getElementById("vehicle-capacity").value = v.maxLoadCapacity;
  document.getElementById("vehicle-odometer").value = v.odometer;
  document.getElementById("vehicle-cost").value = v.acquisitionCost;
  document.getElementById("vehicle-status").value = v.status;

  document.getElementById("vehicle-modal-title").textContent = "Edit Vehicle";
  document.getElementById("vehicle-modal").style.display = "flex";
}

function handleVehicleSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("vehicle-id").value;
  const payload = {
    registrationNumber: document.getElementById("vehicle-reg").value.trim(),
    nameModel: document.getElementById("vehicle-name").value.trim(),
    type: document.getElementById("vehicle-type").value,
    maxLoadCapacity: parseFloat(document.getElementById("vehicle-capacity").value),
    odometer: parseFloat(document.getElementById("vehicle-odometer").value),
    acquisitionCost: parseFloat(document.getElementById("vehicle-cost").value),
    status: document.getElementById("vehicle-status").value
  };

  try {
    if (id) {
      window.db.updateVehicle(id, payload);
    } else {
      window.db.addVehicle(payload);
    }
    closeModal("vehicle-modal");
    renderVehicles();
  } catch (err) {
    alert(err.message);
  }
}

function deleteVehicle(id) {
  if (confirm("Are you sure you want to delete this vehicle?")) {
    window.db.deleteVehicle(id);
    renderVehicles();
  }
}

// ================= DRIVER REGISTRY =================
function renderDrivers() {
  const query = document.getElementById("driver-search").value.toLowerCase();
  const filterStatus = document.getElementById("driver-filter-status").value;
  
  const list = window.db.getDrivers();
  const tbody = document.getElementById("drivers-table-body");
  tbody.innerHTML = "";

  list.forEach(d => {
    if (query && !d.name.toLowerCase().includes(query) && !d.licenseNumber.toLowerCase().includes(query)) return;
    if (filterStatus && d.status !== filterStatus) return;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${d.name}</strong></td>
      <td>${d.licenseNumber}</td>
      <td>${d.licenseCategory}</td>
      <td>${d.licenseExpiryDate}</td>
      <td>${d.contactNumber}</td>
      <td><strong>${d.safetyScore} / 100</strong></td>
      <td><span class="badge badge-${d.status.toLowerCase().replace(" ", "")}">${d.status}</span></td>
      <td class="rbac-mgr rbac-safety">
        <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="editDriver('${d.id}')">✏️</button>
        <button class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="deleteDriver('${d.id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  applyRBAC();
}

function openDriverModal() {
  document.getElementById("driver-form").reset();
  document.getElementById("driver-id").value = "";
  document.getElementById("driver-modal-title").textContent = "Add Driver";
  document.getElementById("driver-modal").style.display = "flex";
}

function editDriver(id) {
  const list = window.db.getDrivers();
  const d = list.find(item => item.id === id);
  if (!d) return;

  document.getElementById("driver-id").value = d.id;
  document.getElementById("driver-name").value = d.name;
  document.getElementById("driver-license").value = d.licenseNumber;
  document.getElementById("driver-category").value = d.licenseCategory;
  document.getElementById("driver-expiry").value = d.licenseExpiryDate;
  document.getElementById("driver-contact").value = d.contactNumber;
  document.getElementById("driver-safety").value = d.safetyScore;
  document.getElementById("driver-status").value = d.status;

  document.getElementById("driver-modal-title").textContent = "Edit Driver";
  document.getElementById("driver-modal").style.display = "flex";
}

function handleDriverSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("driver-id").value;
  const payload = {
    name: document.getElementById("driver-name").value.trim(),
    licenseNumber: document.getElementById("driver-license").value.trim(),
    licenseCategory: document.getElementById("driver-category").value.trim(),
    licenseExpiryDate: document.getElementById("driver-expiry").value,
    contactNumber: document.getElementById("driver-contact").value.trim(),
    safetyScore: parseInt(document.getElementById("driver-safety").value),
    status: document.getElementById("driver-status").value
  };

  if (id) {
    window.db.updateDriver(id, payload);
  } else {
    window.db.addDriver(payload);
  }
  closeModal("driver-modal");
  renderDrivers();
}

function deleteDriver(id) {
  if (confirm("Are you sure you want to delete this driver?")) {
    window.db.deleteDriver(id);
    renderDrivers();
  }
}

// ================= MODAL ACTIONS =================
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}
window.quickLogin = quickLogin;
window.logout = logout;
window.toggleTheme = toggleTheme;
window.closeModal = closeModal;
window.openVehicleModal = openVehicleModal;
window.editVehicle = editVehicle;
window.deleteVehicle = deleteVehicle;
window.openDriverModal = openDriverModal;
window.editDriver = editDriver;
window.deleteDriver = deleteDriver;
window.renderVehicles = renderVehicles;
window.renderDrivers = renderDrivers;
