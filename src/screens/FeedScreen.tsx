/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { motion } from "motion/react";
import { Heart, Loader2, AlertCircle } from "lucide-react";
import { NeuCard } from "@/src/components/ui/Neumorphic";
import { TimeCapsule } from "@/src/components/Features";
import { HoldToReveal, PairHoldToReveal } from "@/src/components/TactileFeatures";
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
  const [error, setError] = React.useState<string | null>(null);
  // Sentinel ref for IntersectionObserver — stub for pagination
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!user?.id) {
      setMoments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    api
      .fetchTodayMoments()
      .then((data) => {
        const myUploadedPictures: api.ApiMoment[] = [];
        for (const moment of data.moments) {
          const isMine = moment.user_id === user.id;
          const isImage = moment.type === "image";
          if (isMine && isImage) {
            myUploadedPictures.push(moment);
          }
        }

        setMoments(myUploadedPictures);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load feed."))
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  // Primitive IntersectionObserver: fires when sentinel enters viewport
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // TODO: wire to real pagination API call (e.g. fetchNextPage())
          console.log("[feed] sentinel visible — trigger next page fetch");
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoading]); // re-attach after initial load completes

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col p-8 pt-16 pb-32"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">My Moments</h2>
        <TimeCapsule onClick={onMoodBoard} />
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent-terracotta" />
        </div>
      )}

      {error && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <AlertCircle className="w-8 h-8 text-accent-terracotta/50" />
          <p className="text-sm opacity-50">{error}</p>
        </div>
      )}

      {!isLoading && !error && moments.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-20 h-20 neu-depressed rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-text-main/20" />
          </div>
          <p className="text-sm opacity-40">
            No moments uploaded by you today yet.
          </p>
        </div>
      )}

      {!isLoading && moments.length > 0 && (
        <div className="space-y-10">
          {moments.length >= 2 ? (
            <>
              {/* Featured Pair */}
              <div className="space-y-4">
                <PairHoldToReveal 
                  image1Url={moments[0].media_url} 
                  image2Url={moments[1].media_url} 
                />
                <div className="px-2 flex justify-between items-center">
                  <span className="text-xs font-bold opacity-50 uppercase tracking-widest">
                    Shared Moments
                  </span>
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full border-2 border-background bg-accent-terracotta" />
                    <div className="w-6 h-6 rounded-full border-2 border-background bg-text-main/10" />
                  </div>
                </div>
              </div>
              
              {/* Remaining Moments */}
              {moments.slice(2).map((moment) => (
                <div key={moment.id} className="space-y-4">
                  <HoldToReveal 
                    imageUrl={moment.media_url} 
                    className="aspect-square"
                  />
                  <div className="px-2">
                    {moment.caption_payload && !moment.is_encrypted && (
                      <p className="font-medium leading-relaxed">
                        {moment.caption_payload}
                      </p>
                    )}
                    <span className="text-xs font-bold opacity-50 uppercase tracking-widest">
                      {moment.created_at ? new Date(moment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                  </div>
                </div>
              ))}
            </>
          ) : (
            moments.map((moment, idx) => (
              <div key={moment.id} className="space-y-4">
                {idx === 0 ? (
                  <HoldToReveal imageUrl={moment.media_url} />
                ) : (
                  <HoldToReveal 
                    imageUrl={moment.media_url} 
                    className="aspect-square"
                  />
                )}
                <div className="px-2">
                  {moment.caption_payload && !moment.is_encrypted && (
                    <p className="font-medium leading-relaxed">
                      {moment.caption_payload}
                    </p>
                  )}
                  {moment.is_encrypted && (
                    <p className="font-medium leading-relaxed opacity-40 italic">
                      🔒 Encrypted message
                    </p>
                  )}
                  <span className="text-xs font-bold opacity-50 uppercase tracking-widest">
                    {moment.created_at
                      ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
                          Math.round(
                            (new Date(moment.created_at).getTime() - Date.now()) / 3600000,
                          ),
                          "hour",
                        )
                      : ""}
                  </span>
                </div>
              </div>
            ))
          )}
          {/* Infinite scroll sentinel — IntersectionObserver fires console.log here */}
          <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />
        </div>
      )}
    </motion.div>
  );
}
