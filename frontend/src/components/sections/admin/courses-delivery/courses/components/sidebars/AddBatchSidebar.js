"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronDown,
  Calendar,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Check,
} from "lucide-react";
import api from "@utils/api";
import { toast } from "react-toastify";

// ── Reusable select dropdown ──────────────────────────────────────────────────
function SelectField({ label, required, value, placeholder, open, onToggle, dropdownRef, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-[#ff5b00]">*</span>}
      </label>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors bg-white text-left"
        >
          <span className={value ? "text-[#1a2b4e] font-medium" : "text-gray-400"}>
            {value || placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
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

function PricingAlert({ error }) {
  if (!error) return null;
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-amber-700 leading-relaxed">{error}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const AddBatchSidebar = ({
  isOpen,
  onClose,
  mode,
  initialData,
  onCreateOrUpdate,
  courseData,
  forcedCourseId,
  instrData,
}) => {
  const [batchName, setBatchName] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [selectedCurriculumIds, setSelectedCurriculumIds] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [bundleDropdownOpen, setBundleDropdownOpen] = useState(false);
  const [instructorDropdownOpen, setInstructorDropdownOpen] = useState(false);
  const [bundleCoursesDropdownOpen, setBundleCoursesDropdownOpen] = useState(false);

  const [courseHasValidPlan, setCourseHasValidPlan] = useState(true);
  const [pricingError, setPricingError] = useState("");
  const [bundles, setBundles] = useState([]);
  const [bundleCourses, setBundleCourses] = useState([]);
  const [loadingBundles, setLoadingBundles] = useState(false);
  const [loadingBundleCourses, setLoadingBundleCourses] = useState(false);
  const [selectedBundleCourses, setSelectedBundleCourses] = useState([]);
  const [bundleHasValidPlan, setBundleHasValidPlan] = useState(true);
  const [bundlePricingError, setBundlePricingError] = useState("");
  const [coursePaymentPlans, setCoursePaymentPlans] = useState({});
  const [validatingCoursePlans, setValidatingCoursePlans] = useState(false);

  const courseDropdownRef = useRef(null);
  const bundleDropdownRef = useRef(null);
  const instructorDropdownRef = useRef(null);
  const bundleCoursesDropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(e.target))
        setCourseDropdownOpen(false);
      if (bundleDropdownRef.current && !bundleDropdownRef.current.contains(e.target))
        setBundleDropdownOpen(false);
      if (instructorDropdownRef.current && !instructorDropdownRef.current.contains(e.target))
        setInstructorDropdownOpen(false);
      if (bundleCoursesDropdownRef.current && !bundleCoursesDropdownRef.current.contains(e.target))
        setBundleCoursesDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (isOpen && bundles.length === 0) fetchBundles();
  }, [isOpen]);

  useEffect(() => {
    if (initialData && mode === "edit") {
      setBatchName(initialData.batchName || "");
      setStartDate(initialData.startDate?.split("T")[0] || "");
      setEndDate(initialData.endDate?.split("T")[0] || "");
      const course = initialData.courses?.[0];
      const courseObj = courseData.find((c) => c.courseId === course?.courseId);
      setSelectedCourse(courseObj || null);
      setSelectedCurriculumIds(course?.curriculums?.map((c) => c.curriculumId) || []);
      if (courseObj?.courseId) fetchCoursePricingDetails(courseObj.courseId);
    } else {
      setBatchName("");
      setStartDate("");
      setEndDate("");
      setSelectedCourse(null);
      setSelectedBundle(null);
      setSelectedInstructor(null);
      setSelectedCurriculumIds([]);
      setPricingError("");
      setCourseHasValidPlan(true);
      setBundleCourses([]);
      setSelectedBundleCourses([]);
      setCoursePaymentPlans({});
    }

    if (forcedCourseId) {
      const courseObj = courseData.find((c) => c.courseId === parseInt(forcedCourseId));
      if (courseObj) {
        setSelectedCourse(courseObj);
        fetchCoursePricingDetails(courseObj.courseId);
      }
    }
  }, [initialData, courseData, instrData, mode, forcedCourseId, isOpen]);

  useEffect(() => {
    if (selectedBundle?.bundleId) fetchBundlePricingDetails(selectedBundle.bundleId);
  }, [selectedBundle]);

  const fetchBundles = async () => {
    setLoadingBundles(true);
    try {
      const res = await api.get("/api/course-bundles");
      setBundles(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch {
      toast.error("Failed to fetch bundles.");
    } finally {
      setLoadingBundles(false);
    }
  };

  const fetchBundleCourses = async (bundleId) => {
    setLoadingBundleCourses(true);
    try {
      const res = await api.get(`/api/courses/bundle/${bundleId}`);
      const courses = res.data?.data || res.data || [];
      setBundleCourses(courses);
      await validateBundleCoursePaymentPlans(courses);
    } catch {
      toast.error("Failed to fetch bundle courses.");
      setBundleCourses([]);
    } finally {
      setLoadingBundleCourses(false);
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
            validation[course.courseId] = { hasPlan: plans.length > 0, error: plans.length === 0 ? "No payment plan set." : "" };
          } catch {
            validation[course.courseId] = { hasPlan: false, error: "Could not verify payment plan." };
          }
        })
      );
      setCoursePaymentPlans(validation);
    } finally {
      setValidatingCoursePlans(false);
    }
  };

  const fetchBundlePricingDetails = async (bundleId) => {
    try {
      const res = await api.get(`/api/course-bundles/${bundleId}/pricing-details`);
      const plans = res?.data?.data?.plans || [];
      setBundleHasValidPlan(plans.length > 0);
      setBundlePricingError(plans.length === 0 ? "This bundle does not have a valid payment plan. Please set one before creating a batch." : "");
    } catch {
      setBundleHasValidPlan(false);
      setBundlePricingError("Failed to verify payment details for this bundle.");
    }
  };

  const fetchCoursePricingDetails = async (courseId) => {
    try {
      const res = await api.get(`/api/courses/${courseId}/pricing-details`);
      const plans = res?.data?.data?.plans || [];
      setCourseHasValidPlan(plans.length > 0);
      setPricingError(plans.length === 0 ? "This course does not have a valid pricing plan. Please set one before creating a batch." : "");
    } catch {
      setCourseHasValidPlan(false);
      setPricingError("Failed to verify pricing details for this course.");
    }
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setSelectedBundle(null);
    setSelectedCurriculumIds([]);
    setCourseDropdownOpen(false);
    setBundleCourses([]);
    setSelectedBundleCourses([]);
    setCoursePaymentPlans({});
    fetchCoursePricingDetails(course.courseId);
  };

  const handleBundleSelect = async (bundle) => {
    setSelectedBundle(bundle);
    setSelectedCourse(null);
    setSelectedCurriculumIds([]);
    setBundleDropdownOpen(false);
    await fetchBundleCourses(bundle.bundleId);
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
  };

  const validateSelectedBundleCourses = () => {
    if (!selectedBundle || selectedBundleCourses.length === 0) return { isValid: true, errors: [] };
    const errors = [];
    selectedBundleCourses.forEach((courseId) => {
      const v = coursePaymentPlans[courseId];
      if (!v?.hasPlan) {
        const c = bundleCourses.find((c) => c.courseId === courseId);
        errors.push(`${c?.title ?? `Course ${courseId}`}: ${v?.error ?? "Payment plan validation failed"}`);
      }
    });
    return { isValid: errors.length === 0, errors };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasBundle = !!selectedBundle;
    const hasCourse = !!selectedCourse;
    if (!batchName || (!hasBundle && !hasCourse) || !selectedInstructor) {
      toast.warn("Please fill all required fields.");
      return;
    }
    if (hasCourse && !courseHasValidPlan) { toast.warn(pricingError); return; }
    if (hasBundle && !bundleHasValidPlan) { toast.warn(bundlePricingError); return; }
    if (hasBundle && selectedBundleCourses.length > 0) {
      const { isValid, errors } = validateSelectedBundleCourses();
      if (!isValid) { toast.warn(`Courses missing payment plans:\n${errors.join("\n")}`); return; }
    }
    if (hasBundle && hasCourse) { toast.warn("Select either a bundle OR a course, not both."); return; }

    const coursesPayload = hasCourse
      ? [{ courseId: selectedCourse.courseId, curriculumIds: selectedCurriculumIds }]
      : hasBundle
      ? selectedBundleCourses.map((courseId) => ({
          courseId,
          curriculumIds: bundleCourses
            .find((c) => c.courseId === courseId)
            ?.curriculums?.filter((cu) => selectedCurriculumIds.includes(cu.curriculumId))
            .map((cu) => cu.curriculumId) || [],
        }))
      : undefined;

    const batchData = mode === "edit"
      ? { batchId: initialData?.batchId, batchName, startDate: startDate || null, endDate: endDate || null, status: "ACTIVE", accommodation: null, batchManagerId: selectedInstructor.id, additionalBatchManager: null, courses: coursesPayload, bundleId: selectedBundle?.bundleId, default: false }
      : { batchName, startDate: startDate || null, endDate: endDate || null, batchManagerId: selectedInstructor.id, courses: coursesPayload, bundleId: selectedBundle?.bundleId, default: false };

    onCreateOrUpdate(batchData);
    onClose();
  };

  const isFormValid =
    batchName &&
    (selectedCourse || selectedBundle) &&
    selectedInstructor &&
    (selectedCourse ? courseHasValidPlan : true) &&
    (selectedBundle ? bundleHasValidPlan : true);

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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff5b00]/15 to-[#0c63e4]/10 flex items-center justify-center border border-[#ff5b00]/15 flex-shrink-0">
            <Calendar style={{ width: "1.125rem", height: "1.125rem" }} className="text-[#ff5b00]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-[#1a2b4e] leading-tight">
              {mode === "edit" ? "Edit Batch" : "Create Batch"}
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {mode === "edit" ? "Update batch details" : "Set up a new delivery batch for this course"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-[#1a2b4e] hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            {/* Batch Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Batch Name <span className="text-[#ff5b00]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Batch 01 — Jan 2025"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors placeholder-gray-400"
              />
            </div>

            {/* Section label */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Course / Bundle</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            {/* Bundle selector */}
            <SelectField
              label="Bundle"
              value={selectedBundle?.title}
              placeholder={loadingBundles ? "Loading bundles…" : "Select a bundle (optional)"}
              open={bundleDropdownOpen}
              onToggle={() => setBundleDropdownOpen((p) => !p)}
              dropdownRef={bundleDropdownRef}
            >
              {bundles.length === 0 ? (
                <div className="px-4 py-3 text-xs text-gray-400">No bundles available</div>
              ) : (
                <>
                  {selectedBundle && (
                    <button
                      type="button"
                      onClick={() => { setSelectedBundle(null); setBundleCourses([]); setSelectedBundleCourses([]); setBundleDropdownOpen(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-xs font-medium text-gray-400 hover:bg-gray-50 border-b border-gray-100"
                    >
                      <X className="w-3 h-3" /> Clear selection
                    </button>
                  )}
                  {bundles.map((bundle) => (
                    <button
                      key={bundle.bundleId}
                      type="button"
                      onClick={() => handleBundleSelect(bundle)}
                      className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-[#1a2b4e] hover:bg-[#ff5b00]/5 transition-colors"
                    >
                      <span>{bundle.title}</span>
                      {selectedBundle?.bundleId === bundle.bundleId && <Check className="w-3.5 h-3.5 text-[#ff5b00]" />}
                    </button>
                  ))}
                </>
              )}
            </SelectField>
            <PricingAlert error={bundlePricingError} />

            {/* Course selector (only when no bundle) */}
            {!selectedBundle && (
              <>
                <SelectField
                  label="Course"
                  required
                  value={selectedCourse?.title}
                  placeholder="Select a course"
                  open={courseDropdownOpen}
                  onToggle={() => !forcedCourseId && setCourseDropdownOpen((p) => !p)}
                  dropdownRef={courseDropdownRef}
                >
                  {courseData.map((course) => (
                    <button
                      key={course.courseId}
                      type="button"
                      onClick={() => handleCourseSelect(course)}
                      className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-[#1a2b4e] hover:bg-[#ff5b00]/5 transition-colors"
                    >
                      <span className="truncate">{course.title}</span>
                      {selectedCourse?.courseId === course.courseId && <Check className="w-3.5 h-3.5 text-[#ff5b00] flex-shrink-0" />}
                    </button>
                  ))}
                </SelectField>
                <PricingAlert error={pricingError} />
              </>
            )}

            {/* Bundle course multi-select */}
            {selectedBundle && (
              loadingBundleCourses ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ff5b00]" />
                  Loading courses in bundle…
                </div>
              ) : bundleCourses.length > 0 && (
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
                      {selectedBundleCourses.length ? `${selectedBundleCourses.length} course${selectedBundleCourses.length > 1 ? "s" : ""} selected` : "Select courses"}
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
                          <button key={course.courseId} type="button" onClick={() => handleBundleCourseToggle(course.courseId)}
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
              )
            )}

            {/* Curriculum — single course */}
            {selectedCourse?.curriculums?.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Curriculums</span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>
                <div className="space-y-2">
                  {selectedCourse.curriculums.map((c) => (
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

            {/* Curriculum — bundle courses */}
            {selectedBundle && selectedBundleCourses.length > 0 && (
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
                          {course.curriculums.map((cu) => (
                            <label key={cu.curriculumId}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100 hover:border-[#ff5b00]/30 cursor-pointer transition-colors">
                              <div onClick={() => handleCurriculumToggle(cu.curriculumId)}
                                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${selectedCurriculumIds.includes(cu.curriculumId) ? "bg-[#ff5b00] border-[#ff5b00]" : "border-gray-300"}`}>
                                {selectedCurriculumIds.includes(cu.curriculumId) && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <span className="text-xs text-[#1a2b4e] truncate">{cu.title}</span>
                            </label>
                          ))}
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

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-500 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!isFormValid}
              className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-150 shadow-sm ${isFormValid ? "text-white bg-[#ff5b00] hover:bg-[#e55200]" : "text-gray-400 bg-gray-100 cursor-not-allowed"}`}>
              {mode === "edit" ? "Save Changes" : "Create Batch"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddBatchSidebar;
