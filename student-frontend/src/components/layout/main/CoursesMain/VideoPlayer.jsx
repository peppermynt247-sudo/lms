"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Loader2, Video, WifiOff } from "lucide-react";
import { getVideoPlaybackData, updateContentProgress } from "@/services/contentService";

/* ─── Skeleton shown while fetching OTP ─────────────────────────────────────── */
function VideoSkeleton() {
  return (
    <div
      className="relative aspect-video rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0d1b35 0%, #1a2b4e 60%, #0d1b35 100%)" }}
    >
      {/* shimmer overlay */}
      <div className="absolute inset-0 sk opacity-20" />

      {/* Fake player chrome */}
      <div className="absolute inset-0 flex flex-col justify-between p-5 pointer-events-none">
        {/* Top bar */}
        <div className="flex items-center gap-2">
          <div className="sk h-4 w-32 rounded opacity-30" />
        </div>

        {/* Centre play ring */}
        <div className="flex items-center justify-center flex-1">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <Loader2 className="w-7 h-7 text-white/40 animate-spin" />
          </div>
        </div>

        {/* Bottom progress chrome */}
        <div className="space-y-2">
          <div className="sk h-1 w-full rounded-full opacity-20" />
          <div className="flex justify-between">
            <div className="sk h-3 w-10 rounded opacity-20" />
            <div className="sk h-3 w-10 rounded opacity-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Placeholder when no video ID or API not yet wired ─────────────────────── */
function VideoPlaceholder({ title }) {
  return (
    <div
      className="relative aspect-video rounded-2xl overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0d1b35 0%, #1a2b4e 55%, #231040 100%)" }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #ff5b00, transparent)" }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #f2277e, transparent)" }}
      />

      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background:     "rgba(255,255,255,0.08)",
          border:         "1px solid rgba(255,255,255,0.15)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Video className="w-7 h-7 text-white/80" strokeWidth={1.5} />
      </div>

      <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">
        Video Lesson
      </p>
      <h3 className="text-white text-sm font-bold text-center px-8 line-clamp-2">
        {title || "Video"}
      </h3>

      {/* Coming-soon badge */}
      <div
        className="mt-4 px-3 py-1 rounded-full text-[11px] font-semibold text-white/70"
        style={{
          background:  "rgba(255,255,255,0.07)",
          border:      "1px solid rgba(255,255,255,0.12)",
        }}
      >
        Player loading…
      </div>
    </div>
  );
}

/* ─── Error state ────────────────────────────────────────────────────────────── */
function VideoError({ message, onRetry }) {
  return (
    <div
      className="relative aspect-video rounded-2xl overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(135deg, #1a0a00, #1a2b4e)" }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
        style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)" }}
      >
        <WifiOff className="w-5 h-5 text-red-400" />
      </div>
      <p className="text-white/70 text-xs font-semibold mb-1">Failed to load video</p>
      <p className="text-white/40 text-[11px] mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white rounded-full transition-all hover:opacity-90"
          style={{ background: "rgba(255,91,0,0.8)" }}
        >
          <Play className="w-3 h-3" /> Retry
        </button>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────── */
const VideoPlayer = ({ contentReferenceId, title, contentItemId, onCompleted }) => {
  const [embedData, setEmbedData] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const markedComplete = useRef(false);

  const fetchVideo = async () => {
    if (!contentReferenceId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getVideoPlaybackData(contentReferenceId);
      setEmbedData(data);

      // Mark as complete the first time the student accesses the video
      if (contentItemId && !markedComplete.current) {
        markedComplete.current = true;
        await updateContentProgress(contentItemId, 100);
        onCompleted?.();
      }
    } catch (err) {
      setError("Could not load video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentReferenceId]);

  /* No ID yet */
  if (!contentReferenceId) return <VideoPlaceholder title={title} />;

  /* Fetching OTP */
  if (loading) return <VideoSkeleton />;

  /* Error */
  if (error) return <VideoError message={error} onRetry={fetchVideo} />;

  /* No embed data */
  if (!embedData) return <VideoPlaceholder title={title} />;

  const { otp, playbackInfo, videoUrl } = embedData;

  // Render YouTube Player if videoUrl exists
  if (videoUrl || (otp == null && playbackInfo == null)) {
    let embedUrl = videoUrl || '';
    
    // Transform YouTube URLs to embed format
    if (embedUrl.includes('youtube.com/watch?v=')) {
      embedUrl = embedUrl.replace('youtube.com/watch?v=', 'youtube.com/embed/');
    } else if (embedUrl.includes('youtu.be/')) {
      embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
    }
    
    // Strip trailing slashes and add essential parameters
    embedUrl = embedUrl.split('&')[0];
    const separator = embedUrl.includes('?') ? '&' : '?';
    embedUrl = `${embedUrl}${separator}rel=0&modestbranding=1&showinfo=0`;

    return (
      <div
        className="bg-black rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 4px 24px -4px rgba(26,43,78,0.30)" }}
      >
        <div className="relative aspect-video">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={`${title} — Video Player`}
          />
        </div>
      </div>
    );
  }

  // Render VdoCipher Player
  const iframeSrc = `https://player.vdocipher.com/v2/?otp=${otp}&playbackInfo=${playbackInfo}`;

  return (
    <div
      className="bg-black rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 4px 24px -4px rgba(26,43,78,0.30)" }}
    >
      <div className="relative aspect-video">
        <iframe
          src={iframeSrc}
          className="w-full h-full"
          allow="encrypted-media"
          allowFullScreen
          title={`${title} — Video Player`}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
