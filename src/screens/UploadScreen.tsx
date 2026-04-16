/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Camera,
  Send,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Sun,
  Cloud,
  Moon,
} from "lucide-react";
import {
  NeuButton,
  NeuTextArea,
} from "@/src/components/ui/Neumorphic";
import { AudioCaption } from "@/src/components/Features";
import { CameraView } from "@/src/components/CameraView";
import * as api from "@/src/lib/api";

export default function UploadScreen({
  onBack,
  onSuccess,
  initialSlot,
}: {
  onBack: () => void;
  onSuccess: (remaining: number) => void;
  initialSlot?: "morning" | "evening" | "night";
}) {
  const [caption, setCaption] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showCamera, setShowCamera] = React.useState(false);
  const [slot, setSlot] = React.useState<"morning" | "evening" | "night">(initialSlot || "morning");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const slotButtonsRef = React.useRef<(HTMLButtonElement | null)[]>([]);

  useGSAP(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline();

    // Animate container entrance
    tl.fromTo(containerRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
      0
    );

    // Animate slot buttons
    slotButtonsRef.current.forEach((btn, i) => {
      if (btn) {
        tl.fromTo(btn,
          { opacity: 0, scale: 0.8, y: 10 },
          { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.2)" },
          i * 0.1
        );
      }
    });
  }, { dependencies: [initialSlot] });

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleCapture = (blob: Blob) => {
    const file = new File([blob], `moment_${Date.now()}.jpg`, { type: "image/jpeg" });
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowCamera(false);
  };

  // Caveman compress: shrink image to max 1280px via Canvas before upload
  const compressImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith("image/")) return file;
    const MAX_DIM = 1280;
    const QUALITY = 0.82;
    return new Promise((resolve) => {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        const { naturalWidth: w, naturalHeight: h } = img;
        // Skip compression if already small enough
        if (w <= MAX_DIM && h <= MAX_DIM) {
          console.log("[compress] skip — already small:", w, "x", h);
          resolve(file);
          return;
        }
        const scale = Math.min(MAX_DIM / w, MAX_DIM / h);
        const cw = Math.round(w * scale);
        const ch = Math.round(h * scale);
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, cw, ch);
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            const compressed = new File([blob], file.name, { type: "image/jpeg" });
            console.log("[compress] original:", (file.size / 1024).toFixed(1), "KB →", (compressed.size / 1024).toFixed(1), "KB at", cw, "x", ch);
            resolve(compressed);
          },
          "image/jpeg",
          QUALITY,
        );
      };
      img.onerror = () => { URL.revokeObjectURL(objUrl); resolve(file); };
      img.src = objUrl;
    });
  };

  // Derive slot from current local hour
  const getCurrentSlot = (): "morning" | "evening" | "night" => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "morning";
    if (h >= 12 && h < 18) return "evening";
    return "night";
  };

  const handleSend = async () => {
    if (!selectedFile) {
      setError("Please select a photo or audio file.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fileToUpload = await compressImage(selectedFile);
      const type = fileToUpload.type.startsWith("audio") ? "audio" : "image";
      const result = await api.uploadMoment(
        fileToUpload,
        type,
        caption.trim() || null,
        false,
        slot,
      );
      onSuccess(result.remaining_today);
    } catch (e: unknown) {
      if (!navigator.onLine) {
        // Queue offline (use compressed file if available)
        const offlineFile = await compressImage(selectedFile);
        const reader = new FileReader();
        reader.onload = () => {
          api.addToOfflineQueue({
            type: offlineFile.type.startsWith("audio") ? "audio" : "image",
            fileDataUrl: reader.result as string,
            fileName: offlineFile.name,
            mimeType: offlineFile.type,
            caption_payload: caption.trim() || null,
            is_encrypted: false,
            captured_at: (() => {
              const now = new Date();
              const isoString = now.toISOString();
              const [datePart, timePart] = isoString.split('T');
              const [time, ms] = timePart.split('.');
              const microseconds = ms.slice(0, -1).padEnd(6, '0');
              return `${datePart}T${time}.${microseconds}Z`;
            })(),
            slot,
          });
          onSuccess(3); // optimistic: assume queued
        };
        reader.readAsDataURL(offlineFile);
      } else {
        setError(e instanceof Error ? e.message : "Upload failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      ref={containerRef}
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
        <AnimatePresence>
          {showCamera && (
            <CameraView
              onCapture={handleCapture}
              onClose={() => setShowCamera(false)}
            />
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => previewUrl ? setPreviewUrl(null) : setShowCamera(true)}
            className="w-full aspect-square neu-depressed rounded-[40px] flex flex-col items-center justify-center text-text-main/20 border-4 border-background overflow-hidden group transition-all active:scale-[0.98]"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover rounded-[36px]"
              />
            ) : (
              <>
                <div className="w-20 h-20 neu-extruded rounded-full flex items-center justify-center mb-6 group-hover:text-accent-terracotta transition-colors">
                  <Camera className="w-10 h-10" />
                </div>
                <p className="font-bold text-text-main/40 uppercase tracking-widest text-xs">
                  Tap to open camera
                </p>
              </>
            )}
          </button>

          {!previewUrl && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold uppercase tracking-widest text-text-main/20 hover:text-text-main/40 transition-colors text-center py-2"
            >
              Or Choose from Gallery
            </button>
          )}

          {previewUrl && (
            <button
              onClick={() => setShowCamera(true)}
              className="text-xs font-bold uppercase tracking-widest text-accent-terracotta text-center py-2 tact-glow"
            >
              Retake Photo
            </button>
          )}
        </div>

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

        <div className="space-y-4 px-2">
          <label className="text-[10px] font-bold opacity-30 uppercase tracking-widest block mb-1">
            Posting Slot
          </label>
          <div className="flex gap-4">
            {[
              { id: "morning", icon: Sun, label: "Morning" },
              { id: "evening", icon: Cloud, label: "Evening" },
              { id: "night", icon: Moon, label: "Night" },
            ].map((s, index) => {
              const currentSlot = getCurrentSlot();
              const isCurrentSlot = s.id === currentSlot;
              return (
                <button
                  key={s.id}
                  ref={(el) => { if (el) slotButtonsRef.current[index] = el; }}
                  onClick={() => isCurrentSlot && setSlot(s.id as any)}
                  disabled={!isCurrentSlot}
                  className={`flex-1 py-4 rounded-3xl flex flex-col items-center gap-2 transition-all duration-300 ${
                    isCurrentSlot
                      ? "neu-depressed text-accent-terracotta bg-background/50 scale-[0.98]"
                      : "neu-extruded text-text-main/20 opacity-40 cursor-not-allowed"
                  }`}
                >
                  <s.icon className={`w-5 h-5 ${isCurrentSlot ? "tact-glow" : ""}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {s.label}
                  </span>
                  {!isCurrentSlot && <span className="text-[8px] opacity-50">Locked</span>}
                </button>
              );
            })}
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
