"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronDown,
  Calendar,
  BookOpen,
  Layers,
  Check,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import api from "@utils/api";
import { toast } from "react-toastify";

// ── Shared helpers ────────────────────────────────────────────────────────────
function parseDate(val) {
  if (!val) return "";
  if (typeof val === "string") return val.includes("T") ? val.split("T")[0] : val;
  if (val instanceof Date) return val.toISOString().split("T")[0];
  return "";
}

function SelectField({ label, required, value, placeholder, open, onToggle, dropdownRef, disabled, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-[#ff5b00]">*</span>}
      </label>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={disabled ? undefined : onToggle}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm border rounded-xl transition-colors bg-white text-left ${
            disabled
              ? "border-gray-100 bg-gray-50 cursor-default text-gray-400"
              : "border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00]"
          }`}
        >
          <span className={value ? "text-[#1a2b4e] font-medium" : "text-gray-400"}>{value || placeholder}</span>
          {!disabled && <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />}
        </button>
        {open && !disabled && (
          <div
            className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-gray-100 z-10 overflow-hidden max-h-52 overflow-y-auto"
            style={{ boxShadow: "0 8px 32px -4px rgba(26,43,78,0.18)" }}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Loading skeleton inside panel ─────────────────────────────────────────────
function PanelSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
      <div className="space-y-1.5">
        <div className="sk h-2.5 w-20 rounded" />
        <div className="sk h-10 w-full rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <div className="sk h-2.5 w-16 rounded" />
        <div className="sk h-10 w-full rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <div className="sk h-2.5 w-24 rounded" />
        <div className="sk h-10 w-full rounded-xl" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="sk h-2.5 w-20 rounded" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="sk h-10 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <div className="sk h-2.5 w-16 rounded" />
          <div className="sk h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <div className="sk h-2.5 w-14 rounded" />
          <div className="sk h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const EditBatchSidebar = ({
  isOpen,
  onClose,
  initialData,
  onUpdate,
  courseData,
  instrData,
  bundleData,
}) => {
  const isBundleBatch = !!(initialData?.bundleId || initialData?.bundle);

  const [loading, setLoading] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Course batch curriculum
  const [allCurriculums, setAllCurriculums] = useState([]);
  const [selectedCurriculumIds, setSelectedCurriculumIds] = useState([]);

  // Bundle batch state
  const [bundleCourses, setBundleCourses] = useState([]);
  const [selectedBundleCourses, setSelectedBundleCourses] = useState([]);
  const [selectedCurriculumIdsByCourse, setSelectedCurriculumIdsByCourse] = useState({});
  const [coursePaymentPlans, setCoursePaymentPlans] = useState({});
  const [validatingCoursePlans, setValidatingCoursePlans] = useState(false);

  const [instructorDropdownOpen, setInstructorDropdownOpen] = useState(false);
  const [bundleCoursesDropdownOpen, setBundleCoursesDropdownOpen] = useState(false);

  const instructorDropdownRef = useRef(null);
  const bundleCoursesDropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (instructorDropdownRef.current && !instructorDropdownRef.current.contains(e.target))
        setInstructorDropdownOpen(false);
      if (bundleCoursesDropdownRef.current && !bundleCoursesDropdownRef.current.contains(e.target))
        setBundleCoursesDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (isOpen && initialData?.batchId) {
      fetchCompleteBatchData(initialData.batchId);
    }
  }, [isOpen, initialData?.batchId]);

  const fetchCompleteBatchData = async (batchId) => {
    setLoading(true);
    try {
      let instructorsToUse = instrData;
      if (!instrData || instrData.length === 0) {
        const res = await api.get("/api/admin/getadminsandinstructors");
        instructorsToUse = res.data || [];
      }

      const response = await api.get(`/api/batches/${batchId}`);
      const data = response.data?.data || response.data;
      if (!data) return;

      setBatchName(data.batchName || "");
      setStartDate(parseDate(data.startDate));
      setEndDate(parseDate(data.endDate));

      // Instructor
      const mgr = data.batchManager;
      const instrObj = mgr
        ? instructorsToUse.find((i) => i.id === mgr.id || String(i.id) === String(mgr.id) || i.name === mgr.name) || null
        : null;
      setSelectedInstructor(instrObj);

      if (isBundleBatch) {
        // Bundle batch
        const bundleId = data.bundle?.bundleId || data.bundleId;
        const bundleObj = bundleData?.find((b) => b.bundleId === bundleId) || null;
        setSelectedBundle(bundleObj);

        const courseIds = (data.courses || []).map((c) => c.courseId);
        setSelectedBundleCourses(courseIds);

        const currByCourse = {};
        (data.courses || []).forEach((c) => {
          currByCourse[c.courseId] = (c.curriculums || []).map((cu) => cu.curriculumId);
        });
        setSelectedCurriculumIdsByCourse(currByCourse);

        if (bundleId) await fetchBundleCourses(bundleId);
      } else {
        // Course batch
        const courseRef = data.courses?.[0];
        const courseObj = courseData.find((c) => c.courseId === courseRef?.courseId) || null;
        setSelectedCourse(courseObj);

        if (courseObj?.courseId) {
          try {
            const res = await api.get(`/api/courses/${courseObj.courseId}`);
            const details = res.data?.data || res.data;
            setAllCurriculums(details?.curriculums || []);
          } catch {
            setAllCurriculums([]);
          }
        }

        const selectedIds = courseRef?.curriculumIds || courseRef?.curriculums?.map((c) => c.curriculumId) || [];
        setSelectedCurriculumIds(selectedIds);
      }
    } catch {
      toast.error("Failed to fetch batch data.");
      // Fallback to initialData
      if (initialData) {
        setBatchName(initialData.batchName || "");
        setStartDate(parseDate(initialData.startDate));
        setEndDate(parseDate(initialData.endDate));
        const instrObj = instrData?.find((i) => i.id === initialData.batchManagerId || String(i.id) === String(initialData.batchManagerId)) || null;
        setSelectedInstructor(instrObj);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBundleCourses = async (bundleId) => {
    try {
      const res = await api.get(`/api/courses/bundle/${bundleId}`);
      const courses = res.data?.data || res.data || [];
      setBundleCourses(courses);
      await validateBundleCoursePaymentPlans(courses);
    } catch {
      setBundleCourses([]);
    }
  };

  const validateBundleCoursePaymentPlans = async (courses) => {
    setValidatingCoursePlans(true);
    const validation = {};
    try {
      await Promise.all(
        courses.map(async (course) => {
          try {
            const res = await api.get(`/api/courses/${course.courseId}/pricing-details`);
            const plans = res?.data?.data?.plans || [];
            validation[course.courseId] = { hasPlan: plans.length > 0, error: plans.length === 0 ? "No payment plan." : "" };
          } catch {
            validation[course.courseId] = { hasPlan: false, error: "Could not verify." };
          }
        })
      );
      setCoursePaymentPlans(validation);
    } finally {
      setValidatingCoursePlans(false);
    }
  };

  const handleCurriculumToggle = (id) => {
    setSelectedCurriculumIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleBundleCourseToggle = (courseId) => {
    setSelectedBundleCourses((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
    setSelectedCurriculumIdsByCourse((prev) => {
      const next = { ...prev };
      if (next[courseId]) delete next[courseId];
      return next;
    });
  };

  const handleBundleCurriculumToggle = (courseId, curriculumId) => {
    setSelectedCurriculumIdsByCourse((prev) => {
      const arr = prev[courseId] || [];
      return {
        ...prev,
        [courseId]: arr.includes(curriculumId) ? arr.filter((id) => id !== curriculumId) : [...arr, curriculumId],
      };
    });
  };

  const validateBundleSelection = () => {
    if (!selectedBundle || selectedBundleCourses.length === 0) return { isValid: true, errors: [] };
    const errors = [];
    selectedBundleCourses.forEach((courseId) => {
      const v = coursePaymentPlans[courseId];
      if (!v?.hasPlan) {
        const c = bundleCourses.find((c) => c.courseId === courseId);
        errors.push(`${c?.title ?? `Course ${courseId}`}: ${v?.error ?? "no payment plan"}`);
      }
    });
    return { isValid: errors.length === 0, errors };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!batchName || !selectedInstructor) {
      toast.warn("Please fill all required fields.");
      return;
    }

    if (isBundleBatch) {
      if (!selectedBundle || selectedBundleCourses.length === 0) {
        toast.warn("Please select at least one course in the bundle.");
        return;
      }
      const { isValid, errors } = validateBundleSelection();
      if (!isValid) { toast.warn(`Courses missing payment plans:\n${errors.join("\n")}`); return; }

      const courses = selectedBundleCourses.map((courseId) => ({
        courseId,
        curriculumIds: selectedCurriculumIdsByCourse[courseId] || [],
      }));

      onUpdate({
        batchId: initialData?.batchId,
        batchName,
        startDate: startDate || null,
        endDate: endDate || null,
        status: initialData?.status || "ACTIVE",
        accommodation: initialData?.accommodation || null,
        batchManagerId: selectedInstructor.id,
        additionalBatchManager: initialData?.additionalBatchManager || null,
        courses,
        bundleId: selectedBundle.bundleId,
        default: initialData?.default || false,
      });
    } else {
      if (!selectedCourse) { toast.warn("Course is required."); return; }

      onUpdate({
        batchId: initialData?.batchId,
        batchName,
        startDate: startDate || null,
        endDate: endDate || null,
        status: initialData?.status || "ACTIVE",
        accommodation: initialData?.accommodation || null,
        batchManagerId: selectedInstructor.id,
        additionalBatchManager: initialData?.additionalBatchManager || null,
        courses: [{ courseId: selectedCourse.courseId, courseName: selectedCourse.title, curriculumIds: selectedCurriculumIds, primary: true }],
        bundleId: undefined,
        default: initialData?.default || false,
      });
    }

    onClose();
  };

  const isFormValid = isBundleBatch
    ? batchName && selectedBundle && selectedInstructor && selectedBundleCourses.length > 0
    : batchName && selectedCourse && selectedInstructor;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Lock body scroll while sidebar is open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-[#1a2b4e]/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-[460px] bg-white flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0c63e4]/15 to-[#ff5b00]/10 flex items-center justify-center border border-[#0c63e4]/15 flex-shrink-0">
            <Calendar style={{ width: "1.125rem", height: "1.125rem" }} className="text-[#0c63e4]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-[#1a2b4e] leading-tight">Edit Batch</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {isBundleBatch ? "Update bundle batch details" : "Update course batch details"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-[#1a2b4e] hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {loading ? (
            <PanelSkeleton />
          ) : (
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

              {/* Batch Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Batch Name <span className="text-[#ff5b00]">*</span>
                </label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g. Batch 01 — Jan 2025"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors placeholder-gray-400"
                />
              </div>

              {/* Section divider */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {isBundleBatch ? "Bundle" : "Course"}
                </span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>

              {/* Course or Bundle (read-only) */}
              {isBundleBatch ? (
                <SelectField
                  label="Bundle"
                  value={selectedBundle?.title}
                  placeholder="Loading…"
                  disabled
                  open={false}
                  onToggle={() => {}}
                />
              ) : (
                <SelectField
                  label="Course"
                  value={selectedCourse?.title}
                  placeholder="Loading…"
                  disabled
                  open={false}
                  onToggle={() => {}}
                />
              )}

              {/* Bundle course multi-select */}
              {isBundleBatch && bundleCourses.length > 0 && (
                <div ref={bundleCoursesDropdownRef} className="relative">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Courses in Bundle <span className="text-[#ff5b00]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setBundleCoursesDropdownOpen((p) => !p)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl hover:border-[#ff5b00]/50 transition-colors bg-white text-left"
                  >
                    <span className={selectedBundleCourses.length ? "text-[#1a2b4e] font-medium" : "text-gray-400"}>
                      {selectedBundleCourses.length
                        ? `${selectedBundleCourses.length} course${selectedBundleCourses.length > 1 ? "s" : ""} selected`
                        : "Select courses"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${bundleCoursesDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {bundleCoursesDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-gray-100 z-10 overflow-hidden max-h-52 overflow-y-auto"
                      style={{ boxShadow: "0 8px 32px -4px rgba(26,43,78,0.18)" }}>
                      {validatingCoursePlans && (
                        <div className="flex items-center gap-2 px-4 py-2 text-xs text-[#0c63e4] bg-[#0c63e4]/5 border-b border-gray-100">
                          <Loader2 className="w-3 h-3 animate-spin" /> Validating payment plans…
                        </div>
                      )}
                      {bundleCourses.map((course) => {
                        const v = coursePaymentPlans[course.courseId];
                        const selected = selectedBundleCourses.includes(course.courseId);
                        return (
                          <button key={course.courseId} type="button"
                            onClick={() => handleBundleCourseToggle(course.courseId)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selected ? "bg-[#ff5b00] border-[#ff5b00]" : "border-gray-300"}`}>
                              {selected && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-[#1a2b4e] truncate block">{course.title}</span>
                              {v && !v.hasPlan && <span className="text-[10px] text-amber-600">No payment plan</span>}
                            </div>
                            {v?.hasPlan && <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Curriculum — course batch */}
              {!isBundleBatch && allCurriculums.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gray-100" />
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Curriculums</span>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                  <div className="space-y-2">
                    {allCurriculums.map((c) => (
                      <label key={c.curriculumId}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-gray-100 hover:border-[#ff5b00]/30 hover:bg-[#ff5b00]/[0.02] cursor-pointer transition-colors">
                        <div onClick={() => handleCurriculumToggle(c.curriculumId)}
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${selectedCurriculumIds.includes(c.curriculumId) ? "bg-[#ff5b00] border-[#ff5b00]" : "border-gray-300"}`}>
                          {selectedCurriculumIds.includes(c.curriculumId) && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="text-sm text-[#1a2b4e] truncate">{c.title}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {/* Curriculum — bundle batch (per course) */}
              {isBundleBatch && selectedBundleCourses.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gray-100" />
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Curriculums</span>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                  <div className="space-y-4">
                    {bundleCourses.filter((c) => selectedBundleCourses.includes(c.courseId)).map((course) =>
                      course.curriculums?.length > 0 && (
                        <div key={course.courseId}>
                          <p className="text-xs font-semibold text-[#1a2b4e] mb-1.5 flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3 text-[#0c63e4]" />{course.title}
                          </p>
                          <div className="space-y-1.5 ml-4">
                            {course.curriculums.map((cu) => {
                              const checked = (selectedCurriculumIdsByCourse[course.courseId] || []).includes(cu.curriculumId);
                              return (
                                <label key={cu.curriculumId}
                                  className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100 hover:border-[#ff5b00]/30 cursor-pointer transition-colors">
                                  <div onClick={() => handleBundleCurriculumToggle(course.courseId, cu.curriculumId)}
                                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${checked ? "bg-[#ff5b00] border-[#ff5b00]" : "border-gray-300"}`}>
                                    {checked && <Check className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                  <span className="text-xs text-[#1a2b4e] truncate">{cu.title}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </>
              )}

              {/* Schedule & Instructor */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Schedule & Instructor</span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>

              <SelectField
                label="Instructor / Manager"
                required
                value={selectedInstructor ? `${selectedInstructor.name} (${selectedInstructor.role})` : null}
                placeholder="Select an instructor"
                open={instructorDropdownOpen}
                onToggle={() => setInstructorDropdownOpen((p) => !p)}
                dropdownRef={instructorDropdownRef}
              >
                {instrData.map((instr) => (
                  <button key={instr.id} type="button"
                    onClick={() => { setSelectedInstructor(instr); setInstructorDropdownOpen(false); }}
                    className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-[#1a2b4e] hover:bg-[#ff5b00]/5 transition-colors">
                    <div className="min-w-0">
                      <span className="block font-medium truncate">{instr.name}</span>
                      <span className="text-[10px] text-gray-400">{instr.role}</span>
                    </div>
                    {selectedInstructor?.id === instr.id && <Check className="w-3.5 h-3.5 text-[#ff5b00] flex-shrink-0" />}
                  </button>
                ))}
              </SelectField>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors" />
                </div>
              </div>

            </div>
          )}

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-500 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!isFormValid || loading}
              className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-150 shadow-sm ${isFormValid && !loading ? "text-white bg-[#ff5b00] hover:bg-[#e55200]" : "text-gray-400 bg-gray-100 cursor-not-allowed"}`}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditBatchSidebar;
