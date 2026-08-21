"use client";

import React, { useState, useEffect } from "react";
import { X, Link, Lock, Clock, Calendar, Film, Eye, EyeOff } from "lucide-react";
import api from "@utils/api";
import { toast } from "react-toastify";
import { appendSeconds } from "./sessionUtils";

/** Format seconds into HH:MM:SS for the live preview label. */
const formatHMS = (totalSeconds) => {
  if (!totalSeconds || isNaN(totalSeconds)) return "";
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
};

// ─── RecordingModal ────────────────────────────────────────────────────────────
const RecordingModal = ({ isOpen, onClose, mode, sessionId, initialData, onSuccess }) => {
  const isEdit = mode === "edit";

  const [formData, setFormData] = useState({
    recordingUrl:      "",
    title:             "",
    recordingPassword: "",
    durationSeconds:   "",
    recordedAt:        "",
    vdoCipherId:       "",
    visible:           true,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Populate form ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    if (isEdit && initialData) {
      setFormData({
        recordingUrl:      initialData.recordingUrl      || "",
        title:             initialData.title             || "",
        recordingPassword: initialData.recordingPassword || "",
        durationSeconds:   initialData.durationSeconds   || "",
        recordedAt:        initialData.recordedAt
          ? initialData.recordedAt.slice(0, 16)
          : "",
        vdoCipherId: initialData.vdoCipherId || "",
        visible:     initialData.visible !== undefined ? initialData.visible : true,
      });
    } else {
      setFormData({
        recordingUrl: "", title: "", recordingPassword: "",
        durationSeconds: "", recordedAt: "", vdoCipherId: "", visible: true,
      });
    }
    setShowPassword(false);
  }, [isOpen, isEdit, initialData]);

  // ── Escape key ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const set = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.recordingUrl.trim()) return toast.error("Recording URL is required");

    const payload = {
      recordingUrl: formData.recordingUrl.trim(),
      visible:      formData.visible,
      ...(formData.title             && { title:             formData.title.trim() }),
      ...(formData.recordingPassword && { recordingPassword: formData.recordingPassword }),
      ...(formData.durationSeconds   && { durationSeconds:   Math.floor(Number(formData.durationSeconds)) }),
      ...(formData.recordedAt        && { recordedAt:        appendSeconds(formData.recordedAt) }),
      ...(formData.vdoCipherId       && { vdoCipherId:       formData.vdoCipherId.trim() }),
    };

    const recId = initialData?.id ?? initialData?.recordingId;

    try {
      setLoading(true);
      if (isEdit) {
        await api.put(`/api/sessions/${sessionId}/recordings/${recId}`, payload);
        toast.success("Recording updated successfully");
      } else {
        await api.post(`/api/sessions/${sessionId}/recordings`, payload);
        toast.success("Recording added successfully");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        `Failed to ${isEdit ? "update" : "add"} recording`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const durationPreview = formatHMS(Number(formData.durationSeconds));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#1a2b4e] to-[#243659] shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {isEdit ? "Edit Recording" : "Add Recording"}
            </h2>
            <p className="text-xs text-gray-300 mt-0.5">
              {isEdit
                ? "Update the recording details below"
                : "Attach a recording link to this session"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form id="recording-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Recording URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Recording URL <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Link size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="url"
                value={formData.recordingUrl}
                onChange={set("recordingUrl")}
                placeholder="https://zoom.us/rec/share/..."
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5e04]/20 focus:border-[#ff5e04] transition-all"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Recording Title
            </label>
            <div className="relative">
              <Film size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={formData.title}
                onChange={set("title")}
                placeholder="e.g. Class 1 Recording"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5e04]/20 focus:border-[#ff5e04] transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Recording Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.recordingPassword}
                onChange={set("recordingPassword")}
                placeholder="Optional access password"
                className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5e04]/20 focus:border-[#ff5e04] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Duration + Recorded At */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Duration (seconds)
              </label>
              <div className="relative">
                <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.durationSeconds}
                  onChange={set("durationSeconds")}
                  placeholder="e.g. 5400"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5e04]/20 focus:border-[#ff5e04] transition-all"
                />
              </div>
              {durationPreview && (
                <p className="text-xs text-gray-400 mt-1 font-mono">{durationPreview}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Recorded At
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="datetime-local"
                  value={formData.recordedAt}
                  onChange={set("recordedAt")}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5e04]/20 focus:border-[#ff5e04] transition-all"
                />
              </div>
            </div>
          </div>

          {/* VdoCipher ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              VdoCipher Video ID
            </label>
            <input
              type="text"
              value={formData.vdoCipherId}
              onChange={set("vdoCipherId")}
              placeholder="Optional — paste VdoCipher video ID"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5e04]/20 focus:border-[#ff5e04] transition-all"
            />
          </div>

          {/* Visibility toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-700">Visible to Students</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formData.visible
                  ? "Students can view this recording"
                  : "Hidden — only admins can see it"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formData.visible}
              onClick={() => setFormData((p) => ({ ...p, visible: !p.visible }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff5e04]/30 ${
                formData.visible ? "bg-[#ff5e04]" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  formData.visible ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="recording-form"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#ff5e04] hover:bg-[#e55003] rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isEdit ? "Update Recording" : "Add Recording"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordingModal;
