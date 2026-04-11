/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { NeuButton, NeuInput } from "@/src/components/ui/Neumorphic";
import { useAuth } from "@/src/contexts/AuthContext";

export default function AuthScreen({ onNext }: { onNext: () => void }) {
  const { sendOtp, verifyOtp } = useAuth();
  const [step, setStep] = React.useState<"email" | "otp">("email");
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [debugOtp, setDebugOtp] = React.useState<string | null>(null);
  const [needsRegistration, setNeedsRegistration] = React.useState(false);

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setDebugOtp(null);
    setNeedsRegistration(false);
    try {
      const res = await sendOtp(email.trim());
      // In local mode, the backend might return the OTP for convenience
      if (res.otp) {
        setDebugOtp(res.otp);
      }
      setStep("otp");
    } catch (e: any) {
      setError(e.message || "Failed to send verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await verifyOtp(email.trim(), code, name.trim() || undefined);
      onNext();
    } catch (e: any) {
      if (e.status === 404 || e.needs_registration) {
        setNeedsRegistration(true);
        setError("Welcome! Please tell us your name to finish signing up.");
      } else {
        setError(e.message || "Invalid code.");
      }
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
      <h2 className="text-3xl font-bold mb-8">
        {step === "email" ? "Welcome back" : "Check your inbox"}
      </h2>

      <div className="space-y-6 mb-12">
        <AnimatePresence mode="wait">
          {step === "email" ? (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-2 opacity-60">Your Email</label>
                <NeuInput
                  placeholder="alex@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-2 opacity-60">6-Digit Code</label>
                <NeuInput
                  placeholder="000000"
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
              </div>

              {/* Only show name input if we got a 404/needs_registration error */}
              {(needsRegistration || name) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2"
                >
                  <label className="text-sm font-semibold ml-2 opacity-60">Your Name</label>
                  <NeuInput
                    placeholder="Alex"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </motion.div>
              )}

              <button
                onClick={() => setStep("email")}
                className="text-xs font-semibold ml-2 opacity-40 hover:opacity-100 transition-opacity"
              >
                Use a different email
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
          {debugOtp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs bg-accent-terracotta/10 text-accent-terracotta p-2 rounded-lg text-center"
            >
              Debug Mode: OTP is <strong>{debugOtp}</strong>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NeuButton
        onClick={step === "email" ? handleSendOtp : handleVerify}
        disabled={isLoading}
        className="w-full max-w-xs mx-auto text-accent-terracotta"
      >
        {isLoading ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : (
          <ChevronRight className="w-8 h-8" />
        )}
      </NeuButton>
    </motion.div>
  );
}
