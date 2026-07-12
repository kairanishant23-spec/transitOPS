import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    registrationNumber: "",
    model: "",
    type: "Truck",
    capacity: 0,
    acquisitionCost: 0,
  });

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/vehicles");
      setVehicles(data);
    } catch (err) {
      console.error("Failed to load vehicles", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/vehicles", {
        ...formData,
        capacity: Number(formData.capacity),
        acquisitionCost: Number(formData.acquisitionCost),
      });
      setShowForm(false);
      setFormData({ registrationNumber: "", model: "", type: "Truck", capacity: 0, acquisitionCost: 0 });
      loadVehicles();
    } catch (err) {
      alert("Failed to add vehicle (Registration may not be unique)");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available": return <Badge variant="default" className="bg-emerald-500">{status}</Badge>;
      case "On Trip": return <Badge variant="default" className="bg-indigo-500">{status}</Badge>;
      case "In Shop": return <Badge variant="default" className="bg-amber-500">{status}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) return <div>Loading vehicles...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Fleet Vehicles</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Vehicle"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Registration No.</label>
              <Input required value={formData.registrationNumber} onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })} placeholder="TX-4471" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Model</label>
              <Input required value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} placeholder="Volvo FH16" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Type</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Trailer">Trailer</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Capacity (kg)</label>
              <Input required type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Cost (₹)</label>
              <Input required type="number" value={formData.acquisitionCost} onChange={(e) => setFormData({ ...formData, acquisitionCost: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit">Save Vehicle</Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">
            <tr>
              <th className="px-6 py-4">Registration</th>
              <th className="px-6 py-4">Model & Type</th>
              <th className="px-6 py-4">Capacity</th>
              <th className="px-6 py-4">Odometer</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{v.registrationNumber}</td>
                <td className="px-6 py-4">{v.model} <span className="text-slate-500 ml-1">({v.type})</span></td>
                <td className="px-6 py-4">{v.capacity.toLocaleString()} kg</td>
                <td className="px-6 py-4">{v.odometer.toLocaleString()} km</td>
                <td className="px-6 py-4">{getStatusBadge(v.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
