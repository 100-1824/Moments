/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Trash2, Music, Loader2, X } from "lucide-react";
import { TimeCapsule } from "@/src/components/Features";
import { useAuth } from "@/src/contexts/AuthContext";
import * as api from "@/src/lib/api";

export default function FeedScreen({
  onMoodBoard,
}: {
  onMoodBoard: () => void;
}) {
  const { user } = useAuth();
  const [moments, setMoments] = React.useState<api.ApiMoment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingMomentId, setDeletingMomentId] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (isLoading) return;
    gsap.fromTo(".moment-card",
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.2)", stagger: 0.08 }
    );
  }, { dependencies: [isLoading, moments] });

  React.useEffect(() => {
    const fetchAllMoments = async () => {
      try {
        const response = await fetch('/api/moments', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('moments_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setMoments(data.data?.moments || []);
        }
      } catch (err) {
        console.error("Failed to fetch moments", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllMoments();
  }, []);

  const openDeleteDialog = (id: string) => {
    setDeletingMomentId(id);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingMomentId(null);
    setDeleteError(null);
  };

  const handleDelete = async () => {
    if (!deletingMomentId) return;
    setIsDeleting(deletingMomentId);
    try {
      await api.deleteMoment(deletingMomentId);
      setMoments(prev => prev.filter(m => m.id !== deletingMomentId));
      closeDeleteDialog();
    } catch (err) {
      setDeleteError("Failed to delete moment");
    } finally {
      setIsDeleting(null);
    }
  };

  const isMyMoment = (moment: api.ApiMoment) => moment.user_id === user?.id;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col p-8 pt-16 pb-32"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Our Moments</h2>
        <TimeCapsule onClick={onMoodBoard} />
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent-terracotta" />
        </div>
      )}

      {!isLoading && moments.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-20 h-20 neu-depressed rounded-full flex items-center justify-center">
            <Music className="w-8 h-8 text-text-main/20" />
          </div>
          <p className="text-sm opacity-40">
            No moments yet. Start sharing!
          </p>
        </div>
      )}

      {!isLoading && moments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {moments.map((moment) => (
            <motion.div
              key={moment.id}
              className="moment-card group rounded-3xl overflow-hidden bg-zinc-900/90 border border-white/5 backdrop-blur-md hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-black/20"
            >
              {/* Image Container */}
              <div className="relative w-full aspect-square bg-black/50 overflow-hidden">
                {moment.media_url ? (
                  <>
                    <img
                      src={moment.media_url}
                      alt="Moment"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-8 h-8 text-text-main/30" />
                  </div>
                )}

                {/* Delete Button (only on own moments) */}
                {isMyMoment(moment) && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openDeleteDialog(moment.id)}
                    disabled={isDeleting === moment.id}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-accent-terracotta/20 hover:bg-accent-terracotta/40 transition-colors disabled:opacity-50"
                    aria-label="Delete moment"
                  >
                    {isDeleting === moment.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-accent-terracotta" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-accent-terracotta" />
                    )}
                  </motion.button>
                )}
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                {moment.caption_payload && !moment.is_encrypted && (
                  <p className="text-sm text-text-main line-clamp-2">
                    {moment.caption_payload}
                  </p>
                )}
                {moment.is_encrypted && (
                  <p className="text-xs text-text-main/40 italic">
                    🔒 Encrypted message
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>{moment.slot && `${moment.slot}`}</span>
                  <span>
                    {moment.created_at
                      ? new Date(moment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : ""}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeDeleteDialog}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 rounded-2xl border border-white/10 p-6 w-full max-w-sm shadow-2xl"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold">Delete Moment</h3>
              <button
                onClick={closeDeleteDialog}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-text-main/70 mb-6">
              Are you sure you want to delete this moment? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeDeleteDialog}
                disabled={isDeleting !== null}
                className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting !== null}
                className="flex-1 px-4 py-2 rounded-lg bg-accent-terracotta/80 text-sm font-medium text-white hover:bg-accent-terracotta transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
