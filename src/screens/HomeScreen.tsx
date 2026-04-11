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
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 28, stiffness: 180, delay }}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
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
    <div className="flex-1 px-3 md:px-8 pt-6 pb-36 md:pb-24">
      {/*
       * Mobile: 1-column stack. md+: 4-column bento grid.
       * Row height is fixed so desktop cards have consistent heights.
       */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-7 md:[grid-auto-rows:minmax(190px,auto)]">

        {/* ── Card 1: Header & Status — full width mobile, 2/4 desktop ── */}
        <LiquidCard mdColSpan={2} delay={0} className="min-h-[140px] md:min-h-0">
          <div className="flex items-start justify-between">
            <div>
              <motion.h2
                className="text-4xl md:text-5xl font-black tracking-tighter leading-none"
                animate={{ opacity: [0.75, 1, 0.75] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                MOMENTS
              </motion.h2>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-main/30 mt-1">
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
          <div className="flex items-center gap-2 text-text-main/20 text-[11px] font-semibold mt-2">
            <Zap className="w-3 h-3 flex-shrink-0" />
            <span>Connection Signal: Strong</span>
          </div>
        </LiquidCard>

        {/* ── Card 2: Digital Locket — 1/4 col desktop ── */}
        <LiquidCard delay={0.07} noPadding className="min-h-[180px]">
          <div className="absolute inset-0">
            <DigitalLocket imageUrl="https://picsum.photos/seed/locket/800/800" />
          </div>
        </LiquidCard>

        {/* ── Card 3: Partner Time / Ambient — 1/4 col desktop ── */}
        <LiquidCard delay={0.13} className="flex flex-col items-center justify-center gap-3 min-h-[180px]" glowColor="rgba(138,154,91,0.18)">
          {partnerLocalTime ? (
            <AmbientContext partnerTime={partnerLocalTime} weatherCondition="sunny" />
          ) : (
            <div className="opacity-25 flex flex-col items-center gap-3">
              <Ghost className="w-12 h-12" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-center">Awaiting Link</span>
            </div>
          )}
        </LiquidCard>

        {/* ── Card 4: Daily Progress — 3/4 col desktop, full mobile ── */}
        <LiquidCard mdColSpan={3} delay={0.19} className="min-h-[120px]">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main/30 mb-3 block">Today's Quota</span>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <DailyProgress count={count} />
              <p className="text-xs text-text-main/40 font-medium mt-2">
                {count === 0
                  ? "Share your first moment today."
                  : count === 3
                  ? "All 3 moments shared ❤️"
                  : `${3 - count} remaining today.`}
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-0.5 mt-1 md:mt-0">
              <span className="text-5xl font-black text-accent-terracotta leading-none tabular-nums">{3 - count}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-main/30">left</span>
            </div>
          </div>
        </LiquidCard>

        {/* ── Card 5: Upload CTA — 1/4 col desktop, full mobile ── */}
        <LiquidCard delay={0.25} onClick={handleUploadClick} glowColor="rgba(217,119,87,0.2)" className="min-h-[140px]">
          <motion.div
            animate={isShaking ? { x: [-6, 6, -5, 5, -3, 3, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="flex flex-row md:flex-col items-center gap-5 h-full md:justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", damping: 15, stiffness: 400 }}
              className={cn(
                "w-16 h-16 md:w-20 md:h-20 rounded-full flex-shrink-0 flex items-center justify-center",
                "border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.25)]",
                count < 3 ? "bg-accent-terracotta/10 text-accent-terracotta" : "bg-text-main/5 text-text-main/15"
              )}
            >
              {count < 3 ? <Camera className="w-7 h-7 md:w-8 md:h-8" /> : <Heart className="w-7 h-7 md:w-8 md:h-8 fill-text-main/10" />}
            </motion.div>
            <div>
              <span className="text-sm md:text-[10px] font-black uppercase tracking-[0.2em] text-text-main/50">
                {count < 3 ? "New Moment" : "Complete"}
              </span>
              {count < 3 && (
                <p className="text-xs text-text-main/25 mt-0.5 md:hidden">Tap to capture a memory</p>
              )}
            </div>
          </motion.div>
        </LiquidCard>

        {/* ── Card 6: Daily Prompt — 2/4 col desktop, full mobile ── */}
        <LiquidCard mdColSpan={2} delay={0.31} glowColor="rgba(138,154,91,0.12)" className="min-h-[130px]">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-accent-sage flex-shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-sage/70">Daily Prompt</span>
          </div>
          <DailyPrompt />
        </LiquidCard>

        {/* ── Card 7: Foggy Mirror — 1/4 col desktop, full mobile ── */}
        <LiquidCard delay={0.37} noPadding className="min-h-[180px]">
          <div className="absolute inset-0">
            <FoggyMirror />
          </div>
        </LiquidCard>

        {/* ── Card 8: Now Playing — 1/4 row-span-2 desktop, full mobile ── */}
        <LiquidCard mdRowSpan={2} delay={0.43} glowColor="rgba(217,119,87,0.12)" className="min-h-[160px]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main/30">Now Playing</span>
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
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
            >
              <Heart className="w-9 h-9 text-accent-terracotta fill-accent-terracotta/25" />
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
