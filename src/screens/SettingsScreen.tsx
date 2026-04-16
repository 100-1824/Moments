/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Users,
  ChevronRight,
  Lock as LockIcon,
  Download,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/contexts/AuthContext";
import { NeuCard, NeuButton } from "@/src/components/ui/Neumorphic";
import { SocialBatterySlider } from "@/src/components/AdvancedFeatures";
import * as api from "@/src/lib/api";

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
  const { user, partner, refreshMe } = useAuth();
  const [isEditingNickname, setIsEditingNickname] = React.useState(false);
  const [nicknameValue, setNicknameValue] = React.useState(user?.partner_nickname || "");
  const [isSavingNickname, setIsSavingNickname] = React.useState(false);

  useGSAP(() => {
    gsap.fromTo(".settings-section",
      { opacity: 0, y: 15, x: -10 },
      { opacity: 1, y: 0, x: 0, duration: 0.4, ease: "power2.out", stagger: 0.1 }
    );
  }, { dependencies: [isEditingNickname] });

  const getPartnerDisplayName = React.useCallback(() => {
    if (!partner) return "Partner";
    return user?.partner_nickname || partner.name;
  }, [user, partner]);

  const handleSaveNickname = async () => {
    setIsSavingNickname(true);
    try {
      await api.updatePartnerNickname(nicknameValue || null);
      // Refresh auth context to update partner data throughout the app
      await refreshMe();
      setIsEditingNickname(false);
    } catch (err) {
      alert("Failed to update partner nickname");
    } finally {
      setIsSavingNickname(false);
    }
  };

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
        <section className="settings-section space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-40 px-2">
            Preferences
          </h3>
          <div className="space-y-4">
            <SettingItem label="Daily Reminders" active />
            <SettingItem label="Haptic Feedback" active />
            <SettingItem label="Privacy & Encryption" onClick={onPrivacy} />
          </div>
        </section>

        <section className="settings-section space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-40 px-2">
            Account
          </h3>
          <SocialBatterySlider />
          {partner && (
            <div className="space-y-3">
              <NeuCard className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 neu-depressed rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 opacity-40" />
                </div>
                <div className="flex-1">
                  <p className="font-bold">
                    {getPartnerDisplayName()}
                  </p>
                  <p className="text-xs opacity-40">
                    {partner.invite_code} • {partner.timezone}
                  </p>
                </div>
              </NeuCard>
              
              {/* Partner Nickname Editor */}
              {isEditingNickname ? (
                <NeuCard className="p-4 space-y-3">
                  <p className="text-xs font-bold opacity-40 uppercase tracking-widest">
                    Partner's Nickname
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nicknameValue}
                      onChange={(e) => setNicknameValue(e.target.value)}
                      placeholder={partner.name}
                      className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-terracotta/50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveNickname}
                      disabled={isSavingNickname}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent-terracotta/20 hover:bg-accent-terracotta/30 rounded-lg transition-colors disabled:opacity-50 text-sm font-semibold"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingNickname(false);
                        setNicknameValue(user?.partner_nickname || "");
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-black/20 hover:bg-black/30 rounded-lg transition-colors text-sm font-semibold"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </NeuCard>
              ) : (
                <button
                  onClick={() => setIsEditingNickname(true)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl hover:border-accent-terracotta/30 transition-all"
                >
                  <span className="text-sm font-semibold">Edit Partner Nickname</span>
                  <Edit2 className="w-4 h-4 opacity-40" />
                </button>
              )}
            </div>
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
