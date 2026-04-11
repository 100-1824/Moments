import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronRight, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  Lock,
  Mail,
  ArrowLeft
} from "lucide-react";
import { NeuButton, NeuInput, NeuCard } from "@/src/components/ui/Neumorphic";
import { useAuth } from "@/src/contexts/AuthContext";
import { cn } from "@/src/lib/utils";

export function AdminLoginScreen({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  const { sendAdminOtp, verifyAdminOtp } = useAuth();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid administrative email.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setDebugOtp(null);
    try {
      const res = await sendAdminOtp(email.trim());
      if (res.otp) {
        setDebugOtp(res.otp);
      }
      setStep("otp");
    } catch (e: any) {
      setError(e.message || "Access restricted or failed to send code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("Please enter your 6-digit security code.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await verifyAdminOtp(email.trim(), code);
      onNext();
    } catch (e: any) {
      setError(e.message || "Authentication failed. Access denied.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-6 sm:p-8">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-terracotta/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent-sage/10 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <button 
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-text-main/40 hover:text-text-main transition-colors text-sm font-semibold group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Consumer App
        </button>

        <div className="mb-12 text-center">
          <div className="w-20 h-20 neu-extruded rounded-2xl mx-auto mb-6 flex items-center justify-center bg-bg-main relative overflow-hidden group">
            <div className="absolute inset-0 bg-accent-terracotta/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <ShieldCheck className="w-10 h-10 text-accent-terracotta" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Moments Admin</h1>
          <p className="text-text-main/60 font-medium">Secure Administrative Gateway</p>
        </div>

        <NeuCard className="p-8 space-y-8">
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {step === "email" ? (
                <motion.div
                  key="email-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <label className="text-sm font-bold uppercase tracking-wider text-text-main/40 ml-1">
                      Admin Identity
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-main/20">
                        <Mail className="w-5 h-5" />
                      </div>
                      <NeuInput
                        placeholder="admin@moments.app"
                        type="email"
                        value={email}
                        className="pl-12 h-14"
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      />
                    </div>
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
                  <div className="space-y-3">
                    <label className="text-sm font-bold uppercase tracking-wider text-text-main/40 ml-1">
                      Security Code
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-main/20">
                        <Lock className="w-5 h-5" />
                      </div>
                      <NeuInput
                        placeholder="000 000"
                        type="text"
                        maxLength={6}
                        value={code}
                        className="pl-12 h-14 tracking-[0.5em] font-mono text-lg"
                        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                        onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setStep("email")}
                    className="text-xs font-bold text-text-main/40 hover:text-accent-terracotta transition-colors ml-1"
                  >
                    Use different administrative identity
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 text-accent-terracotta bg-accent-terracotta/10 p-4 rounded-xl text-sm font-bold border border-accent-terracotta/20"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              {debugOtp && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-accent-sage/10 text-accent-sage p-4 rounded-xl text-center border border-accent-sage/20 text-sm font-bold"
                >
                  {email === 'admin@moments.app' ? (
                    <span>Master Credentials Active: <span className="text-lg font-mono tracking-tight ml-1">000000</span></span>
                  ) : (
                    <span>Security code is <span className="text-lg font-mono tracking-tight ml-1">{debugOtp}</span></span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <NeuButton
            onClick={step === "email" ? handleSendOtp : handleVerify}
            disabled={isLoading}
            className={cn(
              "w-full h-16 text-lg font-bold transition-all",
              step === "otp" ? "text-accent-sage bg-accent-sage/5" : "text-accent-terracotta"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <span className="flex items-center gap-3">
                {step === "email" ? "Enter Vault" : "Authorize Access"}
                <ChevronRight className={cn("w-6 h-6", step === "otp" && "animate-pulse")} />
              </span>
            )}
          </NeuButton>
        </NeuCard>

        <div className="mt-12 text-center text-xs font-bold uppercase tracking-[0.2em] text-text-main/20">
          Moments System Admin &bull; Restricted Access
        </div>
      </motion.div>
    </div>
  );
}
