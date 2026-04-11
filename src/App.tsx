/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  Users,
  Settings,
  Loader2,
  Wifi,
  WifiOff,
  Database,
  HardDrive,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { CameraScreen } from "@/src/screens/CameraScreen";
import { AudioScreen } from "@/src/screens/AudioScreen";
import { SocialBatteryScreen } from "@/src/screens/SocialBatteryScreen";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/contexts/AuthContext";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import {
  AmbientGlowWrapper,
  VaultScreen,
} from "@/src/components/AdvancedFeatures";
import {
  HapticPingButton,
} from "@/src/components/Features";
import {
  PrivacySettingsPage,
  OfflineOutboxPage,
  MonthlyMoodBoardPage,
  DataArchivePage,
} from "@/src/components/UtilityPages";

// ─── Lazy-loaded screens ─────────────────────────────────────────────────────
const WelcomeScreen = React.lazy(() => import("@/src/screens/WelcomeScreen"));
const AuthScreen = React.lazy(() => import("@/src/screens/AuthScreen"));
const ConnectScreen = React.lazy(() => import("@/src/screens/ConnectScreen"));
const HomeScreen = React.lazy(() => import("@/src/screens/HomeScreen"));
const UploadScreen = React.lazy(() => import("@/src/screens/UploadScreen"));
const FeedScreen = React.lazy(() => import("@/src/screens/FeedScreen"));
const SettingsScreen = React.lazy(() => import("@/src/screens/SettingsScreen"));
const AdminLoginScreen = React.lazy(() => import("@/src/screens/AdminLoginScreen").then(m => ({ default: m.AdminLoginScreen })));
const AdminScreen = React.lazy(() => import("@/src/screens/AdminScreen").then(m => ({ default: m.AdminScreen })));

type Screen =
  | "loading"
  | "welcome"
  | "auth"
  | "admin_login"
  | "admin_dashboard"
  | "connect"
  | "home"
  | "feed"
  | "settings"
  | "upload"
  | "privacy"
  | "outbox"
  | "moodboard"
  | "archive";

function ScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-16 h-16 neu-extruded rounded-full flex items-center justify-center">
        <Heart className="w-8 h-8 text-accent-terracotta animate-pulse fill-accent-terracotta/20" />
      </div>
    </div>
  );
}

export default function App() {
  const auth = useAuth();

  const [currentScreen, setCurrentScreen] = React.useState<Screen>("loading");
  const [showSuccessRipple, setShowSuccessRipple] = React.useState(false);
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
  const [isLocked, setIsLocked] = React.useState(false);
  const [glowColor, setGlowColor] = React.useState("#D97757");
  const [moodColors] = React.useState(["#D97757", "#8A9A5B", "#5797D9"]);

    // Navigate to the correct initial screen once auth is resolved.
    React.useEffect(() => {
      if (auth.isLoading) return;
  
      const path = window.location.pathname;
  
      // Prioritize Admin paths
      if (path.startsWith('/admin')) {
        if (auth.user?.is_admin) {
          setCurrentScreen("admin_dashboard");
        } else {
          setCurrentScreen("admin_login");
        }
        return;
      }

      if (!auth.user) {
        setCurrentScreen("welcome");
      } else if (auth.user.is_admin) {
        setCurrentScreen("admin_dashboard");
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

          <React.Suspense fallback={<ScreenLoader />}>
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
              {currentScreen === "admin_login" && (
                <AdminLoginScreen key="admin_login" onNext={() => navigate("admin_dashboard")} onBack={() => navigate("auth")} />
              )}
              {currentScreen === "admin_dashboard" && (
                <div key="admin_dashboard" className="absolute inset-0 z-[100] bg-bg-main overflow-y-auto pb-24">
                  <div className="p-4 md:p-8 flex items-center justify-between pointer-events-none absolute w-full top-0">
                    <button 
                      onClick={() => navigate("settings")} 
                      className="neu-button neu-depressed-sm w-12 h-12 rounded-full flex items-center justify-center pointer-events-auto"
                    >
                      <Heart className="w-5 h-5 text-text-main/60 rotate-45" /> 
                    </button>
                  </div>
                  <AdminScreen onBack={() => navigate("home")} />
                </div>
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
                  onAdmin={() => navigate("admin_login")}
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
          </React.Suspense>

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
