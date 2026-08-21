"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, XCircle, Zap } from "lucide-react";
import api from "@utils/api";
import { toast } from "react-toastify";

// ─── Config ────────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  SCHEDULED: {
    label: "Scheduled",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  LIVE: {
    label: "Live",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-gray-700",
    bg: "bg-gray-100",
    border: "border-gray-200",
    dot: "bg-gray-500",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

// Valid transitions as defined by the backend
const TRANSITIONS = {
  SCHEDULED: ["LIVE", "CANCELLED"],
  LIVE:      ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const TRANSITION_META = {
  LIVE:      { icon: Zap,          label: "Go Live",         desc: "Start broadcasting — students will see this session as active" },
  COMPLETED: { icon: CheckCircle2, label: "Mark Completed",  desc: "Session has ended — make recordings available" },
  CANCELLED: { icon: XCircle,      label: "Cancel Session",  desc: "This session will be permanently cancelled" },
};

// ─── Component ─────────────────────────────────────────────────────────────────
const StatusModal = ({ isOpen, onClose, session, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !session) return null;

  const currentStatus = session.status;
  const available     = TRANSITIONS[currentStatus] || [];
  const currentCfg    = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.SCHEDULED;
  const sessionId     = session.id ?? session.sessionId;

  const handleTransition = async (newStatus) => {
    const cfg = STATUS_CONFIG[newStatus];
    try {
      setLoading(true);
      await api.patch(`/api/sessions/${sessionId}/status`, { status: newStatus });
      toast.success(`Session is now ${cfg.label}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || `Failed to update status to ${cfg.label}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#1a2b4e] to-[#243659]">
          <div>
            <h2 className="text-lg font-semibold text-white">Update Session Status</h2>
            <p className="text-xs text-gray-300 mt-0.5 truncate max-w-xs">{session.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Current status */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Current Status
            </p>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${currentCfg.bg} ${currentCfg.border}`}
            >
              <span className={`w-2 h-2 rounded-full ${currentCfg.dot}`} />
              <span className={`text-sm font-semibold ${currentCfg.color}`}>
                {currentCfg.label}
              </span>
            </div>
          </div>

          {/* Available transitions */}
          {available.length > 0 ? (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Transition To
              </p>
              <div className="space-y-3">
                {available.map((status) => {
                  const meta = TRANSITION_META[status];
                  const cfg  = STATUS_CONFIG[status];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={status}
                      onClick={() => handleTransition(status)}
                      disabled={loading}
                      className={`w-full flex items-center gap-4 p-4 border rounded-xl transition-all text-left
                        hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed
                        ${cfg.bg} ${cfg.border}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border}`}
                      >
                        <Icon size={18} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${cfg.color}`}>{meta.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{meta.desc}</p>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">No transitions available</p>
              <p className="text-xs text-gray-400 mt-1">
                This session is in a terminal state and cannot be changed.
              </p>
            </div>
          )}

          {loading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <span className="w-4 h-4 border-2 border-[#ff5e04] border-t-transparent rounded-full animate-spin" />
              Updating status…
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusModal;
