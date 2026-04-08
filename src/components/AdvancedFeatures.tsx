import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Fingerprint, Lock as LockIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";

// 1. Dynamic Ambient Glow (Background Wrapper)
export const AmbientGlowWrapper = ({ children, color = "#D97757" }: { children: React.ReactNode; color?: string }) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* The Glow Layer */}
      <motion.div
        animate={{
          background: `radial-gradient(circle at 50% 50%, ${color}15 0%, transparent 70%)`,
        }}
        transition={{ duration: 2, ease: "easeInOut" }}
        className="absolute inset-0 pointer-events-none z-0 opacity-50 blur-[100px]"
      />
      
      {/* Content Layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// 2. The "Vault" (Secure Lock Screen)
export const VaultScreen = ({ onUnlock }: { onUnlock: () => void; key?: string }) => {
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const [isUnlocked, setIsUnlocked] = React.useState(false);

  const triggerBiometricAuth = async () => {
    setIsAuthenticating(true);
    // Simulate biometric delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    console.log("Biometric auth successful");
    setIsUnlocked(true);
    setIsAuthenticating(false);
    
    setTimeout(() => {
      onUnlock();
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-background flex flex-col items-center justify-center p-8"
    >
      <div className="mb-12 text-center">
        <div className="w-20 h-20 neu-extruded rounded-full flex items-center justify-center mx-auto mb-6">
          <LockIcon className={cn("w-8 h-8 transition-colors duration-500", isUnlocked ? "text-accent-sage" : "text-text-main/20")} />
        </div>
        <h2 className="text-2xl font-bold">The Vault</h2>
        <p className="text-sm opacity-40">Private moments are locked</p>
      </div>

      <button
        onClick={triggerBiometricAuth}
        disabled={isAuthenticating || isUnlocked}
        className={cn(
          "w-48 h-48 rounded-[48px] transition-all duration-500 flex flex-col items-center justify-center gap-4",
          isAuthenticating ? "neu-depressed" : isUnlocked ? "neu-extruded scale-105" : "neu-extruded active:neu-depressed"
        )}
      >
        <div className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500",
          isAuthenticating ? "scale-90 opacity-50" : "scale-100"
        )}>
          <Fingerprint className={cn(
            "w-16 h-16 transition-colors duration-500",
            isUnlocked ? "text-accent-sage" : isAuthenticating ? "text-accent-terracotta animate-pulse" : "text-text-main/40"
          )} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">
          {isUnlocked ? "Unlocked" : isAuthenticating ? "Verifying..." : "Touch to Unlock"}
        </span>
      </button>

      {isUnlocked && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-8 text-accent-sage font-bold"
        >
          Welcome back
        </motion.div>
      )}
    </motion.div>
  );
};

// 3. Live "Presence" Indicator
export const PresenceIndicator = ({ isPartnerActive }: { isPartnerActive: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center">
        {/* The "Dimple" or "Bead" */}
        <div className={cn(
          "w-3 h-3 rounded-full transition-all duration-700",
          isPartnerActive 
            ? "neu-extruded bg-accent-terracotta shadow-[0_0_10px_rgba(217,119,87,0.6)]" 
            : "neu-depressed-sm"
        )} />
        
        {/* Pulse Effect */}
        <AnimatePresence>
          {isPartnerActive && (
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute w-3 h-3 rounded-full bg-accent-terracotta/40"
            />
          )}
        </AnimatePresence>
      </div>
      <span className={cn(
        "text-[10px] font-bold uppercase tracking-widest transition-opacity duration-500",
        isPartnerActive ? "opacity-60" : "opacity-20"
      )}>
        {isPartnerActive ? "Partner Active" : "Away"}
      </span>
    </div>
  );
};

// 4. The "Social Battery" Slider
export const SocialBatterySlider = () => {
  const [value, setValue] = React.useState(75);

  const getLabel = (v: number) => {
    if (v < 20) return "Drained";
    if (v < 50) return "Low Energy";
    if (v < 80) return "Feeling Good";
    return "Fully Charged";
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-end px-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">Social Battery</span>
          <span className="text-lg font-bold text-accent-terracotta">{value}%</span>
        </div>
        <span className="text-xs font-bold opacity-60">{getLabel(value)}</span>
      </div>

      <div className="relative h-12 flex items-center">
        {/* The Track (Debossed) */}
        <div className="absolute inset-0 neu-depressed rounded-full h-4 my-auto" />
        
        {/* The Native Input (Hidden but functional) */}
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => setValue(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />

        {/* The Thumb (Extruded) */}
        <motion.div
          animate={{ left: `${value}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute w-10 h-10 neu-extruded rounded-full -ml-5 pointer-events-none z-10 flex items-center justify-center"
        >
          <div className="w-2 h-2 rounded-full bg-accent-terracotta/40" />
        </motion.div>
      </div>
    </div>
  );
};
