"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown, ChevronLeft, ChevronRight, MoreVertical,
  Users, BookOpen, Calendar, TrendingUp, AlertCircle,
  KeyRound, Archive, Search, CheckCircle2, UserCheck,
  GraduationCap,
} from "lucide-react";
import { useParams } from "next/navigation";
import api from "../../../../../../utils/api";

/* ── Skeleton helpers ────────────────────────────────────────────── */
function Sk({ className }) {
  return <div className={`sk rounded ${className}`} />;
}

function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Sk className="h-3 w-20" />
        <Sk className="h-9 w-9 rounded-xl" />
      </div>
      <Sk className="h-7 w-16" />
      <Sk className="h-2.5 w-24 rounded-full" />
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-100">
      <div className="col-span-1"><Sk className="h-3 w-6" /></div>
      <div className="col-span-3 space-y-1.5">
        <Sk className="h-3.5 w-32" />
        <Sk className="h-2.5 w-20" />
      </div>
      <div className="col-span-2 space-y-1.5">
        <Sk className="h-3 w-28" />
        <Sk className="h-2.5 w-20" />
      </div>
      <div className="col-span-2"><Sk className="h-3 w-24" /></div>
      <div className="col-span-2"><Sk className="h-5 w-16 rounded-full" /></div>
      <div className="col-span-1 space-y-1.5">
        <Sk className="h-2 w-full rounded-full" />
        <Sk className="h-2.5 w-8 rounded" />
      </div>
      <div className="col-span-1 flex justify-end"><Sk className="h-7 w-7 rounded-full" /></div>
    </div>
  );
}

/* ── Progress bar ────────────────────────────────────────────────── */
function ProgressBar({ value }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  const color =
    pct >= 80 ? "#22c55e" :
    pct >= 50 ? "#0c63e4" :
    pct >= 20 ? "#ff5b00" : "#e5e7eb";
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

/* ── Batch select ────────────────────────────────────────────────── */
function BatchSelect({ batches, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl
                   text-sm font-semibold text-[#1a2b4e] hover:border-[#ff5b00]/40 transition-colors
                   min-w-[220px] focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00]"
      >
        <Calendar className="w-4 h-4 text-[#ff5b00] flex-shrink-0" />
        <span className="flex-1 text-left truncate">{selected?.name ?? "Select Batch"}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-xl border border-gray-100 z-50 overflow-hidden"
          style={{ boxShadow: "0 8px 32px -4px rgba(26,43,78,0.18)" }}
        >
          <div className="p-2 max-h-64 overflow-y-auto">
            {batches.map((b) => (
              <button
                key={b.id}
                onClick={() => { onChange(b); setOpen(false); }}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm transition-colors
                            ${selected?.id === b.id
                              ? "bg-[#ff5b00]/8 text-[#ff5b00] font-semibold"
                              : "text-[#1a2b4e] hover:bg-[#ff5b00]/5"}`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${selected?.id === b.id ? "bg-[#ff5b00]" : "bg-gray-300"}`} />
                <span className="flex-1 text-left truncate">{b.name}</span>
                {b.status && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                    ${b.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                    {b.status}
                  </span>
                )}
                {selected?.id === b.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#ff5b00] flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Row action menu ─────────────────────────────────────────────── */
function ActionMenu({ learnerId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400
                   hover:text-[#1a2b4e] hover:bg-gray-100 transition-all duration-150"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-gray-100 z-50 overflow-hidden"
          style={{ boxShadow: "0 8px 32px -4px rgba(26,43,78,0.18)" }}
        >
          <div className="py-1">
            <button
              className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-medium text-[#1a2b4e] hover:bg-[#ff5b00]/5 transition-colors"
              onClick={() => setOpen(false)}
            >
              <KeyRound className="w-3.5 h-3.5 text-[#0c63e4]" />
              Reset Password
            </button>
            <button
              className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Archive className="w-3.5 h-3.5" />
              Archive Learner
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
const LearnersPage = () => {
  const { courseId } = useParams();
  const [batches, setBatches]               = useState([]);
  const [selectedBatch, setSelectedBatch]   = useState(null);
  const [learners, setLearners]             = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingLearners, setLoadingLearners] = useState(false);
  const [batchError, setBatchError]         = useState(null);
  const [learnerError, setLearnerError]     = useState(null);
  const [search, setSearch]                 = useState("");
  const [itemsPerPage, setItemsPerPage]     = useState(25);
  const [currentPage, setCurrentPage]       = useState(1);

  /* fetch batches ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!courseId) return;
    setLoadingBatches(true);
    setBatchError(null);
    api.get(`/api/courses/${courseId}/batches`)
      .then((res) => {
        const raw = res.data?.data || res.data || [];
        const mapped = raw.map((b) => ({
          id: b.batchId ?? b.id,
          batchId: b.batchId ?? b.id,
          name: b.batchName ?? b.name,
          startDate: b.startDate,
          endDate: b.endDate,
          status: b.status,
        }));
        setBatches(mapped);
        if (mapped.length > 0) setSelectedBatch(mapped[0]);
      })
      .catch(() => setBatchError("Failed to load batches."))
      .finally(() => setLoadingBatches(false));
  }, [courseId]);

  /* fetch learners ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!selectedBatch || !courseId) return;
    setLoadingLearners(true);
    setLearnerError(null);
    const bId = selectedBatch.batchId ?? selectedBatch.id;
    api.get(`/api/courses/learners?courseId=${courseId}&batchId=${bId}`)
      .then((res) => {
        let d = res.data?.data ?? res.data ?? [];
        if (!Array.isArray(d)) d = [];
        setLearners(d);
        setCurrentPage(1);
      })
      .catch(() => { setLearnerError("Failed to load learners."); setLearners([]); })
      .finally(() => setLoadingLearners(false));
  }, [selectedBatch, courseId]);

  /* derived stats ──────────────────────────────────────────────── */
  const avgProgress = learners.length
    ? Math.round(learners.reduce((s, l) => s + (l.curriculumProgress || 0), 0) / learners.length)
    : 0;
  const avgAttendance = learners.length
    ? Math.round(learners.reduce((s, l) => s + (l.attendance || 0), 0) / learners.length)
    : 0;

  /* filtered + paginated ───────────────────────────────────────── */
  const filtered = learners.filter((l) => {
    const q = search.toLowerCase();
    return !q || (l.name ?? l.fullName ?? "").toLowerCase().includes(q)
              || (l.email ?? l.contact ?? "").toLowerCase().includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paged = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  /* ── render ───────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2b4e]">Learners</h1>
          <p className="text-sm text-gray-400 mt-1">Track enrollment, attendance and progress by batch</p>
        </div>

        {/* Batch picker */}
        {loadingBatches ? (
          <div className="flex items-center gap-2 px-4 py-2.5">
            <div className="w-4 h-4 border-2 border-[#ff5b00] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Loading batches…</span>
          </div>
        ) : batchError ? (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle className="w-4 h-4" />{batchError}
          </div>
        ) : batches.length === 0 ? (
          <div className="text-sm text-gray-400">No batches available</div>
        ) : (
          <BatchSelect batches={batches} selected={selectedBatch} onChange={setSelectedBatch} />
        )}
      </div>

      {/* ── Stat cards ── */}
      {loadingBatches || loadingLearners ? (
        <div className="grid grid-cols-4 gap-4">
          <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {/* Total learners */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-[#ff5b00]/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Enrolled</span>
              <div className="w-9 h-9 rounded-xl bg-[#ff5b00]/10 border border-[#ff5b00]/15 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#ff5b00]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1a2b4e]">{learners.length}</div>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ff5b00]/8 border border-[#ff5b00]/15 text-[10px] font-semibold text-[#ff5b00]">
                <UserCheck className="w-2.5 h-2.5" /> learners
              </span>
            </div>
          </div>

          {/* Avg progress */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-[#0c63e4]/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avg Progress</span>
              <div className="w-9 h-9 rounded-xl bg-[#0c63e4]/8 border border-[#0c63e4]/15 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-[#0c63e4]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1a2b4e]">{avgProgress}<span className="text-sm text-gray-400 ml-0.5">%</span></div>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-1.5 rounded-full bg-[#0c63e4] transition-all" style={{ width: `${avgProgress}%` }} />
            </div>
          </div>

          {/* Avg attendance */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avg Attendance</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1a2b4e]">{avgAttendance}<span className="text-sm text-gray-400 ml-0.5">%</span></div>
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                ${avgAttendance >= 75 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${avgAttendance >= 75 ? "bg-emerald-500" : "bg-amber-500"}`} />
                {avgAttendance >= 75 ? "Healthy" : "Needs attention"}
              </span>
            </div>
          </div>

          {/* Batch */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-[#f2277e]/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Batch</span>
              <div className="w-9 h-9 rounded-xl bg-[#f2277e]/8 border border-[#f2277e]/15 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-[#f2277e]" />
              </div>
            </div>
            <div className="text-sm font-bold text-[#1a2b4e] truncate">{selectedBatch?.name ?? "—"}</div>
            <div className="mt-2">
              {selectedBatch?.status && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                  ${selectedBatch.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedBatch.status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-400"}`} />
                  {selectedBatch.status}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Table card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-visible">

        {/* Card toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#ff5b00]/10 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-[#ff5b00]" />
            </div>
            <span className="text-xs font-bold text-[#1a2b4e] uppercase tracking-wide">Learner List</span>
            {!loadingLearners && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#ff5b00]/8 border border-[#ff5b00]/15 text-[10px] font-semibold text-[#ff5b00]">
                {filtered.length}
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search name or email…"
              className="w-full pl-8 pr-3.5 py-2 text-xs border border-gray-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00]
                         transition-colors placeholder-gray-400 text-[#1a2b4e] bg-white"
            />
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="col-span-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">#</div>
          <div className="col-span-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Learner</div>
          <div className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Contact</div>
          <div className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Enrolled On</div>
          <div className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Attendance</div>
          <div className="col-span-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Progress</div>
          <div className="col-span-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</div>
        </div>

        {/* Body */}
        {loadingLearners ? (
          [0, 1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)
        ) : learnerError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-sm font-semibold text-[#1a2b4e]">{learnerError}</p>
          </div>
        ) : !selectedBatch ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-[#1a2b4e]">Select a batch to view learners</p>
          </div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#1a2b4e]">
                {search ? "No learners match your search" : "No learners in this batch"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {search ? "Try a different name or email" : "Enroll students to see them here"}
              </p>
            </div>
          </div>
        ) : (
          paged.map((learner, i) => {
            const name    = learner.name ?? learner.fullName ?? learner.username ?? "—";
            const sid     = learner.studentId ?? learner.id ?? learner.userId;
            const email   = learner.contact ?? learner.email ?? "—";
            const phone   = learner.phone ?? "";
            const enrolled = learner.enrolledOn ?? learner.enrollmentDate ?? "—";
            const att     = learner.attendance ?? 0;
            const prog    = learner.curriculumProgress ?? 0;
            const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

            return (
              <div
                key={learner.id ?? learner.userId ?? i}
                className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-100 last:border-b-0
                           hover:bg-[#ff5b00]/[0.025] transition-colors duration-150 group"
              >
                {/* Index */}
                <div className="col-span-1">
                  <span className="text-xs font-medium text-gray-400">
                    {String((page - 1) * itemsPerPage + i + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Learner name + avatar */}
                <div className="col-span-3 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff5b00]/20 to-[#0c63e4]/20
                                  border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-[#1a2b4e]">{initials || "?"}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#1a2b4e] truncate group-hover:text-[#ff5b00] transition-colors">
                      {name}
                    </div>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#0c63e4]/8 text-[10px] font-semibold text-[#0c63e4]">
                      #{sid}
                    </span>
                  </div>
                </div>

                {/* Contact */}
                <div className="col-span-2 min-w-0">
                  <div className="text-xs text-[#1a2b4e] truncate">{email}</div>
                  {phone && <div className="text-[11px] text-gray-400 truncate">{phone}</div>}
                </div>

                {/* Enrolled on */}
                <div className="col-span-2">
                  <div className="text-xs text-[#1a2b4e]">{enrolled}</div>
                </div>

                {/* Attendance */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${att >= 75 ? "text-emerald-600" : att >= 50 ? "text-amber-500" : "text-red-400"}`}>
                      {att}%
                    </span>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0
                      ${att >= 75 ? "bg-emerald-400" : att >= 50 ? "bg-amber-400" : att > 0 ? "bg-red-400" : "bg-gray-200"}`} />
                  </div>
                </div>

                {/* Progress */}
                <div className="col-span-1">
                  <div className="space-y-1">
                    <ProgressBar value={prog} />
                    <span className="text-[11px] font-medium text-gray-400">{prog}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end">
                  <ActionMenu learnerId={learner.id ?? learner.userId} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Pagination ── */}
      {!loadingLearners && filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Showing{" "}
            <span className="font-semibold text-[#1a2b4e]">
              {(page - 1) * itemsPerPage + 1}–{Math.min(page * itemsPerPage, filtered.length)}
            </span>{" "}
            of <span className="font-semibold text-[#1a2b4e]">{filtered.length}</span> learners
          </div>

          <div className="flex items-center gap-3">
            {/* Page buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200
                           text-gray-400 hover:border-[#ff5b00]/30 hover:text-[#ff5b00]
                           disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                let p;
                if (totalPages <= 5) {
                  p = idx + 1;
                } else if (page <= 3) {
                  p = idx + 1;
                } else if (page >= totalPages - 2) {
                  p = totalPages - 4 + idx;
                } else {
                  p = page - 2 + idx;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold transition-colors
                      ${page === p
                        ? "bg-[#ff5b00] text-white shadow-sm"
                        : "border border-gray-200 text-gray-500 hover:border-[#ff5b00]/30 hover:text-[#ff5b00]"}`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200
                           text-gray-400 hover:border-[#ff5b00]/30 hover:text-[#ff5b00]
                           disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Per-page */}
            <div className="flex items-center gap-1.5">
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5
                           focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00]
                           text-[#1a2b4e] bg-white appearance-none"
              >
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-xs text-gray-400">/ page</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnersPage;
