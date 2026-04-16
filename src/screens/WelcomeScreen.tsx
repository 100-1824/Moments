/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion } from "motion/react";
import { Heart } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/src/lib/utils";
import { NeuButton } from "@/src/components/ui/Neumorphic";

export default function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const heartRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const descRef = React.useRef<HTMLParagraphElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    // Heart entrance with floating effect
    tl.fromTo(heartRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.7)" },
      0
    );

    // Floating animation
    tl.to(heartRef.current,
      { y: -15, duration: 2, ease: "sine.inOut", repeat: -1, yoyo: true },
      0.8
    );

    // Title entrance
    tl.fromTo(titleRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
      0.3
    );

    // Description entrance
    tl.fromTo(descRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
      0.5
    );

    // Button entrance with scale
    tl.fromTo(buttonRef.current,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)" },
      0.7
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-8 text-center"
    >
      <div ref={heartRef} className="w-32 h-32 neu-extruded rounded-full flex items-center justify-center mb-12">
        <Heart className="w-16 h-16 text-accent-terracotta fill-accent-terracotta/20" />
      </div>
      <h1 ref={titleRef} className="text-4xl font-bold mb-4 tracking-tight">Moments</h1>
      <p ref={descRef} className="text-text-main/60 mb-12 leading-relaxed">
        A private, intimate space to share your day, three moments at a time.
      </p>
      <NeuButton
        ref={buttonRef}
        onClick={onStart}
        className="w-full max-w-xs h-16 text-lg font-semibold text-accent-terracotta"
      >
        Get Started
      </NeuButton>
    </motion.div>
  );
}
