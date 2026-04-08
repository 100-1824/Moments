import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Lock, 
  Shield, 
  WifiOff, 
  RefreshCw, 
  Download, 
  Palette, 
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { NeuCard, NeuButton } from "@/src/components/ui/Neumorphic";

// 1. Privacy Settings Page
export const PrivacySettingsPage = ({ onBack }: { onBack: () => void; key?: string }) => {
  const [isEncrypted, setIsEncrypted] = React.useState(false);

  const encryptPhotoPayload = (file: any) => {
    console.log("Client-side encryption triggered for:", file);
    // Placeholder for actual encryption logic
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col p-8 pt-16 pb-32"
    >
      <div className="flex items-center mb-12">
        <NeuButton size="sm" onClick={onBack} className="w-12 h-12 mr-4">
          <ArrowLeft className="w-5 h-5" />
        </NeuButton>
        <h2 className="text-3xl font-bold">Privacy</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-12">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 neu-extruded rounded-full flex items-center justify-center mx-auto relative">
            <Shield className={cn("w-8 h-8 transition-colors duration-500", isEncrypted ? "text-accent-sage" : "text-text-main/20")} />
            <AnimatePresence>
              {isEncrypted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute -top-2 -right-2 w-8 h-8 neu-extruded rounded-full flex items-center justify-center bg-accent-sage/10"
                >
                  <Lock className="w-4 h-4 text-accent-sage" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <h3 className="text-xl font-bold">Zero-Knowledge Mode</h3>
          <p className="text-sm opacity-40 max-w-[240px] mx-auto">
            When active, all photos are encrypted on your device before being sent.
          </p>
        </div>

        {/* Neumorphic Toggle */}
        <button 
          onClick={() => setIsEncrypted(!isEncrypted)}
          className="w-24 h-12 neu-depressed rounded-full p-1 transition-all duration-500 relative"
        >
          <motion.div
            animate={{ x: isEncrypted ? 48 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "w-10 h-10 rounded-full neu-extruded flex items-center justify-center transition-colors duration-500",
              isEncrypted ? "bg-accent-sage/10" : "bg-background"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full transition-colors", isEncrypted ? "bg-accent-sage" : "bg-text-main/20")} />
          </motion.div>
        </button>
      </div>
    </motion.div>
  );
};

// 2. Offline Outbox Page
export const OfflineOutboxPage = ({ onBack }: { onBack: () => void; key?: string }) => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [queue, setQueue] = React.useState([
    { id: 1, type: "Photo", time: "10:05 AM" },
    { id: 2, type: "Voice Note", time: "10:12 AM" }
  ]);
  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueuedPhotos();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncQueuedPhotos = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 2000));
    setQueue([]);
    setIsSyncing(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col p-8 pt-16 pb-32"
    >
      <div className="flex items-center mb-8">
        <NeuButton size="sm" onClick={onBack} className="w-12 h-12 mr-4">
          <ArrowLeft className="w-5 h-5" />
        </NeuButton>
        <h2 className="text-3xl font-bold">Outbox</h2>
      </div>

      <div className="flex-1 space-y-6">
        <AnimatePresence mode="popLayout">
          {queue.length > 0 ? (
            queue.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, x: 100 }}
                className="neu-extruded p-6 rounded-[32px] flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 neu-depressed rounded-full flex items-center justify-center text-accent-terracotta">
                    <WifiOff className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-bold">{item.type}</p>
                    <p className="text-xs opacity-40">Waiting to sync • {item.time}</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-accent-terracotta animate-pulse" />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 neu-depressed rounded-full flex items-center justify-center mb-6 text-accent-sage">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold">All Synced</h3>
              <p className="text-sm opacity-40">Your moments are safe in the cloud.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isSyncing && (
        <div className="fixed bottom-32 left-0 right-0 flex justify-center">
          <div className="neu-extruded px-6 py-3 rounded-full flex items-center gap-3 bg-background/80 backdrop-blur-md">
            <Loader2 className="w-4 h-4 animate-spin text-accent-terracotta" />
            <span className="text-xs font-bold uppercase tracking-widest">Syncing...</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// 3. Monthly Mood Board Page
export const MonthlyMoodBoardPage = ({ onBack, colors = ["#D97757", "#8A9A5B", "#5797D9"] }: { onBack: () => void; colors?: string[]; key?: string }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col"
    >
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-30 blur-[120px]"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, ${colors[0]} 0%, transparent 50%),
              radial-gradient(circle at 80% 30%, ${colors[1]} 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, ${colors[2]} 0%, transparent 50%)
            `
          }}
        />
      </div>

      <div className="p-8 pt-16 flex items-center justify-between">
        <div className="flex items-center">
          <NeuButton size="sm" onClick={onBack} className="w-12 h-12 mr-4">
            <ArrowLeft className="w-5 h-5" />
          </NeuButton>
          <h2 className="text-3xl font-bold">Mood Board</h2>
        </div>
        <div className="w-12 h-12 neu-extruded rounded-full flex items-center justify-center">
          <Palette className="w-5 h-5 text-accent-terracotta" />
        </div>
      </div>

      <div className="flex-1 relative p-8">
        {/* Scattered Photos */}
        <div className="grid grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8, rotate: (i % 2 === 0 ? 5 : -5) }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-[8px] border-white/50 backdrop-blur-sm"
            >
              <img 
                src={`https://picsum.photos/seed/mood${i}/400/600`} 
                alt="Memory" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-8 pb-12 text-center">
        <span className="text-xs font-bold uppercase tracking-widest opacity-30">March 2026</span>
        <p className="text-lg font-bold">A month of warmth and connection</p>
      </div>
    </motion.div>
  );
};

// 4. Data Archive Page
export const DataArchivePage = ({ onBack }: { onBack: () => void; key?: string }) => {
  const [isExporting, setIsExporting] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const handleExport = async () => {
    setIsExporting(true);
    // Simulate async fetch to /api/export
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(r => setTimeout(r, 300));
    }
    setIsExporting(false);
    setProgress(0);
    console.log("Export complete");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col p-8 pt-16 pb-32"
    >
      <div className="flex items-center mb-12">
        <NeuButton size="sm" onClick={onBack} className="w-12 h-12 mr-4">
          <ArrowLeft className="w-5 h-5" />
        </NeuButton>
        <h2 className="text-3xl font-bold">Archive</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-12 text-center">
        <div className="space-y-4">
          <div className="w-24 h-24 neu-depressed rounded-full flex items-center justify-center mx-auto text-accent-terracotta">
            <Download className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold">Our History</h3>
          <p className="text-sm opacity-40 max-w-[280px] mx-auto leading-relaxed">
            Download a complete archive of your shared moments, voice notes, and memories in a secure package.
          </p>
        </div>

        <div className="w-full max-w-xs space-y-8">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={cn(
              "w-full h-24 rounded-[40px] transition-all duration-500 flex flex-col items-center justify-center gap-2",
              isExporting ? "neu-depressed" : "neu-extruded active:neu-depressed"
            )}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-accent-terracotta" />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Preparing {progress}%</span>
              </>
            ) : (
              <>
                <span className="text-lg font-bold text-accent-terracotta">Download Archive</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">JSON + Media (124MB)</span>
              </>
            )}
          </button>

          <div className="p-6 neu-depressed rounded-3xl text-left space-y-3">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-4 h-4 opacity-30" />
              <span className="text-xs font-bold opacity-60">428 Photos</span>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw className="w-4 h-4 opacity-30" />
              <span className="text-xs font-bold opacity-60">Last sync: 2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
