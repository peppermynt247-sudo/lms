"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Clock, Link, Hash, User, BookOpen, Layers } from "lucide-react";
import api from "@utils/api";
import { toast } from "react-toastify";
import { appendSeconds } from "./sessionUtils";

// ─── DropdownSelect ────────────────────────────────────────────────────────────
// Defined OUTSIDE SessionModal so it gets a stable reference and React never
// unmounts/remounts it on SessionModal re-renders.
const DropdownSelect = ({
  label,
  icon: Icon,
  displayValue,
  currentValue,
  open,
  setOpen,
  dropRef,
  items,
  idKey,
  labelKey,
  onSelect,
  placeholder,
  required,
  disabled,
}) => (
  <div>
    <label className={`block text-sm font-medium mb-1.5 ${disabled ? "text-gray-400" : "text-gray-700"}`}>
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="relative" ref={dropRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg text-sm transition-all duration-200 ${
          disabled 
            ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed" 
            : open
              ? "border-[#ff5e04] ring-2 ring-[#ff5e04]/20 bg-white text-gray-900"
              : "border-gray-300 hover:border-gray-400 bg-white text-gray-900"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={15} className={`${disabled ? "text-gray-300" : "text-gray-400"} shrink-0`} />
          <span className={`truncate ${displayValue && !disabled ? "text-gray-900" : "text-gray-400"}`}>
            {disabled ? placeholder : (displayValue || placeholder)}
          </span>
        </div>
        <ChevronDown
          size={15}
          className={`${disabled ? "text-gray-300" : "text-gray-400"} shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          <div
            className="px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 cursor-pointer italic"
            onClick={() => { onSelect(""); setOpen(false); }}
          >
            — None —
          </div>
          {items.map((item) => (
            <div
              key={item[idKey]}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-orange-50 hover:text-[#ff5e04] ${
                String(item[idKey]) === String(currentValue)
                  ? "bg-orange-50 text-[#ff5e04] font-medium"
                  : "text-gray-700"
              }`}
              onClick={() => { onSelect(String(item[idKey])); setOpen(false); }}
            >
              {item[labelKey]}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ─── SessionModal ──────────────────────────────────────────────────────────────
const SessionModal = ({ isOpen, onClose, mode, initialData, onSuccess }) => {
  const isEdit = mode === "edit";

  const [formData, setFormData] = useState({
    batchId: "",
    courseId: "",
    instructorId: "",
    title: "",
    description: "",
    zoomJoinUrl: "",
    zoomMeetingId: "",
    scheduledAt: "",
    durationMinutes: "",
  });

  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchingBatches, setFetchingBatches] = useState(false);

  // Track if reference data has already been fetched — prevents re-fetching on
  // every modal open. Data is stable enough to cache for the session lifetime.
  // Trade-off: new batches/courses/instructors added after first open will not
  // appear until the page is refreshed. Acceptable for admin use.
  const dataFetched = useRef(false);

  const [batchOpen, setBatchOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [instructorOpen, setInstructorOpen] = useState(false);

  const batchRef = useRef(null);
  const courseRef = useRef(null);
  const instructorRef = useRef(null);

  // ── Fetch reference data (once) ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || dataFetched.current) return;
    dataFetched.current = true;
    setFetching(true);
    Promise.all([
      // Only fetch courses and instructors globally. Batches are fetched per course.
      api.get("/api/courses", { params: { page: 0, size: 100 } }).then((r) =>
        setCourses(r.data?.data?.content || [])
      ),
      api.get("/api/admin/getadminsandinstructors").then((r) =>
        setInstructors(r.data || [])
      ),
    ])
      .catch(() => toast.error("Failed to load form data"))
      .finally(() => setFetching(false));
  }, [isOpen]);

  // ── Fetch Batches for Course ────────────────────────────────────────────────
  const fetchBatchesForCourse = async (courseId) => {
    if (!courseId) {
      setBatches([]);
      return;
    }

    try {
      setFetchingBatches(true);
      const res = await api.get(`/api/courses/${courseId}/batches`);
      const batchesData = res.data?.data || res.data || [];
      setBatches(batchesData);
      
      // Auto-select first batch if not in edit mode
      if (!isEdit && batchesData.length > 0) {
        setFormData(prev => ({ ...prev, batchId: String(batchesData[0].batchId) }));
      }
    } catch (err) {
      console.error("Failed to fetch batches", err);
      toast.error("Failed to load batches for this course");
      setBatches([]);
    } finally {
      setFetchingBatches(false);
    }
  };

  // Fetch batches if editing and courseId is available on modal open
  const editBatchesFetched = useRef(false);
  useEffect(() => {
    if (isOpen && isEdit && formData.courseId && !editBatchesFetched.current) {
      fetchBatchesForCourse(formData.courseId);
      editBatchesFetched.current = true;
    }
    if (!isOpen) editBatchesFetched.current = false;
  }, [isOpen, isEdit, formData.courseId]);


  // ── Populate form on open ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    // Always reset dropdown open states so they don't bleed across modal opens
    setBatchOpen(false);
    setCourseOpen(false);
    setInstructorOpen(false);

    if (isEdit && initialData) {
      setFormData({
        batchId:        String(initialData.batchId ?? initialData.batch?.batchId ?? ""),
        courseId:       String(initialData.courseId ?? initialData.course?.courseId ?? ""),
        instructorId:   String(initialData.instructorId ?? initialData.instructor?.id ?? ""),
        title:          initialData.title || "",
        description:    initialData.description || "",
        zoomJoinUrl:    initialData.zoomJoinUrl || "",
        zoomMeetingId:  initialData.zoomMeetingId || "",
        scheduledAt:    initialData.scheduledAt
          ? initialData.scheduledAt.slice(0, 16)
          : "",
        durationMinutes: initialData.durationMinutes || "",
      });
    } else {
      setFormData({
        batchId: "", courseId: "", instructorId: "",
        title: "", description: "", zoomJoinUrl: "",
        zoomMeetingId: "", scheduledAt: "", durationMinutes: "",
      });
    }
  }, [isOpen, isEdit, initialData]);

  // ── Close dropdowns on outside click ───────────────────────────────────────
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (batchRef.current && !batchRef.current.contains(e.target)) setBatchOpen(false);
      if (courseRef.current && !courseRef.current.contains(e.target)) setCourseOpen(false);
      if (instructorRef.current && !instructorRef.current.contains(e.target)) setInstructorOpen(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // ── Escape key closes modal ─────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const set = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.batchId) return toast.error("Batch is required");
    if (!formData.instructorId) return toast.error("Instructor is required");
    if (!formData.title.trim()) return toast.error("Session title is required");
    if (!formData.scheduledAt) return toast.error("Scheduled date & time is required");
    if (!formData.zoomJoinUrl.trim()) return toast.error("Join URL is required");


    const payload = {
      batchId:      Number(formData.batchId),
      title:        formData.title.trim(),
      scheduledAt:  appendSeconds(formData.scheduledAt),
      ...(formData.courseId     && { courseId:        Number(formData.courseId) }),
      ...(formData.instructorId && { instructorId:    Number(formData.instructorId) }),
      ...(formData.description  && { description:     formData.description.trim() }),
      ...(formData.zoomJoinUrl  && { zoomJoinUrl:     formData.zoomJoinUrl.trim() }),
      ...(formData.zoomMeetingId && { zoomMeetingId:  formData.zoomMeetingId.trim() }),
      ...(formData.durationMinutes && { durationMinutes: Number(formData.durationMinutes) }),
    };

    try {
      setLoading(true);
      const sessionId = initialData?.id ?? initialData?.sessionId;
      if (isEdit) {
        await api.put(`/api/sessions/${sessionId}`, payload);
        toast.success("Session updated successfully");
      } else {
        await api.post("/api/sessions", payload);
        toast.success("Session created successfully");
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(`Error ${isEdit ? "updating" : "creating"} session:`, err);
      const errorData = err?.response?.data;
      
      // Helper to strip "fieldName: " prefix if present (e.g., "scheduledAt: Session must be...")
      const cleanMsg = (m) => (typeof m === 'string' && m.includes(': ')) ? m.split(': ')[1] : m;

      const errorMessage = 
        (errorData?.messages && Array.isArray(errorData.messages) 
          ? errorData.messages.map(cleanMsg).join(", ") 
          : cleanMsg(errorData?.messages)) ||
        cleanMsg(errorData?.message) || 
        (errorData?.errors && typeof errorData.errors === 'object' 
          ? Object.values(errorData.errors).flat().map(cleanMsg).join(", ") 
          : cleanMsg(errorData?.errors)) ||
        errorData?.error || 
        `Failed to ${isEdit ? "update" : "create"} session. Please try again.`;


      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }

  };

  if (!isOpen) return null;

  const selectedBatch      = batches.find((b) => String(b.batchId) === formData.batchId);
  const selectedCourse     = courses.find((c) => String(c.courseId) === formData.courseId);
  const selectedInstructor = instructors.find((i) => String(i.id) === formData.instructorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#1a2b4e] to-[#243659] shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {isEdit ? "Edit Session" : "Create New Session"}
            </h2>
            <p className="text-xs text-gray-300 mt-0.5">
              {isEdit
                ? "Update the session details below"
                : "Fill in the details to schedule a new live session"}
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
        <form id="session-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#ff5e04] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Session Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={set("title")}
                  placeholder="e.g. Java Spring Boot — Live Class 1"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5e04]/20 focus:border-[#ff5e04] transition-all"
                />
              </div>

              {/* Course + Batch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DropdownSelect
                  label="Course"
                  icon={BookOpen}
                  displayValue={selectedCourse?.title || ""}
                  currentValue={formData.courseId}
                  open={courseOpen}
                  setOpen={setCourseOpen}
                  dropRef={courseRef}
                  items={courses}
                  idKey="courseId"
                  labelKey="title"
                  onSelect={(v) => {
                    setFormData((p) => ({ ...p, courseId: v, batchId: "" }));
                    if (v) fetchBatchesForCourse(v);
                  }}
                  placeholder="Select course"
                  required
                />
                <DropdownSelect
                  label="Batch"
                  icon={Layers}
                  displayValue={fetchingBatches ? "Loading..." : (selectedBatch?.batchName || "")}
                  currentValue={formData.batchId}
                  open={batchOpen}
                  setOpen={setBatchOpen}
                  dropRef={batchRef}
                  items={batches}
                  idKey="batchId"
                  labelKey="batchName"
                  onSelect={(v) => setFormData((p) => ({ ...p, batchId: v }))}
                  placeholder={formData.courseId ? "Select batch" : "Select a course first"}
                  required
                  disabled={!formData.courseId || fetchingBatches}
                />
              </div>

              {/* Instructor */}
              <DropdownSelect
                label="Instructor"
                icon={User}
                displayValue={selectedInstructor?.name || ""}
                currentValue={formData.instructorId}
                open={instructorOpen}
                setOpen={setInstructorOpen}
                dropRef={instructorRef}
                items={instructors}
                idKey="id"
                labelKey="name"
                onSelect={(v) => setFormData((p) => ({ ...p, instructorId: v }))}
                placeholder="Select instructor"
                required
              />

              {/* Scheduled At + Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Scheduled Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={set("scheduledAt")}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5e04]/20 focus:border-[#ff5e04] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Duration (minutes)
                  </label>
                  <div className="relative">
                    <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="number"
                      min="15"
                      value={formData.durationMinutes}
                      onChange={set("durationMinutes")}
                      placeholder="e.g. 90"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5e04]/20 focus:border-[#ff5e04] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={set("description")}
                  rows={3}
                  placeholder="Brief overview of what will be covered in this session..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5e04]/20 focus:border-[#ff5e04] transition-all resize-none"
                />
              </div>

              {/* Zoom Details */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  Zoom Details
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Join URL <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Link size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="url"
                      value={formData.zoomJoinUrl}
                      onChange={set("zoomJoinUrl")}
                      placeholder="https://zoom.us/j/..."
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5e04]/20 focus:border-[#ff5e04] bg-white transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Meeting ID
                  </label>
                  <div className="relative">
                    <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={formData.zoomMeetingId}
                      onChange={set("zoomMeetingId")}
                      placeholder="e.g. 123456789"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5e04]/20 focus:border-[#ff5e04] bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
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
            form="session-form"
            disabled={loading || fetching}
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#ff5e04] hover:bg-[#e55003] rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isEdit ? "Update Session" : "Create Session"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionModal;
