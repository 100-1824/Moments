/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, AlertCircle } from "lucide-react";
import {
  NeuCard,
  NeuButton,
  NeuInput,
} from "@/src/components/ui/Neumorphic";
import { useAuth } from "@/src/contexts/AuthContext";

export default function ConnectScreen({ onSuccess }: { onSuccess: () => void }) {
  const { user, connect } = useAuth();
  const [partnerCode, setPartnerCode] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConnect = async () => {
    if (!partnerCode.trim()) {
      setError("Enter your partner's invite code.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await connect(partnerCode.trim().toUpperCase());
      onSuccess();
    } catch (e: unknown) {
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
    </motion.div>
  );
}
