/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "motion/react";
import { Heart, Plus, RefreshCw, Zap, Music, Ghost, Camera, Sparkles } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/contexts/AuthContext";
import { 
  NeuCard, 
  NeuButton, 
  DailyProgress, 
} from "@/src/components/ui/Neumorphic";
import {
  AmbientContext,
  DailyPrompt,
} from "@/src/components/Features";
import { PresenceIndicator } from "@/src/components/AdvancedFeatures";
import {
  DigitalLocket,
  NowPlayingPlayer,
  FoggyMirror,
} from "@/src/components/TactileFeatures";

// ─── Liquid Card: premium hover-reactive bento cell ──────────────────────────
function LiquidCard({
  children,
  className,
  onClick,
  colSpan,
  rowSpan,
  delay = 0,
  glowColor = "rgba(217,119,87,0.15)",
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  colSpan?: number;
  rowSpan?: number;
  delay?: number;
  glowColor?: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-80, 80], [4, -4]);
  const rotateY = useTransform(x, [-80, 80], [-4, 4]);
  const springConfig = { damping: 22, stiffness: 300 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onClick && !className?.includes("cursor-pointer")) return;
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
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        damping: 28,
        stiffness: 180,
        delay,
      }}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        perspective: 1000,
        gridColumn: colSpan ? `span ${colSpan}` : undefined,
        gridRow: rowSpan ? `span ${rowSpan}` : undefined,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.975 } : undefined}
      className={cn(
        "relative rounded-3xl overflow-hidden group",
        "bg-surface-main/40 backdrop-blur-xl",
        "border border-white/[0.06]",
        "shadow-[0_4px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)]",
        "transition-shadow duration-500",
        onClick && "cursor-pointer hover:shadow-[0_8px_48px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.07)]",
        className
      )}
    >
      {/* Ambient glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${glowColor} 0%, transparent 70%)` }}
      />
      {/* Inner shine */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      <div className="relative z-10 h-full w-full p-6 md:p-8 flex flex-col">
        {children}
      </div>
    </motion.div>
  );
}

// ─── Pulsing connection dot ───────────────────────────────────────────────────
function PulsingDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
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
  count,
  onUpload,
  onOutbox,
}: {
  count: number;
  onUpload: () => void;
  onOutbox: () => void;
}) {
  const { partner } = useAuth();
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

  const handleUploadClick = () => {
    if (count >= 3) {
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
    <div className="flex-1 px-4 md:px-10 pt-8 pb-32">
      <div
        className="grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-8"
        style={{ gridAutoRows: "minmax(196px, auto)" }}
      >

        {/* ── Card 1: Header & Status (col 2) ── */}
        <LiquidCard colSpan={2} delay={0} className="flex flex-col justify-between min-h-[196px]">
          <div className="flex items-start justify-between">
            <div>
              <motion.h2
                className="text-5xl md:text-6xl font-black tracking-tighter leading-none text-text-main"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                MOMENTS
              </motion.h2>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-text-main/30 mt-1.5">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
            <button
              onClick={onOutbox}
              className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.04] border border-white/[0.06] hover:border-accent-terracotta/50 hover:text-accent-terracotta transition-all duration-300 group/btn"
            >
              <RefreshCw className="w-4 h-4 text-text-main/40 group-hover/btn:rotate-180 group-hover/btn:text-accent-terracotta transition-transform duration-500" />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <PulsingDot active={isPartnerActive} />
            <span className="text-xs font-semibold text-text-main/40">
              {isPartnerActive
                ? `${partner?.name ?? "Partner"} is online now`
                : `${partner?.name ?? "Partner"} · Last seen recently`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-text-main/20 text-xs font-semibold mt-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Connection Signal: Strong</span>
          </div>
        </LiquidCard>

        {/* ── Card 2: Digital Locket (col 1) ── */}
        <LiquidCard delay={0.06} className="p-0 overflow-hidden min-h-[196px]">
          <div className="absolute inset-0">
            <DigitalLocket imageUrl="https://picsum.photos/seed/locket/800/800" />
          </div>
        </LiquidCard>

        {/* ── Card 3: Partner Time (col 1) ── */}
        <LiquidCard delay={0.12} className="flex flex-col items-center justify-center gap-4" glowColor="rgba(138,154,91,0.18)">
          {partnerLocalTime ? (
            <AmbientContext partnerTime={partnerLocalTime} weatherCondition="sunny" />
          ) : (
            <div className="opacity-25 flex flex-col items-center gap-3">
              <Ghost className="w-14 h-14" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Awaiting Link</span>
            </div>
          )}
        </LiquidCard>

        {/* ── Card 4: Daily Progress (col 3) ── */}
        <LiquidCard colSpan={3} delay={0.18} className="flex flex-col md:flex-row items-center justify-between gap-6 min-h-[160px]">
          <div className="flex flex-col items-start gap-3 flex-1">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-text-main/30">Today's Quota</span>
            <DailyProgress count={count} />
            <span className="text-xs text-text-main/40 font-medium">
              {count === 0 ? "Share your first moment today." : count === 3 ? "All 3 moments shared — beautiful! ❤️" : `${3 - count} more to go.`}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-6xl font-black text-accent-terracotta leading-none tabular-nums">{3 - count}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-main/30">Remaining</span>
          </div>
        </LiquidCard>

        {/* ── Card 5: Upload Action (col 1) ── */}
        <LiquidCard
          delay={0.24}
          onClick={handleUploadClick}
          glowColor="rgba(217,119,87,0.2)"
          className="flex flex-col items-center justify-center"
        >
          <motion.div
            animate={isShaking ? { x: [-6, 6, -5, 5, -3, 3, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-5"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", damping: 15, stiffness: 400 }}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center",
                "border border-white/[0.08]",
                "shadow-[0_4px_24px_rgba(0,0,0,0.3)]",
                "transition-all duration-500",
                count < 3
                  ? "bg-accent-terracotta/10 text-accent-terracotta group-hover:bg-accent-terracotta/20"
                  : "bg-text-main/5 text-text-main/15"
              )}
            >
              {count < 3 ? <Camera className="w-8 h-8" /> : <Heart className="w-8 h-8 fill-text-main/10" />}
            </motion.div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-text-main/40 group-hover:text-accent-terracotta transition-colors">
              {count < 3 ? "New Moment" : "Complete"}
            </span>
          </motion.div>
        </LiquidCard>

        {/* ── Card 6: Daily Prompt (col 2) ── */}
        <LiquidCard colSpan={2} delay={0.3} className="flex flex-col justify-center min-h-[180px]" glowColor="rgba(138,154,91,0.12)">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-accent-sage" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent-sage/70">Daily Prompt</span>
          </div>
          <DailyPrompt />
        </LiquidCard>

        {/* ── Card 7: Foggy Mirror (col 1) ── */}
        <LiquidCard delay={0.36} className="p-0 overflow-hidden min-h-[180px]">
          <div className="absolute inset-0">
            <FoggyMirror />
          </div>
        </LiquidCard>

        {/* ── Card 8: Now Playing (col 1, row 2) ── */}
        <LiquidCard delay={0.42} rowSpan={2} glowColor="rgba(217,119,87,0.12)" className="flex flex-col justify-between min-h-[400px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-text-main/30">Now Playing</span>
              <Music className="w-5 h-5 text-accent-terracotta mt-2" />
            </div>
            <div className="flex gap-1 items-end h-6">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-accent-terracotta/50 rounded-full"
                  animate={{ height: ["8px", "20px", "12px", "18px", "8px"] }}
                  transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.2, ease: "easeInOut" }}
                />
              ))}
            </div>
          </div>
          <NowPlayingPlayer title="Moonlight" artist="Kali Uchis" />
        </LiquidCard>

        {/* ── Card 9: Quote / CTA (col 3) ── */}
        <LiquidCard colSpan={3} delay={0.48} className="flex items-center justify-center relative min-h-[220px]" glowColor="rgba(217,119,87,0.08)">
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-accent-terracotta/5 to-transparent" />
          </div>
          <div className="z-10 text-center flex flex-col items-center gap-5">
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
            >
              <Heart className="w-10 h-10 text-accent-terracotta fill-accent-terracotta/25" />
            </motion.div>
            <p className="max-w-sm text-sm md:text-base font-medium text-text-main/50 leading-relaxed italic">
              "Small moments are the big memories of tomorrow."
            </p>
            <button className="px-7 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/[0.08] bg-white/[0.03] hover:bg-accent-terracotta/10 hover:border-accent-terracotta/30 hover:text-accent-terracotta transition-all duration-300">
              View Timeline
            </button>
          </div>
        </LiquidCard>

      </div>

      {/* Daily quota tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
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
