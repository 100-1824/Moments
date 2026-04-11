import * as React from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { ArrowLeft, Send, RefreshCw, Pencil } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { getLatestNote, writeNote, revealNote, type ApiNote } from "@/src/lib/api";

// ─── Fog layer (CSS canvas — no camera needed) ──────────────────────────────
//
// The "fog" is a set of blurred white radial blobs that cover the text.
// The receiver clicks/drags to "wipe" the fog by tracking cursor/touch
// position relative to the card. Each wipe expands a transparent hole in the
// fog via a radial-gradient mask.
//
// For the author, the text is always visible (it's their own note).
// For the receiver, content is hidden server-side until they reveal; the
// reveal POST unlocks it and the fog dissipates with a beautiful animation.

function FogCanvas({
  revealed,
  onWipe,
}: {
  revealed: boolean;
  onWipe: () => void;
}) {
  const [holes, setHoles] = React.useState<{ x: number; y: number }[]>([]);

  const handlePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHoles((h) => [...h, { x, y }]);
    // Trigger reveal when user has made at least 6 swipes
    if (holes.length >= 5 && !revealed) {
      onWipe();
    }
  };

  // Build the mask-image gradient from all holes
  const maskGradients = holes
    .map((h) => `radial-gradient(circle 80px at ${h.x}% ${h.y}%, transparent 0%, black 100%)`)
    .join(", ");

  const fogStyle: React.CSSProperties = {
    maskImage: holes.length > 0 ? maskGradients : "none",
    WebkitMaskImage: holes.length > 0 ? maskGradients : "none",
    transition: "opacity 0.5s ease",
    opacity: revealed ? 0 : 1,
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-pointer touch-none select-none"
      onPointerMove={handlePointer}
      onPointerDown={handlePointer}
      animate={{ opacity: revealed ? 0 : 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      style={{ pointerEvents: revealed ? "none" : "auto" }}
    >
      {/* Fog background */}
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden"
        style={fogStyle}
      >
        {/* Base fog: frosted glass effect */}
        <div className="absolute inset-0 backdrop-blur-[32px] bg-white/10" />
        {/* Animated cloud blobs */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/[0.12] blur-3xl"
            style={{
              width: `${80 + i * 30}px`,
              height: `${60 + i * 20}px`,
              left: `${(i * 17) % 80}%`,
              top: `${(i * 23) % 70}%`,
            }}
            animate={{
              x: [0, 12, -8, 8, 0],
              y: [0, -8, 12, -6, 0],
              opacity: [0.6, 0.9, 0.5, 0.8, 0.6],
            }}
            transition={{
              repeat: Infinity,
              duration: 5 + i * 0.7,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Wipe hint overlay */}
      {holes.length === 0 && !revealed && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
        >
          <div className="text-center">
            <div className="text-2xl mb-1">☁️</div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em]">Swipe to reveal</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Author view: write or re-write a note ───────────────────────────────────
function AuthorView({
  note,
  onSave,
  isSaving,
}: {
  note: ApiNote | null;
  onSave: (text: string) => void;
  isSaving: boolean;
}) {
  const [text, setText] = React.useState(note?.content ?? "");
  const max = 280;

  return (
    <div className="flex flex-col h-full gap-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main/30">
          {note ? "Your note is live · rewrite to update" : "Write a secret note for your partner"}
        </p>
        <p className="text-xs text-text-main/25 mt-1">
          They'll see a fogged mirror and swipe to reveal your message.
        </p>
      </div>

      {/* Text area styled as "fogged notepad" */}
      <div className="relative flex-1">
        <div className="absolute inset-0 rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, max))}
          placeholder={"Write something sweet...\n\n\"Thinking of you today.\""}
          className="relative z-10 w-full h-full resize-none bg-transparent p-4 text-text-main text-sm font-medium leading-relaxed placeholder:text-text-main/20 focus:outline-none"
          style={{ fontFamily: "'Georgia', serif" }}
          disabled={isSaving}
        />
        <div className="absolute bottom-3 right-4 text-[10px] text-text-main/20 font-bold z-10">
          {text.length}/{max}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        disabled={!text.trim() || isSaving}
        onClick={() => onSave(text)}
        className={cn(
          "flex items-center justify-center gap-2 w-full py-4 rounded-2xl",
          "text-sm font-black uppercase tracking-[0.15em]",
          "transition-all duration-300",
          text.trim() && !isSaving
            ? "bg-accent-terracotta text-white shadow-[0_4px_24px_rgba(217,119,87,0.4)]"
            : "bg-white/[0.04] text-text-main/20 cursor-not-allowed"
        )}
      >
        {isSaving ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {isSaving ? "Frosting..." : note ? "Refrost" : "Frost It"}
      </motion.button>
    </div>
  );
}

// ─── Receiver view: fogged mirror with wipe-to-reveal ────────────────────────
function ReceiverView({
  note,
  onReveal,
  isRevealing,
}: {
  note: ApiNote;
  onReveal: () => void;
  isRevealing: boolean;
}) {
  const revealed = note.is_revealed;

  return (
    <div className="flex flex-col h-full gap-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main/30">
          {revealed ? "Note from your partner" : "Your partner left you something"}
        </p>
        <p className="text-xs text-text-main/25 mt-1">
          {revealed
            ? `Revealed ${note.revealed_at ? new Date(note.revealed_at).toLocaleDateString() : "today"}`
            : "Swipe the fog to reveal their secret note."}
        </p>
      </div>

      {/* The frosted mirror card */}
      <div className="relative flex-1 rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] min-h-[200px]">
        {/* Actual content — always in DOM, fog sits on top */}
        <div className="absolute inset-0 p-6 flex items-center justify-center">
          <p
            className="text-text-main text-base font-medium leading-relaxed text-center"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            {revealed && note.content ? note.content : ""}
          </p>
        </div>

        {/* Fog overlay */}
        <AnimatePresence>
          {!revealed && (
            <FogCanvas revealed={revealed} onWipe={isRevealing ? () => {} : onReveal} />
          )}
        </AnimatePresence>

        {/* Revealed confetti burst */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
            >
              {["❤️", "✨", "💫", "🌸", "💕"].map((emoji, i) => (
                <motion.span
                  key={i}
                  className="absolute text-2xl"
                  initial={{ opacity: 1, y: 0, x: 0, scale: 0.5 }}
                  animate={{
                    opacity: 0,
                    y: -80 - Math.random() * 60,
                    x: (Math.random() - 0.5) * 160,
                    scale: 1.4,
                  }}
                  transition={{ duration: 1.5, delay: i * 0.1, ease: "easeOut" }}
                >
                  {emoji}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function FoggyMirrorScreen({ onBack }: { onBack: () => void }) {
  const [note, setNote] = React.useState<ApiNote | null | undefined>(undefined);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isRevealing, setIsRevealing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const n = await getLatestNote();
      setNote(n);
    } catch {
      setNote(null);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const handleSave = async (content: string) => {
    setIsSaving(true);
    setError(null);
    try {
      const saved = await writeNote(content);
      setNote(saved);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReveal = async () => {
    if (!note || isRevealing) return;
    setIsRevealing(true);
    try {
      const revealed = await revealNote(note.id);
      setNote(revealed);
    } catch {
      // silently fail — content will still show from local state if needed
    } finally {
      setIsRevealing(false);
    }
  };

  const isLoading = note === undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: "spring", damping: 28, stiffness: 220 }}
      className="flex flex-col h-full px-4 pt-6 pb-8 max-w-md mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.15] transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-text-main/50" />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight">Foggy Mirror</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/30">Secret notepad</p>
        </div>
        <div className="ml-auto">
          <Pencil className="w-5 h-5 text-text-main/20" />
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="text-text-main/30 text-sm font-medium"
          >
            Loading...
          </motion.div>
        </div>
      ) : (
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                key="err"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-400 text-xs font-semibold mb-4 px-1"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* If no note yet, or caller is author → show write view */}
          {(!note || note.is_author) ? (
            <AuthorView
              note={note ?? null}
              onSave={handleSave}
              isSaving={isSaving}
            />
          ) : (
            <ReceiverView
              note={note}
              onReveal={handleReveal}
              isRevealing={isRevealing}
            />
          )}
        </div>
      )}
    </motion.div>
  );
}
