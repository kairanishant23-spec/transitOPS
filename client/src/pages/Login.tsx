import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { api } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Truck, ShieldCheck, Users, UserPlus } from "lucide-react";

export default function Login() {
  const { user, login } = useAuth();
  const [tab, setTab] = useState<"admin" | "user" | "signup">("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("admin@transitops.com");
  const [password, setPassword] = useState("admin");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Driver");

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleTabChange = (t: "admin" | "user" | "signup") => {
    setTab(t);
    setError("");
    if (t === "admin") {
      setEmail("admin@transitops.com");
      setPassword("admin");
    } else if (t === "user") {
      setEmail("driver@transitops.com");
      setPassword("driver");
    } else {
      setEmail("");
      setPassword("");
      setName("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (tab === "signup") {
        const { data } = await api.post("/auth/register", { name, email, password, role });
        login(data.token, data.user);
      } else {
        const { data } = await api.post("/auth/login", { email, password });
        if (tab === "admin" && data.user.role !== "Fleet Manager") {
          throw new Error("Admin rights required");
        }
        login(data.token, data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl mix-blend-screen animate-pulse"></div>
      <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl mix-blend-screen animate-pulse" style={{ animationDelay: "2s" }}></div>
      <div className="absolute left-1/3 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-emerald-600/10 blur-3xl mix-blend-screen animate-pulse" style={{ animationDelay: "4s" }}></div>

      <div className="relative z-10 w-full max-w-md p-4">
        <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/60 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-slate-900 px-8 pt-8 pb-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 ring-1 ring-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Truck size={28} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">TransitOps</h1>
            <p className="text-sm text-slate-400 font-medium">Smart Fleet Management Portal</p>
          </div>

          <div className="flex border-b border-slate-900 bg-slate-950/40 px-2">
            <button
              onClick={() => handleTabChange("admin")}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                tab === "admin" ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => handleTabChange("user")}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                tab === "user" ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Staff
            </button>
            <button
              onClick={() => handleTabChange("signup")}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                tab === "signup" ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="flex items-center gap-2 rounded-lg bg-indigo-500/10 px-3 py-2 text-xs font-medium text-indigo-300 ring-1 ring-indigo-500/20">
              {tab === "admin" && <><ShieldCheck size={16} /> Managing Administrator Account</>}
              {tab === "user" && <><Users size={16} /> Standard Staff Login</>}
              {tab === "signup" && <><UserPlus size={16} /> Register New Account</>}
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 ring-1 ring-red-500/20 text-center font-medium">
                {error}
              </div>
            )}

            {tab === "signup" && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Full Name</label>
                  <Input 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-slate-900/50 border-slate-800 text-slate-200 focus-visible:ring-indigo-500" 
                    placeholder="Jane Doe" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Role</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <option value="Fleet Manager">Fleet Manager</option>
                    <option value="Driver">Driver</option>
                    <option value="Safety Officer">Safety Officer</option>
                    <option value="Financial Analyst">Financial Analyst</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Email Address</label>
              <Input 
                required 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-900/50 border-slate-800 text-slate-200 focus-visible:ring-indigo-500" 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Password</label>
              <Input 
                required 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-900/50 border-slate-800 text-slate-200 focus-visible:ring-indigo-500" 
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-5 shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all"
            >
              {loading ? "Processing..." : tab === "signup" ? "Create Account" : "Secure Login"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
