"use client"

import { useState, useRef } from "react"
import Discussion from "@/components/sections/Student/MyCourses/Discussion"
import { Play, Loader2, X, FileText } from "lucide-react"
import api from "@/services/api"
import { updateContentProgress } from "@/services/contentService"

export default function EbookLayout({ title, contentReferenceId, contentItemId, courseId, batchId, onCompleted }) {
  const [viewUrl, setViewUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [fullscreen, setFullscreen] = useState(false)
  const markedComplete = useRef(false)

  const handleOpen = async () => {
    if (!contentReferenceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/api/ebooks/${contentReferenceId}`)
      const url = res.data?.data?.viewUrl
      if (!url) throw new Error("No viewUrl in response")
      setViewUrl(`${url}#toolbar=0&navpanes=0&scrollbar=0`)

      // Fire progress update in the background — do NOT await it.
      // Awaiting would defer the setViewUrl flush (React 18 automatic batching)
      // and block the iframe from rendering until the progress API call settles.
      if (contentItemId && !markedComplete.current) {
        markedComplete.current = true
        updateContentProgress(contentItemId, 100)
          .then(() => onCompleted?.())
          .catch(() => { markedComplete.current = false })
      }
    } catch {
      setError("Failed to load eBook. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Viewer card */}
      <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden${fullscreen ? ' fixed inset-0 z-50 rounded-none border-none' : ''}`}
           style={fullscreen ? { boxShadow: "none", background: "#111827" } : { boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" }}>

        {viewUrl ? (
          /* ── PDF viewer ── */
          <div className="relative" style={fullscreen ? { height: "100vh" } : { height: "80vh" }}>
            <button
              onClick={() => setViewUrl(null)}
              className={`absolute top-3 right-3 z-20 w-8 h-8 bg-[#1a2b4e]/70 hover:bg-[#1a2b4e]/90 rounded-full flex items-center justify-center transition-colors${fullscreen ? ' top-6 right-6' : ''}`}
              title="Close viewer"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
            <button
              onClick={() => setFullscreen(f => !f)}
              className={`absolute top-3 left-3 z-20 w-8 h-8 bg-[#1a2b4e]/70 hover:bg-[#1a2b4e]/90 rounded-full flex items-center justify-center transition-colors${fullscreen ? ' top-6 left-6' : ''}`}
              title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {fullscreen ? (
                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 15H7a2 2 0 0 1-2-2v-2m10 4h2a2 2 0 0 0 2-2v-2M9 9V7a2 2 0 0 0-2-2H5m10 2V5a2 2 0 0 1 2-2h2"/></svg>
              ) : (
                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 9h2a2 2 0 0 1 2 2v2m-10-4H5a2 2 0 0 0-2 2v2m10 4v2a2 2 0 0 0 2 2h2m-10-2v2a2 2 0 0 1-2 2H5"/></svg>
              )}
            </button>
            <iframe
              src={viewUrl}
              title={title || "eBook Viewer"}
              width="100%"
              height="100%"
              style={{ border: "none", display: "block", background: fullscreen ? "#111827" : undefined }}
              allowFullScreen
            />
          </div>
        ) : (
          /* ── Cover / play area ── */
          <div
            className="relative aspect-video overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1a2b4e 0%, #2d3a6b 50%, #3a2060 100%)" }}
          >
            {/* Decorative blobs */}
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10"
                 style={{ background: "radial-gradient(circle, #ff5b00, transparent)" }} />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-10"
                 style={{ background: "radial-gradient(circle, #f2277e, transparent)" }} />

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border:     "1px solid rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <FileText className="w-8 h-8 text-white" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                  Reading Material
                </p>
                <h2 className="text-white text-base font-bold">
                  {title || "eBook"}
                </h2>
              </div>
            </div>

            {error && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/90
                              text-white text-xs font-semibold px-4 py-2 rounded-full shadow">
                {error}
              </div>
            )}

            {/* Open button — bottom right */}
            <div className="absolute bottom-5 right-5">
              <button
                onClick={handleOpen}
                disabled={loading || !contentReferenceId}
                className="flex items-center gap-2 bg-white text-[#1a2b4e] font-bold text-xs
                           px-5 py-2.5 rounded-full shadow-lg disabled:opacity-50
                           transition-all duration-150 hover:scale-105 active:scale-95"
              >
                {loading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Play    className="w-3.5 h-3.5 ml-0.5" />
                }
                {loading ? "Opening…" : "Open eBook"}
              </button>
            </div>
          </div>
        )}
      </div>

      {title && <Discussion contentItemId={contentItemId} courseId={courseId} batchId={batchId} />}
    </div>
  )
}
