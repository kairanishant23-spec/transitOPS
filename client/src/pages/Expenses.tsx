import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const { data } = await api.get("/expenses");
        setExpenses(data);
      } catch (err) {
        console.error("Failed to load expenses", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  if (loading) return <div>Loading expenses data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Fleet Expenses</h2>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Vehicle</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">{format(new Date(exp.date), "MMM dd, yyyy")}</td>
                <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">{exp.vehicle?.registrationNumber || 'Unknown'}</td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{exp.category}</Badge>
                </td>
                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">₹{exp.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
