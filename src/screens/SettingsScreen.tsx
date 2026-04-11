/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion } from "motion/react";
import {
  Users,
  ChevronRight,
  Lock as LockIcon,
  Download,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/contexts/AuthContext";
import { NeuCard, NeuButton } from "@/src/components/ui/Neumorphic";
import { SocialBatterySlider } from "@/src/components/AdvancedFeatures";

function SettingItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex justify-between items-center px-2 py-1 rounded-xl transition-colors",
        onClick && "cursor-pointer hover:bg-black/5 active:scale-[0.98]",
      )}
      onClick={onClick}
    >
      <span className="font-semibold">{label}</span>
      {active !== undefined ? (
        <button
          className={cn(
            "w-12 h-6 rounded-full transition-all duration-300 p-1",
            active ? "neu-depressed bg-accent-sage/20" : "neu-depressed",
          )}
        >
          <motion.div
            animate={{ x: active ? 24 : 0 }}
            className={cn(
              "w-4 h-4 rounded-full",
              active
                ? "bg-accent-sage shadow-[0_0_8px_rgba(138,154,91,0.5)]"
                : "bg-text-main/20",
            )}
          />
        </button>
      ) : onClick ? (
        <ChevronRight className="w-5 h-5 opacity-30" />
      ) : null}
    </div>
  );
}

export default function SettingsScreen({
  onBack,
  onLock,
  onPrivacy,
  onArchive,
  onAdmin,
  onLogout,
}: {
  onBack: () => void;
  onLock: () => void;
  onPrivacy: () => void;
  onArchive: () => void;
  onAdmin: () => void;
  onLogout: () => void;
}) {
  const { user, partner } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col p-8 pt-16 pb-32"
    >
      <div className="flex items-center mb-8">
        <h2 className="text-3xl font-bold">Settings</h2>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-40 px-2">
            Preferences
          </h3>
          <div className="space-y-4">
            <SettingItem label="Daily Reminders" active />
            <SettingItem label="Haptic Feedback" active />
            <SettingItem label="Privacy & Encryption" onClick={onPrivacy} />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-40 px-2">
            Account
          </h3>
          <SocialBatterySlider />
          {partner && (
            <NeuCard className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 neu-depressed rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 opacity-40" />
              </div>
              <div>
                <p className="font-bold">Partner: {partner.name}</p>
                <p className="text-xs opacity-40">
                  {partner.invite_code} • {partner.timezone}
                </p>
              </div>
            </NeuCard>
          )}
          {user && (
            <NeuCard className="p-4">
              <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-1">
                Your invite code
              </p>
              <p className="font-mono font-bold text-accent-terracotta text-lg">
                {user.invite_code}
              </p>
            </NeuCard>
          )}

          <div className="grid grid-cols-2 gap-4">
            <NeuButton
              onClick={onLock}
              className="w-full h-14 text-sm font-bold text-accent-terracotta"
            >
              <LockIcon className="w-4 h-4 mr-2" />
              Vault
            </NeuButton>
            <NeuButton
              onClick={onArchive}
              className="w-full h-14 text-sm font-bold opacity-60"
            >
              <Download className="w-4 h-4 mr-2" />
              Archive
            </NeuButton>
          </div>
          {user?.is_admin && (
            <NeuButton
              onClick={onAdmin}
              className="w-full h-14 text-sm font-bold text-accent-terracotta border border-accent-terracotta/20 mt-4"
            >
              <Users className="w-4 h-4 mr-2" />
              Admin Dashboard
            </NeuButton>
          )}
        </section>

        <NeuButton
          onClick={onLogout}
          className="w-full h-14 text-sm font-bold text-accent-terracotta/60"
        >
          Sign Out
        </NeuButton>
      </div>
    </motion.div>
  );
}
