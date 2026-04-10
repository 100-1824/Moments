/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { NeuButton } from "@/src/components/ui/Neumorphic";

export default function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="w-32 h-32 neu-extruded rounded-full flex items-center justify-center mb-12">
        <Heart className="w-16 h-16 text-accent-terracotta fill-accent-terracotta/20" />
      </div>
      <h1 className="text-4xl font-bold mb-4 tracking-tight">Moments</h1>
      <p className="text-text-main/60 mb-12 leading-relaxed">
        A private, intimate space to share your day, three moments at a time.
      </p>
      <NeuButton
        onClick={onStart}
        className="w-full max-w-xs h-16 text-lg font-semibold text-accent-terracotta"
      >
        Get Started
      </NeuButton>
    </motion.div>
  );
}
