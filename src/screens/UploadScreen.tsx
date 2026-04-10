/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Send,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  NeuButton,
  NeuTextArea,
} from "@/src/components/ui/Neumorphic";
import { AudioCaption } from "@/src/components/Features";
import * as api from "@/src/lib/api";

export default function UploadScreen({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: (remaining: number) => void;
}) {
  const [caption, setCaption] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
