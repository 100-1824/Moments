/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useReducedMotion } from "motion/react";
import { Heart, Plus, RefreshCw, Zap, Music, Ghost, Camera, Sparkles, Droplets, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/contexts/AuthContext";
import * as api from "@/src/lib/api";
import {
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
import { NowPlayingPlayer } from "@/src/components/TactileFeatures";

type HomeCardConfig = {
  id: string;
  mdColSpan?: number;
  mdRowSpan?: number;
  delay: number;
  glowColor?: string;
  className?: string;
  onClick?: () => void;
  noPadding?: boolean;
  content: React.ReactNode;
};

const DEFAULT_CARD_ORDER = [
  "header",
  "ambient",
  "partner-moment",
  "foggy",
  "daily-grid",
  "upload",
  "prompt",
  "now-playing",
  "quote",
];

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
        "bg-zinc-900/90 backdrop-blur-md",
        "border border-white/5",
        "shadow-[0_4px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)]",
        "transition-all duration-300 ease-out",
        onClick && "cursor-pointer hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-black/20",
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

  const getPartnerDisplayName = React.useCallback(() => {
    if (!partner) return "Partner";
    return user?.partner_nickname || partner.name;
  }, [user, partner]);
  
  const refreshMoments = React.useCallback(async () => {
    try {
      const { moments: data } = await api.fetchTodayMoments();
      // Filter for today's moments only
      const today = new Date().toISOString().split('T')[0];
      const todayMoments = data.filter((m: any) => m.captured_at?.startsWith(today));
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

  const count = React.useMemo(() => {
    return [momentsBySlot.morning, momentsBySlot.evening, momentsBySlot.night].filter(Boolean).length;
  }, [momentsBySlot]);
  const shouldReduceMotion = useReducedMotion();
  const [isShaking, setIsShaking] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [partnerLatestMoment, setPartnerLatestMoment] = React.useState<api.ApiMoment | null>(null);
  const [isPartnerMomentLoading, setIsPartnerMomentLoading] = React.useState(false);

  React.useEffect(() => {
    if (!partner?.id) {
      setPartnerLatestMoment(null);
      setIsPartnerMomentLoading(false);
      return;
    }

    let isMounted = true;
    setIsPartnerMomentLoading(true);

    api
      .fetchTodayMoments()
      .then((response) => {
        if (!isMounted) return;

        const momentsFromPartner: api.ApiMoment[] = [];
        for (const moment of response.moments) {
          if (moment.user_id === partner.id && moment.type === "image") {
            momentsFromPartner.push(moment);
          }
        }

        if (momentsFromPartner.length === 0) {
          setPartnerLatestMoment(null);
          return;
        }

        momentsFromPartner.sort((a, b) => {
          const aTime = new Date(a.created_at).getTime();
          const bTime = new Date(b.created_at).getTime();
          return bTime - aTime;
        });

        setPartnerLatestMoment(momentsFromPartner[0]);
      })
      .catch(() => {
        if (isMounted) {
          setPartnerLatestMoment(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsPartnerMomentLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [partner?.id, user?.id]);

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

  const cards = React.useMemo<HomeCardConfig[]>(() => ([
    {
      id: "header",
      mdColSpan: 4,
      delay: 0,
      className: "min-h-[140px] md:min-h-0",
      content: (
        <>
          <div className="flex items-start justify-between">
            <div>
              <motion.h2
                className="text-4xl md:text-5xl font-black tracking-tight font-semibold leading-none"
                animate={shouldReduceMotion ? {} : { opacity: [0.75, 1, 0.75] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                MOMENTS
              </motion.h2>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 font-medium mt-1">
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
            <span className="text-xs font-semibold text-zinc-400 font-medium truncate">
              {isPartnerActive
                ? `${getPartnerDisplayName()} is online now`
                : partner
                ? `${getPartnerDisplayName()} · Offline`
                : "No partner linked"}
            </span>
          </div>
        </>
      ),
    },
    {
      id: "ambient",
      mdColSpan: 2,
      delay: 0.07,
      className: "flex flex-col items-center justify-center gap-3 min-h-[160px]",
      glowColor: "rgba(138,154,91,0.18)",
      content: partnerLocalTime ? (
        <AmbientContext partnerTime={partnerLocalTime} weatherCondition="sunny" />
      ) : (
        <div className="opacity-25 flex flex-col items-center gap-3">
          <Ghost className="w-12 h-12" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-center">Awaiting Link</span>
        </div>
      ),
    },
    {
      id: "partner-moment",
      mdColSpan: 2,
      delay: 0.1,
      glowColor: "rgba(217,119,87,0.2)",
      className: "min-h-[220px]",
      noPadding: true,
      content: (
        <div className="relative h-full min-h-[220px] overflow-hidden">
          {partnerLatestMoment ? (
            <>
              <img
                src={partnerLatestMoment.media_url}
                alt={`${partner?.name ?? "Partner"} latest moment`}
                className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-[1.03]"
                loading="lazy"
                decoding="async"
              />
              {/* Cinematic gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              {/* Glass inner ring */}
              <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 pointer-events-none" />
              {/* Caption positioned absolutely at bottom-left */}
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                  {getPartnerDisplayName()} Latest
                </p>
                <p className="mt-2 text-sm md:text-base font-semibold leading-relaxed text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] line-clamp-3">
                  {partnerLatestMoment.caption_payload && !partnerLatestMoment.is_encrypted
                    ? partnerLatestMoment.caption_payload
                    : partnerLatestMoment.is_encrypted
                    ? "🔒 Encrypted moment"
                    : "Shared just now."}
                </p>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent-terracotta/20 via-background/50 to-accent-sage/20 px-6 text-center">
              <p className="text-xs font-semibold tracking-wide text-text-main/60">
                {isPartnerMomentLoading
                  ? "Loading latest moment..."
                  : partner?.id
                  ? "No partner moment shared yet today."
                  : "Connect with your partner to see their latest moment."}
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "foggy",
      mdColSpan: 2,
      delay: 0.13,
      onClick: onFoggyMirror,
      glowColor: "rgba(100,150,255,0.15)",
      className: "min-h-[160px] flex flex-col justify-center items-center",
      content: (
        <>
          <Droplets className="w-8 h-8 text-blue-400/50 mb-3" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main/50">Foggy Mirror</span>
        </>
      ),
    },
    {
      id: "daily-grid",
      mdColSpan: 4,
      delay: 0.19,
      className: "min-h-[400px]",
      noPadding: true,
      content: (
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
                        src={moment.media_url} 
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
        ),
      },
    {
      id: "upload",
      delay: 0.25,
      onClick: handleUploadClick,
      glowColor: "rgba(217,119,87,0.2)",
      className: "min-h-[140px]",
      content: (
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
      ),
    },
    {
      id: "prompt",
      mdColSpan: 3,
      delay: 0.31,
      glowColor: "rgba(138,154,91,0.12)",
      className: "min-h-[130px]",
      content: (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-accent-sage flex-shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-sage/70">Daily Prompt</span>
          </div>
          <DailyPrompt />
        </>
      ),
    },
    {
      id: "now-playing",
      mdRowSpan: 2,
      delay: 0.43,
      glowColor: "rgba(217,119,87,0.12)",
      className: "min-h-[160px]",
      content: (
        <>
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
        </>
      ),
    },
    {
      id: "quote",
      mdColSpan: 3,
      delay: 0.49,
      glowColor: "rgba(217,119,87,0.08)",
      className: "flex items-center justify-center min-h-[160px]",
      content: (
        <>
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
        </>
      ),
    },
  ]), [count, handleUploadClick, isPartnerActive, isPartnerMomentLoading, isShaking, onFoggyMirror, onOutbox, partner?.id, partner?.name, partnerLatestMoment, partnerLocalTime]);

  const [isEditMode, setIsEditMode] = React.useState(false);
  const [cardOrder, setCardOrder] = React.useState<string[]>(() => [...DEFAULT_CARD_ORDER]);
  const cardIds = React.useMemo(() => cards.map((card) => card.id), [cards]);

  React.useEffect(() => {
    setCardOrder((prev) => {
      const idSet = new Set(cardIds);
      const persisted = prev.filter((id) => idSet.has(id));
      const persistedSet = new Set(persisted);
      const missing = cardIds.filter((id) => !persistedSet.has(id));
      const nextOrder = [...persisted, ...missing];
      return nextOrder.length === prev.length && nextOrder.every((id, index) => id === prev[index]) ? prev : nextOrder;
    });
  }, [cardIds]);

  const cardsById = React.useMemo(() => {
    return cards.reduce<Record<string, HomeCardConfig>>((acc, card) => {
      acc[card.id] = card;
      return acc;
    }, {});
  }, [cards]);

  const orderedCards = React.useMemo(
    () => cardOrder.map((id) => cardsById[id]).filter((card): card is HomeCardConfig => Boolean(card)),
    [cardOrder, cardsById]
  );

  const moveCard = React.useCallback((index: number, direction: -1 | 1) => {
    setCardOrder((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }, []);

  return (
    <div className="flex-1 px-3 md:px-8 pt-6 pb-36 md:pb-24">
      <div className="flex justify-end mb-4 md:mb-6">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsEditMode((prev) => !prev)}
          className={cn(
            "group inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em]",
            "border border-white/[0.08] bg-white/[0.03] backdrop-blur-md transition-all duration-300",
            isEditMode && "text-accent-terracotta border-accent-terracotta/35 bg-accent-terracotta/12"
          )}
        >
          <GripVertical className={cn("w-3.5 h-3.5 transition-colors", isEditMode ? "text-accent-terracotta" : "text-text-main/40")} />
          {isEditMode ? "Done" : "Edit Layout"}
        </motion.button>
      </div>

      {/*
       * Mobile: 1-column stack. md+: 4-column bento grid.
       * Row height is fixed so desktop cards have consistent heights.
       */}
      <BentoGrid orderedCards={orderedCards} isEditMode={isEditMode} moveCard={moveCard} />

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

// Bento Grid with GSAP Staggered Entrance Animation
interface BentoGridProps {
  orderedCards: HomeCardConfig[];
  isEditMode: boolean;
  moveCard: (index: number, direction: -1 | 1) => void;
}

function BentoGrid({ orderedCards, isEditMode, moveCard }: BentoGridProps) {
  const gridRef = React.useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    if (!gridRef.current) return;

    const cards = gridRef.current.querySelectorAll('[data-gsap-card]');
    
    // Stagger entrance: hero first, then rest of grid
    const timeline = gsap.timeline();
    
    // Hero card (partner-moment at index 2) fades and slides up
    if (cards[2]) {
      timeline.fromTo(
        cards[2],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
        0
      );
    }

    // Remaining cards stagger in
    cards.forEach((card, index) => {
      if (index !== 2) {
        timeline.fromTo(
          card,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" },
          0.1 + index * 0.08
        );
      }
    });

    return () => {
      timeline.kill();
    };
  }, { scope: gridRef });

  return (
    <div 
      ref={gridRef}
      className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5 md:[grid-auto-rows:minmax(190px,auto)]"
    >
      {orderedCards.map((card, index) => (
        <div key={card.id} className="relative" data-gsap-card>
          <LiquidCard
            mdColSpan={card.mdColSpan}
            mdRowSpan={card.mdRowSpan}
            delay={card.delay}
            className={card.className}
            glowColor={card.glowColor}
            onClick={card.onClick}
            noPadding={card.noPadding}
          >
            {card.content}
          </LiquidCard>
          <AnimatePresence>
            {isEditMode && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-background/80 backdrop-blur-md p-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.2)]"
              >
                <button
                  type="button"
                  onClick={() => moveCard(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${card.id} card up`}
                  className="p-1 rounded-lg text-text-main/60 hover:text-accent-terracotta hover:bg-white/[0.06] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveCard(index, 1)}
                  disabled={index === orderedCards.length - 1}
                  aria-label={`Move ${card.id} card down`}
                  className="p-1 rounded-lg text-text-main/60 hover:text-accent-terracotta hover:bg-white/[0.06] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
