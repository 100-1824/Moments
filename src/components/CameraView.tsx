import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, RefreshCw, X } from "lucide-react";
import { NeuButton } from "./ui/Neumorphic";
import { cn } from "@/src/lib/utils";

interface CameraViewProps {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
}

export const CameraView = ({ onCapture, onClose }: CameraViewProps) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = React.useState<"user" | "environment">("environment");
  const [error, setError] = React.useState<string | null>(null);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const startStream = async () => {
    stopStream();
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions.");
    }
  };

  React.useEffect(() => {
    startStream();
    return () => stopStream();
  }, [facingMode]);

  React.useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const [isCapturing, setIsCapturing] = React.useState(false);

  const capture = () => {
    if (!videoRef.current || isCapturing) return;
    
    setIsCapturing(true);
    
    // Flash effect timing
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);
    
    setTimeout(() => {
      canvas.toBlob((blob) => {
        if (blob) {
          onCapture(blob);
        }
        setIsCapturing(false);
      }, "image/jpeg", 0.9);
    }, 150);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden"
    >
      <div className="relative w-full max-w-md aspect-[3/4] rounded-[40px] overflow-hidden bg-zinc-900 border-4 border-white/10 shadow-2xl">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-zinc-950">
            <p className="text-accent-terracotta font-bold mb-4">{error}</p>
            <NeuButton onClick={onClose} size="sm">Go Back</NeuButton>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                facingMode === "user" && "-scale-x-100",
                !stream && "opacity-0"
              )}
            />
            {!stream && (
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-white/20" />
              </div>
            )}
          </>
        )}

        {/* Flash Effect Overlay */}
        <AnimatePresence>
          {isCapturing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white z-50"
            />
          )}
        </AnimatePresence>

        {/* Top Controls */}
        <div className="absolute top-6 left-6 right-6 flex justify-between z-10">
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/60 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <button 
            onClick={toggleCamera}
            className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/60 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none border-[0.5px] border-white/5 opacity-50">
          <div className="h-full w-1/3 border-r border-white/10 absolute left-1/3" />
          <div className="h-full w-1/3 border-r border-white/10 absolute left-2/3" />
          <div className="w-full h-1/3 border-b border-white/10 absolute top-1/3" />
          <div className="w-full h-1/3 border-b border-white/10 absolute top-2/3" />
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-6 w-full max-w-md">
        <button
          onClick={capture}
          disabled={!stream || isCapturing}
          className="w-24 h-24 rounded-full border-8 border-white p-2 transition-all hover:scale-110 active:scale-90 disabled:opacity-50"
        >
          <div className="w-full h-full rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all hover:bg-zinc-100" />
        </button>
        <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">
          {isCapturing ? "Processing..." : "Capture Moment"}
        </p>
      </div>
    </motion.div>
  );
};
