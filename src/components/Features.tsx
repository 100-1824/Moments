import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Sun, Moon, Cloud, Mic, Square, Play, Layers } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { NeuCard, NeuButton } from "@/src/components/ui/Neumorphic";
import { sendPing } from "@/src/lib/api";

// 1. "Thinking of You" Haptic Ping Button
export const HapticPingButton = () => {
  const [isPressing, setIsPressing] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isRateLimited, setIsRateLimited] = React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const triggerHaptic = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  const handleStart = () => {
    if (isRateLimited) return;
    setIsPressing(true);
    timerRef.current = setTimeout(async () => {
      triggerHaptic();
      setIsPressing(false);
      try {
        await sendPing();
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 2000);
      } catch {
        // 429 = rate limited; show brief cooldown state
        setIsRateLimited(true);
        setTimeout(() => setIsRateLimited(false), 60_000);
      }
    }, 1500);
  };

  const handleEnd = () => {
    setIsPressing(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-accent-terracotta/20 rounded-full blur-xl"
            />
          )}
        </AnimatePresence>
        <button
          onMouseDown={handleStart}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchEnd={handleEnd}
          className={cn(
            "w-24 h-24 rounded-full transition-all duration-300 flex items-center justify-center",
            isPressing ? "neu-depressed scale-95" : "neu-extruded",
            isSuccess && "text-accent-terracotta"
          )}
        >
          <Heart 
            className={cn(
              "w-10 h-10 transition-all duration-500",
              isSuccess ? "fill-accent-terracotta scale-125" : "text-text-main/40"
            )} 
          />
        </button>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">
        {isSuccess ? "Sent!" : isRateLimited ? "1/min limit" : "Hold to Ping"}
      </span>
    </div>
  );
};

// 2. Ambient Context Header
interface AmbientContextProps {
  partnerTime: string;
  weatherCondition: "sunny" | "cloudy" | "night";
}

export const AmbientContext = ({ partnerTime, weatherCondition }: AmbientContextProps) => {
  const Icon = weatherCondition === "sunny" ? Sun : weatherCondition === "night" ? Moon : Cloud;
  
  return (
    <div className="neu-extruded-sm rounded-full px-4 py-2 flex items-center gap-3 bg-background/50 backdrop-blur-sm">
      <div className="w-8 h-8 neu-depressed-sm rounded-full flex items-center justify-center">
        <Icon className="w-4 h-4 text-accent-terracotta" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-tighter opacity-40 leading-none">Partner's Time</span>
        <span className="text-sm font-bold leading-tight">{partnerTime}</span>
      </div>
    </div>
  );
};

// 3. Audio Captions (Voice Notes)
export const AudioCaption = () => {
  const [status, setStatus] = React.useState<"idle" | "recording" | "playing">("idle");

  return (
    <div className="neu-extruded-sm rounded-full p-2 flex items-center gap-3 w-full max-w-[200px]">
      <button
        onClick={() => setStatus(status === "idle" ? "recording" : status === "recording" ? "idle" : "playing")}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-all",
          status === "recording" ? "neu-depressed text-accent-terracotta" : "neu-extruded text-text-main/60"
        )}
      >
        {status === "recording" ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
      </button>
      
      <div className="flex-1 flex items-center gap-1 h-4 px-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            animate={status === "recording" ? {
              height: [4, Math.random() * 12 + 4, 4]
            } : { height: 4 }}
            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
            className={cn(
              "w-1 rounded-full",
              status === "recording" ? "bg-accent-terracotta" : "bg-text-main/20"
            )}
          />
        ))}
      </div>

      {status === "idle" && (
        <button className="w-8 h-8 neu-extruded-sm rounded-full flex items-center justify-center text-text-main/40">
          <Play className="w-3 h-3 fill-current" />
        </button>
      )}
    </div>
  );
};

// 4. Gentle Daily Prompts
const PROMPTS = [
  "Share something yellow.",
  "What are you drinking right now?",
  "Show me your current view.",
  "A small thing that made you smile today.",
  "What's the weather like there?",
  "Your favorite snack of the day.",
  "Something you're looking forward to.",
  "A song that's stuck in your head.",
  "The last thing you bought.",
  "A cozy corner in your home."
];

export const DailyPrompt = () => {
  // Simple day-based random
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const prompt = PROMPTS[dayOfYear % PROMPTS.length];

  return (
    <div className="neu-depressed rounded-3xl p-6 w-full">
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-2 block">Daily Prompt</span>
      <p className="text-lg font-medium text-text-main/80 italic">"{prompt}"</p>
    </div>
  );
};

// 5. Monthly "Time Capsule" Entry Point
export const TimeCapsule = ({ onClick }: { onClick: () => void }) => {
  return (
    <button 
      onClick={onClick}
      className="group relative w-32 h-40 transition-transform active:scale-95"
    >
      {/* Stacked Cards Effect */}
      <div className="absolute inset-0 neu-extruded rounded-xl rotate-6 translate-x-2 translate-y-2 opacity-40 group-hover:rotate-12 transition-transform" />
      <div className="absolute inset-0 neu-extruded rounded-xl -rotate-3 -translate-x-1 translate-y-1 opacity-60 group-hover:-rotate-6 transition-transform" />
      <div className="absolute inset-0 neu-extruded rounded-xl flex flex-col items-center justify-center p-4 border-4 border-background">
        <div className="w-10 h-10 neu-depressed-sm rounded-full flex items-center justify-center mb-3">
          <Layers className="w-5 h-5 text-accent-terracotta" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">March 2026</span>
        <span className="text-sm font-bold">Time Capsule</span>
      </div>
    </button>
  );
};
