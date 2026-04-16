/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion } from "motion/react";
import { Trash2, Music, Loader2 } from "lucide-react";
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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this moment?")) return;
    setIsDeleting(id);
    try {
      await api.deleteMoment(id);
      setMoments(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert("Failed to delete moment");
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group rounded-3xl overflow-hidden bg-zinc-900/90 border border-white/5 backdrop-blur-md hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-black/20"
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
                    onClick={() => handleDelete(moment.id)}
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
    </motion.div>
  );
}
