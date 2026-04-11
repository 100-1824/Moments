import React, { useEffect, useState, useCallback } from "react";
import { NeuCard, NeuButton } from "@/src/components/ui/Neumorphic";
import {
  Users, Heart, ShieldAlert, BarChart3, Settings2,
  Activity, Zap, Server, RefreshCw, Unlink, Lock,
  Wifi, WifiOff, Database, HardDrive, ChevronDown, ChevronUp,
  Search, X, AlertTriangle, CheckCircle, Clock, ArrowLeft, LogOut,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell,
} from "recharts";
import * as api from "@/src/lib/api";
import { useAuth } from "@/src/contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  invite_code: string;
  couple_id: string | null;
  last_seen_at: string | null;
  created_at: string;
}

interface AdminCouple {
  id: string;
  status: string;
  linked_at: string | null;
  partner_a: AdminUser;
  partner_b: AdminUser;
}

interface MediaStats {
  by_type: { type: string; total: number; encrypted: number }[];
  total: number;
  total_encrypted: number;
  recent_encrypted: { id: string; type: string; couple_id: string; created_at: string }[];
  daily_volume: { day: string; uploads: number }[];
}

interface EngagementMetrics {
  total_pings: number;
  daily_pings: { day: string; pings: number }[];
  hourly_heatmap: { dow: number; hour: number; pings: number }[];
  avg_social_battery: number | null;
}

interface HealthCheck {
  status: string;
  timestamp: string;
  php_version: string;
  environment: string;
  checks: Record<string, { status: string; message: string }>;
}

interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const TabButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-6 py-4 rounded-[20px] text-sm font-black transition-all duration-300 whitespace-nowrap uppercase tracking-widest",
      active
        ? "neu-depressed text-accent-terracotta tact-glow"
        : "text-text-muted hover:text-text-main hover:bg-white/5"
    )}
  >
    {icon}
    <span className="hidden lg:inline">{label}</span>
  </button>
);

const StatusBadge = ({ status }: { status: string }) => (
  <span className={cn(
    "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter",
    status === "ok" ? "bg-accent-sage/10 text-accent-sage" :
    status === "error" ? "bg-accent-terracotta/10 text-accent-terracotta" :
    "bg-white/5 text-text-muted border border-white/5"
  )}>
    {status}
  </span>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-24">
    <div className="w-12 h-12 rounded-full border-4 border-accent-terracotta/20 border-t-accent-terracotta animate-spin shadow-[0_0_20px_rgba(217,119,87,0.2)]" />
  </div>
);

// ─── Tooltip style ───────────────────────────────────────────────────────────
const NEU_TOOLTIP = {
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.05)",
  backgroundColor: "#18181B",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
  fontSize: "12px",
  color: "#FAFAFA"
};
// ─── Utility ───────────────────────────────────────────────────────────────
async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("moments_token");
  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json",
    "Content-Type": "application/json",
  };
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
  const res = await fetch(`${baseUrl}/admin${path}`, {
    ...options,
    headers,
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("moments_token");
      window.location.reload();
    }
    throw new Error(`Admin API Error: ${res.status}`);
  }
  
  return res.json();
}


// ─── Module 1: User Registry ─────────────────────────────────────────────────

function UserRegistryTab() {
  const [users, setUsers] = useState<Paginated<AdminUser> | null>(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [regen, setRegen] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = debounced ? `?search=${encodeURIComponent(debounced)}` : "";
      const res = await adminFetch<{ data: Paginated<AdminUser> }>(`/users${params}`);
      setUsers(res.data);
    } finally {
      setLoading(false);
    }
  }, [debounced]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRegenerate = async (userId: string) => {
    setRegen(userId);
    try {
      await adminFetch(`/users/${userId}/regenerate-invite`, { method: "POST" });
      await fetchUsers();
    } finally {
      setRegen(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <NeuCard className="flex items-center gap-3 p-3">
        <Search className="w-4 h-4 text-text-main/40 flex-shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, or invite code..."
          className="flex-1 bg-transparent outline-none text-sm text-text-main placeholder:text-text-main/30"
        />
        {search && (
          <button onClick={() => setSearch("")}>
            <X className="w-4 h-4 text-text-main/40" />
          </button>
        )}
      </NeuCard>

      {loading ? <LoadingSpinner /> : (
        <NeuCard className="p-0 overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-text-main/5">
            <span className="text-xs font-bold text-text-main/50 uppercase tracking-widest">
              {users?.total ?? 0} Users
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-text-main/5">
                  {["Name", "Phone", "Invite Code", "Last Seen", "Linked", ""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-main/40 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users?.data.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-text-main/5 hover:bg-text-main/2 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-text-main">{user.name}</td>
                    <td className="px-4 py-3 text-text-main/60 font-mono text-xs">{user.phone}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-accent-terracotta/10 text-accent-terracotta px-2 py-1 rounded-lg">
                        {user.invite_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-main/50 text-xs">
                      {user.last_seen_at ? new Date(user.last_seen_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-full",
                        user.couple_id ? "bg-green-500/15 text-green-700" : "bg-text-main/10 text-text-main/40"
                      )}>
                        {user.couple_id ? "Linked" : "Single"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRegenerate(user.id)}
                        disabled={regen === user.id}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 neu-button rounded-xl text-text-main/60 hover:text-accent-terracotta transition-colors disabled:opacity-40"
                      >
                        <RefreshCw className={cn("w-3 h-3", regen === user.id && "animate-spin")} />
                        Regen
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {users?.data.length === 0 && (
              <div className="py-12 text-center text-text-main/30 text-sm">No users found.</div>
            )}
          </div>
        </NeuCard>
      )}
    </div>
  );
}

// ─── Module 2: Connection Oversight ──────────────────────────────────────────

function ConnectionOversightTab() {
  const [couples, setCouples] = useState<Paginated<AdminCouple> | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  const fetchCouples = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<{ data: Paginated<AdminCouple> }>("/couples");
      setCouples(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCouples(); }, [fetchCouples]);

  const handleUnlink = async (coupleId: string) => {
    setUnlinking(coupleId);
    try {
      await adminFetch(`/couples/${coupleId}/unlink`, { method: "DELETE" });
      setConfirming(null);
      await fetchCouples();
    } finally {
      setUnlinking(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {couples?.data.map((couple, i) => (
          <motion.div
            key={couple.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <NeuCard className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Partner A */}
              <div className="flex-1 flex items-center gap-3">
                <div className="w-10 h-10 neu-depressed-sm rounded-full flex items-center justify-center text-sm font-bold text-accent-terracotta">
                  {couple.partner_a?.name?.[0] ?? "?"}
                </div>
                <div>
                  <p className="font-semibold text-text-main text-sm">{couple.partner_a?.name}</p>
                  <p className="text-xs text-text-main/40 font-mono">{couple.partner_a?.invite_code}</p>
                </div>
              </div>

              {/* Heart connector */}
              <div className="flex flex-col items-center gap-1">
                <Heart className="w-5 h-5 text-accent-terracotta fill-accent-terracotta/30" />
                <span className="text-xs text-text-main/30">
                  {couple.linked_at ? new Date(couple.linked_at).toLocaleDateString() : "—"}
                </span>
                <StatusBadge status={couple.status === "active" ? "ok" : couple.status} />
              </div>

              {/* Partner B */}
              <div className="flex-1 flex items-center gap-3 sm:flex-row-reverse sm:text-right">
                <div className="w-10 h-10 neu-depressed-sm rounded-full flex items-center justify-center text-sm font-bold text-blue-500">
                  {couple.partner_b?.name?.[0] ?? "?"}
                </div>
                <div>
                  <p className="font-semibold text-text-main text-sm">{couple.partner_b?.name}</p>
                  <p className="text-xs text-text-main/40 font-mono">{couple.partner_b?.invite_code}</p>
                </div>
              </div>

              {/* Unlink / Purge action — available for ALL statuses (archived zombies included) */}
              {confirming === couple.id ? (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleUnlink(couple.id)}
                    disabled={!!unlinking}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-red-500/15 text-red-600 font-bold hover:bg-red-500/25 transition-colors disabled:opacity-40"
                  >
                    <Unlink className={cn("w-3 h-3", unlinking === couple.id && "animate-spin")} />
                    Confirm Purge
                  </button>
                  <button
                    onClick={() => setConfirming(null)}
                    className="text-xs px-3 py-2 rounded-xl text-text-main/40 neu-depressed-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(couple.id)}
                  className={cn(
                    "flex items-center gap-1.5 text-xs px-3 py-2 neu-button rounded-xl transition-colors flex-shrink-0",
                    couple.status === "active"
                      ? "text-text-main/50 hover:text-red-500"
                      : "text-amber-500/70 hover:text-amber-500 border border-amber-500/20"
                  )}
                >
                  <Unlink className="w-3 h-3" />
                  {couple.status === "active" ? "Unlink" : "Purge Zombie"}
                </button>
              )}
            </NeuCard>
          </motion.div>
        ))}
        {couples?.data.length === 0 && (
          <NeuCard className="py-12 text-center text-text-main/30 text-sm">No couples found.</NeuCard>
        )}
      </div>
    </div>
  );
}

// ─── Module 3: Media Analytics ───────────────────────────────────────────────

function MediaAnalyticsTab() {
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEncrypted, setShowEncrypted] = useState(false);

  useEffect(() => {
    adminFetch<{ data: MediaStats }>("/media-stats")
      .then(r => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return null;

  const typeChartData = stats.by_type.map(b => ({
    name: b.type.charAt(0).toUpperCase() + b.type.slice(1),
    Total: Number(b.total),
    Encrypted: Number(b.encrypted),
  }));

  const volumeData = stats.daily_volume.map(d => ({
    day: new Date(d.day).toLocaleDateString("en", { month: "short", day: "numeric" }),
    uploads: Number(d.uploads),
  }));

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4">
        <NeuCard className="flex flex-col gap-1">
          <p className="text-xs text-text-main/50 uppercase tracking-widest">Total Moments</p>
          <p className="text-3xl font-black text-text-main">{stats.total}</p>
        </NeuCard>
        <NeuCard className="flex flex-col gap-1">
          <p className="text-xs text-text-main/50 uppercase tracking-widest">Encrypted</p>
          <p className="text-3xl font-black text-accent-terracotta">{stats.total_encrypted}</p>
        </NeuCard>
      </div>

      {/* Type bars */}
      <NeuCard className="flex flex-col gap-4 min-h-[280px]">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-text-main/40" />
          <h3 className="text-xs font-bold text-text-main/50 uppercase tracking-widest">Upload Volume by Type</h3>
        </div>
        <div className="flex-1" style={{ minHeight: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeChartData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} vertical={false} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="rgba(0,0,0,0.35)" />
              <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="rgba(0,0,0,0.35)" />
              <Tooltip contentStyle={NEU_TOOLTIP} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
              <Bar dataKey="Total" fill="#D97757" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="Encrypted" fill="#8A9A5B" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </NeuCard>

      {/* Daily volume line chart */}
      {volumeData.length > 0 && (
        <NeuCard className="flex flex-col gap-4 min-h-[240px]">
          <h3 className="text-xs font-bold text-text-main/50 uppercase tracking-widest">30-Day Upload Volume</h3>
          <div className="flex-1" style={{ minHeight: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="day" fontSize={10} tickLine={false} axisLine={false} stroke="rgba(0,0,0,0.3)" interval="preserveStartEnd" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="rgba(0,0,0,0.3)" />
                <Tooltip contentStyle={NEU_TOOLTIP} />
                <Line type="monotone" dataKey="uploads" stroke="#D97757" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </NeuCard>
      )}

      {/* Encrypted toggle list */}
      <NeuCard>
        <button
          onClick={() => setShowEncrypted(v => !v)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-text-main/50" />
            <span className="text-sm font-bold text-text-main/70">Recent Encrypted Moments</span>
            <span className="text-xs bg-accent-terracotta/15 text-accent-terracotta px-2 py-0.5 rounded-full font-bold">
              {stats.recent_encrypted.length}
            </span>
          </div>
          {showEncrypted ? <ChevronUp className="w-4 h-4 text-text-main/30" /> : <ChevronDown className="w-4 h-4 text-text-main/30" />}
        </button>
        <AnimatePresence>
          {showEncrypted && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-2">
                {stats.recent_encrypted.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl bg-text-main/5 border border-text-main/8">
                    <div className="flex items-center gap-3">
                      <Lock className="w-3.5 h-3.5 text-accent-terracotta" />
                      <span className="text-xs font-mono text-text-main/50">{m.id.slice(0, 8)}…</span>
                      <span className="text-xs bg-text-main/10 px-2 py-0.5 rounded-md text-text-main/60 capitalize">{m.type}</span>
                    </div>
                    <span className="text-xs text-text-main/30">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </NeuCard>
    </div>
  );
}

// ─── Module 4: Engagement Metrics ────────────────────────────────────────────

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HEAT_COLORS = ["#EBF0F3", "#F2CABA", "#E8A98A", "#D97757", "#B85C3A"];

function getHeatColor(value: number, max: number): string {
  if (max === 0) return HEAT_COLORS[0];
  const idx = Math.min(Math.floor((value / max) * (HEAT_COLORS.length - 1)), HEAT_COLORS.length - 1);
  return HEAT_COLORS[idx];
}

function EngagementTab() {
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch<{ data: EngagementMetrics }>("/engagement")
      .then(r => setMetrics(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!metrics) return null;

  // Build 7×24 heatmap grid
  const heatmapMap: Record<string, number> = {};
  let heatMax = 0;
  metrics.hourly_heatmap.forEach(({ dow, hour, pings }) => {
    const key = `${dow}-${hour}`;
    const v = Number(pings);
    heatmapMap[key] = v;
    if (v > heatMax) heatMax = v;
  });

  const dailyData = metrics.daily_pings.map(d => ({
    day: new Date(d.day).toLocaleDateString("en", { month: "short", day: "numeric" }),
    pings: Number(d.pings),
  }));

  const batteryPct = metrics.avg_social_battery != null
    ? Math.round((metrics.avg_social_battery / 100) * 100)
    : null;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <NeuCard className="flex flex-col gap-1">
          <p className="text-xs text-text-main/50 uppercase tracking-widest">Total Haptic Pings</p>
          <p className="text-3xl font-black text-text-main">{metrics.total_pings}</p>
        </NeuCard>
        <NeuCard className="flex flex-col gap-1">
          <p className="text-xs text-text-main/50 uppercase tracking-widest">Avg Social Battery</p>
          <p className="text-3xl font-black text-accent-terracotta">
            {batteryPct != null ? `${batteryPct}%` : "—"}
          </p>
        </NeuCard>
      </div>

      {/* Community battery slider */}
      {batteryPct != null && (
        <NeuCard>
          <p className="text-xs font-bold text-text-main/50 uppercase tracking-widest mb-4">Community Social Battery</p>
          <div className="relative w-full">
            <div className="h-4 rounded-full neu-depressed overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${batteryPct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #D97757, #E8A98A)" }}
              />
            </div>
            <p className="mt-2 text-right text-xs text-text-main/40">{batteryPct}% charged</p>
          </div>
        </NeuCard>
      )}

      {/* Daily pings chart */}
      {dailyData.length > 0 && (
        <NeuCard className="flex flex-col gap-4 min-h-[240px]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent-terracotta" />
            <h3 className="text-xs font-bold text-text-main/50 uppercase tracking-widest">30-Day Ping Activity</h3>
          </div>
          <div className="flex-1" style={{ minHeight: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="day" fontSize={10} tickLine={false} axisLine={false} stroke="rgba(0,0,0,0.3)" interval="preserveStartEnd" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="rgba(0,0,0,0.3)" />
                <Tooltip contentStyle={NEU_TOOLTIP} />
                <Bar dataKey="pings" fill="#D97757" radius={[3, 3, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeuCard>
      )}

      {/* Hourly heatmap */}
      <NeuCard>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-text-main/40" />
          <h3 className="text-xs font-bold text-text-main/50 uppercase tracking-widest">Haptic Ping Heatmap (30d)</h3>
        </div>
        <div className="overflow-x-auto">
          <div className="inline-flex flex-col gap-1 min-w-full">
            <div className="flex gap-1 ml-8">
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="w-4 text-center text-[8px] text-text-main/25 flex-shrink-0">
                  {h % 6 === 0 ? `${h}h` : ""}
                </div>
              ))}
            </div>
            {DOW_LABELS.map((dow, d) => (
              <div key={d} className="flex items-center gap-1">
                <span className="w-7 text-[10px] text-text-main/35 text-right flex-shrink-0">{dow}</span>
                {Array.from({ length: 24 }, (_, h) => {
                  const val = heatmapMap[`${d}-${h}`] ?? 0;
                  return (
                    <div
                      key={h}
                      title={`${dow} ${h}:00 — ${val} pings`}
                      className="w-4 h-4 rounded-sm flex-shrink-0 transition-opacity hover:opacity-70"
                      style={{ backgroundColor: getHeatColor(val, heatMax) }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] text-text-main/30">Less</span>
            {HEAT_COLORS.map(c => (
              <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
            ))}
            <span className="text-[10px] text-text-main/30">More</span>
          </div>
        </div>
      </NeuCard>
    </div>
  );
}

// ─── Module 5: Infrastructure Health ─────────────────────────────────────────

function InfraHealthTab() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  const fetchHealth = useCallback(async () => {
    setPolling(true);
    try {
      const res = await adminFetch<HealthCheck>("/health");
      setHealth(res);
    } finally {
      setLoading(false);
      setPolling(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30_000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchHealth]);

  if (loading) return <LoadingSpinner />;
  if (!health) return null;

  const allOk = health.status === "ok";
  const checkEntries = Object.entries(health.checks);

  const iconForKey = (key: string) => {
    if (key === "database") return <Database className="w-4 h-4" />;
    if (key === "r2_storage") return <HardDrive className="w-4 h-4" />;
    if (key.startsWith("table_")) return <Server className="w-4 h-4" />;
    return <Server className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Master status banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <NeuCard className={cn(
          "flex items-center gap-4",
          allOk ? "border border-green-500/20" : "border border-red-500/20"
        )}>
          {allOk ? (
            <CheckCircle className="w-10 h-10 text-green-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-10 h-10 text-red-500 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-bold text-text-main">
              {allOk ? "All Systems Operational" : "System Degraded"}
            </p>
            <p className="text-xs text-text-main/50">
              PHP {health.php_version} · {health.environment} · {new Date(health.timestamp).toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={fetchHealth}
            disabled={polling}
            className="flex items-center gap-1.5 text-xs px-3 py-2 neu-button rounded-xl text-text-main/50 hover:text-accent-terracotta transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", polling && "animate-spin")} />
            Refresh
          </button>
        </NeuCard>
      </motion.div>

      {/* Check grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {checkEntries.map(([key, check], i) => {
          const isOk = check.status === "ok";
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <NeuCard className={cn(
                "flex items-center gap-3 p-4",
                !isOk && "border border-red-500/20"
              )}>
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center",
isOk ? "bg-green-500/15 text-green-700" : "bg-red-500/15 text-red-500"
                )}>
                  {isOk
                    ? <CheckCircle className="w-4 h-4" />
                    : <X className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-main capitalize">
                    {key.replace(/_/g, " ").replace("table ", "")}
                  </p>
                  {!isOk && (
                    <p className="text-xs text-red-500 mt-0.5 truncate">{check.message}</p>
                  )}
                </div>
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full flex-shrink-0",
                  isOk ? "bg-green-500 animate-pulse" : "bg-red-500"
                )} />
              </NeuCard>
            </motion.div>
          );
        })}
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-text-main/30">
        <Clock className="w-3 h-3" />
        Auto-refreshes every 30 seconds
      </div>
    </div>
  );
}

// ─── Main AdminScreen ─────────────────────────────────────────────────────────

// ─── Module 6: Dashboard Overview (Nexus) ──────────────────────────────────
interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color?: string;
  className?: string;
}

const MetricCard = ({ label, value, icon: Icon, trend, color = "accent-terracotta", className }: MetricCardProps) => (
  <NeuCard className={cn("flex flex-col h-full group", className)}>
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-2.5 rounded-xl bg-surface-main border border-white/5 shadow-tactile-sm transition-transform group-hover:scale-110")}>
        <Icon className={cn("w-5 h-5", `text-${color}`)} />
      </div>
      {trend && (
        <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
          {trend}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">{label}</h3>
      <p className="text-3xl font-black text-text-main tracking-tighter">{value}</p>
    </div>
  </NeuCard>
);

function DashboardOverview({ analytics }: { analytics: api.AdminAnalytics | null }) {
  if (!analytics) return <LoadingSpinner />;

  const typeData = [
    { name: "Visual", value: analytics.moments_by_type.image, color: "#D97757" },
    { name: "Auditory", value: analytics.moments_by_type.audio, color: "#8A9A5B" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 grid-rows-none md:grid-rows-2 gap-6">
      {/* Primary Stats */}
      <div className="md:col-span-4 h-full">
        <MetricCard label="Total Operatives" value={analytics.users_total} icon={Users} trend="+3.2%" />
      </div>
      <div className="md:col-span-4 h-full">
        <MetricCard label="Active Couples" value={analytics.couples_total} icon={Heart} trend="+1.5%" color="accent-sage" />
      </div>
      <div className="md:col-span-4 h-full">
        <MetricCard label="Total Fragments" value={analytics.moments_total} icon={Zap} trend="+8.1%" color="yellow-500" />
      </div>

      {/* Breakdown Chart (Bento Large) */}
      <div className="md:col-span-8 h-full">
        <NeuCard className="flex flex-col h-full bg-surface-main/20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-text-main/40" />
              <h3 className="text-xs font-black text-text-muted uppercase tracking-widest">Temporal Analysis</h3>
            </div>
            <div className="flex gap-4">
              {typeData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] font-bold text-text-muted uppercase">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} layout="vertical" margin={{ left: -20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.03} horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={11} axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.3)" />
                <Tooltip contentStyle={NEU_TOOLTIP} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {typeData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeuCard>
      </div>

      {/* Security Module */}
      <div className="md:col-span-4 h-full">
        <NeuCard className="flex flex-col justify-between h-full bg-accent-terracotta/5 border border-accent-terracotta/10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-accent-terracotta" />
              <h3 className="text-xs font-black text-accent-terracotta uppercase tracking-[0.2em]">Safety Protocol</h3>
            </div>
            <p className="text-sm font-semibold text-text-main/80 mb-6">
              <span className="text-accent-terracotta font-black">{analytics.moments_encrypted}</span> moments are currently protected via end-to-end encryption.
            </p>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(analytics.moments_encrypted / analytics.moments_total) * 100}%` }}
              className="h-full bg-accent-terracotta"
            />
          </div>
        </NeuCard>
      </div>
    </div>
  );
}

type AdminTab = "overview" | "users" | "couples" | "media" | "engagement" | "infra";

export function AdminScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = React.useState<AdminTab>("overview");
  const [analytics, setAnalytics] = React.useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const { logout } = useAuth();

  React.useEffect(() => {
    setLoading(true);
    api.getAdminAnalytics()
      .then(setAnalytics)
      .catch(err => {
        console.error("Analytics fetch failed:", err);
        setError("Nexus authorization failed. Check backend credentials.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      onBack();
    } catch (e) {
      onBack();
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-6 bg-deep-dots">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 text-red-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-text-main mb-3 uppercase tracking-tighter italic text-center">Protocol Denied</h2>
        <p className="text-text-muted text-center text-sm font-medium mb-8 max-w-xs leading-relaxed">{error}</p>
        <NeuButton onClick={onBack} size="lg" className="text-accent-terracotta px-8">Return to Portal</NeuButton>
      </div>
    );
  }

  const tabs: { id: AdminTab; icon: React.ElementType; label: string }[] = [
    { id: "overview",   icon: BarChart3, label: "Nexus"    },
    { id: "users",      icon: Users,      label: "Registry" },
    { id: "couples",    icon: Heart,      label: "Couplings" },
    { id: "media",      icon: Activity,   label: "Storage"  },
    { id: "engagement", icon: Zap,        label: "Flux"     },
    { id: "infra",      icon: Server,     label: "Node"      },
  ];

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-sans selection:bg-accent-terracotta/30 overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-terracotta/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-sage/5 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2" />
        <div className="absolute inset-0 bg-deep-dots opacity-20" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-accent-terracotta text-white uppercase tracking-widest">Master Admin</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-text-main tracking-tighter uppercase italic leading-none">
              Nexus <span className="text-accent-terracotta">Terminal</span>
            </h1>
          </div>

          <NeuButton 
            onClick={handleLogout}
            className="group flex items-center gap-2 text-text-muted hover:text-accent-terracotta transition-colors"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-black uppercase tracking-widest">Terminate Session</span>
          </NeuButton>
        </header>

        {/* Tactical Nav */}
        <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-surface-main/30 backdrop-blur-md rounded-2xl border border-white/[0.03] shadow-inner overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                  isActive 
                    ? "bg-surface-main text-accent-terracotta shadow-tactile-sm border border-white/[0.05]"
                    : "text-text-muted hover:text-text-main hover:bg-white/[0.02]"
                )}
              >
                <Icon className={cn("w-4 h-4 transition-transform", isActive && "scale-110")} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Stage */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="min-h-[500px]"
          >
            {loading ? (
              <div className="w-full h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-t-2 border-accent-terracotta animate-spin" />
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] animate-pulse">Establishing Connection...</span>
                </div>
              </div>
            ) : (
              <>
                {activeTab === "overview"   && <DashboardOverview analytics={analytics} />}
                {activeTab === "users"      && <UserRegistryTab />}
                {activeTab === "couples"    && <ConnectionOversightTab />}
                {activeTab === "media"      && <MediaAnalyticsTab />}
                {activeTab === "engagement" && <EngagementTab />}
                {activeTab === "infra"      && <InfraHealthTab />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
