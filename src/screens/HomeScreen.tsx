/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useReducedMotion } from "motion/react";
import { Heart, Plus, RefreshCw, Zap, Music, Ghost, Camera, Sparkles, Droplets } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  NeuButton,
  DailyProgress,
  NeuButton as IconButton,
} from "@/src/components/ui/Neumorphic";
import {
  Trash2,
  Sun,
  Cloud,
  Moon,
  Loader2,
} from "lucide-react";
import {
  AmbientContext,
  DailyPrompt,
} from "@/src/components/Features";
import { PresenceIndicator } from "@/src/components/AdvancedFeatures";
import { NowPlayingPlayer } from "@/src/components/TactileFeatures";


// ─── Liquid Card: premium hover-reactive bento cell ──────────────────────────
function LiquidCard({
  children,
  className,
  onClick,
  mdColSpan,
  mdRowSpan,
  delay = 0,
  glowColor = "rgba(217,119,87,0.15)",
  noPadding = false,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  mdColSpan?: number;
  mdRowSpan?: number;
  delay?: number;
  glowColor?: string;
  noPadding?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-80, 80], [3, -3]);
  const rotateY = useTransform(x, [-80, 80], [-3, 3]);
  const springConfig = { damping: 25, stiffness: 300 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={shouldReduceMotion ? { duration: 0.2, delay } : { type: "spring", damping: 28, stiffness: 180, delay }}
      style={{
        rotateX: shouldReduceMotion ? 0 : springRotateX,
        rotateY: shouldReduceMotion ? 0 : springRotateY,
        perspective: 1000,
        // Only apply column/row spans at md and above via inline style on the element
        // Tailwind doesn't support dynamic col-span; we handle mobile with default (span 1)
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.975 } : undefined}
      className={cn(
        // Mobile: always full width. md: apply column span via class
        "relative rounded-3xl overflow-hidden group",
        mdColSpan === 2 && "md:col-span-2",
        mdColSpan === 3 && "md:col-span-3",
        mdColSpan === 4 && "md:col-span-4",
        mdRowSpan === 2 && "md:row-span-2",
        "bg-surface-main/40 backdrop-blur-xl",
        "border border-white/[0.06]",
        "shadow-[0_4px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)]",
        "transition-shadow duration-500",
        onClick && "cursor-pointer hover:shadow-[0_8px_48px_rgba(0,0,0,0.35)]",
        className
      )}
    >
      {/* Ambient glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${glowColor} 0%, transparent 70%)` }}
      />
      {/* Top shine line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      {/* Content */}
      {noPadding ? (
        <div className="relative z-10 h-full w-full">{children}</div>
      ) : (
        <div className="relative z-10 h-full w-full p-5 md:p-7 flex flex-col">{children}</div>
      )}
    </motion.div>
  );
}

// ─── Pulsing presence dot ─────────────────────────────────────────────────────
function PulsingDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
      {active && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
      )}
      <span className={cn(
        "relative inline-flex rounded-full h-2.5 w-2.5",
        active ? "bg-green-400" : "bg-text-main/20"
      )} />
    </span>
  );
}

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
export default function HomeScreen({
  onUpload,
  onOutbox,
  onFoggyMirror,
}: {
  onUpload: (slot?: string) => void;
  onOutbox: () => void;
  onFoggyMirror: () => void;
}) {
  const { user, partner } = useAuth();
  const [moments, setMoments] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  
  const refreshMoments = React.useCallback(async () => {
    try {
      const data = await api.getMoments();
      // Filter for today's moments only
      const today = new Date().toISOString().split('T')[0];
      const todayMoments = data.filter((m: any) => m.captured_at.startsWith(today));
      setMoments(todayMoments);
    } catch (err) {
      console.error("Failed to fetch moments", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshMoments();
  }, [refreshMoments]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this moment?")) return;
    setIsDeleting(id);
    try {
      await api.deleteMoment(id);
      setMoments(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert("Failed to delete moment");
    } finally {
      setIsDeleting(null);
    }
  };

  const momentsBySlot = React.useMemo(() => {
    return {
      morning: moments.find(m => m.slot === "morning"),
      evening: moments.find(m => m.slot === "evening"),
      night: moments.find(m => m.slot === "night"),
    };
  }, [moments]);

  const count = moments.length;
  const shouldReduceMotion = useReducedMotion();
  const [isShaking, setIsShaking] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);

  const partnerLocalTime = React.useMemo(() => {
    if (!partner?.timezone) return null;
    try {
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: partner.timezone,
        hour12: true,
      }).format(new Date());
    } catch {
      return null;
    }
  }, [partner?.timezone]);

  const handleUploadClick = (slot?: string) => {
    if (count >= 3 && !slot) {
      setIsShaking(true);
      setShowTooltip(true);
      setTimeout(() => {
        setIsShaking(false);
        setShowTooltip(false);
      }, 2200);
    } else {
      onUpload();
    }
  };

  const isPartnerActive = React.useMemo(() => {
    if (!partner?.last_seen_at) return false;
    return Date.now() - new Date(partner.last_seen_at).getTime() < 5 * 60_000;
  }, [partner?.last_seen_at]);

  return (
    <div className="flex-1 px-3 md:px-8 pt-6 pb-36 md:pb-24">
      {/*
       * Mobile: 1-column stack. md+: 4-column bento grid.
       * Row height is fixed so desktop cards have consistent heights.
       */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-7 md:[grid-auto-rows:minmax(190px,auto)]">

        {/* ── Card 1: Header & Status — full width ── */}
        <LiquidCard mdColSpan={4} delay={0} className="min-h-[140px] md:min-h-0">
          <div className="flex items-start justify-between">
            <div>
              <motion.h2
                className="text-4xl md:text-5xl font-black tracking-tighter leading-none"
                animate={shouldReduceMotion ? {} : { opacity: [0.75, 1, 0.75] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                MOMENTS
              </motion.h2>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-main/50 mt-1">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
            <button
              onClick={onOutbox}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.06] hover:border-accent-terracotta/50 hover:text-accent-terracotta transition-all duration-300 group/btn mt-1"
              aria-label="Refresh outbox"
            >
              <RefreshCw className="w-4 h-4 text-text-main/40 group-hover/btn:rotate-180 group-hover/btn:text-accent-terracotta transition-transform duration-500" />
            </button>
          </div>
          <div className="flex items-center gap-2.5 mt-4">
            <PulsingDot active={isPartnerActive} />
            <span className="text-xs font-semibold text-text-main/40 truncate">
              {isPartnerActive
                ? `${partner?.name ?? "Partner"} is online now`
                : partner?.name
                ? `${partner.name} · Offline`
                : "No partner linked"}
            </span>
          </div>
        </LiquidCard>

        {/* ── Card 2: Partner Time / Ambient — 2/4 col desktop ── */}
        <LiquidCard mdColSpan={2} delay={0.07} className="flex flex-col items-center justify-center gap-3 min-h-[160px]" glowColor="rgba(138,154,91,0.18)">
          {partnerLocalTime ? (
            <AmbientContext partnerTime={partnerLocalTime} weatherCondition="sunny" />
          ) : (
            <div className="opacity-25 flex flex-col items-center gap-3">
              <Ghost className="w-12 h-12" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-center">Awaiting Link</span>
            </div>
          )}
        </LiquidCard>

        {/* ── Card 3: Foggy Mirror Entry — 2/4 col desktop ── */}
        <LiquidCard mdColSpan={2} delay={0.13} onClick={onFoggyMirror} glowColor="rgba(100,150,255,0.15)" className="min-h-[160px] flex flex-col justify-center items-center">
          <Droplets className="w-8 h-8 text-blue-400/50 mb-3" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main/50">Foggy Mirror</span>
        </LiquidCard>

        {/* ── Card 4: Daily Grid — 4/4 col desktop, full mobile ── */}
        <LiquidCard mdColSpan={4} delay={0.19} className="min-h-[400px]" noPadding>
          <div className="h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main/50 block">Daily Grid</span>
                <h3 className="text-xl font-bold bg-gradient-to-r from-text-main to-text-main/40 bg-clip-text text-transparent">Today's Journey</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-accent-terracotta/10 border border-accent-terracotta/20">
                  <span className="text-[10px] font-black text-accent-terracotta uppercase tracking-tighter">
                    {count}/3 Slots Filled
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              {[
                { id: "morning", label: "Morning", icon: Sun, color: "text-amber-400" },
                { id: "evening", label: "Evening", icon: Cloud, color: "text-blue-400" },
                { id: "night", label: "Night", icon: Moon, color: "text-purple-400" },
              ].map((slotInfo) => {
                const moment = (momentsBySlot as any)[slotInfo.id];
                const isOwn = moment?.user_id === user?.id;

                return (
                  <div key={slotInfo.id} className="relative group/slot h-full min-h-[220px]">
                    {moment ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-full rounded-[32px] overflow-hidden neu-depressed border-4 border-background relative"
                      >
                        <img 
                          src={moment.file_url} 
                          alt={slotInfo.label} 
                          className="w-full h-full object-cover grayscale-[0.3] group-hover/slot:grayscale-0 transition-all duration-700"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                          <p className="text-xs font-medium text-white line-clamp-2">
                            {moment.caption || `Captured in the ${slotInfo.label}`}
                          </p>
                        </div>
                        
                        {isOwn && (
                          <button
                            onClick={() => handleDelete(moment.id)}
                            disabled={isDeleting === moment.id}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-red-400 hover:bg-black/40 transition-all opacity-0 group-hover/slot:opacity-100"
                          >
                            {isDeleting === moment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        )}

                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                          <slotInfo.icon className={`w-3 h-3 ${slotInfo.color}`} />
                          <span className="text-[9px] font-black text-white/90 uppercase tracking-widest">{slotInfo.label}</span>
                        </div>
                      </motion.div>
                    ) : (
                      <button
                        onClick={() => onUpload()}
                        className="w-full h-full rounded-[32px] border-2 border-dashed border-text-main/10 hover:border-accent-terracotta/30 hover:bg-accent-terracotta/[0.02] transition-all flex flex-col items-center justify-center gap-4 group/add"
                      >
                        <div className="w-12 h-12 rounded-full neu-extruded flex items-center justify-center text-text-main/20 group-hover/add:text-accent-terracotta group-hover/add:scale-110 transition-all duration-500">
                          <Plus className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main/20 group-hover/add:text-text-main/40 transition-colors block">
                            {slotInfo.label}
                          </span>
                          <span className="text-[9px] font-bold text-text-main/10 group-hover/add:text-accent-terracotta/40 transition-colors uppercase tracking-widest">
                            Empty Slot
                          </span>
                        </div>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </LiquidCard>

        {/* ── Card 6: Daily Prompt — 3/4 col desktop, full mobile ── */}
        <LiquidCard mdColSpan={3} delay={0.31} glowColor="rgba(138,154,91,0.12)" className="min-h-[130px]">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-accent-sage flex-shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-sage/70">Daily Prompt</span>
          </div>
          <DailyPrompt />
        </LiquidCard>



        {/* ── Card 8: Now Playing — 1/4 row-span-2 desktop, full mobile ── */}
        <LiquidCard mdRowSpan={2} delay={0.43} glowColor="rgba(217,119,87,0.12)" className="min-h-[160px]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main/50">Now Playing</span>
              <Music className="w-5 h-5 text-accent-terracotta mt-1.5" />
            </div>
            <div className="flex gap-1 items-end h-5">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-accent-terracotta/50 rounded-full"
                  animate={{ height: ["6px", "18px", "10px", "16px", "6px"] }}
                  transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.2, ease: "easeInOut" }}
                />
              ))}
            </div>
          </div>
          <NowPlayingPlayer title="Moonlight" artist="Kali Uchis" />
        </LiquidCard>

        {/* ── Card 9: Quote / CTA — 3/4 col desktop, full mobile ── */}
        <LiquidCard mdColSpan={3} delay={0.49} glowColor="rgba(217,119,87,0.08)" className="flex items-center justify-center min-h-[160px]">
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-accent-terracotta/5 to-transparent" />
          </div>
          <div className="z-10 text-center flex flex-col items-center gap-4">
            <motion.div
              animate={shouldReduceMotion ? {} : { scale: [1, 1.12, 1] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
            >
              <Heart aria-hidden="true" className="w-9 h-9 text-accent-terracotta fill-accent-terracotta/25" />
            </motion.div>
            <p className="max-w-sm text-sm font-medium text-text-main/50 leading-relaxed italic">
              "Small moments are the big memories of tomorrow."
            </p>
            <button className="px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.18em] border border-white/[0.08] bg-white/[0.03] hover:bg-accent-terracotta/10 hover:border-accent-terracotta/30 hover:text-accent-terracotta transition-all duration-300">
              View Timeline
            </button>
          </div>
        </LiquidCard>

      </div>

      {/* Daily quota reached tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-text-main/95 backdrop-blur-xl text-bg-main text-[11px] font-black py-4 px-8 rounded-full shadow-2xl z-[200] border border-white/20 uppercase tracking-widest whitespace-nowrap"
          >
            ✓ All 3 moments shared today
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
