/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, AlertCircle, Heart } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  NeuCard,
  NeuButton,
  NeuInput,
} from "@/src/components/ui/Neumorphic";
import { useAuth } from "@/src/contexts/AuthContext";
import { ApiError } from "@/src/lib/api";


export default function ConnectScreen({ onSuccess }: { onSuccess: () => void }) {
  const { user, connect, refreshMe } = useAuth();
  const [partnerCode, setPartnerCode] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const leftHeartRef = React.useRef<HTMLDivElement>(null);
  const rightHeartRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!isConnected || !leftHeartRef.current || !rightHeartRef.current) return;

    // Timeline for heart connection animation
    const tl = gsap.timeline({ defaults: { duration: 0.6, ease: "elastic.out(1.2, 0.75)" } });

    // Initial scale up from small
    tl.fromTo([leftHeartRef.current, rightHeartRef.current], 
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1 },
      0
    );

    // Hearts move toward each other from sides
    tl.fromTo(leftHeartRef.current,
      { x: -100 },
      { x: 0 },
      0
    );

    tl.fromTo(rightHeartRef.current,
      { x: 100 },
      { x: 0 },
      0
    );

    // Stagger pulse after connection
    tl.to([leftHeartRef.current, rightHeartRef.current],
      { scale: 1.15, duration: 0.4, ease: "power2.inOut", repeat: 2, yoyo: true },
      0.8
    );

    // Glow effect on center after connection
    tl.to(".connection-glow",
      { opacity: 1, duration: 0.8, ease: "power2.out" },
      0.6
    );
  }, { dependencies: [isConnected] });

  const handleConnect = async () => {
    if (!partnerCode.trim()) {
      setError("Enter your partner's invite code.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await connect(partnerCode.trim().toUpperCase());
      setIsConnected(true);
      
      // Wait for animation to complete before navigating
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 409) {
        // Already linked: refresh state to get couple_id/partner and move home
        try {
          await refreshMe();
          setIsConnected(true);
          setTimeout(() => {
            onSuccess();
          }, 2000);
          return;
        } catch (refreshErr) {
          // If refresh fails, show original error
        }
      }
      setError(e instanceof Error ? e.message : "Could not connect.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "-100%" }}
      className="flex-1 flex flex-col p-8 pt-20"
    >
      {!isConnected ? (
        <>
          <h2 className="text-3xl font-bold mb-4">Connect</h2>
          <p className="text-text-main/60 mb-8">
            Share your code with your partner or enter theirs.
          </p>

          <NeuCard className="mb-12 text-center py-10">
            <span className="text-xs uppercase tracking-widest opacity-40 mb-2 block">
              Your Unique Code
            </span>
            <span className="text-4xl font-mono font-bold tracking-tighter text-accent-terracotta">
              {user?.invite_code ?? "---"}
            </span>
          </NeuCard>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-2 opacity-60">
                Partner's Code
              </label>
              <NeuInput
                placeholder="MOM-XXX"
                value={partnerCode}
                onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
              />
            </div>
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-accent-terracotta text-sm px-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            <NeuButton
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full max-w-xs mx-auto text-accent-terracotta"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                "Connect"
              )}
            </NeuButton>
          </div>
        </>
      ) : (
        <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Glow effect */}
            <div className="connection-glow absolute inset-0 rounded-full bg-gradient-to-r from-accent-terracotta/0 via-accent-terracotta/20 to-accent-terracotta/0 blur-2xl opacity-0" />
            
            {/* Left heart */}
            <div
              ref={leftHeartRef}
              className="absolute left-0"
            >
              <Heart className="w-12 h-12 text-accent-terracotta fill-accent-terracotta" />
            </div>

            {/* Center spark line */}
            <div className="absolute w-8 h-0.5 bg-gradient-to-r from-accent-terracotta/0 via-accent-terracotta to-accent-terracotta/0 rounded-full" />

            {/* Right heart */}
            <div
              ref={rightHeartRef}
              className="absolute right-0"
            >
              <Heart className="w-12 h-12 text-accent-terracotta fill-accent-terracotta" />
            </div>
          </div>

          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Connected with {user?.partner_nickname || "your partner"}!</h2>
            <p className="text-text-main/60">You and {user?.partner_nickname || "your partner"} are now linked</p>
          </div>

          <button
            onClick={onSuccess}
            className="mt-6 px-8 py-3 rounded-full bg-accent-terracotta/10 border border-accent-terracotta/30 hover:border-accent-terracotta/60 hover:bg-accent-terracotta/20 transition-all duration-300 text-accent-terracotta font-bold uppercase tracking-wider"
          >
            Continue
          </button>
        </div>
      )}
    </motion.div>
  );
}
