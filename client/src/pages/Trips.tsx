import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function Trips() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: "",
    driverId: "",
    source: "",
    destination: "",
    cargoWeight: 0,
    distance: 0,
  });

  // For populating dropdowns
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, v, d] = await Promise.all([
        api.get("/trips"),
        api.get("/vehicles"),
        api.get("/drivers")
      ]);
      setTrips(t.data);
      setVehicles(v.data.filter((veh: any) => veh.status === "Available"));
      setDrivers(d.data.filter((drv: any) => drv.status === "Available"));
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/trips", formData);
      setShowForm(false);
      setFormData({ vehicleId: "", driverId: "", source: "", destination: "", cargoWeight: 0, distance: 0 });
      loadData();
    } catch (err) {
      alert("Failed to draft trip.");
    }
  };

  const updateStatus = async (id: string, action: "dispatch" | "complete" | "cancel") => {
    try {
      await api.post(`/trips/${id}/${action}`);
      loadData();
    } catch (err) {
      alert(`Failed to ${action} trip. Check backend logs.`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Draft": return <Badge className="bg-slate-400">Draft</Badge>;
      case "Dispatched": return <Badge className="bg-amber-500 animate-pulse">Dispatched</Badge>;
      case "Completed": return <Badge className="bg-emerald-500">Completed</Badge>;
      case "Cancelled": return <Badge className="bg-red-500">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (loading) return <div>Loading trips...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Active Dispatches & Trips</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Create New Trip"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Vehicle</label>
              <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500" value={formData.vehicleId} onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}>
                <option value="">Select Available Vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} ({v.type}) - Cap: {v.capacity}kg</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Driver</label>
              <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500" value={formData.driverId} onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}>
                <option value="">Select Available Driver</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.licenseCategory})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Source</label>
              <Input required value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} placeholder="Origin City" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Destination</label>
              <Input required value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} placeholder="Destination City" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Cargo Weight (kg)</label>
              <Input required type="number" value={formData.cargoWeight} onChange={(e) => setFormData({ ...formData, cargoWeight: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Est. Distance (km)</label>
              <Input required type="number" value={formData.distance} onChange={(e) => setFormData({ ...formData, distance: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit">Draft Trip</Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Route</th>
              <th className="px-6 py-4">Vehicle & Driver</th>
              <th className="px-6 py-4">Cargo & Distance</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {trips.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-semibold">{t.source} → {t.destination}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-indigo-600 dark:text-indigo-400">{t.vehicle?.registrationNumber || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">{t.driver?.name || 'Unknown'}</p>
                </td>
                <td className="px-6 py-4">
                  <p>{t.cargoWeight} kg</p>
                  <p className="text-xs text-slate-500">{t.distance} km est.</p>
                </td>
                <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  {t.status === "Draft" && (
                    <>
                      <Button size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700" onClick={() => updateStatus(t.id, "dispatch")}>Dispatch</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(t.id, "cancel")}>Cancel</Button>
                    </>
                  )}
                  {t.status === "Dispatched" && (
                    <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(t.id, "complete")}>Complete</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
