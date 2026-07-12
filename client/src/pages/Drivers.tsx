import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";

export default function Drivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    licenseNumber: "",
    licenseCategory: "Class A Commercial",
    licenseExpiry: "",
    phone: "",
  });

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/drivers");
      setDrivers(data);
    } catch (err) {
      console.error("Failed to load drivers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/drivers", formData);
      setShowForm(false);
      setFormData({ name: "", licenseNumber: "", licenseCategory: "Class A Commercial", licenseExpiry: "", phone: "" });
      loadDrivers();
    } catch (err) {
      alert("Failed to add driver (License may already exist)");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available": return <Badge className="bg-emerald-500">{status}</Badge>;
      case "On Trip": return <Badge className="bg-indigo-500">{status}</Badge>;
      case "Off Duty": return <Badge className="bg-slate-500">{status}</Badge>;
      case "Suspended": return <Badge className="bg-red-500">{status}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) return <div>Loading drivers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Driver Roster</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Driver"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Full Name</label>
              <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">License Number</label>
              <Input required value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} placeholder="DL-12345" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">License Expiry</label>
              <Input required type="date" value={formData.licenseExpiry} onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit">Register Driver</Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {drivers.map((d) => {
          const isExpired = new Date(d.licenseExpiry) < new Date();
          return (
            <div key={d.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 flex flex-col gap-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{d.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                    {d.licenseNumber} 
                    {isExpired && <span className="text-xs font-bold text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">EXPIRED</span>}
                  </p>
                </div>
                {getStatusBadge(d.status)}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-500">Category</p>
                  <p className="text-sm font-medium">{d.licenseCategory}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Safety Score</p>
                  <p className={`text-sm font-bold ${d.safetyScore >= 90 ? 'text-emerald-500' : d.safetyScore >= 75 ? 'text-amber-500' : 'text-red-500'}`}>
                    {d.safetyScore}/100
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500">Expiry</p>
                  <p className={`text-sm font-medium ${isExpired ? 'text-red-500' : ''}`}>
                    {format(new Date(d.licenseExpiry), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
