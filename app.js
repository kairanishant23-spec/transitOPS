/* TransitOps — Application logic (vanilla JS + localStorage + Chart.js) */
(function () {
  "use strict";
  const KEYS = {
    vehicles: "transitops_vehicles_demo_v2",
    drivers: "transitops_drivers_demo_v2",
    trips: "transitops_trips_demo_v2",
    expenses: "transitops_expenses_demo_v2",
    maintenance: "transitops_maintenance_demo_v2",
    profile: "transitops_profile",
    session: "transitops_session",
    theme: "transitops_theme",
    currency: "transitops_currency",
    distance: "transitops_distance",
    security: "transitops_login_security",
    profileLocks: "transitops_profile_locks",
    notifications: "transitops_notifications",
  };
  const load = (k, f) => {
    try {
      const r = localStorage.getItem(k);
      return r ? JSON.parse(r) : f;
    } catch {
      return f;
    }
  };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const $ = (s) => document.querySelector(s),
    $$ = (s) => Array.from(document.querySelectorAll(s));
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const today = () => new Date().toISOString().slice(0, 10);
  const RATES = { INR: 1, USD: 1 / 83, EUR: 1 / 90, GBP: 1 / 106 },
    SYMBOL = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
  const RBAC = {
    Admin: [
      "dashboard",
      "vehicles",
      "drivers",
      "dispatch",
      "maintenance",
      "expenses",
      "analytics",
      "settings",
    ],
    "Fleet Manager": [
      "dashboard",
      "vehicles",
      "drivers",
      "dispatch",
      "maintenance",
      "expenses",
      "analytics",
      "settings",
    ],
    Driver: ["dashboard", "dispatch", "analytics", "settings"],
    "Safety Officer": [
      "dashboard",
      "vehicles",
      "drivers",
      "analytics",
      "settings",
    ],
    "Financial Analyst": ["dashboard", "expenses", "analytics", "settings"],
  };
  function seed() {
    if (!localStorage.getItem(KEYS.vehicles))
      save(KEYS.vehicles, [
        {
          reg: "MH-12-AB-1201",
          model: "Tata Ace Gold",
          type: "Mini Truck",
          capacity: 750,
          odometer: 68420,
          acquisitionCost: 780000,
          region: "West",
          status: "Available",
        },
        {
          reg: "MH-14-KL-9088",
          model: "Ashok Leyland Dost+",
          type: "Light Truck",
          capacity: 1500,
          odometer: 91340,
          acquisitionCost: 1120000,
          region: "West",
          status: "On Trip",
        },
        {
          reg: "DL-01-CX-4412",
          model: "Tata 407 Gold SFC",
          type: "Truck",
          capacity: 2950,
          odometer: 120540,
          acquisitionCost: 1680000,
          region: "North",
          status: "In Shop",
        },
        {
          reg: "KA-05-MN-7710",
          model: "Mahindra Bolero Pik-Up",
          type: "Pickup",
          capacity: 1700,
          odometer: 77200,
          acquisitionCost: 980000,
          region: "South",
          status: "Available",
        },
        {
          reg: "TN-09-QP-3055",
          model: "Eicher Pro 2049",
          type: "Truck",
          capacity: 4995,
          odometer: 105880,
          acquisitionCost: 1950000,
          region: "South",
          status: "On Trip",
        },
        {
          reg: "GJ-01-TR-6621",
          model: "BharatBenz 1917R",
          type: "Heavy Truck",
          capacity: 10000,
          odometer: 142300,
          acquisitionCost: 2850000,
          region: "West",
          status: "Available",
        },
        {
          reg: "UP-32-VN-5005",
          model: "Demo Van-05",
          type: "Van",
          capacity: 500,
          odometer: 31120,
          acquisitionCost: 620000,
          region: "North",
          status: "Available",
        },
        {
          reg: "WB-20-RT-8820",
          model: "Tata Prima 5530.S",
          type: "Prime Mover",
          capacity: 35000,
          odometer: 260400,
          acquisitionCost: 5400000,
          region: "East",
          status: "Retired",
        },
      ]);
    if (!localStorage.getItem(KEYS.drivers))
      save(KEYS.drivers, [
        {
          name: "Alex Kumar",
          license: "DL-AK-2201",
          category: "LMV",
          expiry: "2027-08-20",
          contact: "9876501001",
          score: 94,
          status: "Available",
        },
        {
          name: "Priya Sharma",
          license: "DL-PS-4407",
          category: "Transport",
          expiry: "2027-11-18",
          contact: "9876501002",
          score: 97,
          status: "On Trip",
        },
        {
          name: "Rohan Mehta",
          license: "DL-RM-3310",
          category: "HMV",
          expiry: "2028-03-04",
          contact: "9876501003",
          score: 91,
          status: "Available",
        },
        {
          name: "Kavya Nair",
          license: "DL-KN-7782",
          category: "Transport",
          expiry: "2026-12-19",
          contact: "9876501004",
          score: 95,
          status: "Available",
        },
        {
          name: "Arjun Singh",
          license: "DL-AS-9912",
          category: "HMV",
          expiry: "2025-01-12",
          contact: "9876501005",
          score: 62,
          status: "Suspended",
        },
        {
          name: "Meera Iyer",
          license: "DL-MI-6105",
          category: "Transport",
          expiry: "2027-06-30",
          contact: "9876501006",
          score: 96,
          status: "On Trip",
        },
        {
          name: "Vikram Das",
          license: "DL-VD-5518",
          category: "LMV",
          expiry: "2027-01-15",
          contact: "9876501007",
          score: 86,
          status: "Off Duty",
        },
      ]);
    if (!localStorage.getItem(KEYS.trips))
      save(KEYS.trips, [
        {
          id: "TRP-2101",
          route: "Pune → Mumbai",
          vehicle: "MH-12-AB-1201",
          driver: "Alex Kumar",
          distance: 150,
          cargoWeight: 600,
          revenue: 18500,
          date: "2026-01-22",
          status: "Completed",
        },
        {
          id: "TRP-2154",
          route: "Delhi → Jaipur",
          vehicle: "DL-01-CX-4412",
          driver: "Rohan Mehta",
          distance: 281,
          cargoWeight: 2500,
          revenue: 32600,
          date: "2026-02-17",
          status: "Completed",
        },
        {
          id: "TRP-2210",
          route: "Bengaluru → Mysuru",
          vehicle: "KA-05-MN-7710",
          driver: "Kavya Nair",
          distance: 145,
          cargoWeight: 1200,
          revenue: 19800,
          date: "2026-03-09",
          status: "Completed",
        },
        {
          id: "TRP-2259",
          route: "Ahmedabad → Surat",
          vehicle: "GJ-01-TR-6621",
          driver: "Rohan Mehta",
          distance: 265,
          cargoWeight: 8200,
          revenue: 55400,
          date: "2026-04-14",
          status: "Completed",
        },
        {
          id: "TRP-2311",
          route: "Lucknow → Kanpur",
          vehicle: "UP-32-VN-5005",
          driver: "Alex Kumar",
          distance: 93,
          cargoWeight: 450,
          revenue: 12800,
          date: "2026-05-21",
          status: "Completed",
        },
        {
          id: "TRP-2360",
          route: "Chennai → Coimbatore",
          vehicle: "TN-09-QP-3055",
          driver: "Meera Iyer",
          distance: 505,
          cargoWeight: 4200,
          revenue: 68400,
          date: "2026-06-16",
          status: "Completed",
        },
        {
          id: "TRP-2398",
          route: "Mumbai → Pune",
          vehicle: "MH-12-AB-1201",
          driver: "Priya Sharma",
          distance: 150,
          cargoWeight: 700,
          revenue: 21400,
          date: "2026-07-05",
          status: "Completed",
        },
        {
          id: "TRP-2401",
          route: "Ahmedabad → Vadodara",
          vehicle: "GJ-01-TR-6621",
          driver: "Rohan Mehta",
          distance: 111,
          cargoWeight: 7400,
          revenue: 29200,
          date: "2026-07-08",
          status: "Completed",
        },
        {
          id: "TRP-2407",
          route: "Mumbai → Nashik",
          vehicle: "MH-14-KL-9088",
          driver: "Priya Sharma",
          distance: 167,
          cargoWeight: 1300,
          revenue: 26500,
          date: "2026-07-11",
          status: "Dispatched",
        },
        {
          id: "TRP-2408",
          route: "Chennai → Madurai",
          vehicle: "TN-09-QP-3055",
          driver: "Meera Iyer",
          distance: 462,
          cargoWeight: 4500,
          revenue: 61200,
          date: "2026-07-12",
          status: "Dispatched",
        },
      ]);
    if (!localStorage.getItem(KEYS.expenses))
      save(KEYS.expenses, [
        {
          vehicle: "MH-12-AB-1201",
          type: "Fuel",
          amount: 6200,
          litres: 68,
          date: "2026-01-20",
        },
        {
          vehicle: "DL-01-CX-4412",
          type: "Fuel",
          amount: 9800,
          litres: 108,
          date: "2026-02-15",
        },
        {
          vehicle: "DL-01-CX-4412",
          type: "Maintenance",
          amount: 18500,
          litres: 0,
          date: "2026-02-18",
        },
        {
          vehicle: "KA-05-MN-7710",
          type: "Fuel",
          amount: 5900,
          litres: 65,
          date: "2026-03-08",
        },
        {
          vehicle: "GJ-01-TR-6621",
          type: "Fuel",
          amount: 16800,
          litres: 185,
          date: "2026-04-13",
        },
        {
          vehicle: "GJ-01-TR-6621",
          type: "Toll",
          amount: 3100,
          litres: 0,
          date: "2026-04-14",
        },
        {
          vehicle: "TN-09-QP-3055",
          type: "Fuel",
          amount: 21800,
          litres: 240,
          date: "2026-06-15",
        },
        {
          vehicle: "TN-09-QP-3055",
          type: "Maintenance",
          amount: 12400,
          litres: 0,
          date: "2026-06-02",
        },
        {
          vehicle: "MH-14-KL-9088",
          type: "Fuel",
          amount: 7200,
          litres: 79,
          date: "2026-07-11",
        },
        {
          vehicle: "MH-12-AB-1201",
          type: "Toll",
          amount: 1800,
          litres: 0,
          date: "2026-07-05",
        },
      ]);
    if (!localStorage.getItem(KEYS.maintenance))
      save(KEYS.maintenance, [
        {
          vehicle: "DL-01-CX-4412",
          description: "Brake inspection & pad replacement",
          cost: 18500,
          status: "Active",
          date: "2026-07-10",
        },
        {
          vehicle: "MH-12-AB-1201",
          description: "Oil and filter change",
          cost: 5400,
          status: "Closed",
          date: "2026-05-02",
        },
        {
          vehicle: "TN-09-QP-3055",
          description: "Tyre rotation and alignment",
          cost: 12400,
          status: "Closed",
          date: "2026-06-02",
        },
      ]);
    if (!localStorage.getItem(KEYS.profile))
      save(KEYS.profile, {
        name: "A. Morgan",
        email: "a.morgan@transitops.com",
      });
    if (!localStorage.getItem(KEYS.profileLocks))
      save(KEYS.profileLocks, { nameChanged: false, emailChanged: false });
  }
  const state = {
    get vehicles() {
      return load(KEYS.vehicles, []);
    },
    set vehicles(v) {
      save(KEYS.vehicles, v);
    },
    get drivers() {
      return load(KEYS.drivers, []);
    },
    set drivers(v) {
      save(KEYS.drivers, v);
    },
    get trips() {
      return load(KEYS.trips, []);
    },
    set trips(v) {
      save(KEYS.trips, v);
    },
    get expenses() {
      return load(KEYS.expenses, []);
    },
    set expenses(v) {
      save(KEYS.expenses, v);
    },
    get maintenance() {
      return load(KEYS.maintenance, []);
    },
    set maintenance(v) {
      save(KEYS.maintenance, v);
    },
    get profile() {
      return load(KEYS.profile, {
        name: "A. Morgan",
        email: "a.morgan@transitops.com",
      });
    },
    set profile(v) {
      save(KEYS.profile, v);
    },
    get session() {
      return load(KEYS.session, null);
    },
    set session(v) {
      v ? save(KEYS.session, v) : localStorage.removeItem(KEYS.session);
    },
    get notifications() {
      return load(KEYS.notifications, [
        { text: "TransitOps demo data loaded.", time: "Just now" },
      ]);
    },
    set notifications(v) {
      save(KEYS.notifications, v);
    },
  };
  function formatMoney(inr) {
    const c = load(KEYS.currency, "INR"),
      v = Number(inr || 0) * RATES[c];
    return (
      SYMBOL[c] +
      v.toLocaleString(c === "INR" ? "en-IN" : "en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
    );
  }
  function formatDistance(km) {
    const unit = load(KEYS.distance, "km"),
      v = unit === "mi" ? Number(km || 0) * 0.621371 : Number(km || 0);
    return `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`;
  }
  function driverEligible(d) {
    return (
      !!d &&
      d.status === "Available" &&
      d.status !== "Suspended" &&
      d.expiry >= today()
    );
  }
  function statusBadge(s) {
    const m = {
      Available: "bg-sky-500/10 text-sky-600",
      "On Trip": "bg-green-500/10 text-green-600",
      "In Shop": "bg-amber-500/10 text-amber-600",
      Retired: "bg-slate-500/10 text-slate-500",
      Suspended: "bg-rose-500/10 text-rose-600",
      "Off Duty": "bg-slate-500/10 text-slate-500",
      Dispatched: "bg-indigo-500/10 text-indigo-600",
      Completed: "bg-green-500/10 text-green-600",
      Active: "bg-amber-500/10 text-amber-600",
      Closed: "bg-slate-500/10 text-slate-500",
    };
    return `<span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${m[s] || m["Off Duty"]}">${esc(s)}</span>`;
  }
  const refreshIcons = () => window.lucide && window.lucide.createIcons();
  function permitted() {
    return RBAC[state.session?.role] || [];
  }
  function applyRBAC() {
    const allowed = permitted();
    $$(".nav-link").forEach((b) =>
      b.classList.toggle("hidden", !allowed.includes(b.dataset.view)),
    );
    const active = $(".view.active")?.id.replace("view-", "");
    if (!allowed.includes(active)) navigate(allowed[0] || "settings");
  }
  function navigate(view) {
    if (!permitted().includes(view)) view = permitted()[0];
    $$(".nav-link").forEach((b) =>
      b.classList.toggle("active", b.dataset.view === view),
    );
    $$(".view").forEach((v) =>
      v.classList.toggle("active", v.id === `view-${view}`),
    );
    $("#sidebar")?.classList.remove("open");
    $("#sidebarOverlay")?.classList.add("hidden");
    if (view === "analytics") renderAnalytics();
    refreshIcons();
  }
  function initNav() {
    $$(".nav-link").forEach((b) =>
      b.addEventListener("click", () => navigate(b.dataset.view)),
    );
    $("#menuBtn")?.addEventListener("click", () => {
      $("#sidebar").classList.add("open");
      $("#sidebarOverlay").classList.remove("hidden");
    });
    $("#sidebarOverlay")?.addEventListener("click", () => {
      $("#sidebar").classList.remove("open");
      $("#sidebarOverlay").classList.add("hidden");
    });
  }
  function setTheme(t) {
    save(KEYS.theme, t);
    document.documentElement.classList.toggle("dark", t === "dark");
    renderAnalytics();
  }
  function initTheme() {
    setTheme(load(KEYS.theme, "light"));
    $("#themeToggle")?.addEventListener("click", () =>
      setTheme(
        document.documentElement.classList.contains("dark") ? "light" : "dark",
      ),
    );
    $$("[data-theme-choice]").forEach((b) =>
      b.addEventListener("click", () => setTheme(b.dataset.themeChoice)),
    );
  }
  function kpi(label, value) {
    return `<div class="kpi-card"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`;
  }
  function activeTrips() {
    return state.trips.filter((t) => t.status === "Dispatched");
  }
  function syncTripStatuses() {
    const trips = activeTrips(),
      v = state.vehicles,
      d = state.drivers;
    v.forEach((x) => {
      if (x.status === "On Trip" && !trips.some((t) => t.vehicle === x.reg))
        x.status = "Available";
      if (trips.some((t) => t.vehicle === x.reg)) x.status = "On Trip";
    });
    d.forEach((x) => {
      if (x.status === "On Trip" && !trips.some((t) => t.driver === x.name))
        x.status = "Available";
      if (trips.some((t) => t.driver === x.name)) x.status = "On Trip";
    });
    state.vehicles = v;
    state.drivers = d;
  }
  function renderKPIs() {
    const v = state.vehicles,
      d = state.drivers,
      active = activeTrips().length,
      total = state.expenses.reduce((s, e) => s + Number(e.amount), 0);
    $("#dashboardKpis").innerHTML = [
      kpi("Active Vehicles", active),
      kpi(
        "Available Vehicles",
        v.filter((x) => x.status === "Available").length,
      ),
      kpi("In Shop", v.filter((x) => x.status === "In Shop").length),
      kpi("Drivers On Duty", d.filter((x) => x.status === "On Trip").length),
      kpi(
        "Fleet Utilization",
        `${v.length ? Math.round((active / v.length) * 100) : 0}%`,
      ),
      kpi("Total Op. Cost", formatMoney(total)),
    ].join("");
  }
  function renderDashboardTrips() {
    const current = $("#currentTripsBody"),
      recent = $("#recentTripsBody");
    if (current)
      current.innerHTML = activeTrips().length
        ? activeTrips()
            .map(
              (t) =>
                `<tr><td class="font-semibold text-indigo-600">${esc(t.id)}</td><td>${esc(t.route)}</td><td>${esc(t.vehicle)}</td><td>${esc(t.driver)}</td><td>${statusBadge(t.status)}</td></tr>`,
            )
            .join("")
        : `<tr><td colspan="5" class="text-center text-slate-400">No current trips</td></tr>`;
    const done = state.trips
      .filter((t) => t.status === "Completed")
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
    if (recent)
      recent.innerHTML = done
        .map(
          (t) =>
            `<tr><td class="font-semibold text-indigo-600">${esc(t.id)}</td><td>${esc(t.route)}</td><td>${formatDistance(t.distance)}</td><td>${formatMoney(t.revenue)}</td><td>${esc(t.date)}</td></tr>`,
        )
        .join("");
  }
  function tripForVehicle(reg) {
    return activeTrips().find((t) => t.vehicle === reg);
  }
  function tripForDriver(name) {
    return activeTrips().find((t) => t.driver === name);
  }
  function renderVehicles() {
    const v = state.vehicles;
    $("#vehicleKpis") &&
      ($("#vehicleKpis").innerHTML = [
        kpi("Vehicles Registered", v.length),
        kpi(
          "Currently On Trip",
          v.filter((x) => x.status === "On Trip").length,
        ),
        kpi("Available", v.filter((x) => x.status === "Available").length),
        kpi("In Shop", v.filter((x) => x.status === "In Shop").length),
      ].join(""));
    const grid = $("#currentVehiclesGrid");
    if (grid)
      grid.innerHTML = activeTrips().length
        ? activeTrips()
            .map(
              (t) =>
                `<div class="trip-card"><strong>${esc(t.vehicle)}</strong><p>${esc(t.id)}</p><p>${esc(t.route)}</p><p>Driver: ${esc(t.driver)}</p></div>`,
            )
            .join("")
        : `<p class="text-sm text-slate-400">No vehicles currently on trip.</p>`;
    const body = $("#vehiclesTableBody");
    if (body) {
      body.innerHTML = v
        .map((x, i) => {
          const t = tripForVehicle(x.reg);
          return `<tr><td class="font-semibold">${esc(x.reg)}</td><td>${esc(x.model)}</td><td>${esc(x.type)}</td><td>${Number(x.capacity).toLocaleString()} kg</td><td>${formatDistance(x.odometer)}</td><td>${esc(x.region)}</td><td>${statusBadge(x.status)}</td><td>${t ? `${esc(t.id)}<br><span class="text-xs text-slate-500">${esc(t.driver)}</span>` : "—"}</td><td>${state.session?.role === "Admin" ? `<button data-del-vehicle="${i}" class="text-rose-500"><i data-lucide="trash-2" class="h-4 w-4"></i></button>` : "—"}</td></tr>`;
        })
        .join("");
      body.querySelectorAll("[data-del-vehicle]").forEach((b) =>
        b.addEventListener("click", () => {
          const arr = state.vehicles,
            vehicle = arr[+b.dataset.delVehicle];
          if (tripForVehicle(vehicle.reg))
            return alert("Vehicles on active trips cannot be deleted.");
          arr.splice(+b.dataset.delVehicle, 1);
          state.vehicles = arr;
          renderAll();
        }),
      );
    }
    refreshIcons();
  }
  function renderDrivers() {
    const d = state.drivers;
    $("#driverKpis") &&
      ($("#driverKpis").innerHTML = [
        kpi("Drivers Registered", d.length),
        kpi(
          "Currently Driving",
          d.filter((x) => x.status === "On Trip").length,
        ),
        kpi("Available", d.filter((x) => x.status === "Available").length),
        kpi("Suspended", d.filter((x) => x.status === "Suspended").length),
      ].join(""));
    const grid = $("#currentDriversGrid");
    if (grid)
      grid.innerHTML = activeTrips().length
        ? activeTrips()
            .map(
              (t) =>
                `<div class="trip-card"><strong>${esc(t.driver)}</strong><p>${esc(t.id)}</p><p>${esc(t.route)}</p><p>Vehicle: ${esc(t.vehicle)}</p></div>`,
            )
            .join("")
        : `<p class="text-sm text-slate-400">No drivers currently on trip.</p>`;
    const body = $("#driversTableBody");
    if (body)
      body.innerHTML = d
        .map((x) => {
          const t = tripForDriver(x.name),
            expired = x.expiry < today();
          return `<tr><td class="font-semibold">${esc(x.name)}</td><td>${esc(x.license)}</td><td>${esc(x.category)}</td><td>${esc(x.expiry)} ${expired ? '<span class="text-rose-600">(Expired)</span>' : ""}</td><td>${esc(x.contact)}</td><td>${esc(x.score)}</td><td>${statusBadge(x.status)}</td><td>${t ? `${esc(t.id)}<br><span class="text-xs text-slate-500">${esc(t.route)}</span>` : "—"}</td></tr>`;
        })
        .join("");
  }
  function fillSelects() {
    const v = state.vehicles.filter((x) => x.status === "Available"),
      d = state.drivers.filter(driverEligible);
    if ($("#dispatch-vehicle"))
      $("#dispatch-vehicle").innerHTML =
        v
          .map(
            (x) =>
              `<option value="${esc(x.reg)}">${esc(x.reg)} — ${esc(x.model)} (${x.capacity} kg)</option>`,
          )
          .join("") || '<option value="">No vehicles available</option>';
    if ($("#dispatch-driver"))
      $("#dispatch-driver").innerHTML =
        d
          .map((x) => `<option value="${esc(x.name)}">${esc(x.name)}</option>`)
          .join("") || '<option value="">No eligible drivers</option>';
    const all = state.vehicles
      .map(
        (x) =>
          `<option value="${esc(x.reg)}">${esc(x.reg)} — ${esc(x.model)}</option>`,
      )
      .join("");
    if ($("#expense-vehicle")) $("#expense-vehicle").innerHTML = all;
    if ($("#maintenance-vehicle")) $("#maintenance-vehicle").innerHTML = all;
  }
  function renderActiveTrips() {
    const list = $("#activeTripsList");
    if (!list) return;
    list.innerHTML = activeTrips().length
      ? activeTrips()
          .map(
            (t) =>
              `<li class="trip-card"><div class="flex justify-between"><strong class="text-indigo-600">${esc(t.id)}</strong>${statusBadge(t.status)}</div><p>${esc(t.route)}</p><p>${esc(t.vehicle)} · ${esc(t.driver)}</p><div class="mt-3 flex gap-2"><button data-complete="${esc(t.id)}" class="btn-secondary text-xs">Complete</button><button data-cancel="${esc(t.id)}" class="btn-secondary text-xs">Cancel</button></div></li>`,
          )
          .join("")
      : '<li class="text-sm text-slate-400">No active dispatches.</li>';
    list
      .querySelectorAll("[data-complete],[data-cancel]")
      .forEach((b) =>
        b.addEventListener("click", () =>
          changeTripStatus(
            b.dataset.complete || b.dataset.cancel,
            b.dataset.complete ? "Completed" : "Cancelled",
          ),
        ),
      );
  }
  function changeTripStatus(id, status) {
    const trips = state.trips,
      t = trips.find((x) => x.id === id);
    if (!t) return;
    t.status = status;
    state.trips = trips;
    syncTripStatuses();
    addNotification(`${id} marked ${status}.`);
    renderAll();
  }
  function initDispatch() {
    $("#dispatchForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const err = $("#dispatchError");
      err.textContent = "";
      const vehicle = state.vehicles.find(
          (v) => v.reg === $("#dispatch-vehicle").value,
        ),
        driver = state.drivers.find(
          (d) => d.name === $("#dispatch-driver").value,
        ),
        raw = $("#dispatch-weight").value,
        weight = Number(raw);
      if (driver?.status === "Suspended") {
        err.textContent =
          "Suspended drivers cannot drive or be assigned to trips.";
        return;
      }
      if (!driverEligible(driver)) {
        err.textContent =
          "Driver is not eligible. The driver must be Available with a valid, non-suspended license.";
        return;
      }
      if (raw.trim() === "" || !Number.isFinite(weight) || weight < 0) {
        err.textContent =
          "Cargo weight must be a valid, non-negative numeric value.";
        return;
      }
      if (weight > Number(vehicle?.capacity)) {
        err.textContent = `Cargo weight ${weight} kg exceeds ${vehicle.reg}'s maximum capacity of ${vehicle.capacity} kg. A vehicle with capacity ${vehicle.capacity} kg cannot carry more than ${vehicle.capacity} kg.`;
        return;
      }
      const trips = state.trips,
        id = `TRP-${Math.max(...trips.map((t) => Number(t.id.replace(/\D/g, ""))), 2408) + 1}`,
        src = $("#dispatch-source").value.trim(),
        dest = $("#dispatch-destination").value.trim();
      trips.push({
        id,
        route: `${src} → ${dest}`,
        vehicle: vehicle.reg,
        driver: driver.name,
        distance: Number($("#dispatch-distance").value),
        cargoWeight: weight,
        revenue: Number($("#dispatch-revenue").value),
        date: today(),
        status: "Dispatched",
      });
      state.trips = trips;
      syncTripStatuses();
      addNotification(`New Trip ${id} Dispatched: ${src} → ${dest}`);
      e.target.reset();
      renderAll();
    });
  }
  function renderExpenses() {
    const body = $("#expensesTableBody");
    if (!body) return;
    body.innerHTML = state.expenses
      .slice()
      .reverse()
      .map(
        (e) =>
          `<tr><td class="font-semibold">${esc(e.vehicle)}</td><td>${esc(e.type)}</td><td>${formatMoney(e.amount)}</td><td>${e.type === "Fuel" ? `${Number(e.litres || 0)} L` : "—"}</td><td>${esc(e.date)}</td></tr>`,
      )
      .join("");
    $("#expenseTotal").textContent = formatMoney(
      state.expenses.reduce((s, e) => s + Number(e.amount), 0),
    );
  }
  function initExpenses() {
    $("#expense-date") && ($("#expense-date").value = today());
    $("#expenseForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const type = $("#expense-type").value,
        arr = state.expenses;
      arr.push({
        vehicle: $("#expense-vehicle").value,
        type,
        amount: Number($("#expense-amount").value),
        litres: type === "Fuel" ? Number($("#expense-litres").value || 0) : 0,
        date: $("#expense-date").value,
      });
      state.expenses = arr;
      addNotification(`Expense logged for ${$("#expense-vehicle").value}.`);
      e.target.reset();
      $("#expense-date").value = today();
      renderAll();
    });
  }
  function renderMaintenance() {
    const body = $("#maintenanceTableBody");
    if (body)
      body.innerHTML = state.maintenance
        .slice()
        .reverse()
        .map(
          (m) =>
            `<tr><td class="font-semibold">${esc(m.vehicle)}</td><td>${esc(m.description)}</td><td>${formatMoney(m.cost)}</td><td>${statusBadge(m.status)}</td><td>${esc(m.date)}</td></tr>`,
        )
        .join("");
  }
  function initMaintenance() {
    $("#maintenanceForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const record = {
          vehicle: $("#maintenance-vehicle").value,
          description: $("#maintenance-description").value.trim(),
          cost: Number($("#maintenance-cost").value),
          status: $("#maintenance-status").value,
          date: today(),
        },
        arr = state.maintenance;
      arr.push(record);
      state.maintenance = arr;
      if (record.status === "Active") {
        const vehicles = state.vehicles,
          v = vehicles.find((x) => x.reg === record.vehicle);
        if (v && !tripForVehicle(v.reg)) {
          v.status = "In Shop";
          state.vehicles = vehicles;
        }
      }
      addNotification(`Maintenance record added for ${record.vehicle}.`);
      e.target.reset();
      renderAll();
    });
  }
  let charts = {};
  function chartTheme() {
    const dark = document.documentElement.classList.contains("dark");
    return {
      tick: dark ? "#94a3b8" : "#475569",
      grid: dark ? "rgba(148,163,184,.12)" : "rgba(100,116,139,.15)",
    };
  }
  function drawChart(id, type, labels, data, label) {
    const canvas = $(`#${id}`);
    if (!canvas || typeof Chart === "undefined") return;
    charts[id]?.destroy();
    const th = chartTheme();
    charts[id] = new Chart(canvas, {
      type,
      data: {
        labels,
        datasets: [
          {
            label,
            data,
            borderWidth: 2,
            borderColor: "#4f46e5",
            backgroundColor: "rgba(79,70,229,.55)",
            borderRadius: 6,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: th.tick }, grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: { color: th.tick },
            grid: { color: th.grid },
          },
        },
      },
    });
  }
  function renderAnalytics() {
    const completed = state.trips.filter((t) => t.status === "Completed"),
      months = [
        "2026-01",
        "2026-02",
        "2026-03",
        "2026-04",
        "2026-05",
        "2026-06",
        "2026-07",
      ],
      revenue = months.map((m) =>
        completed
          .filter((t) => t.date.startsWith(m))
          .reduce((s, t) => s + Number(t.revenue || 0), 0),
      ),
      cats = ["Fuel", "Maintenance", "Toll"],
      costs = cats.map((c) =>
        state.expenses
          .filter((e) => e.type === c)
          .reduce((s, e) => s + Number(e.amount), 0),
      ),
      vehicleRevenue = state.vehicles
        .map((v) => ({
          reg: v.reg,
          val: completed
            .filter((t) => t.vehicle === v.reg)
            .reduce((s, t) => s + Number(t.revenue || 0), 0),
        }))
        .sort((a, b) => b.val - a.val)
        .slice(0, 5),
      eff = state.vehicles.map((v) => {
        const dist = completed
            .filter((t) => t.vehicle === v.reg)
            .reduce((s, t) => s + Number(t.distance || 0), 0),
          litres = state.expenses
            .filter((e) => e.vehicle === v.reg && e.type === "Fuel")
            .reduce((s, e) => s + Number(e.litres || 0), 0);
        return { reg: v.reg, val: litres ? dist / litres : 0 };
      }),
      roi = state.vehicles.map((v) => {
        const rev = completed
            .filter((t) => t.vehicle === v.reg)
            .reduce((s, t) => s + Number(t.revenue || 0), 0),
          cost = state.expenses
            .filter(
              (e) =>
                e.vehicle === v.reg && ["Fuel", "Maintenance"].includes(e.type),
            )
            .reduce((s, e) => s + Number(e.amount), 0);
        return {
          reg: v.reg,
          val: Number(v.acquisitionCost)
            ? ((rev - cost) / Number(v.acquisitionCost)) * 100
            : 0,
        };
      }),
      totalRev = completed.reduce((s, t) => s + Number(t.revenue || 0), 0),
      opCost = state.expenses.reduce((s, e) => s + Number(e.amount), 0),
      fuelLitres = state.expenses
        .filter((e) => e.type === "Fuel")
        .reduce((s, e) => s + Number(e.litres || 0), 0),
      totalDist = completed.reduce((s, t) => s + Number(t.distance || 0), 0),
      acq = state.vehicles.reduce(
        (s, v) => s + Number(v.acquisitionCost || 0),
        0,
      ),
      fleetCost = state.expenses
        .filter((e) => ["Fuel", "Maintenance"].includes(e.type))
        .reduce((s, e) => s + Number(e.amount), 0),
      fleetRoi = acq ? ((totalRev - fleetCost) / acq) * 100 : 0;
    if ($("#analyticsKpis"))
      $("#analyticsKpis").innerHTML = [
        kpi("Monthly Revenue", formatMoney(revenue[revenue.length - 1])),
        kpi("Operational Cost", formatMoney(opCost)),
        kpi(
          "Fuel Utilization",
          `${fuelLitres ? (totalDist / fuelLitres).toFixed(2) : "0.00"} km/L`,
        ),
        kpi("Fleet ROI", `${fleetRoi.toFixed(2)}%`),
      ].join("");
    drawChart(
      "revenueChart",
      "line",
      months.map((m) =>
        new Date(m + "-01").toLocaleString("en", { month: "short" }),
      ),
      revenue.map((v) => v * RATES[load(KEYS.currency, "INR")]),
      "Revenue",
    );
    drawChart(
      "costChart",
      "bar",
      cats,
      costs.map((v) => v * RATES[load(KEYS.currency, "INR")]),
      "Cost",
    );
    drawChart(
      "topVehiclesChart",
      "bar",
      vehicleRevenue.map((x) => x.reg),
      vehicleRevenue.map((x) => x.val * RATES[load(KEYS.currency, "INR")]),
      "Revenue",
    );
    drawChart(
      "fuelChart",
      "bar",
      eff.map((x) => x.reg),
      eff.map((x) => Number(x.val.toFixed(2))),
      "km/L",
    );
    drawChart(
      "roiChart",
      "bar",
      roi.map((x) => x.reg),
      roi.map((x) => Number(x.val.toFixed(2))),
      "ROI %",
    );
  }
  function exportCSV() {
    const rows = state.trips.filter((t) => t.status === "Completed"),
      lines = [
        [
          "Trip",
          "Route",
          "Vehicle",
          "Driver",
          "Distance km",
          "Revenue INR",
          "Date",
        ].join(","),
        ...rows.map((t) =>
          [
            t.id,
            `"${t.route}"`,
            t.vehicle,
            `"${t.driver}"`,
            t.distance,
            t.revenue,
            t.date,
          ].join(","),
        ),
      ],
      blob = new Blob([lines.join("\n")], { type: "text/csv" }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "transitops-completed-trips.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  function addNotification(text) {
    const n = state.notifications;
    n.unshift({ text, time: "Just now" });
    state.notifications = n;
    renderNotifications();
  }
  function renderNotifications() {
    const list = state.notifications,
      container = $("#notificationsList");
    if (!container) return;
    $("#notificationDot")?.classList.toggle("hidden", !list.length);
    container.innerHTML = list.length
      ? list
          .map(
            (n) =>
              `<li class="border-b border-slate-100 pb-2 dark:border-slate-800"><p class="font-medium">${esc(n.text)}</p><span class="text-[10px] text-slate-400">${esc(n.time)}</span></li>`,
          )
          .join("")
      : '<li class="py-4 text-center text-slate-400">No new notifications.</li>';
  }
  function initNotifications() {
    $("#notificationBtn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      $("#notificationDropdown").classList.toggle("hidden");
    });
    document.addEventListener("click", (e) => {
      const d = $("#notificationDropdown");
      if (d && !d.contains(e.target)) d.classList.add("hidden");
    });
    $("#clearNotificationsBtn")?.addEventListener("click", () => {
      state.notifications = [];
      renderNotifications();
    });
    renderNotifications();
  }
  function profileLocks() {
    return load(KEYS.profileLocks, { nameChanged: false, emailChanged: false });
  }
  function populateProfileForms() {
    const p = state.profile,
      role = state.session?.role || "",
      locks = profileLocks();
    $("#profileNameDisplay").textContent = p.name;
    $("#profileRoleDisplay").textContent = role;
    $("#modalProfileName").textContent = p.name;
    $("#modalProfileRole").textContent = role;
    ["#p-name", "#s-name"].forEach((s) => {
      const el = $(s);
      if (el) {
        el.value = p.name;
        el.disabled = locks.nameChanged;
      }
    });
    ["#p-email", "#s-email"].forEach((s) => {
      const el = $(s);
      if (el) {
        el.value = p.email;
        el.disabled = locks.emailChanged;
      }
    });
    ["#p-role", "#s-role"].forEach((s) => {
      $(s) && ($(s).value = role);
    });
    $("#p-name-note").textContent = $("#s-name-note").textContent =
      locks.nameChanged
        ? "Display name has already been changed once and is locked."
        : "Display name can be changed once.";
    $("#p-email-note").textContent = $("#s-email-note").textContent =
      locks.emailChanged
        ? "Email has already been changed once and is locked."
        : "Email can be changed once.";
    $("#settingsProfileName").textContent = p.name;
    $("#settingsProfileEmail").textContent = p.email;
  }
  function saveProfileFrom(nameSel, emailSel, msgSel) {
    const p = state.profile,
      locks = profileLocks(),
      name = $(nameSel).value.trim(),
      email = $(emailSel).value.trim(),
      msg = $(msgSel);
    msg.textContent = "";
    if (locks.nameChanged && name !== p.name) {
      msg.textContent = "Display name can only be changed once.";
      return false;
    }
    if (locks.emailChanged && email !== p.email) {
      msg.textContent = "Email address can only be changed once.";
      return false;
    }
    if (!locks.nameChanged && name !== p.name) {
      p.name = name;
      locks.nameChanged = true;
    }
    if (!locks.emailChanged && email !== p.email) {
      p.email = email;
      locks.emailChanged = true;
    }
    state.profile = p;
    save(KEYS.profileLocks, locks);
    populateProfileForms();
    addNotification(`Profile updated: ${p.name}`);
    return true;
  }
  function initProfile() {
    $("#profileBtn")?.addEventListener("click", () => {
      $("#profileModal").showModal();
      populateProfileForms();
      refreshIcons();
    });
    $("#profileForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      if (saveProfileFrom("#p-name", "#p-email", "#profileMessage"))
        $("#profileModal").close();
    });
    $("#settingsProfileForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      saveProfileFrom("#s-name", "#s-email", "#settingsProfileMessage");
    });
    populateProfileForms();
  }
  function renderConversions() {
    const c = load(KEYS.currency, "INR"),
      n = (s) => Number($(s)?.value || 0);
    $("#conv-inr-result").textContent = formatMoney(n("#conv-inr"));
    $("#conv-usd-result").textContent =
      `₹${(n("#conv-usd") / RATES.USD).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    $("#conv-eur-result").textContent =
      `₹${(n("#conv-eur") / RATES.EUR).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    $("#conv-gbp-result").textContent =
      `₹${(n("#conv-gbp") / RATES.GBP).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    $("#conv-km-result").textContent =
      `${(n("#conv-km") * 0.621371).toFixed(2)} mi`;
    $("#conv-mi-result").textContent =
      `${(n("#conv-mi") / 0.621371).toFixed(2)} km`;
    void c;
  }
  function initSettings() {
    $("#currencySelect").value = load(KEYS.currency, "INR");
    $("#distanceSelect").value = load(KEYS.distance, "km");
    $("#currencySelect").addEventListener("change", (e) => {
      save(KEYS.currency, e.target.value);
      renderAll();
      renderConversions();
    });
    $("#distanceSelect").addEventListener("change", (e) => {
      save(KEYS.distance, e.target.value);
      renderAll();
    });
    [
      "#conv-inr",
      "#conv-usd",
      "#conv-eur",
      "#conv-gbp",
      "#conv-km",
      "#conv-mi",
    ].forEach((s) => $(s)?.addEventListener("input", renderConversions));
    renderConversions();
    $("#logoutBtn")?.addEventListener("click", () => {
      state.session = null;
      location.reload();
    });
  }
  function initModals() {
    $("[data-close]");
    $$("[data-close]").forEach((b) =>
      b.addEventListener("click", () => b.closest("dialog").close()),
    );
    $("#addVehicleBtn")?.addEventListener("click", () =>
      $("#vehicleModal").showModal(),
    );
    $("#addDriverBtn")?.addEventListener("click", () =>
      $("#driverModal").showModal(),
    );
    $("#vehicleForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const reg = $("#v-reg").value.trim().toUpperCase();
      if (state.vehicles.some((v) => v.reg === reg)) {
        $("#vehicleFormError").textContent =
          "Vehicle registration numbers must be unique.";
        return;
      }
      const a = state.vehicles;
      a.push({
        reg,
        model: $("#v-model").value.trim(),
        type: $("#v-type").value.trim(),
        capacity: Number($("#v-capacity").value),
        odometer: Number($("#v-odometer").value),
        acquisitionCost: Number($("#v-acquisition").value),
        region: $("#v-region").value.trim(),
        status: $("#v-status").value,
      });
      state.vehicles = a;
      $("#vehicleModal").close();
      e.target.reset();
      renderAll();
    });
    $("#driverForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const a = state.drivers;
      a.push({
        name: $("#d-name").value.trim(),
        license: $("#d-license").value.trim(),
        category: $("#d-category").value.trim(),
        expiry: $("#d-expiry").value,
        contact: $("#d-contact").value.trim(),
        score: Number($("#d-score").value),
        status: $("#d-status").value,
      });
      state.drivers = a;
      $("#driverModal").close();
      e.target.reset();
      renderAll();
    });
  }
  function renderAll() {
    syncTripStatuses();
    renderKPIs();
    renderDashboardTrips();
    renderVehicles();
    renderDrivers();
    renderAnalytics();
    fillSelects();
    renderActiveTrips();
    renderExpenses();
    renderMaintenance();
    populateProfileForms();
    refreshIcons();
  }
  function initLogin() {
    const email = $("#loginEmail"),
      btn = $("#loginBtn"),
      msg = $("#loginMessage");
    btn.disabled = false;
    msg.textContent = "Test mode: password is not required.";
    $("#loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const key = email.value.trim().toLowerCase();
      state.session = { email: key, role: $("#loginRole").value };
      const p = state.profile;
      if (!p.email) p.email = key;
      state.profile = p;
      showApp();
    });
  }
  function showApp() {
    $("#loginScreen").classList.add("hidden");
    $("#appShell").classList.remove("hidden");
    applyRBAC();
    initProfile();
    renderAll();
  }
  function initListeners() {
    $("#exportCsvBtn")?.addEventListener("click", exportCSV);
    $("#globalSearch")?.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      $$("tbody tr").forEach((r) =>
        r.classList.toggle(
          "hidden",
          q && !r.textContent.toLowerCase().includes(q),
        ),
      );
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    seed();
    initTheme();
    initNav();
    initLogin();
    initModals();
    initDispatch();
    initExpenses();
    initMaintenance();
    initNotifications();
    initSettings();
    initListeners();
    if (state.session) showApp();
    refreshIcons();
  });
})();
