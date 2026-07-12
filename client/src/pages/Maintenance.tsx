import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";

export default function Maintenance() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.get("/maintenance");
        setLogs(data);
      } catch (err) {
        console.error("Failed to load maintenance logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) return <div>Loading maintenance data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Maintenance Logs</h2>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Vehicle</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Cost</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">{format(new Date(log.date), "MMM dd, yyyy")}</td>
                <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">{log.vehicle?.registrationNumber || 'Unknown'}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{log.description}</td>
                <td className="px-6 py-4 font-medium">₹{log.cost.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <Badge variant={log.status === "Closed" ? "default" : "destructive"}>
                    {log.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
