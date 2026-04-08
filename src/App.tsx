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
  Bell
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { 
  NeuCard, 
  NeuButton, 
  NeuInput, 
  NeuTextArea, 
  DailyProgress 
} from "@/src/components/ui/Neumorphic";

type Screen = "welcome" | "auth" | "connect" | "home" | "feed" | "settings" | "upload";

export default function App() {
  const [currentScreen, setCurrentScreen] = React.useState<Screen>("welcome");
  const [dailyCount, setDailyCount] = React.useState(1);
  const [isPartnerConnected, setIsPartnerConnected] = React.useState(false);
  const [showSuccessRipple, setShowSuccessRipple] = React.useState(false);

  const navigate = (screen: Screen) => setCurrentScreen(screen);

  const handleUploadSuccess = () => {
    setDailyCount(prev => Math.min(prev + 1, 3));
    setShowSuccessRipple(true);
    setTimeout(() => setShowSuccessRipple(false), 2000);
    navigate("home");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* Success Ripple Effect */}
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
          <AuthScreen key="auth" onNext={() => navigate("connect")} />
        )}
        {currentScreen === "connect" && (
          <ConnectScreen 
            key="connect" 
            onSuccess={() => {
              setIsPartnerConnected(true);
              navigate("home");
            }} 
          />
        )}
        {currentScreen === "home" && (
          <HomeScreen 
            key="home" 
            count={dailyCount} 
            onUpload={() => navigate("upload")} 
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
          <FeedScreen key="feed" />
        )}
        {currentScreen === "settings" && (
          <SettingsScreen key="settings" onBack={() => navigate("home")} />
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      {["home", "feed", "settings"].includes(currentScreen) && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-background/80 backdrop-blur-md"
        >
          <div className="neu-extruded rounded-full flex justify-around items-center p-2">
            <NavButton 
              active={currentScreen === "home"} 
              onClick={() => navigate("home")}
              icon={<Heart className={cn("w-6 h-6", currentScreen === "home" ? "text-accent-terracotta" : "text-text-main/40")} />}
            />
            <NavButton 
              active={currentScreen === "feed"} 
              onClick={() => navigate("feed")}
              icon={<Users className={cn("w-6 h-6", currentScreen === "feed" ? "text-accent-terracotta" : "text-text-main/40")} />}
            />
            <NavButton 
              active={currentScreen === "settings"} 
              onClick={() => navigate("settings")}
              icon={<Settings className={cn("w-6 h-6", currentScreen === "settings" ? "text-accent-terracotta" : "text-text-main/40")} />}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}

function NavButton({ active, icon, onClick }: { active: boolean; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-4 rounded-full transition-all duration-300",
        active ? "neu-depressed-sm" : "hover:bg-black/5"
      )}
    >
      {icon}
    </button>
  );
}

// --- Screens ---

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
      <NeuButton onClick={onStart} className="w-full max-w-xs h-16 text-lg font-semibold text-accent-terracotta">
        Get Started
      </NeuButton>
    </motion.div>
  );
}

function AuthScreen({ onNext }: { onNext: () => void; key?: string }) {
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
          <NeuInput placeholder="Alex" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold ml-2 opacity-60">Phone Number</label>
          <NeuInput placeholder="+1 (555) 000-0000" />
        </div>
      </div>
      <NeuButton onClick={onNext} className="w-full max-w-xs mx-auto text-accent-terracotta">
        <ChevronRight className="w-8 h-8" />
      </NeuButton>
    </motion.div>
  );
}

function ConnectScreen({ onSuccess }: { onSuccess: () => void; key?: string }) {
  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "-100%" }}
      className="flex-1 flex flex-col p-8 pt-20"
    >
      <h2 className="text-3xl font-bold mb-4">Connect</h2>
      <p className="text-text-main/60 mb-8">Share your code with your partner or enter theirs.</p>
      
      <NeuCard className="mb-12 text-center py-10">
        <span className="text-xs uppercase tracking-widest opacity-40 mb-2 block">Your Unique Code</span>
        <span className="text-4xl font-mono font-bold tracking-tighter text-accent-terracotta">MOM-429</span>
      </NeuCard>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold ml-2 opacity-60">Partner's Code</label>
          <NeuInput placeholder="Enter code here..." />
        </div>
        <NeuButton onClick={onSuccess} className="w-full max-w-xs mx-auto text-accent-terracotta">
          Connect
        </NeuButton>
      </div>
    </motion.div>
  );
}

function HomeScreen({ count, onUpload }: { count: number; onUpload: () => void; key?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col p-8 pt-16 pb-32"
    >
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-3xl font-bold">Today</h2>
          <p className="text-text-main/40 font-medium">April 8, 2026</p>
        </div>
        <NeuButton size="sm" className="w-12 h-12">
          <Bell className="w-5 h-5 opacity-40" />
        </NeuButton>
      </div>

      <NeuCard className="flex flex-col items-center py-12 mb-12">
        <DailyProgress count={count} />
        <p className="mt-6 text-sm font-semibold opacity-40">
          {count === 3 ? "All moments shared!" : `${3 - count} moments left today`}
        </p>
      </NeuCard>

      <div className="flex-1 flex flex-col items-center justify-center">
        {count < 3 ? (
          <div className="text-center">
            <NeuButton 
              onClick={onUpload} 
              className="w-32 h-32 mx-auto mb-6 text-accent-terracotta"
            >
              <Plus className="w-12 h-12" />
            </NeuButton>
            <p className="text-lg font-bold opacity-60">Share a moment</p>
          </div>
        ) : (
          <div className="text-center opacity-40">
            <div className="w-32 h-32 neu-depressed rounded-full mx-auto mb-6 flex items-center justify-center">
              <Heart className="w-12 h-12" />
            </div>
            <p className="text-lg font-bold">See you tomorrow</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function UploadScreen({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void; key?: string }) {
  const [caption, setCaption] = React.useState("");

  return (
    <motion.div 
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      className="fixed inset-0 bg-background z-50 flex flex-col p-8"
    >
      <div className="flex items-center mb-8">
        <NeuButton size="sm" onClick={onBack} className="w-12 h-12 mr-4">
          <ArrowLeft className="w-5 h-5" />
        </NeuButton>
        <h2 className="text-2xl font-bold">New Moment</h2>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto pb-8">
        <div className="aspect-square neu-depressed rounded-[40px] flex flex-col items-center justify-center text-text-main/20 border-4 border-background">
          <Camera className="w-16 h-16 mb-4" />
          <p className="font-bold">Tap to capture</p>
          <div className="mt-8 flex gap-4">
            <NeuButton size="sm" className="w-12 h-12"><ImageIcon className="w-5 h-5" /></NeuButton>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center px-2">
            <label className="text-sm font-semibold opacity-60">Caption</label>
            <span className="text-[10px] font-bold opacity-30">{caption.length}/120</span>
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

      <NeuButton 
        onClick={onSuccess}
        className="w-full h-16 text-lg font-bold text-accent-terracotta mt-auto"
      >
        <Send className="w-6 h-6 mr-2" />
        Send Moment
      </NeuButton>
    </motion.div>
  );
}

function FeedScreen() {
  const mockMoments = [
    { id: 1, time: "2h ago", caption: "Thinking of you while having my morning coffee ☕️", img: "https://picsum.photos/seed/coffee/400/400" },
    { id: 2, time: "5h ago", caption: "The sky looked so pretty today!", img: "https://picsum.photos/seed/sky/400/400" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col p-8 pt-16 pb-32"
    >
      <h2 className="text-3xl font-bold mb-8">Partner Feed</h2>
      <div className="space-y-10">
        {mockMoments.map(moment => (
          <div key={moment.id} className="space-y-4">
            <NeuCard className="p-2 overflow-hidden">
              <img 
                src={moment.img} 
                alt="Moment" 
                className="w-full aspect-square object-cover rounded-[28px]"
                referrerPolicy="no-referrer"
              />
            </NeuCard>
            <div className="px-2">
              <p className="font-medium leading-relaxed">{moment.caption}</p>
              <span className="text-xs font-bold opacity-30 uppercase tracking-widest">{moment.time}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SettingsScreen({ onBack }: { onBack: () => void; key?: string }) {
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
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-40 px-2">Preferences</h3>
          <div className="space-y-4">
            <SettingItem label="Daily Reminders" active />
            <SettingItem label="Haptic Feedback" active />
            <SettingItem label="Dark Mode" />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-40 px-2">Account</h3>
          <NeuCard className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 neu-depressed rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 opacity-40" />
            </div>
            <div>
              <p className="font-bold">Partner: Jamie</p>
              <p className="text-xs opacity-40">Connected since Jan 2024</p>
            </div>
          </NeuCard>
        </section>

        <NeuButton className="w-full h-14 text-sm font-bold text-accent-terracotta/60">
          Sign Out
        </NeuButton>
      </div>
    </motion.div>
  );
}

function SettingItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div className="flex justify-between items-center px-2">
      <span className="font-semibold">{label}</span>
      <button className={cn(
        "w-12 h-6 rounded-full transition-all duration-300 p-1",
        active ? "neu-depressed bg-accent-sage/20" : "neu-depressed"
      )}>
        <motion.div 
          animate={{ x: active ? 24 : 0 }}
          className={cn(
            "w-4 h-4 rounded-full",
            active ? "bg-accent-sage shadow-[0_0_8px_rgba(138,154,91,0.5)]" : "bg-text-main/20"
          )}
        />
      </button>
    </div>
  );
}
