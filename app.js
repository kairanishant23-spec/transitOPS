/* ==========================================================================
   TransitOps — Application logic (vanilla JS + localStorage + Chart.js)
   ========================================================================== */

(function () {
  "use strict";

  /* -------------------- Storage helpers -------------------- */
  const KEYS = {
    vehicles: "transitops_vehicles",
    drivers: "transitops_drivers",
    trips: "transitops_trips",
    expenses: "transitops_expenses",
    theme: "transitops_theme",
    profile: "transitops_profile",
    notifications: "transitops_notifications",
  };

  const load = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };
  const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  /* -------------------- Seed data (first run only) -------------------- */
  function seed() {
    if (!localStorage.getItem(KEYS.vehicles)) {
      save(KEYS.vehicles, [
        { reg: "TX-4471", model: "Volvo FH16", capacity: "24t", status: "Active" },
        { reg: "TX-8820", model: "Scania R450", capacity: "18t", status: "Active" },
        { reg: "TX-1093", model: "Mercedes Actros", capacity: "22t", status: "Available" },
        { reg: "TX-3356", model: "MAN TGX", capacity: "20t", status: "Available" },
        { reg: "TX-7712", model: "DAF XF", capacity: "26t", status: "In Shop" },
        { reg: "TX-2287", model: "Iveco S-Way", capacity: "16t", status: "Active" },
      ]);
    }
    if (!localStorage.getItem(KEYS.drivers)) {
      save(KEYS.drivers, [
        { name: "Marcus Reid", license: "DL-99231", expiry: "2027-04-12", score: 96, status: "On Duty" },
        { name: "Elena Torres", license: "DL-77410", expiry: "2026-11-03", score: 92, status: "On Duty" },
        { name: "Sam Okafor", license: "DL-55028", expiry: "2028-02-21", score: 88, status: "On Duty" },
        { name: "Priya Nair", license: "DL-33817", expiry: "2026-09-15", score: 94, status: "Off Duty" },
        { name: "Dylan Cho", license: "DL-11294", expiry: "2027-07-30", score: 81, status: "Off Duty" },
      ]);
    }
    if (!localStorage.getItem(KEYS.trips)) {
      save(KEYS.trips, [
        { id: "TRP-1001", route: "Dallas → Houston", vehicle: "TX-4471", driver: "Marcus Reid", distance: 385, cost: 640, date: "2026-07-08" },
        { id: "TRP-1002", route: "Austin → San Antonio", vehicle: "TX-8820", driver: "Elena Torres", distance: 128, cost: 240, date: "2026-07-09" },
        { id: "TRP-1003", route: "Houston → El Paso", vehicle: "TX-2287", driver: "Sam Okafor", distance: 1180, cost: 1720, date: "2026-07-10" },
        { id: "TRP-1004", route: "Dallas → Austin", vehicle: "TX-1093", driver: "Priya Nair", distance: 314, cost: 520, date: "2026-07-11" },
      ]);
    }
    if (!localStorage.getItem(KEYS.expenses)) {
      save(KEYS.expenses, [
        { vehicle: "TX-4471", type: "Fuel", amount: 420.5, date: "2026-07-08" },
        { vehicle: "TX-8820", type: "Toll", amount: 68.0, date: "2026-07-09" },
        { vehicle: "TX-7712", type: "Maintenance", amount: 1250.0, date: "2026-07-06" },
        { vehicle: "TX-2287", type: "Fuel", amount: 890.75, date: "2026-07-10" },
      ]);
    }
  }

  const state = {
    get vehicles() { return load(KEYS.vehicles, []); },
    set vehicles(v) { save(KEYS.vehicles, v); },
    get drivers() { return load(KEYS.drivers, []); },
    set drivers(v) { save(KEYS.drivers, v); },
    get trips() { return load(KEYS.trips, []); },
    set trips(v) { save(KEYS.trips, v); },
    get expenses() { return load(KEYS.expenses, []); },
    set expenses(v) { save(KEYS.expenses, v); },
    get profile() { return load(KEYS.profile, { name: "A. Morgan", role: "Financial Analyst / Admin", email: "a.morgan@transitops.com" }); },
    set profile(v) { save(KEYS.profile, v); },
    get notifications() { return load(KEYS.notifications, [
      { text: "System initialized successfully.", time: "Just now" },
      { text: "Seeded data for vehicles and drivers loaded.", time: "5 mins ago" },
    ]); },
    set notifications(v) { save(KEYS.notifications, v); },
  };

  /* -------------------- Utils -------------------- */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const money = (n) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function statusBadge(status) {
    const map = {
      Active: "bg-green-500/10 text-green-600 dark:text-green-400",
      Available: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      "In Shop": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      "On Duty": "bg-green-500/10 text-green-600 dark:text-green-400",
      "Off Duty": "bg-slate-400/10 text-slate-500 dark:text-slate-400",
    };
    return `<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${map[status] || map["Off Duty"]}">
      <span class="h-1.5 w-1.5 rounded-full bg-current"></span>${esc(status)}</span>`;
  }

  /* -------------------- Icons refresh -------------------- */
  const refreshIcons = () => window.lucide && window.lucide.createIcons();

  /* ==================================================================
     THEME
     ================================================================== */
  function initTheme() {
    const saved = load(KEYS.theme, "dark");
    document.documentElement.classList.toggle("dark", saved === "dark");
    $("#themeToggle").addEventListener("click", () => {
      const isDark = document.documentElement.classList.toggle("dark");
      save(KEYS.theme, isDark ? "dark" : "light");
      updateCharts(); // re-theme chart colors
    });
  }

  /* ==================================================================
     NAVIGATION
     ================================================================== */
  function initNav() {
    $$(".nav-link").forEach((btn) => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        $$(".nav-link").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        $$(".view").forEach((v) => v.classList.remove("active"));
        $("#view-" + view).classList.add("active");
        // close mobile sidebar
        $("#sidebar").classList.remove("open");
        $("#sidebarOverlay").classList.add("hidden");
        refreshIcons();
      });
    });

    // mobile menu
    $("#menuBtn").addEventListener("click", () => {
      $("#sidebar").classList.add("open");
      $("#sidebarOverlay").classList.remove("hidden");
    });
    $("#sidebarOverlay").addEventListener("click", () => {
      $("#sidebar").classList.remove("open");
      $("#sidebarOverlay").classList.add("hidden");
    });

    // registry sub-tabs
    $$(".reg-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const t = tab.dataset.regtab;
        $$(".reg-tab").forEach((x) => {
          x.classList.remove("active", "bg-indigo-600", "text-white");
          x.classList.add("text-slate-500", "dark:text-slate-400");
        });
        tab.classList.add("active", "bg-indigo-600", "text-white");
        tab.classList.remove("text-slate-500", "dark:text-slate-400");
        $$(".reg-panel").forEach((p) => p.classList.add("hidden"));
        $("#regtab-" + t).classList.remove("hidden");
      });
    });
  }

  /* ==================================================================
     DASHBOARD KPIs
     ================================================================== */
  function renderKPIs() {
    const v = state.vehicles;
    const d = state.drivers;
    const active = v.filter((x) => x.status === "Active").length;
    const available = v.filter((x) => x.status === "Available").length;
    const inshop = v.filter((x) => x.status === "In Shop").length;
    const onDuty = d.filter((x) => x.status === "On Duty").length;
    const utilization = v.length ? Math.round((active / v.length) * 100) : 0;
    const totalCost = state.expenses.reduce((s, e) => s + Number(e.amount), 0) +
      state.trips.reduce((s, t) => s + Number(t.cost || 0), 0);

    $("#stat-active").textContent = active;
    $("#stat-available").textContent = available;
    $("#stat-inshop").textContent = inshop;
    $("#stat-drivers").textContent = onDuty;
    $("#stat-utilization").textContent = utilization + "%";
    $("#stat-cost").textContent = money(totalCost);
  }

  /* ==================================================================
     CHARTS
     ================================================================== */
  let statusChart, costChart;

  function chartTheme() {
    const dark = document.documentElement.classList.contains("dark");
    return {
      tick: dark ? "#94a3b8" : "#475569",
      grid: dark ? "rgba(148,163,184,0.12)" : "rgba(100,116,139,0.15)",
    };
  }

  function buildCharts() {
    const v = state.vehicles;
    const statusCounts = {
      Active: v.filter((x) => x.status === "Active").length,
      Available: v.filter((x) => x.status === "Available").length,
      "In Shop": v.filter((x) => x.status === "In Shop").length,
    };

    const theme = chartTheme();

    statusChart = new Chart($("#statusChart"), {
      type: "doughnut",
      data: {
        labels: ["Active", "Available", "In Shop"],
        datasets: [{
          data: [statusCounts.Active, statusCounts.Available, statusCounts["In Shop"]],
          backgroundColor: ["#22c55e", "#0ea5e9", "#f59e0b"],
          borderWidth: 0,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: { legend: { position: "bottom", labels: { color: theme.tick, padding: 16, usePointStyle: true } } },
      },
    });

    // cost by expense category
    const cats = ["Fuel", "Toll", "Maintenance"];
    const catTotals = cats.map((c) =>
      state.expenses.filter((e) => e.type === c).reduce((s, e) => s + Number(e.amount), 0)
    );

    costChart = new Chart($("#costChart"), {
      type: "bar",
      data: {
        labels: cats,
        datasets: [{
          label: "Cost (₹)",
          data: catTotals,
          backgroundColor: ["#4f46e5", "#6366f1", "#818cf8"],
          borderRadius: 8,
          maxBarThickness: 60,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: theme.tick }, grid: { display: false } },
          y: { ticks: { color: theme.tick }, grid: { color: theme.grid }, beginAtZero: true },
        },
      },
    });
  }

  function updateCharts() {
    if (!statusChart || !costChart) return;
    const theme = chartTheme();
    const v = state.vehicles;
    statusChart.data.datasets[0].data = [
      v.filter((x) => x.status === "Active").length,
      v.filter((x) => x.status === "Available").length,
      v.filter((x) => x.status === "In Shop").length,
    ];
    statusChart.options.plugins.legend.labels.color = theme.tick;
    statusChart.update();

    const cats = ["Fuel", "Toll", "Maintenance"];
    costChart.data.datasets[0].data = cats.map((c) =>
      state.expenses.filter((e) => e.type === c).reduce((s, e) => s + Number(e.amount), 0)
    );
    costChart.options.scales.x.ticks.color = theme.tick;
    costChart.options.scales.y.ticks.color = theme.tick;
    costChart.options.scales.y.grid.color = theme.grid;
    costChart.update();
  }

  /* ==================================================================
     TRIPS TABLE (dashboard)
     ================================================================== */
  function renderTrips(filter = "") {
    const body = $("#tripsTableBody");
    const f = filter.trim().toLowerCase();
    const rows = state.trips.filter((t) =>
      !f || [t.id, t.route, t.vehicle, t.driver].join(" ").toLowerCase().includes(f)
    );
    body.innerHTML = rows.length
      ? rows.map((t) => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/40">
          <td class="px-5 py-3 font-semibold text-indigo-600 dark:text-indigo-400">${esc(t.id)}</td>
          <td class="px-5 py-3">${esc(t.route)}</td>
          <td class="px-5 py-3">${esc(t.vehicle)}</td>
          <td class="px-5 py-3">${esc(t.driver)}</td>
          <td class="px-5 py-3">${esc(t.distance)} km</td>
          <td class="px-5 py-3 font-medium">${money(t.cost)}</td>
          <td class="px-5 py-3 text-slate-500 dark:text-slate-400">${esc(t.date)}</td>
        </tr>`).join("")
      : `<tr><td colspan="7" class="px-5 py-8 text-center text-slate-400">No trips match your filter.</td></tr>`;
  }

  function exportCSV() {
    const trips = state.trips;
    const header = ["Trip ID", "Route", "Vehicle", "Driver", "Distance (km)", "Cost", "Date"];
    const lines = [header.join(",")].concat(
      trips.map((t) => [t.id, `"${t.route}"`, t.vehicle, `"${t.driver}"`, t.distance, t.cost, t.date].join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transitops-completed-trips.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ==================================================================
     REGISTRY TABLES
     ================================================================== */
  function renderVehicles() {
    const body = $("#vehiclesTableBody");
    body.innerHTML = state.vehicles.map((v, i) => `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/40">
        <td class="px-5 py-3 font-semibold">${esc(v.reg)}</td>
        <td class="px-5 py-3">${esc(v.model)}</td>
        <td class="px-5 py-3">${esc(v.capacity)}</td>
        <td class="px-5 py-3">${statusBadge(v.status)}</td>
        <td class="px-5 py-3 text-right">
          <button data-del-vehicle="${i}" class="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500" title="Delete">
            <i data-lucide="trash-2" class="h-4 w-4"></i>
          </button>
        </td>
      </tr>`).join("");
    refreshIcons();
    body.querySelectorAll("[data-del-vehicle]").forEach((b) =>
      b.addEventListener("click", () => {
        const arr = state.vehicles;
        arr.splice(Number(b.dataset.delVehicle), 1);
        state.vehicles = arr;
        renderAll();
      })
    );
  }

  function renderDrivers() {
    const body = $("#driversTableBody");
    body.innerHTML = state.drivers.map((d) => `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/40">
        <td class="px-5 py-3 font-semibold">${esc(d.name)}</td>
        <td class="px-5 py-3">${esc(d.license)}</td>
        <td class="px-5 py-3 text-slate-500 dark:text-slate-400">${esc(d.expiry)}</td>
        <td class="px-5 py-3">
          <span class="inline-flex items-center gap-2">
            <span class="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <span class="block h-full rounded-full ${d.score >= 90 ? "bg-green-500" : d.score >= 80 ? "bg-amber-500" : "bg-rose-500"}" style="width:${d.score}%"></span>
            </span>
            <span class="text-xs font-semibold">${esc(d.score)}</span>
          </span>
        </td>
        <td class="px-5 py-3">${statusBadge(d.status)}</td>
      </tr>`).join("");
  }

  /* ==================================================================
     DISPATCH
     ================================================================== */
  function fillSelects() {
    const availVehicles = state.vehicles.filter((v) => v.status === "Available" || v.status === "Active");
    const availDrivers = state.drivers.filter((d) => d.status === "On Duty");

    const vOpts = availVehicles.map((v) => `<option value="${esc(v.reg)}">${esc(v.reg)} — ${esc(v.model)}</option>`).join("");
    const dOpts = availDrivers.map((d) => `<option value="${esc(d.name)}">${esc(d.name)}</option>`).join("");

    $("#dispatch-vehicle").innerHTML = vOpts || `<option value="">No vehicles available</option>`;
    $("#dispatch-driver").innerHTML = dOpts || `<option value="">No drivers on duty</option>`;
    $("#expense-vehicle").innerHTML = state.vehicles.map((v) => `<option value="${esc(v.reg)}">${esc(v.reg)} — ${esc(v.model)}</option>`).join("");
  }

  function renderActiveTrips() {
    const list = $("#activeTripsList");
    const trips = state.trips.slice(-5).reverse();
    list.innerHTML = trips.length
      ? trips.map((t) => `
        <li class="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-indigo-600 dark:text-indigo-400">${esc(t.id)}</span>
            <span class="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400">Dispatched</span>
          </div>
          <p class="mt-1 text-sm">${esc(t.route)}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">${esc(t.vehicle)} · ${esc(t.driver)}</p>
        </li>`).join("")
      : `<li class="text-sm text-slate-400">No active dispatches.</li>`;
  }

  function initDispatch() {
    $("#dispatchForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const vehicle = $("#dispatch-vehicle").value;
      const driver = $("#dispatch-driver").value;
      if (!vehicle || !driver) return;
      const src = $("#dispatch-source").value.trim();
      const dest = $("#dispatch-destination").value.trim();
      const distance = Number($("#dispatch-distance").value) || 0;
      const weight = Number($("#dispatch-weight").value) || 0;
      const cost = Math.round(distance * 1.6 + weight * 0.05);

      const trips = state.trips;
      const id = "TRP-" + (1000 + trips.length + 1);
      trips.push({ id, route: `${src} → ${dest}`, vehicle, driver, distance, cost, date: new Date().toISOString().slice(0, 10) });
      state.trips = trips;
      
      addNotification(`New Trip ${id} Dispatched: ${src} → ${dest} via ${vehicle}`);

      e.target.reset();
      renderAll();
      $("#dispatchForm").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  /* ==================================================================
     EXPENSES
     ================================================================== */
  function renderExpenses() {
    const body = $("#expensesTableBody");
    const exp = state.expenses;
    body.innerHTML = exp.length
      ? exp.slice().reverse().map((e) => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/40">
          <td class="px-5 py-3 font-semibold">${esc(e.vehicle)}</td>
          <td class="px-5 py-3">
            <span class="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">${esc(e.type)}</span>
          </td>
          <td class="px-5 py-3 font-medium">${money(e.amount)}</td>
          <td class="px-5 py-3 text-slate-500 dark:text-slate-400">${esc(e.date)}</td>
        </tr>`).join("")
      : `<tr><td colspan="4" class="px-5 py-8 text-center text-slate-400">No expenses logged.</td></tr>`;
    const total = exp.reduce((s, e) => s + Number(e.amount), 0);
    $("#expenseTotal").textContent = money(total);
  }

  function initExpenses() {
    $("#expense-date").value = new Date().toISOString().slice(0, 10);
    $("#expenseForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const vehicle = $("#expense-vehicle").value;
      const type = $("#expense-type").value;
      const amount = Number($("#expense-amount").value) || 0;
      const date = $("#expense-date").value;
      
      const exp = state.expenses;
      exp.push({ vehicle, type, amount, date });
      state.expenses = exp;
      
      addNotification(`Expense logged: ${money(amount)} (${type}) for ${vehicle}`);
      $("#expense-amount").value = "";
      renderAll();
    });
  }

  /* ==================================================================
     MODALS
     ================================================================== */
  function initModals() {
    const vModal = $("#vehicleModal");
    const dModal = $("#driverModal");

    $("#addVehicleBtn").addEventListener("click", () => { vModal.showModal(); refreshIcons(); });
    $("#addDriverBtn").addEventListener("click", () => { dModal.showModal(); refreshIcons(); });

    $$("[data-close]").forEach((btn) =>
      btn.addEventListener("click", () => btn.closest("dialog").close())
    );

    $("#vehicleForm").addEventListener("submit", () => {
      const reg = $("#v-reg").value.trim();
      const model = $("#v-model").value.trim();
      const capacity = $("#v-capacity").value.trim();
      const status = $("#v-status").value;
      
      const arr = state.vehicles;
      arr.push({ reg, model, capacity, status });
      state.vehicles = arr;
      
      addNotification(`Registered Vehicle: ${reg} (${model})`);
      $("#vehicleForm").reset();
      renderAll();
    });

    $("#driverForm").addEventListener("submit", () => {
      const name = $("#d-name").value.trim();
      const license = $("#d-license").value.trim();
      const expiry = $("#d-expiry").value;
      const score = Number($("#d-score").value) || 0;
      const status = $("#d-status").value;
      
      const arr = state.drivers;
      arr.push({ name, license, expiry, score, status });
      state.drivers = arr;
      
      addNotification(`Registered Driver: ${name} (Safety: ${score}%)`);
      $("#driverForm").reset();
      renderAll();
    });
  }

  /* ==================================================================
     SEARCH / EXPORT LISTENERS
     ================================================================== */
  function initListeners() {
    $("#tripSearch").addEventListener("input", (e) => renderTrips(e.target.value));
    $("#exportCsvBtn").addEventListener("click", exportCSV);
    $("#globalSearch").addEventListener("input", (e) => {
      // simple: filter dashboard trips too
      if ($("#view-dashboard").classList.contains("active")) renderTrips(e.target.value);
    });
  }

  /* ==================================================================
     RENDER ALL + BOOT
     ================================================================== */
  function renderAll() {
    renderKPIs();
    renderTrips($("#tripSearch") ? $("#tripSearch").value : "");
    renderVehicles();
    renderDrivers();
    fillSelects();
    renderActiveTrips();
    renderExpenses();
    updateCharts();
    refreshIcons();
  }

  /* ==================================================================
     PROFILE & NOTIFICATIONS LOGIC
     ================================================================== */
  function addNotification(text) {
    const list = state.notifications;
    list.unshift({ text, time: "Just now" });
    state.notifications = list;
    renderNotifications();
  }

  function renderNotifications() {
    const list = state.notifications;
    const dot = $("#notificationDot");
    const container = $("#notificationsList");
    
    if (list.length > 0) {
      dot.classList.remove("hidden");
      container.innerHTML = list.map((n) => `
        <li class="border-b border-slate-100 pb-2 dark:border-slate-800 last:border-0 last:pb-0">
          <p class="font-medium text-slate-800 dark:text-slate-200">${esc(n.text)}</p>
          <span class="text-[10px] text-slate-400">${esc(n.time)}</span>
        </li>
      `).join("");
    } else {
      dot.classList.add("hidden");
      container.innerHTML = `<li class="text-center py-4 text-slate-400">No new notifications.</li>`;
    }
  }

  function initNotifications() {
    const btn = $("#notificationBtn");
    const dropdown = $("#notificationDropdown");
    
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("hidden");
    });
    
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target) && e.target !== btn) {
        dropdown.classList.add("hidden");
      }
    });
    
    $("#clearNotificationsBtn").addEventListener("click", () => {
      state.notifications = [];
      renderNotifications();
    });
    
    renderNotifications();
  }

  function initProfile() {
    const pModal = $("#profileModal");
    const p = state.profile;
    
    // Set initial display
    $("#profileNameDisplay").textContent = p.name;
    $("#profileRoleDisplay").textContent = p.role;
    $("#modalProfileName").textContent = p.name;
    $("#modalProfileRole").textContent = p.role;
    $("#p-name").value = p.name;
    $("#p-role").value = p.role;
    $("#p-email").value = p.email;
    
    $("#profileBtn").addEventListener("click", (e) => {
      pModal.showModal();
      refreshIcons();
    });
    
    $("#profileForm").addEventListener("submit", () => {
      const updated = {
        name: $("#p-name").value.trim(),
        role: $("#p-role").value.trim(),
        email: $("#p-email").value.trim(),
      };
      state.profile = updated;
      
      // Update DOM
      $("#profileNameDisplay").textContent = updated.name;
      $("#profileRoleDisplay").textContent = updated.role;
      $("#modalProfileName").textContent = updated.name;
      $("#modalProfileRole").textContent = updated.role;
      
      addNotification(`Profile updated: ${updated.name}`);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    seed();
    initTheme();
    initNav();
    initModals();
    initDispatch();
    initExpenses();
    initListeners();
    initNotifications();
    initProfile();
    buildCharts();
    renderAll();
    refreshIcons();
  });
})();
