"use client";
import React, { useEffect, useState, useCallback } from "react";
import { BookOpen, Loader2, AlertCircle, X, FileText, Lock } from "lucide-react";
import api from "@utils/api";

export default function EbookViewerModal({ ebookId, onClose }) {
  const [viewUrl, setViewUrl] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchEbook() {
      try {
        const res = await api.get(`/api/ebooks/${ebookId}`);
        const data = res.data.data || res.data;
        setViewUrl(data.viewUrl);
        setTitle(data.title || "eBook");
      } catch {
        setError("Unable to load this eBook. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    if (ebookId) fetchEbook();
  }, [ebookId]);

  const handleKeyDown = useCallback(
    (e) => { if (e.key === "Escape") onClose(); },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ animation: "ebookFadeIn 0.2s ease-out" }}
    >
      <style>{`
        @keyframes ebookFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ebookSlideUp {
          from { transform: translateY(16px) scale(0.985); opacity: 0; }
          to   { transform: translateY(0) scale(1);        opacity: 1; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1a2b4e]/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        className="relative flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{
          width: "min(1000px, calc(100vw - 32px))",
          height: "calc(100vh - 48px)",
          maxHeight: "900px",
          animation: "ebookSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
          background: "#ffffff",
          boxShadow: "0 32px 80px -8px rgba(26,43,78,0.35), 0 0 0 1px rgba(26,43,78,0.08)",
        }}
      >
        {/* Top gradient accent bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-[#ff5b00] via-[#f2277e] to-[#0c63e4] shrink-0" />

        {/* Header */}
        <div className="flex items-center gap-3.5 px-5 py-3.5 border-b border-gray-100 bg-white shrink-0">
          {/* Icon cluster */}
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f2277e]/15 to-[#f2277e]/5 flex items-center justify-center border border-[#f2277e]/15">
              <BookOpen className="w-4.5 h-4.5 text-[#f2277e]" style={{ width: 18, height: 18 }} />
            </div>
          </div>

          {/* Title block */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-[#f2277e] uppercase tracking-widest leading-none mb-1 flex items-center gap-1.5">
              <FileText className="w-2.5 h-2.5" style={{ width: 10, height: 10 }} />
              eBook / PDF
            </p>
            <h2 className="text-sm font-bold text-[#1a2b4e] truncate leading-snug">
              {loading ? "Loading…" : title}
            </h2>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Read-only badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">
              <Lock className="w-3 h-3 text-gray-400" style={{ width: 12, height: 12 }} />
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Read-only</span>
            </div>

            {/* Esc hint */}
            <span className="text-xs text-gray-300 select-none hidden lg:block">ESC</span>

            {/* Close button */}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-[#1a2b4e] hover:bg-gray-100 transition-all duration-150 border border-transparent hover:border-gray-200"
              aria-label="Close viewer"
            >
              <X className="w-4 h-4" style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>

        {/* Viewer body */}
        <div className="flex-1 relative overflow-hidden" style={{ background: "#f8f9fb" }}>

          {/* Loading state */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: "#f8f9fb" }}>
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f2277e]/10 to-[#ff5b00]/10 flex items-center justify-center border border-[#f2277e]/15">
                  <BookOpen className="w-7 h-7 text-[#f2277e]" style={{ width: 28, height: 28 }} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center border border-gray-100">
                  <Loader2 className="w-3.5 h-3.5 text-[#ff5b00] animate-spin" style={{ width: 14, height: 14 }} />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#1a2b4e]">Loading eBook</p>
                <p className="text-xs text-gray-400 mt-0.5">Preparing your document…</p>
              </div>
              {/* Animated progress bar */}
              <div className="w-40 h-0.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#ff5b00] to-[#f2277e]"
                  style={{ animation: "ebookProgress 1.4s ease-in-out infinite alternate", width: "60%" }}
                />
              </div>
              <style>{`
                @keyframes ebookProgress {
                  from { transform: translateX(-100%); }
                  to   { transform: translateX(170%); }
                }
              `}</style>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: "#f8f9fb" }}>
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100">
                <AlertCircle className="w-7 h-7 text-red-500" style={{ width: 28, height: 28 }} />
              </div>
              <div className="text-center px-4">
                <p className="text-sm font-bold text-[#1a2b4e]">Failed to load eBook</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">{error}</p>
              </div>
              <button
                onClick={onClose}
                className="mt-1 px-5 py-2 text-xs font-semibold text-white bg-[#ff5b00] rounded-full hover:bg-[#e55200] transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          )}

          {/* iframe viewer */}
          {!loading && !error && viewUrl && (
            <iframe
              src={`${viewUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
              title={title}
              className="absolute inset-0 w-full h-full border-0"
              allow="fullscreen"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#ff5b00] to-[#f2277e]" />
            <p className="text-[11px] text-gray-400 font-medium">
              Read-only · Downloading disabled
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-gray-500 hover:text-[#1a2b4e] transition-colors px-3.5 py-1.5 rounded-full hover:bg-gray-100 border border-transparent hover:border-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
