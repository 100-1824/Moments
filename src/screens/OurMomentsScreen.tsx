import * as React from "react";
import { motion } from "motion/react";
import { Trash2, ArrowLeft, Music, Loader2 } from "lucide-react";
import { useAuth } from "@/src/contexts/AuthContext";
import * as api from "@/src/lib/api";

export default function OurMomentsScreen({
  onBack,
}: {
  onBack: () => void;
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
    <div className="flex-1 px-3 md:px-8 pt-6 pb-36 md:pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onBack}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <h1 className="text-2xl font-semibold tracking-tight">Our Moments</h1>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-accent-terracotta" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && moments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
            <Music className="w-8 h-8 text-text-main/40" />
          </div>
          <p className="text-text-main/50 text-center">No moments yet</p>
        </div>
      )}

      {/* Moments Grid */}
      {!isLoading && moments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {moments.map((moment) => (
            <motion.div
              key={moment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative overflow-hidden rounded-3xl bg-zinc-900/90 backdrop-blur-md border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
            >
              {/* Image */}
              <div className="aspect-square overflow-hidden bg-black">
                {moment.type === "image" && moment.media_url && (
                  <img
                    src={moment.media_url}
                    alt={`Moment ${moment.id}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                {moment.type === "audio" && (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-terracotta/20 to-accent-terracotta/5">
                    <Music className="w-16 h-16 text-accent-terracotta/40" />
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Glass Ring */}
                <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 pointer-events-none" />
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="text-xs text-text-main/50 uppercase tracking-wider font-medium">
                      {moment.slot ? `${moment.slot} slot` : "No slot"}
                    </div>
                    <div className="text-xs text-text-main/40 mt-1">
                      {new Date(moment.created_at).toLocaleString()}
                    </div>
                  </div>

                  {/* Delete Button - Only on own moments */}
                  {isMyMoment(moment) && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(moment.id)}
                      disabled={isDeleting === moment.id}
                      className="p-2 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors text-text-main/40 disabled:opacity-50"
                    >
                      {isDeleting === moment.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </motion.button>
                  )}
                </div>

                {/* Caption */}
                {moment.caption_payload && (
                  <p className="text-sm text-text-main/70 line-clamp-2">
                    {moment.caption_payload}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
