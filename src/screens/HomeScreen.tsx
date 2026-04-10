/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/contexts/AuthContext";
import { NeuCard, NeuButton, DailyProgress } from "@/src/components/ui/Neumorphic";
import {
  HapticPingButton,
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

  // Is partner "active" = seen in last 5 minutes
  const isPartnerActive = React.useMemo(() => {
    if (!partner?.last_seen_at) return false;
    return Date.now() - new Date(partner.last_seen_at).getTime() < 5 * 60_000;
  }, [partner?.last_seen_at]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col p-8 pt-12 pb-32 gap-8"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold">Today</h2>
          <div className="flex items-center gap-3">
            <PresenceIndicator isPartnerActive={isPartnerActive} />
            <button
              onClick={onOutbox}
              className="w-6 h-6 neu-extruded-sm rounded-full flex items-center justify-center"
            >
              <RefreshCw className="w-3 h-3 text-accent-terracotta" />
            </button>
          </div>
        </div>
        <DigitalLocket imageUrl="https://picsum.photos/seed/locket/400/400" />
      </div>

      {partnerLocalTime && (
        <div className="flex justify-end -mt-4">
          <AmbientContext partnerTime={partnerLocalTime} weatherCondition="sunny" />
        </div>
      )}

      <NeuCard className="flex flex-col items-center py-10">
        <DailyProgress count={count} />
        <p className="mt-6 text-sm font-semibold opacity-40">
          {count >= 3
            ? "All moments shared!"
            : `${3 - count} moment${3 - count !== 1 ? "s" : ""} left today`}
        </p>
      </NeuCard>

      <DailyPrompt />

      <NowPlayingPlayer title="Midnight City" artist="M83" />

      <FoggyMirror />

      <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-0 bg-text-main text-background text-[10px] font-bold py-2 px-4 rounded-full shadow-lg z-10"
            >
              You've shared all 3 moments today.
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center flex flex-col items-center gap-12">
          <motion.div
            animate={isShaking ? { x: [-4, 4, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <NeuButton
              onClick={handleUploadClick}
              active={count >= 3}
              className={cn(
                "w-32 h-32 mx-auto transition-colors duration-500",
                count < 3 ? "text-accent-terracotta" : "text-text-main/20",
              )}
            >
              {count < 3 ? (
                <Plus className="w-12 h-12" />
              ) : (
                <Heart className="w-12 h-12" />
              )}
            </NeuButton>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
