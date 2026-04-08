import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, SkipForward, SkipBack, Music } from "lucide-react";
import { cn } from "@/src/lib/utils";

// 1. The "Digital Locket" (Pinned Core Memory)
export const DigitalLocket = ({ imageUrl }: { imageUrl: string }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="perspective-1000 w-32 h-32 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
      <motion.div
        animate={{ rotateY: isOpen ? 180 : 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="relative w-full h-full preserve-3d"
      >
        {/* Front Face (Closed Locket) */}
        <div className="absolute inset-0 backface-hidden neu-extruded rounded-full flex items-center justify-center bg-background border-4 border-background">
          <div className="w-12 h-12 neu-depressed-sm rounded-full flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-accent-terracotta/40" />
          </div>
        </div>

        {/* Back Face (Open Locket with Image) */}
        <div className="absolute inset-0 backface-hidden rounded-full overflow-hidden rotate-y-180 border-4 border-background shadow-inner">
          <img
            src={imageUrl}
            alt="Core Memory"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </motion.div>
    </div>
  );
};

// 2. "Hold-to-Reveal" (Intimate Viewing)
export const HoldToReveal = ({ imageUrl }: { imageUrl: string }) => {
  const [isRevealed, setIsRevealed] = React.useState(false);

  return (
    <div
      onMouseDown={() => setIsRevealed(true)}
      onMouseUp={() => setIsRevealed(false)}
      onMouseLeave={() => setIsRevealed(false)}
      onTouchStart={() => setIsRevealed(true)}
      onTouchEnd={() => setIsRevealed(false)}
      className="relative w-full aspect-square rounded-[40px] overflow-hidden cursor-pointer group"
    >
      <img
        src={imageUrl}
        alt="Intimate Moment"
        className={cn(
          "w-full h-full object-cover transition-all duration-500",
          !isRevealed && "blur-2xl scale-110"
        )}
        referrerPolicy="no-referrer"
      />
      
      {/* Neumorphic Overlay */}
      <div className={cn(
        "absolute inset-0 transition-all duration-300 flex items-center justify-center",
        isRevealed ? "bg-black/0 shadow-inner" : "bg-background/20 backdrop-blur-sm shadow-[inset_0_0_100px_rgba(255,255,255,0.5)]"
      )}>
        {!isRevealed && (
          <div className="neu-extruded w-16 h-16 rounded-full flex items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity">
            <div className="w-2 h-2 rounded-full bg-text-main/20" />
          </div>
        )}
      </div>
    </div>
  );
};

// 3. The Neumorphic "Now Playing" Record Player
export const NowPlayingPlayer = ({ title, artist }: { title: string; artist: string }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);

  return (
    <div className="neu-extruded rounded-[40px] p-6 w-full space-y-6">
      <div className="flex items-center gap-6">
        {/* Spinning Record */}
        <div className="relative w-24 h-24">
          <motion.div
            animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
            transition={isPlaying ? { repeat: Infinity, duration: 4, ease: "linear" } : { duration: 0.5 }}
            className="w-full h-full rounded-full bg-black shadow-xl flex items-center justify-center overflow-hidden"
          >
            {/* Record Grooves */}
            <div className="absolute inset-0 border-[10px] border-white/5 rounded-full" />
            <div className="absolute inset-2 border-[10px] border-white/5 rounded-full" />
            <div className="absolute inset-4 border-[10px] border-white/5 rounded-full" />
            
            {/* Center Label */}
            <div className="w-8 h-8 rounded-full bg-accent-terracotta flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-black/20" />
            </div>
          </motion.div>
          
          {/* Needle/Arm (Static) */}
          <div className="absolute -top-2 -right-2 w-12 h-12 pointer-events-none">
            <div className="w-1 h-16 bg-text-main/20 rounded-full origin-top rotate-[30deg] translate-x-8" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-lg truncate">{title}</h4>
          <p className="text-sm opacity-40 truncate">{artist}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center px-4">
        <button className="w-10 h-10 neu-depressed rounded-full flex items-center justify-center text-text-main/40 hover:text-text-main transition-colors">
          <SkipBack className="w-4 h-4 fill-current" />
        </button>
        
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-all",
            isPlaying ? "neu-depressed text-accent-terracotta" : "neu-extruded text-text-main"
          )}
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
        </button>

        <button className="w-10 h-10 neu-depressed rounded-full flex items-center justify-center text-text-main/40 hover:text-text-main transition-colors">
          <SkipForward className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
};

// 4. The "Foggy Mirror" Shared Scratchpad
export const FoggyMirror = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set initial "frost"
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add some "texture" to the frost
      for (let i = 0; i < 1000; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 20, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
  };

  const clearMirror = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center px-2">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">Foggy Mirror</span>
        <button onClick={clearMirror} className="text-[10px] font-bold uppercase tracking-widest text-accent-terracotta opacity-60 hover:opacity-100 transition-opacity">
          Refrost
        </button>
      </div>
      
      <div className="neu-depressed rounded-[40px] aspect-video relative overflow-hidden bg-accent-terracotta/5 border-4 border-background">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="w-full h-full cursor-crosshair"
        />
        
        {/* Background Content (Visible when wiped) */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-10">
          <Music className="w-24 h-24" />
        </div>
      </div>
    </div>
  );
};
