"use client";

import React from "react";

// ─── DateTime helpers ───────────────────────────────────────────────────────────
/**
 * datetime-local inputs return "YYYY-MM-DDTHH:MM" (16 chars, no seconds).
 * Spring Boot LocalDateTime requires full ISO: "YYYY-MM-DDTHH:MM:SS".
 */
export const appendSeconds = (dt) => {
  if (!dt) return undefined;
  return dt.length === 16 ? `${dt}:00` : dt;
};

/** Short month — used in list/table views. */
export const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
};

/** Long month — used in detail views where space allows. */
export const fmtDateLong = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
};

/** Convert minutes → "1h 30m" display string. */
export const fmtDuration = (mins) => {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
};

/** Convert seconds → "1h 30m" or "45m 10s" display string. */
export const fmtSeconds = (sec) => {
  if (!sec) return "—";
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
};

// ─── XSS protection ─────────────────────────────────────────────────────────────
/** Escape user-supplied strings before embedding in Swal.fire html templates. */
export const escapeHtml = (str) =>
  String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

// ─── Status config ───────────────────────────────────────────────────────────────
export const STATUS = {
  SCHEDULED: { label: "Scheduled", badge: "bg-blue-100 text-blue-700 border-blue-200",   dot: "bg-blue-500" },
  LIVE:      { label: "Live",      badge: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500 animate-pulse" },
  COMPLETED: { label: "Completed", badge: "bg-gray-100 text-gray-600 border-gray-200",    dot: "bg-gray-400" },
  CANCELLED: { label: "Cancelled", badge: "bg-red-100 text-red-600 border-red-200",       dot: "bg-red-400" },
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────────
/**
 * Reusable session status pill.
 * large=false (default) → compact table style (text-xs, px-2.5)
 * large=true            → spacious detail style (text-sm, px-3)
 */
export const StatusBadge = ({ status, large = false }) => {
  const cfg = STATUS[status] || STATUS.SCHEDULED;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${cfg.badge} ${
        large ? "px-3 py-1 text-sm" : "px-2.5 py-1 text-xs"
      }`}
    >
      <span className={`rounded-full ${cfg.dot} ${large ? "w-2 h-2" : "w-1.5 h-1.5"}`} />
      {cfg.label}
    </span>
  );
};
