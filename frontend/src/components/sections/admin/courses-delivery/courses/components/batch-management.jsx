"use client";

import { useState, useEffect, useContext, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  ExternalLink,
  Calendar,
  User,
  BookOpen,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import api from "@utils/api";
import AddBatchSidebar from "./sidebars/AddBatchSidebar";
import EditBatchSidebar from "./sidebars/EditBatchSidebar";
import { BatchesContext } from "../../../../../../app/admin/courses/[courseId]/layout";
import { toast } from "react-toastify";

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-100">
      <div className="col-span-1"><div className="sk h-3 w-6 rounded" /></div>
      <div className="col-span-3 space-y-1.5">
        <div className="sk h-3.5 w-36 rounded" />
        <div className="sk h-2.5 w-20 rounded" />
      </div>
      <div className="col-span-2 space-y-1.5">
        <div className="sk h-3 w-24 rounded" />
        <div className="sk h-2.5 w-16 rounded" />
      </div>
      <div className="col-span-2 space-y-1.5">
        <div className="sk h-3 w-20 rounded" />
        <div className="sk h-2.5 w-14 rounded" />
      </div>
      <div className="col-span-2"><div className="sk h-3 w-24 rounded" /></div>
      <div className="col-span-1"><div className="sk h-5 w-14 rounded-full" /></div>
      <div className="col-span-1 flex justify-end"><div className="sk h-7 w-7 rounded-full" /></div>
    </div>
  );
}

// ── Batch row ─────────────────────────────────────────────────────────────────
function BatchRow({ batch, index, onEdit, onDelete, onMakeDefault, onView }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div
      className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-[#ff5b00]/[0.025] transition-colors duration-150 cursor-pointer group"
      onClick={() => onView(batch.id)}
    >
      {/* Index */}
      <div className="col-span-1">
        <span className="text-xs font-medium text-gray-400">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Batch name + default badge */}
      <div className="col-span-3 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[#1a2b4e] truncate group-hover:text-[#ff5b00] transition-colors">
            {batch.name}
          </span>
          {batch.isDefault && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#ff5b00]/10 text-[#ff5b00] flex-shrink-0">
              <Star className="w-2.5 h-2.5" />
              Default
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">{batch.subject}</p>
      </div>

      {/* Duration */}
      <div className="col-span-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <div>
            <div className="text-[#1a2b4e] font-medium">{batch.duration.start}</div>
            <div className="text-gray-400">→ {batch.duration.end}</div>
          </div>
        </div>
      </div>

      {/* Instructor */}
      <div className="col-span-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span className="text-[#1a2b4e] font-medium truncate">{batch.instructor}</span>
        </div>
      </div>

      {/* Manager */}
      <div className="col-span-2">
        <span className="text-xs text-gray-500 truncate">{batch.manager}</span>
      </div>

      {/* Progress */}
      <div className="col-span-1">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0c63e4]/8 text-[#0c63e4]">
          {batch.progress}
        </span>
      </div>

      {/* Actions */}
      <div
        className="col-span-1 flex justify-end"
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#1a2b4e] hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all duration-150 opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>

        {open && (
          <div
            className="absolute right-6 mt-8 w-44 bg-white rounded-xl border border-gray-100 z-50 overflow-hidden"
            style={{ boxShadow: "0 8px 32px -4px rgba(26,43,78,0.18)" }}
          >
            <div className="py-1">
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); onView(batch.id); }}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-medium text-[#1a2b4e] hover:bg-[#ff5b00]/5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#0c63e4]" />
                View Details
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(batch); }}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-medium text-[#1a2b4e] hover:bg-[#ff5b00]/5 transition-colors"
              >
                <Edit className="w-3.5 h-3.5 text-[#0c63e4]" />
                Edit Batch
              </button>
              {!batch.isDefault && (
                <button
                  onClick={(e) => { e.stopPropagation(); setOpen(false); onMakeDefault(batch.id); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-medium text-[#1a2b4e] hover:bg-[#ff5b00]/5 transition-colors"
                >
                  <Star className="w-3.5 h-3.5 text-[#ff5b00]" />
                  Make Default
                </button>
              )}
              <div className="mx-3 my-1 h-px bg-gray-100" />
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(batch.id); }}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Batch
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BatchManagement() {
  const { courseId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("active");
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [initialData, setInitialData] = useState(null);
  const [editType, setEditType] = useState(null);

  const [course, setCourse] = useState([]);
  const [instructor, setInstructor] = useState([]);
  const [bundleData, setBundleData] = useState([]);

  const { setBatches: setSharedBatches } = useContext(BatchesContext);
  const router = useRouter();

  const fetchBatches = async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/courses/${courseId}/batches`);
      const batchesData = response.data?.data || response.data || [];
      if (Array.isArray(batchesData)) {
        const transformed = batchesData.map((batch) => ({
          id: batch.batchId || batch.id,
          name: batch.batchName || batch.name,
          course:
            batch.courses?.length > 0 ? batch.courses[0].courseName : "No Course",
          duration: {
            start: batch.startDate
              ? new Date(batch.startDate).toLocaleDateString()
              : "N/A",
            end: batch.endDate
              ? new Date(batch.endDate).toLocaleDateString()
              : "N/A",
          },
          subject:
            batch.courses?.length > 0 && batch.courses[0].curriculums?.length > 0
              ? batch.courses[0].curriculums.map((c) => c.title).join(", ")
              : "No Curriculum",
          instructor: batch.batchManager?.name || "N/A",
          manager: batch.batchManager?.name || "N/A",
          progress: "0%",
          learners: 0,
          isDefault: batch.default || false,
          isOld: false,
          raw: batch,
        }));
        setBatches(transformed);
        setSharedBatches(transformed);
      } else {
        setBatches([]);
        setSharedBatches([]);
      }
    } catch {
      setError("Could not load batches. Please try again.");
      setBatches([]);
      setSharedBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!courseId) return;
    Promise.all([
      fetchBatches(),
      api
        .get("/api/courses")
        .then((res) => setCourse(res.data?.data?.content || []))
        .catch(() => setCourse([])),
      api
        .get("/api/admin/getadminsandinstructors")
        .then((res) => setInstructor(res.data || []))
        .catch(() => setInstructor([])),
      api
        .get("/api/course-bundles")
        .then((res) =>
          setBundleData(Array.isArray(res.data) ? res.data : res.data.data || [])
        )
        .catch(() => setBundleData([])),
    ]);
  }, [courseId]);

  const handleAddBatch = () => {
    setModalMode("create");
    setInitialData(null);
    setEditType(null);
    setIsModalOpen(true);
  };

  const handleEditBatch = (batchData) => {
    setModalMode("edit");
    const raw = batchData.raw ?? batchData;
    const normalized = {
      batchId: raw.batchId || raw.id,
      batchName: raw.batchName || raw.name,
      startDate: raw.startDate || null,
      endDate: raw.endDate || null,
      status: raw.status,
      accommodation: raw.accommodation,
      batchManagerId: raw.batchManager?.id || raw.batchManagerId || null,
      additionalBatchManager: raw.additionalBatchManager || null,
      courses: raw.courses || [],
      bundleId: raw.bundleId,
      default: raw.default || false,
    };
    setInitialData(normalized);
    setEditType(raw?.bundleId || raw?.bundle ? "bundle" : "course");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setInitialData(null);
    setEditType(null);
  };

  const handleCreateOrUpdateBatch = async (data, apiEndpoint = "/api/batches") => {
    try {
      if (modalMode === "edit") {
        await api.put(`/api/batches/${data.batchId}`, data);
      } else {
        await api.post(apiEndpoint, data);
      }
      await fetchBatches();
    } catch {
      toast.error("Failed to create/update batch. Please try again.");
    } finally {
      setIsModalOpen(false);
      setInitialData(null);
    }
  };

  const handleDelete = async (batchId) => {
    if (!confirm("Are you sure you want to delete this batch?")) return;
    try {
      await api.delete(`/api/batches/${batchId}`);
      toast.success("Batch deleted successfully.");
      setBatches((prev) => prev.filter((b) => b.id !== batchId));
    } catch {
      toast.error("Failed to delete batch. Please try again.");
    }
  };

  const handleMakeDefault = async (batchId) => {
    try {
      await api.put(`/api/courses/${courseId}/batches/${batchId}/set-default`);
      toast.success("Batch set as default.");
      setBatches((prev) => prev.map((b) => ({ ...b, isDefault: b.id === batchId })));
      fetchBatches();
    } catch {
      toast.error("Failed to set default batch. Please try again.");
    }
  };

  const handleRowClick = (batchId) => {
    router.push(`/admin/batches/${batchId}`);
  };

  const filteredBatches = batches.filter((batch) =>
    batch.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="sk w-10 h-10 rounded-xl" />
            <div className="space-y-1.5">
              <div className="sk h-5 w-40 rounded" />
              <div className="sk h-3 w-56 rounded" />
            </div>
          </div>
          <div className="sk h-9 w-28 rounded-xl" />
        </div>

        {/* Controls skeleton */}
        <div className="flex items-center gap-3">
          <div className="sk h-9 w-56 rounded-xl" />
          <div className="sk h-8 w-28 rounded-xl" />
          <div className="sk h-8 w-32 rounded-xl" />
        </div>

        {/* Table skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
            {[1, 3, 2, 2, 2, 1, 1].map((span, i) => (
              <div key={i} className={`col-span-${span}`}>
                <div className="sk h-2.5 w-14 rounded" />
              </div>
            ))}
          </div>
          {[...Array(5)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#1a2b4e]">Failed to load batches</p>
          <p className="text-xs text-gray-400 mt-0.5">{error}</p>
        </div>
        <button
          onClick={fetchBatches}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#ff5b00] rounded-xl hover:bg-[#e55200] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1a2b4e] leading-tight">Batches</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage delivery batches for this course</p>
        </div>

        <button
          onClick={handleAddBatch}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#ff5b00] text-white text-sm font-semibold rounded-xl hover:bg-[#e55200] active:scale-95 transition-all duration-150 shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Batch
        </button>
      </div>

      {/* Controls row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search batches…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-56 pl-9 pr-4 py-2 text-sm border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] placeholder-gray-400 text-[#1a2b4e] transition-colors"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
          <button
            onClick={() => setActiveFilter("active")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
              activeFilter === "active"
                ? "bg-white text-[#1a2b4e] shadow-sm"
                : "text-gray-500 hover:text-[#1a2b4e]"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveFilter("completed")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
              activeFilter === "completed"
                ? "bg-white text-[#1a2b4e] shadow-sm"
                : "text-gray-500 hover:text-[#1a2b4e]"
            }`}
          >
            Completed
          </button>
        </div>

        {/* Count badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ff5b00]/8 border border-[#ff5b00]/15">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff5b00]" />
          <span className="text-xs font-semibold text-[#ff5b00]">
            {filteredBatches.length} {filteredBatches.length === 1 ? "Batch" : "Batches"}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-[#ff5b00]/20 via-gray-200 to-transparent" />

      {/* Empty state */}
      {batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff5b00]/10 to-[#0c63e4]/8 border border-[#ff5b00]/15 flex items-center justify-center">
            <Calendar className="w-7 h-7 text-[#ff5b00]/60" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#1a2b4e]">No batches yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Create a batch to start delivering this course to learners.
            </p>
          </div>
          <button
            onClick={handleAddBatch}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#ff5b00] text-white text-sm font-semibold rounded-xl hover:bg-[#e55200] transition-all duration-150 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add First Batch
          </button>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#1a2b4e]">No results</p>
            <p className="text-xs text-gray-400 mt-0.5">
              No batches match &quot;{searchTerm}&quot;
            </p>
          </div>
        </div>
      ) : (
        /* Table */
        <div className="rounded-2xl border border-gray-200 bg-white overflow-visible shadow-sm">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 rounded-t-2xl">
            <div className="col-span-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">#</div>
            <div className="col-span-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Batch</div>
            <div className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Duration</div>
            <div className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Instructor</div>
            <div className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Manager</div>
            <div className="col-span-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Progress</div>
            <div className="col-span-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</div>
          </div>

          {/* Rows */}
          {filteredBatches.map((batch, index) => (
            <BatchRow
              key={batch.id}
              batch={batch}
              index={index}
              onView={handleRowClick}
              onEdit={handleEditBatch}
              onDelete={handleDelete}
              onMakeDefault={handleMakeDefault}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {isModalOpen && modalMode === "create" && (
        <AddBatchSidebar
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          initialData={initialData}
          onCreateOrUpdate={handleCreateOrUpdateBatch}
          courseData={course}
          instrData={instructor}
          forcedCourseId={courseId}
        />
      )}
      {isModalOpen && modalMode === "edit" && (
        <EditBatchSidebar
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          initialData={initialData}
          onUpdate={handleCreateOrUpdateBatch}
          courseData={course}
          instrData={instructor}
          bundleData={bundleData}
        />
      )}
    </div>
  );
}
