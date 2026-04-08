/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  Camera,
  Users,
  Settings,
  Plus,
  ChevronRight,
  Image as ImageIcon,
  Send,
  ArrowLeft,
  Bell,
  Lock as LockIcon,
  RefreshCw,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import * as api from "@/src/lib/api";
import { useAuth } from "@/src/contexts/AuthContext";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import {
  NeuCard,
  NeuButton,
  NeuInput,
  NeuTextArea,
  DailyProgress,
} from "@/src/components/ui/Neumorphic";
import {
  HapticPingButton,
  AmbientContext,
  AudioCaption,
  DailyPrompt,
  TimeCapsule,
} from "@/src/components/Features";
import {
  AmbientGlowWrapper,
  VaultScreen,
  PresenceIndicator,
  SocialBatterySlider,
} from "@/src/components/AdvancedFeatures";
import {
  DigitalLocket,
  HoldToReveal,
  NowPlayingPlayer,
  FoggyMirror,
} from "@/src/components/TactileFeatures";
import {
  PrivacySettingsPage,
  OfflineOutboxPage,
  MonthlyMoodBoardPage,
  DataArchivePage,
} from "@/src/components/UtilityPages";

type Screen =
  | "loading"
  | "welcome"
  | "auth"
  | "connect"
  | "home"
  | "feed"
  | "settings"
  | "upload"
  | "privacy"
  | "outbox"
  | "moodboard"
  | "archive";

export default function App() {
  const auth = useAuth();

  const [currentScreen, setCurrentScreen] = React.useState<Screen>("loading");
  const [showSuccessRipple, setShowSuccessRipple] = React.useState(false);
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
  const [isLocked, setIsLocked] = React.useState(false);
  const [glowColor, setGlowColor] = React.useState("#D97757");
  const [moodColors, setMoodColors] = React.useState(["#D97757", "#8A9A5B", "#5797D9"]);

  // Navigate to the correct initial screen once auth is resolved.
  React.useEffect(() => {
    if (auth.isLoading) return;

    if (!auth.user) {
      setCurrentScreen("welcome");
    } else if (!auth.user.couple_id) {
      setCurrentScreen("connect");
    } else {
      setCurrentScreen("home");
    }
  }, [auth.isLoading, auth.user]);

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const navigate = (screen: Screen) => setCurrentScreen(screen);

  const handleUploadSuccess = (remaining: number) => {
    auth.setDailyCount(3 - remaining);
    setShowSuccessRipple(true);
    const randomColors = ["#D97757", "#8A9A5B", "#5797D9", "#D957A5"];
    setGlowColor(randomColors[Math.floor(Math.random() * randomColors.length)]);
    setTimeout(() => setShowSuccessRipple(false), 2000);
    navigate("home");
  };

  if (currentScreen === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-20 h-20 neu-extruded rounded-full flex items-center justify-center">
          <Heart className="w-10 h-10 text-accent-terracotta animate-pulse fill-accent-terracotta/20" />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AmbientGlowWrapper color={glowColor}>
        <div
          className={cn(
            "min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden transition-opacity duration-500",
            isOffline && "opacity-60 grayscale-[0.5] pointer-events-none",
          )}
        >
          <AnimatePresence>
            {isLocked && (
              <VaultScreen key="vault" onUnlock={() => setIsLocked(false)} />
            )}
          </AnimatePresence>

          {/* Offline Banner */}
          <AnimatePresence>
            {isOffline && (
              <motion.div
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                exit={{ y: -100 }}
                className="fixed top-0 left-0 right-0 z-[200] p-4 flex justify-center"
              >
                <div className="neu-extruded bg-accent-terracotta/10 px-6 py-2 rounded-full flex items-center gap-2 border border-accent-terracotta/20">
                  <div className="w-2 h-2 rounded-full bg-accent-terracotta animate-pulse" />
                  <span className="text-xs font-bold text-accent-terracotta">
                    Waiting for connection...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Ripple */}
          <AnimatePresence>
            {showSuccessRipple && (
              <motion.div
                initial={{ scale: 0, opacity: 0.5 }}
                animate={{ scale: 4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
              >
                <div className="w-64 h-64 rounded-full bg-accent-terracotta/20 blur-3xl" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {currentScreen === "welcome" && (
              <WelcomeScreen key="welcome" onStart={() => navigate("auth")} />
            )}
            {currentScreen === "auth" && (
              <AuthScreen
                key="auth"
                onNext={() => navigate("connect")}
              />
            )}
            {currentScreen === "connect" && (
              <ConnectScreen
                key="connect"
                onSuccess={() => navigate("home")}
              />
            )}
            {currentScreen === "home" && (
              <HomeScreen
                key="home"
                count={auth.dailyCount}
                onUpload={() => navigate("upload")}
                onOutbox={() => navigate("outbox")}
              />
            )}
            {currentScreen === "upload" && (
              <UploadScreen
                key="upload"
                onBack={() => navigate("home")}
                onSuccess={handleUploadSuccess}
              />
            )}
            {currentScreen === "feed" && (
              <FeedScreen
                key="feed"
                onMoodBoard={() => navigate("moodboard")}
              />
            )}
            {currentScreen === "settings" && (
              <SettingsScreen
                key="settings"
                onBack={() => navigate("home")}
                onLock={() => setIsLocked(true)}
                onPrivacy={() => navigate("privacy")}
                onArchive={() => navigate("archive")}
                onLogout={async () => {
                  await auth.logout();
                  navigate("welcome");
                }}
              />
            )}
            {currentScreen === "privacy" && (
              <PrivacySettingsPage
                key="privacy"
                onBack={() => navigate("settings")}
              />
            )}
            {currentScreen === "archive" && (
              <DataArchivePage
                key="archive"
                onBack={() => navigate("settings")}
              />
            )}
            {currentScreen === "outbox" && (
              <OfflineOutboxPage
                key="outbox"
                onBack={() => navigate("home")}
              />
            )}
            {currentScreen === "moodboard" && (
              <MonthlyMoodBoardPage
                key="moodboard"
                colors={moodColors}
                onBack={() => navigate("feed")}
              />
            )}
          </AnimatePresence>

          {/* Bottom Navigation */}
          {["home", "feed", "settings"].includes(currentScreen) && (
            <>
              <div className="fixed bottom-24 left-6 z-[150]">
                <HapticPingButton />
              </div>
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-background/80 backdrop-blur-md"
              >
                <div className="neu-extruded rounded-full flex justify-around items-center p-2">
                  <NavButton
                    active={currentScreen === "home"}
                    onClick={() => navigate("home")}
                    icon={
                      <Heart
                        className={cn(
                          "w-6 h-6",
                          currentScreen === "home"
                            ? "text-accent-terracotta"
                            : "text-text-main/40",
                        )}
                      />
                    }
                  />
                  <NavButton
                    active={currentScreen === "feed"}
                    onClick={() => navigate("feed")}
                    icon={
                      <Users
                        className={cn(
                          "w-6 h-6",
                          currentScreen === "feed"
                            ? "text-accent-terracotta"
                            : "text-text-main/40",
                        )}
                      />
                    }
                  />
                  <NavButton
                    active={currentScreen === "settings"}
                    onClick={() => navigate("settings")}
                    icon={
                      <Settings
                        className={cn(
                          "w-6 h-6",
                          currentScreen === "settings"
                            ? "text-accent-terracotta"
                            : "text-text-main/40",
                        )}
                      />
                    }
                  />
                </div>
              </motion.div>
            </>
          )}
        </div>
      </AmbientGlowWrapper>
    </ErrorBoundary>
  );
}

function NavButton({
  active,
  icon,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-full transition-all duration-300",
        active ? "neu-depressed-sm" : "hover:bg-black/5",
      )}
    >
      {icon}
    </button>
  );
}

// ─── Screens ─────────────────────────────────────────────────────────────────

function WelcomeScreen({ onStart }: { onStart: () => void; key?: string }) {
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

function AuthScreen({ onNext }: { onNext: () => void; key?: string }) {
  const { register } = useAuth();
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      setError("Please fill in your name and phone number.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      await register(name.trim(), phone.trim(), timezone);
      onNext();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
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
      <h2 className="text-3xl font-bold mb-8">Join Moments</h2>
      <div className="space-y-6 mb-12">
        <div className="space-y-2">
          <label className="text-sm font-semibold ml-2 opacity-60">Your Name</label>
          <NeuInput
            placeholder="Alex"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold ml-2 opacity-60">Phone Number</label>
          <NeuInput
            placeholder="+1 (555) 000-0000"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
      </div>
      <NeuButton
        onClick={handleSubmit}
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

function ConnectScreen({ onSuccess }: { onSuccess: () => void; key?: string }) {
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

function HomeScreen({
  count,
  onUpload,
  onOutbox,
}: {
  count: number;
  onUpload: () => void;
  onOutbox: () => void;
  key?: string;
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
          <AmbientContext partnerTime={partnerLocalTime} weatherCondition="day" />
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

function UploadScreen({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: (remaining: number) => void;
  key?: string;
}) {
  const [caption, setCaption] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSend = async () => {
    if (!selectedFile) {
      setError("Please select a photo or audio file.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const type = selectedFile.type.startsWith("audio") ? "audio" : "image";
      const result = await api.uploadMoment(
        selectedFile,
        type,
        caption.trim() || null,
        false,
      );
      onSuccess(result.remaining_today);
    } catch (e: unknown) {
      if (!navigator.onLine) {
        // Queue offline
        const reader = new FileReader();
        reader.onload = () => {
          api.addToOfflineQueue({
            type: selectedFile.type.startsWith("audio") ? "audio" : "image",
            fileDataUrl: reader.result as string,
            fileName: selectedFile.name,
            mimeType: selectedFile.type,
            caption_payload: caption.trim() || null,
            is_encrypted: false,
            captured_at: new Date().toISOString(),
          });
          onSuccess(3); // optimistic: assume queued
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setError(e instanceof Error ? e.message : "Upload failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      className="fixed inset-0 bg-background z-50 flex flex-col p-8"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="flex items-center mb-8">
        <NeuButton size="sm" onClick={onBack} className="w-12 h-12 mr-4">
          <ArrowLeft className="w-5 h-5" />
        </NeuButton>
        <h2 className="text-2xl font-bold">New Moment</h2>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto pb-8">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-square neu-depressed rounded-[40px] flex flex-col items-center justify-center text-text-main/20 border-4 border-background overflow-hidden"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover rounded-[36px]"
            />
          ) : (
            <>
              <Camera className="w-16 h-16 mb-4" />
              <p className="font-bold">Tap to choose photo</p>
            </>
          )}
        </button>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <label className="text-sm font-semibold opacity-60">
              Moment Details
            </label>
            <AudioCaption />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">
                Caption
              </span>
              <span className="text-[10px] font-bold opacity-30">
                {caption.length}/120
              </span>
            </div>
            <NeuTextArea
              placeholder="What's on your mind?"
              rows={4}
              maxLength={120}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
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
      </div>

      <NeuButton
        onClick={handleSend}
        disabled={isLoading || !selectedFile}
        className="w-full h-16 text-lg font-bold text-accent-terracotta mt-auto"
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <>
            <Send className="w-6 h-6 mr-2" />
            Send Moment
          </>
        )}
      </NeuButton>
    </motion.div>
  );
}

function FeedScreen({
  onMoodBoard,
}: {
  onMoodBoard: () => void;
  key?: string;
}) {
  const [moments, setMoments] = React.useState<api.ApiMoment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api
      .fetchTodayMoments()
      .then((data) => setMoments(data.moments))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load feed."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col p-8 pt-16 pb-32"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Partner Feed</h2>
        <TimeCapsule onClick={onMoodBoard} />
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent-terracotta" />
        </div>
      )}

      {error && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <AlertCircle className="w-8 h-8 text-accent-terracotta/50" />
          <p className="text-sm opacity-50">{error}</p>
        </div>
      )}

      {!isLoading && !error && moments.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-20 h-20 neu-depressed rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-text-main/20" />
          </div>
          <p className="text-sm opacity-40">
            No moments shared today yet. Check back soon.
          </p>
        </div>
      )}

      {!isLoading && moments.length > 0 && (
        <div className="space-y-10">
          {moments.map((moment, idx) => (
            <div key={moment.id} className="space-y-4">
              {idx === 0 ? (
                <HoldToReveal imageUrl={moment.media_url} />
              ) : (
                <NeuCard className="p-2 overflow-hidden">
                  <img
                    src={moment.media_url}
                    alt="Moment"
                    className="w-full aspect-square object-cover rounded-[28px]"
                  />
                </NeuCard>
              )}
              <div className="px-2">
                {moment.caption_payload && !moment.is_encrypted && (
                  <p className="font-medium leading-relaxed">
                    {moment.caption_payload}
                  </p>
                )}
                {moment.is_encrypted && (
                  <p className="font-medium leading-relaxed opacity-40 italic">
                    🔒 Encrypted message
                  </p>
                )}
                <span className="text-xs font-bold opacity-30 uppercase tracking-widest">
                  {moment.created_at
                    ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
                        Math.round(
                          (new Date(moment.created_at).getTime() - Date.now()) / 3600000,
                        ),
                        "hour",
                      )
                    : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function SettingsScreen({
  onBack,
  onLock,
  onPrivacy,
  onArchive,
  onLogout,
}: {
  onBack: () => void;
  onLock: () => void;
  onPrivacy: () => void;
  onArchive: () => void;
  onLogout: () => void;
  key?: string;
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
