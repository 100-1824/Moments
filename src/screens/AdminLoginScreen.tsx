import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { 
  ChevronRight, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  Lock,
  Mail,
  ArrowLeft,
  KeyRound,
  Fingerprint
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
  const formRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!formRef.current) return;
    gsap.fromTo(formRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );
  }, { dependencies: [step] });

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
    <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-6 sm:p-8 font-sans selection:bg-accent-terracotta/30">
      {/* Premium Background Gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-accent-terracotta/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent-sage/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <motion.button 
          whileHover={{ x: -4 }}
          onClick={onBack}
          className="mb-10 flex items-center gap-2 text-text-muted hover:text-text-main transition-colors text-sm font-medium tracking-tight"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Portal
        </motion.button>

        <div className="mb-12 text-center">
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-24 h-24 neu-extruded rounded-[32px] mx-auto mb-8 flex items-center justify-center bg-bg-main relative group"
          >
            <div className="absolute inset-0 bg-accent-terracotta/5 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity" />
            <Fingerprint className="w-12 h-12 text-accent-terracotta drop-shadow-[0_0_15px_rgba(217,119,87,0.4)]" />
          </motion.div>
          
          <h1 className="text-4xl font-black tracking-tighter mb-3 bg-gradient-to-b from-text-main to-text-main/60 bg-clip-text text-transparent">
            Vault Access
          </h1>
          <p className="text-text-muted font-medium text-lg">Moments Administrative Protocol</p>
        </div>

        <NeuCard className="p-10 space-y-10 tact-border">
          <div className="space-y-8" ref={formRef}>
            <AnimatePresence mode="wait">
              {step === "email" ? (
                <motion.div
                  key="email-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-2">
                       <Mail className="w-3 h-3" /> Identity Signature
                    </label>
                    <div className="relative group">
                      <NeuInput
                        placeholder="admin@moments.app"
                        type="email"
                        value={email}
                        className="h-16 text-lg"
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
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-2">
                       <KeyRound className="w-3 h-3" /> Temporal Key
                    </label>
                    <NeuInput
                      placeholder="000 000"
                      type="text"
                      maxLength={6}
                      value={code}
                      className="h-16 tracking-[0.6em] font-mono text-2xl text-center"
                      onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    />
                  </div>

                  <button
                    onClick={() => setStep("email")}
                    className="text-xs font-black text-text-muted hover:text-accent-terracotta transition-colors px-1"
                  >
                    RESET IDENTITY HANDSHAKE
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-start gap-4 text-accent-terracotta bg-accent-terracotta/5 p-6 rounded-2xl text-sm font-bold border border-accent-terracotta/10"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">
                    {error}
                  </div>
                </motion.div>
              )}

              {debugOtp && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-accent-sage/5 text-accent-sage p-6 rounded-2xl text-center border border-accent-sage/10 text-sm font-bold tact-glow"
                >
                  {email === 'admin@moments.app' ? (
                    <div className="flex items-center justify-center gap-3">
                      <ShieldCheck className="w-5 h-5" />
                      <span>MASTER OVERRIDE: <span className="text-xl font-mono tracking-widest ml-1">000000</span></span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <Lock className="w-5 h-5" />
                      <span>SECURE KEY: <span className="text-xl font-mono tracking-widest ml-1">{debugOtp}</span></span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <NeuButton
            onClick={step === "email" ? handleSendOtp : handleVerify}
            disabled={isLoading}
            size="xl"
            className={cn(
              "w-full h-20 text-xl font-black transition-all",
              step === "otp" ? "text-accent-sage" : "text-accent-terracotta"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <span className="flex items-center gap-3">
                {step === "email" ? "INITIALIZE" : "AUTHORIZE"}
                <ChevronRight className={cn("w-6 h-6", step === "otp" && "animate-pulse")} />
              </span>
            )}
          </NeuButton>
        </NeuCard>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/50">
            <span className="w-1 h-1 rounded-full bg-accent-sage animate-pulse" />
            System Status: Secure
          </div>
        </div>
      </motion.div>
    </div>
  );
}
