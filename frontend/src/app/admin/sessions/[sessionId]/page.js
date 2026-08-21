"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Plus,
  ExternalLink,
  Eye,
  EyeOff,
  Film,
  Calendar,
  Clock,
  User,
  Layers,
  Hash,
  Link as LinkIcon,
  AlertCircle,
  RefreshCw,
  Lock,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "@utils/api";
import { toast } from "react-toastify";
import SessionModal   from "@/components/sections/admin/sessions/SessionModal";
import StatusModal    from "@/components/sections/admin/sessions/StatusModal";
import RecordingModal from "@/components/sections/admin/sessions/RecordingModal";
import { fmtDateLong, fmtDuration, fmtSeconds, StatusBadge, escapeHtml } from "@/components/sections/admin/sessions/sessionUtils";

// ─── Helpers ───────────────────────────────────────────────────────────────────
// Defensive ID accessor — handles both `id` and `recordingId` field names
// from the backend without breaking.
const getRecordingId = (rec) => rec?.id ?? rec?.recordingId;

// ─── Detail item ───────────────────────────────────────────────────────────────
const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={15} className="text-gray-500" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm text-gray-800 font-medium mt-0.5 break-words">{value || "—"}</p>
    </div>
  </div>
);

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId;

  const [session,    setSession]    = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [recLoading, setRecLoading] = useState(false);

  // Modals
  const [editModal,   setEditModal]   = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [recModal,    setRecModal]    = useState({ open: false, mode: "create", data: null });

  // ── Fetch session detail ────────────────────────────────────────────────────
  const fetchSession = useCallback(async () => {
    try {
      const res  = await api.get(`/api/sessions/${sessionId}`);
      const data = res.data?.data ?? res.data;
      setSession(data);
      setRecordings(data?.recordings || []);
    } catch {
      toast.error("Failed to load session");
      router.push("/admin/sessions");
    } finally {
      setLoading(false);
    }
  }, [sessionId, router]);

  // ── Fetch recordings (for refresh without full page reload) ─────────────────
  const fetchRecordings = useCallback(async (silent = false) => {
    if (!silent) setRecLoading(true);
    try {
      const res = await api.get(`/api/sessions/${sessionId}/recordings`);
      setRecordings(res.data?.data || res.data || []);
    } catch {
      toast.error("Failed to load recordings");
    } finally {
      setRecLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // ── Delete session ──────────────────────────────────────────────────────────
  const handleDeleteSession = async () => {
    const result = await Swal.fire({
      title:              "Delete Session?",
      html:               `<span style="color:#374151">"<strong>${escapeHtml(session?.title)}</strong>" and all its recordings will be permanently removed.</span>`,
      icon:               "warning",
      showCancelButton:   true,
      confirmButtonColor: "#ff5e04",
      cancelButtonColor:  "#6b7280",
      confirmButtonText:  "Yes, delete it",
      cancelButtonText:   "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/sessions/${sessionId}`);
      toast.success("Session deleted successfully");
      router.push("/admin/sessions");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete session");
    }
  };

  // ── Delete recording ────────────────────────────────────────────────────────
  const handleDeleteRecording = async (rec) => {
    const label  = rec.title || "this recording";
    const result = await Swal.fire({
      title:              "Delete Recording?",
      html:               `<span style="color:#374151">"<strong>${escapeHtml(label)}</strong>" will be permanently removed.</span>`,
      icon:               "warning",
      showCancelButton:   true,
      confirmButtonColor: "#ff5e04",
      cancelButtonColor:  "#6b7280",
      confirmButtonText:  "Yes, delete it",
      cancelButtonText:   "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/sessions/${sessionId}/recordings/${getRecordingId(rec)}`);
      toast.success("Recording deleted successfully");
      fetchRecordings(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete recording");
    }
  };

  // ── Toggle recording visibility ─────────────────────────────────────────────
  // PUT is a replace verb — send the full recording payload to avoid erasing
  // other fields (title, url, password, etc.) on the backend.
  const handleToggleVisibility = async (rec) => {
    const payload = {
      recordingUrl: rec.recordingUrl,
      visible:      !rec.visible,
      ...(rec.title             && { title:             rec.title }),
      ...(rec.recordingPassword && { recordingPassword: rec.recordingPassword }),
      ...(rec.durationSeconds   && { durationSeconds:   rec.durationSeconds }),
      ...(rec.recordedAt        && { recordedAt:        rec.recordedAt }),
      ...(rec.vdoCipherId       && { vdoCipherId:       rec.vdoCipherId }),
    };
    try {
      await api.put(
        `/api/sessions/${sessionId}/recordings/${getRecordingId(rec)}`,
        payload
      );
      toast.success(rec.visible ? "Recording hidden from students" : "Recording is now visible to students");
      fetchRecordings(true);
    } catch {
      toast.error("Failed to update recording visibility");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-2 border-[#ff5e04] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const canChangeStatus = session.status === "SCHEDULED" || session.status === "LIVE";

  return (
    <div className="p-6 min-h-screen bg-gray-50/50">

      {/* ── Breadcrumb + Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/admin/sessions")}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-all shadow-sm mt-0.5"
            aria-label="Back to sessions"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <button
                onClick={() => router.push("/admin/sessions")}
                className="text-sm text-gray-400 hover:text-[#ff5e04] transition-colors"
              >
                Live Sessions
              </button>
              <span className="text-gray-300 text-sm">/</span>
              <span className="text-sm text-gray-700 font-medium line-clamp-1 max-w-xs sm:max-w-sm">
                {session.title}
              </span>
            </div>
            <StatusBadge status={session.status} large />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canChangeStatus && (
            <button
              onClick={() => setStatusModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all"
            >
              <AlertCircle size={15} />
              Change Status
            </button>
          )}
          <button
            onClick={() => setEditModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
          >
            <Edit2 size={15} />
            Edit
          </button>
          <button
            onClick={handleDeleteSession}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </div>

      {/* ── Content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Session info ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Session details card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-[#1a2b4e] to-[#243659]">
              <h2 className="text-base font-semibold text-white leading-snug line-clamp-2">
                {session.title}
              </h2>
              {session.description && (
                <p className="text-xs text-gray-300 mt-1.5 line-clamp-4 leading-relaxed">
                  {session.description}
                </p>
              )}
            </div>
            <div className="p-5 space-y-4">
              <DetailItem icon={Layers}   label="Batch"        value={session.batchName} />
              <DetailItem icon={User}     label="Instructor"   value={session.instructorName} />
              <DetailItem icon={Calendar} label="Scheduled At" value={fmtDateLong(session.scheduledAt)} />
              <DetailItem icon={Clock}    label="Duration"     value={fmtDuration(session.durationMinutes)} />
            </div>
          </div>

          {/* Zoom card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
                <LinkIcon size={12} className="text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Zoom Details</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Meeting ID</p>
                <p className="text-sm font-mono text-gray-800 font-semibold">
                  {session.zoomMeetingId || "—"}
                </p>
              </div>
              {session.zoomJoinUrl ? (
                <a
                  href={session.zoomJoinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all w-full"
                >
                  <ExternalLink size={14} />
                  Join Zoom Meeting
                </a>
              ) : (
                <p className="text-sm text-gray-400 italic text-center py-2">
                  No join URL configured
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Recordings ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Recordings header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Film size={16} className="text-[#ff5e04]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Recordings</h3>
                  <p className="text-xs text-gray-400">
                    {recordings.length} recording{recordings.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchRecordings()}
                  title="Refresh recordings"
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <RefreshCw size={14} className={recLoading ? "animate-spin" : ""} />
                </button>
                <button
                  onClick={() => setRecModal({ open: true, mode: "create", data: null })}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#ff5e04] hover:bg-[#e55003] text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
                >
                  <Plus size={14} />
                  Add Recording
                </button>
              </div>
            </div>

            {/* Recordings body */}
            {recLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-[#ff5e04] border-t-transparent rounded-full animate-spin" />
              </div>

            ) : recordings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Film size={44} className="mb-3 opacity-20" />
                <p className="text-base font-semibold text-gray-500">No recordings yet</p>
                <p className="text-sm mt-1 text-gray-400">Add the recording link once the session is complete</p>
                <button
                  onClick={() => setRecModal({ open: true, mode: "create", data: null })}
                  className="mt-5 flex items-center gap-2 px-4 py-2 bg-[#ff5e04] text-white text-sm font-semibold rounded-lg hover:bg-[#e55003] transition-all shadow-sm"
                >
                  <Plus size={14} /> Add First Recording
                </button>
              </div>

            ) : (
              <div className="divide-y divide-gray-100">
                {recordings.map((rec, idx) => (
                  <div
                    key={getRecordingId(rec)}
                    className={`p-5 transition-colors ${
                      !rec.visible
                        ? "bg-gray-50/80"
                        : "hover:bg-orange-50/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">

                      {/* Recording info */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          rec.visible ? "bg-orange-100" : "bg-gray-100"
                        }`}>
                          <Film size={18} className={rec.visible ? "text-[#ff5e04]" : "text-gray-400"} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`text-sm font-semibold ${rec.visible ? "text-gray-900" : "text-gray-500"} truncate`}>
                              {rec.title || `Recording ${idx + 1}`}
                            </p>
                            {!rec.visible && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full border border-gray-200 shrink-0">
                                <EyeOff size={10} /> Hidden
                              </span>
                            )}
                          </div>

                          {/* Meta chips */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                            {rec.recordedAt && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Calendar size={11} />
                                {fmtDateLong(rec.recordedAt)}
                              </span>
                            )}
                            {rec.durationSeconds && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock size={11} />
                                {fmtSeconds(rec.durationSeconds)}
                              </span>
                            )}
                            {rec.recordingPassword && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Lock size={11} />
                                Password protected
                              </span>
                            )}
                            {rec.vdoCipherId && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Hash size={11} />
                                VdoCipher
                              </span>
                            )}
                          </div>

                          {/* URL */}
                          <a
                            href={rec.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={11} />
                            <span className="truncate max-w-xs">{rec.recordingUrl}</span>
                          </a>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleVisibility(rec)}
                          title={rec.visible ? "Hide from students" : "Show to students"}
                          className={`p-1.5 rounded-lg transition-all ${
                            rec.visible
                              ? "text-green-500 hover:bg-gray-100 hover:text-gray-500"
                              : "text-gray-400 hover:bg-green-50 hover:text-green-500"
                          }`}
                        >
                          {rec.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        <button
                          onClick={() => setRecModal({ open: true, mode: "edit", data: rec })}
                          title="Edit Recording"
                          className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-[#ff5e04] transition-all"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteRecording(rec)}
                          title="Delete Recording"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <SessionModal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        mode="edit"
        initialData={session}
        onSuccess={fetchSession}
      />
      <StatusModal
        isOpen={statusModal}
        onClose={() => setStatusModal(false)}
        session={session}
        onSuccess={fetchSession}
      />
      <RecordingModal
        isOpen={recModal.open}
        onClose={() => setRecModal((p) => ({ ...p, open: false }))}
        mode={recModal.mode}
        sessionId={sessionId}
        initialData={recModal.data}
        onSuccess={() => fetchRecordings(true)}
      />
    </div>
  );
}
