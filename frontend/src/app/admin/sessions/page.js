"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Layers,
  RefreshCw,
  Radio,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "@utils/api";
import { toast } from "react-toastify";
import SessionModal from "@/components/sections/admin/sessions/SessionModal";
import StatusModal from "@/components/sections/admin/sessions/StatusModal";
import { fmtDate, fmtDuration, StatusBadge, escapeHtml } from "@/components/sections/admin/sessions/sessionUtils";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const getId = (obj) => obj?.id ?? obj?.sessionId;

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

// ─── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, iconColor, iconBg, loading }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
      <Icon size={22} className={iconColor} />
    </div>
    <div>
      {loading ? (
        <div className="h-7 w-10 bg-gray-200 rounded animate-pulse mb-1" />
      ) : (
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      )}
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  </div>
);

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function SessionsPage() {
  const router = useRouter();

  // ── Data ─────────────────────────────────────────────────────────────────────
  const [sessions,      setSessions]      = useState([]);
  const [batches,       setBatches]       = useState([]);
  const [statusCounts,  setStatusCounts]  = useState({ SCHEDULED: 0, LIVE: 0, COMPLETED: 0, CANCELLED: 0 });
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages,    setTotalPages]    = useState(0);
  const [tableLoading,  setTableLoading]  = useState(true);
  const [statsLoading,  setStatsLoading]  = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [editLoading,   setEditLoading]   = useState(null); // sessionId being loaded, or null

  // ── Filters ───────────────────────────────────────────────────────────────────
  const [filterStatus,  setFilterStatus]  = useState("");
  const [filterBatchId, setFilterBatchId] = useState("");
  const [searchTitle,   setSearchTitle]   = useState("");
  const [page,          setPage]          = useState(0);

  // ── Modals ────────────────────────────────────────────────────────────────────
  const [sessionModal, setSessionModal] = useState({ open: false, mode: "create", data: null });
  const [statusModal,  setStatusModal]  = useState({ open: false, session: null });

  // ── Fetch paginated sessions (table) ──────────────────────────────────────────
  const fetchSessions = useCallback(async (silent = false) => {
    if (!silent) setTableLoading(true);
    else         setRefreshing(true);
    try {
      const params = { page, size: PAGE_SIZE, sort: "scheduledAt,desc" };
      if (filterStatus)  params.status  = filterStatus;
      if (filterBatchId) params.batchId = filterBatchId;

      const res = await api.get("/api/sessions", { params });
      const d   = res.data?.data || {};
      setSessions(d.content   || []);
      setTotalPages(d.totalPages    || 0);
      setTotalElements(d.totalElements || 0);
    } catch {
      toast.error("Failed to fetch sessions");
    } finally {
      setTableLoading(false);
      setRefreshing(false);
    }
  }, [page, filterStatus, filterBatchId]);

  // ── Fetch global per-status counts (stat cards) ───────────────────────────────
  // These are unfiltered totals — always reflect the full DB, not the current filter.
  const fetchStatusCounts = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [s, l, c, x] = await Promise.all([
        api.get("/api/sessions", { params: { status: "SCHEDULED", page: 0, size: 1 } }),
        api.get("/api/sessions", { params: { status: "LIVE",      page: 0, size: 1 } }),
        api.get("/api/sessions", { params: { status: "COMPLETED", page: 0, size: 1 } }),
        api.get("/api/sessions", { params: { status: "CANCELLED", page: 0, size: 1 } }),
      ]);
      setStatusCounts({
        SCHEDULED: s.data?.data?.totalElements || 0,
        LIVE:      l.data?.data?.totalElements || 0,
        COMPLETED: c.data?.data?.totalElements || 0,
        CANCELLED: x.data?.data?.totalElements || 0,
      });
    } catch {
      // Silent — non-critical if status counts fail to load
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Load reference data (batches) ─────────────────────────────────────────────
  useEffect(() => {
    api.get("/api/batches")
      .then((r) => setBatches(r.data?.data?.content || []))
      .catch(() => {});
    fetchStatusCounts();
  }, [fetchStatusCounts]);

  // ── Fetch sessions whenever page or filters change ────────────────────────────
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // ── Refresh both table + stats after any mutation ─────────────────────────────
  const refreshAll = useCallback(() => {
    fetchSessions(true);
    fetchStatusCounts();
  }, [fetchSessions, fetchStatusCounts]);

  // ── Filter change handlers — reset page and update filter atomically ──────────
  // React 18 batches both setState calls in one event handler, preventing the
  // double-fetch that a separate "reset page" useEffect would cause.
  const handleStatusFilter = (val) => {
    setFilterStatus(val);
    setPage(0);
  };

  const handleBatchFilter = (val) => {
    setFilterBatchId(val);
    setPage(0);
  };

  // ── Open edit modal with full session data (list has only SessionSummary) ─────
  // Shows a per-row loading spinner to give immediate visual feedback while the
  // full SessionResponse is fetched before the modal opens.
  const handleEditSession = async (session) => {
    const id = getId(session);
    setEditLoading(id);
    try {
      const res = await api.get(`/api/sessions/${id}`);
      const full = res.data?.data ?? res.data;
      setSessionModal({ open: true, mode: "edit", data: full });
    } catch {
      toast.error("Failed to load session details");
    } finally {
      setEditLoading(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async (session) => {
    const result = await Swal.fire({
      title:              "Delete Session?",
      html:               `<span style="color:#374151">"<strong>${escapeHtml(session.title)}</strong>" will be permanently removed.</span>`,
      icon:               "warning",
      showCancelButton:   true,
      confirmButtonColor: "#ff5e04",
      cancelButtonColor:  "#6b7280",
      confirmButtonText:  "Yes, delete it",
      cancelButtonText:   "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/sessions/${getId(session)}`);
      toast.success("Session deleted successfully");
      refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete session");
    }
  };

  // ── Client-side title search (within current page) ────────────────────────────
  const displayed = searchTitle
    ? sessions.filter((s) => s.title?.toLowerCase().includes(searchTitle.toLowerCase()))
    : sessions;

  const isSearchActive  = searchTitle.trim().length > 0;
  const isTrulyEmpty    = !tableLoading && sessions.length === 0 && !isSearchActive;
  const isSearchNoMatch = !tableLoading && displayed.length === 0 && isSearchActive;

  // ── Pagination page numbers ───────────────────────────────────────────────────
  const pageNumbers = () => {
    const pages = [];
    const start = Math.max(0, page - 2);
    const end   = Math.min(totalPages - 1, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 min-h-screen bg-gray-50/50">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage scheduled, live, and completed sessions across all batches
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchSessions(true); fetchStatusCounts(); }}
            disabled={refreshing}
            title="Refresh"
            className="p-2.5 text-gray-500 hover:text-gray-700 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-all shadow-sm"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setSessionModal({ open: true, mode: "create", data: null })}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#ff5e04] hover:bg-[#e55003] text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            <Plus size={16} />
            New Session
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total"     value={Object.values(statusCounts).reduce((a, b) => a + b, 0)} icon={Layers} iconColor="text-[#ff5e04]" iconBg="bg-orange-50" loading={statsLoading} />
        <StatCard label="Scheduled" value={statusCounts.SCHEDULED}   icon={Clock}       iconColor="text-blue-600"   iconBg="bg-blue-50"   loading={statsLoading} />
        <StatCard label="Live"      value={statusCounts.LIVE}        icon={Radio}       iconColor="text-green-600"  iconBg="bg-green-50"  loading={statsLoading} />
        <StatCard label="Completed" value={statusCounts.COMPLETED}   icon={CheckCircle2} iconColor="text-gray-600"  iconBg="bg-gray-100"  loading={statsLoading} />
        <StatCard label="Cancelled" value={statusCounts.CANCELLED}   icon={XCircle}     iconColor="text-red-500"    iconBg="bg-red-50"    loading={statsLoading} />
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-4 flex flex-col sm:flex-row gap-3 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
            placeholder="Search sessions by title…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5e04]/20 focus:border-[#ff5e04] transition-all"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="appearance-none pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5e04]/20 focus:border-[#ff5e04] bg-white cursor-pointer min-w-[150px]"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="LIVE">Live</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Batch filter */}
        <div className="relative">
          <Layers size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={filterBatchId}
            onChange={(e) => handleBatchFilter(e.target.value)}
            className="appearance-none pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5e04]/20 focus:border-[#ff5e04] bg-white cursor-pointer min-w-[160px]"
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b.batchId} value={b.batchId}>{b.batchName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Loading skeleton */}
        {tableLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#ff5e04] border-t-transparent rounded-full animate-spin" />
          </div>

        /* True empty state (no sessions exist at all) */
        ) : isTrulyEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Calendar size={52} className="mb-4 opacity-25" />
            <p className="text-lg font-semibold text-gray-600">No sessions yet</p>
            <p className="text-sm mt-1 text-gray-400">
              {filterStatus || filterBatchId
                ? "No sessions match the selected filters."
                : "Create your first live session to get started."}
            </p>
            {!filterStatus && !filterBatchId && (
              <button
                onClick={() => setSessionModal({ open: true, mode: "create", data: null })}
                className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-[#ff5e04] text-white text-sm font-semibold rounded-lg hover:bg-[#e55003] transition-all shadow-sm"
              >
                <Plus size={16} /> Create First Session
              </button>
            )}
          </div>

        /* Search no-match state (data exists but search filtered it out) */
        ) : isSearchNoMatch ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Search size={48} className="mb-4 opacity-25" />
            <p className="text-lg font-semibold text-gray-600">No results for "{searchTitle}"</p>
            <p className="text-sm mt-1 text-gray-400">
              Try a different title or clear the search.
            </p>
            <button
              onClick={() => setSearchTitle("")}
              className="mt-5 text-sm font-medium text-[#ff5e04] hover:underline"
            >
              Clear search
            </button>
          </div>

        /* Data table */
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Session</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Instructor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheduled At</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayed.map((session, idx) => (
                  <tr
                    key={getId(session)}
                    onClick={() => router.push(`/admin/sessions/${getId(session)}`)}
                    className="hover:bg-orange-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3.5 text-gray-400 text-xs font-medium">
                      {page * PAGE_SIZE + idx + 1}
                    </td>

                    <td className="px-4 py-3.5 max-w-[220px]">
                      <p className="font-semibold text-gray-900 group-hover:text-[#ff5e04] transition-colors truncate">
                        {session.title}
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Layers size={12} className="text-gray-400 shrink-0" />
                        <span className="text-gray-700 text-xs font-medium truncate max-w-[110px]">
                          {session.batchName || "—"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-gray-400 shrink-0" />
                        <span className="text-gray-700 text-xs truncate max-w-[100px]">
                          {session.instructorName || "—"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                        <Calendar size={12} className="text-gray-400 shrink-0" />
                        {fmtDate(session.scheduledAt)}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-gray-600 text-xs">
                      {fmtDuration(session.durationMinutes)}
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusBadge status={session.status} />
                    </td>

                    {/* Actions — stop propagation so row click doesn't fire */}
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {(session.status === "SCHEDULED" || session.status === "LIVE") && (
                          <button
                            onClick={() => setStatusModal({ open: true, session })}
                            title="Change Status"
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all"
                          >
                            <AlertCircle size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditSession(session)}
                          disabled={editLoading === getId(session)}
                          title="Edit Session"
                          className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-[#ff5e04] transition-all disabled:opacity-60 disabled:cursor-wait"
                        >
                          {editLoading === getId(session)
                            ? <span className="w-3.5 h-3.5 border-2 border-[#ff5e04] border-t-transparent rounded-full animate-spin inline-block" />
                            : <Edit2 size={15} />
                          }
                        </button>
                        <button
                          onClick={() => handleDelete(session)}
                          title="Delete Session"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {!tableLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} of {totalElements}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              {pageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs rounded-lg border font-medium transition-all ${
                    p === page
                      ? "bg-[#ff5e04] text-white border-[#ff5e04] shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-orange-50 hover:border-orange-300 hover:text-[#ff5e04]"
                  }`}
                >
                  {p + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <SessionModal
        isOpen={sessionModal.open}
        onClose={() => setSessionModal((p) => ({ ...p, open: false }))}
        mode={sessionModal.mode}
        initialData={sessionModal.data}
        onSuccess={refreshAll}
      />
      <StatusModal
        isOpen={statusModal.open}
        onClose={() => setStatusModal({ open: false, session: null })}
        session={statusModal.session}
        onSuccess={refreshAll}
      />
    </div>
  );
}
