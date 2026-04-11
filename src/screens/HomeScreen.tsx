/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Plus, RefreshCw, Zap, Music, Ghost, Camera } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/contexts/AuthContext";
import { 
  NeuCard, 
  NeuButton, 
  DailyProgress, 
  BentoCard, 
  staggerContainer,
  staggerItem 
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

  // Derive partner's local time for ambient context
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
      }, 2000);
    } else {
      onUpload();
    }
  };

  const isPartnerActive = React.useMemo(() => {
    if (!partner?.last_seen_at) return false;
    return Date.now() - new Date(partner.last_seen_at).getTime() < 5 * 60_000;
  }, [partner?.last_seen_at]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="flex-1 p-4 md:p-8 pt-12 pb-32"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[minmax(180px,auto)]">
        
        {/* Header & Status (2x1) */}
        <BentoCard className="md:col-span-2 flex flex-col justify-between">
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tighter">MOMENTS</h2>
            <div className="flex items-center gap-3">
              <PresenceIndicator isPartnerActive={isPartnerActive} />
              <button
                onClick={onOutbox}
                className="w-8 h-8 neu-extruded-sm rounded-full flex items-center justify-center transition-transform hover:rotate-180 duration-500"
              >
                <RefreshCw className="w-4 h-4 text-accent-terracotta" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-text-main/40 text-sm font-medium">
            <Zap className="w-4 h-4" />
            <span>Connection Strength: High</span>
          </div>
        </BentoCard>

        {/* Digital Locket (1x1) */}
        <BentoCard className="flex items-center justify-center p-0 overflow-hidden min-h-[180px]">
          <DigitalLocket imageUrl="https://picsum.photos/seed/locket/800/800" />
        </BentoCard>

        {/* Ambient Context (1x1) */}
        <BentoCard className="flex flex-col items-center justify-center gap-3">
          {partnerLocalTime ? (
            <AmbientContext partnerTime={partnerLocalTime} weatherCondition="sunny" />
          ) : (
            <div className="opacity-20 flex flex-col items-center">
              <Ghost className="w-12 h-12 mb-2" />
              <span className="text-xs font-bold uppercase tracking-widest">Awaiting Link</span>
            </div>
          )}
        </BentoCard>

        {/* Daily Progress (3x1) */}
        <BentoCard className="md:col-span-3 flex flex-col md:flex-row items-center justify-between px-12 py-8 min-h-[160px]">
          <div className="flex-1 flex flex-col items-center md:items-start gap-2 mb-6 md:mb-0">
            <span className="text-xs font-black uppercase tracking-[0.2em] opacity-40">Today's Quota</span>
            <DailyProgress count={count} />
          </div>
          <div className="text-right flex flex-col items-center md:items-end">
             <span className="text-4xl font-black text-accent-terracotta leading-none">
               {3 - count}
             </span>
             <span className="text-[10px] font-bold uppercase opacity-40">Left to Capture</span>
          </div>
        </BentoCard>

        {/* Quick Upload Action (1x1) */}
        <BentoCard 
          className="flex flex-col items-center justify-center group cursor-pointer"
          onClick={handleUploadClick}
        >
          <motion.div
            animate={isShaking ? { x: [-4, 4, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-4"
          >
            <div className={cn(
              "w-20 h-20 rounded-full neu-extruded flex items-center justify-center transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(217,119,87,0.3)]",
              count < 3 ? "text-accent-terracotta" : "text-text-main/10"
            )}>
              {count < 3 ? <Plus className="w-8 h-8" /> : <Heart className="w-8 h-8" />}
            </div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
              {count < 3 ? "New Moment" : "Complete"}
            </span>
          </motion.div>
        </BentoCard>

        {/* Daily Prompt (2x1) */}
        <BentoCard className="md:col-span-2 flex flex-col justify-center min-h-[180px]">
          <DailyPrompt />
        </BentoCard>

        {/* Foggy Mirror (1x1) */}
        <BentoCard className="flex items-center justify-center p-0">
          <FoggyMirror />
        </BentoCard>

        {/* Now Playing (1x2 on MD) */}
        <BentoCard className="md:col-span-1 md:row-span-2 flex flex-col justify-between overflow-hidden relative">
          <div className="flex justify-between items-start mb-4">
            <Music className="w-6 h-6 text-accent-terracotta" />
            <div className="flex gap-1">
              {[1,2,3].map(i => (
                <div key={i} className="w-1 h-3 bg-accent-terracotta/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
          <NowPlayingPlayer title="Moonlight" artist="Kali Uchis" />
        </BentoCard>

        {/* Bonus Interactive Card (2x1) */}
        <BentoCard className="md:col-span-3 min-h-[220px] flex items-center justify-center relative group">
          <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-none" />
          <div className="z-10 text-center flex flex-col items-center gap-4">
             <Heart className="w-12 h-12 text-accent-terracotta animate-pulse" />
             <p className="max-w-xs text-sm font-medium opacity-60">
               "Small moments are the big memories of tomorrow."
             </p>
             <button className="px-6 py-2 rounded-full neu-extruded-sm text-[10px] font-black uppercase tracking-widest hover:text-accent-terracotta transition-colors">
               View Timeline
             </button>
          </div>
        </BentoCard>
      </div>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-text-main text-background text-xs font-black py-4 px-8 rounded-full shadow-2xl z-[200] border border-white/20 backdrop-blur-xl"
          >
            YOU'VE SHARED ALL 3 MOMENTS TODAY.
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

