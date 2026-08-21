"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown } from "lucide-react";
import api from "@utils/api";
import { toast } from 'react-toastify';

const AddBatchModal = ({
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bundleDropdownOpen, setBundleDropdownOpen] = useState(false);
  const [instructorDropdownOpen, setInstructorDropdownOpen] = useState(false);
  const [courseHasValidPlan, setCourseHasValidPlan] = useState(true);
  const [pricingError, setPricingError] = useState("");
  const [bundles, setBundles] = useState([]);
  const [bundleCourses, setBundleCourses] = useState([]);
  const [loadingBundles, setLoadingBundles] = useState(false);
  const [loadingBundleCourses, setLoadingBundleCourses] = useState(false);
  const [selectedBundleCourses, setSelectedBundleCourses] = useState([]);
  const [instructor, setInstructor] = useState([]);
  const [bundleHasValidPlan, setBundleHasValidPlan] = useState(true);
  const [bundlePricingError, setBundlePricingError] = useState("");

  // New state for individual course payment plan validation within bundles
  const [coursePaymentPlans, setCoursePaymentPlans] = useState({}); // { courseId: { hasPlan: boolean, error: string } }
  const [validatingCoursePlans, setValidatingCoursePlans] = useState(false);

  const dropdownRef = useRef();
  const bundleDropdownRef = useRef();
  const instructorDropdownRef = useRef();

  // Add this function to clear course selection
  const clearCourseSelection = () => {
    setSelectedCourse(null);
    setSelectedCurriculumIds([]);
  };

  // Add this function to clear bundle selection
  const clearBundleSelection = () => {
    setSelectedBundle(null);
    setBundleCourses([]);
    setSelectedBundleCourses([]);
    setCoursePaymentPlans({});
  };

  // Fetch bundles when modal opens
  useEffect(() => {
    if (isOpen && bundles.length === 0) {
      fetchBundles();
    }
  }, [isOpen]);

  const fetchBundles = async () => {
    try {
      setLoadingBundles(true);
      const res = await api.get("/api/course-bundles");
      const bundlesData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setBundles(bundlesData);
    } catch (error) {
      toast.error("Failed to fetch bundles");
    } finally {
      setLoadingBundles(false);
    }
  };

  const fetchBundleCourses = async (bundleId) => {
    try {
      setLoadingBundleCourses(true);
      const res = await api.get(`/api/courses/bundle/${bundleId}`);
      const courses = res.data?.data || res.data || [];
      setBundleCourses(courses);
      
      // Validate payment plans for all courses in the bundle
      await validateBundleCoursePaymentPlans(courses);
    } catch (error) {
      toast.error("Failed to fetch bundle courses");
      setBundleCourses([]);
    } finally {
      setLoadingBundleCourses(false);
    }
  };

  // New function to validate payment plans for all courses in a bundle
  const validateBundleCoursePaymentPlans = async (courses) => {
    setValidatingCoursePlans(true);
    const coursePlanValidation = {};
    
    try {
      // Validate payment plans for each course in parallel
      const validationPromises = courses.map(async (course) => {
        try {
          const res = await api.get(`/api/courses/${course.courseId}/pricing-details`);
          const plans = res?.data?.data?.plans || [];
          
          coursePlanValidation[course.courseId] = {
            hasPlan: plans.length > 0,
            error: plans.length === 0 ? "This course does not have a payment plan." : ""
          };
        } catch (error) {
          coursePlanValidation[course.courseId] = {
            hasPlan: false,
            error: "Failed to verify payment plan for this course."
          };
        }
      });
      
      await Promise.all(validationPromises);
      setCoursePaymentPlans(coursePlanValidation);
    } catch (error) {
    } finally {
      setValidatingCoursePlans(false);
    }
  };

  const fetchBundlePricingDetails = async (bundleId) => {
    try {
      const res = await api.get(`/api/course-bundles/${bundleId}/pricing-details`);
      if (res.status === 200) {
        const plans = res?.data?.data?.plans || [];
        if (plans.length === 0) {
          setBundleHasValidPlan(false);
          setBundlePricingError("This bundle does not have a valid payment plan. Please set one before creating a batch.");
        } else {
          setBundleHasValidPlan(true);
          setBundlePricingError("");
        }
      } else {
        setBundleHasValidPlan(false);
        setBundlePricingError("Unable to fetch bundle payment plans, Try again later!");
      }
    } catch (error) {
      setBundleHasValidPlan(false);
      setBundlePricingError("Failed to verify payment details for this bundle.");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (bundleDropdownRef.current && !bundleDropdownRef.current.contains(e.target)) {
        setBundleDropdownOpen(false);
      }
      if (instructorDropdownRef.current && !instructorDropdownRef.current.contains(e.target)) {
        setInstructorDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
  if (initialData && mode === "edit") {
    setBatchName(initialData.name || "");
    setStartDate(initialData.startDate?.split("T")[0] || "");
    setEndDate(initialData.endDate?.split("T")[0] || "");

    const course = initialData.courses?.[0];
    const courseObj = courseData.find((c) => c.courseId === course?.courseId);
    setSelectedCourse(courseObj || null);
    setSelectedCurriculumIds(course?.curriculums?.map(c => c.curriculumId) || []);
    setInstructor(initialData.batchManager || {});
    if (courseObj?.courseId) {
      fetchCoursePricingDetails(courseObj.courseId);
    }
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
  } else if (!initialData && !mode === "edit") {
    setSelectedCourse(null);
  }
}, [initialData, courseData, instrData, mode, forcedCourseId]);

  useEffect(() => {
    if (selectedBundle && selectedBundle.bundleId) {
      fetchBundlePricingDetails(selectedBundle.bundleId);
    }
  }, [selectedBundle]);

  const fetchCoursePricingDetails = async (courseId) => {
    try {
      const res = await api.get(`/api/courses/${courseId}/pricing-details`);
      if(res.status===200){
      const plans = res?.data?.data?.plans || [];

      if (plans.length === 0) {
        setCourseHasValidPlan(false);
        setPricingError("This course does not have a valid pricing plan. Please set one before creating a batch.");
      } else {
        setCourseHasValidPlan(true);
        setPricingError("");
      }
      }
      else{        
        setCourseHasValidPlan(false);
        toast.error("Unable to fetch course pricing plans, Try again later !");
        setPricingError("Unable to fetch course pricing plans, Try again later !")
      }
    } catch (error) {
      setCourseHasValidPlan(false);
      toast.error("Failed to verify pricing details for this course.");
      setPricingError("Failed to verify pricing details for this course.");
    }
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setSelectedBundle(null);
    setSelectedCurriculumIds([]);
    setDropdownOpen(false);
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
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  // New function to check if all selected bundle courses have valid payment plans
  const validateSelectedBundleCourses = () => {
    if (!selectedBundle || selectedBundleCourses.length === 0) {
      return { isValid: true, errors: [] };
    }

    const errors = [];
    const invalidCourses = [];

    selectedBundleCourses.forEach(courseId => {
      const courseValidation = coursePaymentPlans[courseId];
      if (!courseValidation || !courseValidation.hasPlan) {
        const course = bundleCourses.find(c => c.courseId === courseId);
        const courseName = course ? course.title : `Course ID ${courseId}`;
        invalidCourses.push(courseName);
        errors.push(`${courseName}: ${courseValidation?.error || "Payment plan validation failed"}`);
      }
    });

    return {
      isValid: invalidCourses.length === 0,
      errors,
      invalidCourses
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if either bundle OR course is selected (not both)
    const hasBundle = !!selectedBundle;
    const hasCourse = !!selectedCourse;
    
    if (!batchName || (!hasBundle && !hasCourse) || !selectedInstructor) {
      toast.warn("Please fill all required fields.");
      return;
    }

    // Validate course payment plan for single course selection
    if (hasCourse && !courseHasValidPlan) {
      toast.warn(pricingError || "This course does not have a valid payment plan.");
      return;
    }

    // Validate bundle payment plan
    if (hasBundle && !bundleHasValidPlan) {
      toast.warn(bundlePricingError || "This bundle does not have a valid payment plan.");
      return;
    }

    // Validate individual course payment plans within bundle
    if (hasBundle && selectedBundleCourses.length > 0) {
      const bundleCourseValidation = validateSelectedBundleCourses();
      if (!bundleCourseValidation.isValid) {
        const errorMessage = `The following courses do not have payment plans:\n${bundleCourseValidation.errors.join('\n')}`;
        toast.warn(errorMessage);
        return;
      }
    }

    if (hasBundle && hasCourse) {
      toast.warn("Please select either a bundle OR a course, not both.");
      return;
    }

    const batchData = mode === "edit"
      ? {
          batchId: initialData?.batchId,
          batchName,
          startDate: startDate || null,
          endDate: endDate || null,
          status: "ACTIVE",
          accommodation: null,
          batchManagerId: selectedInstructor.id,
          additionalBatchManager: null,
          courses: selectedCourse ? [
            {
              courseId: selectedCourse.courseId,
              curriculumIds: selectedCurriculumIds,
            },
          ] : selectedBundle ? selectedBundleCourses.map(courseId => {
            const course = bundleCourses.find(c => c.courseId === courseId);
            // Only include curriculumIds for this course that are selected
            const curriculumIds = course?.curriculums
              ?.filter(curriculum => selectedCurriculumIds.includes(curriculum.curriculumId))
              ?.map(curriculum => curriculum.curriculumId) || [];
            return {
              courseId,
              curriculumIds
            };
          }) : undefined,
          bundleId: selectedBundle ? selectedBundle.bundleId : undefined,
          default: false,
        }
      : {
          batchName,
          startDate: startDate || null,
          endDate: endDate || null,
          batchManagerId: selectedInstructor.id,
          courses: selectedCourse ? [
            {
              courseId: selectedCourse.courseId,
              curriculumIds: selectedCurriculumIds,
            },
          ] : selectedBundle ? selectedBundleCourses.map(courseId => {
            const course = bundleCourses.find(c => c.courseId === courseId);
            const curriculumIds = course?.curriculums
              ?.filter(curriculum => selectedCurriculumIds.includes(curriculum.curriculumId))
              ?.map(curriculum => curriculum.curriculumId) || [];
            return {
              courseId,
              curriculumIds
            };
          }) : undefined,
          bundleId: selectedBundle ? selectedBundle.bundleId : undefined,
          default: false,
        };

    onCreateOrUpdate(batchData);
    onClose();
  };

  const isFormValid = batchName && 
    (selectedCourse || selectedBundle) && 
    selectedInstructor && 
    (selectedCourse ? courseHasValidPlan : true) &&
    (selectedBundle ? bundleHasValidPlan : true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold mb-4">
          {mode === "edit" ? "Edit Batch" : "Create Batch"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Batch Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Enter batch name"
              />
            </div>

            {/* Bundle Select */}
            <div>
              <label className="block text-sm font-medium mb-1">Bundle</label>
              <div className="relative" ref={bundleDropdownRef}>
                <button
                  type="button"
                  onClick={() => setBundleDropdownOpen(!bundleDropdownOpen)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm flex justify-between items-center"
                >
                  {selectedBundle?.title || "Select a bundle"}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                {bundleDropdownOpen && (
                  <ul className="absolute z-10 bg-white border border-gray-200 mt-1 w-full rounded shadow-md max-h-60 overflow-y-auto">
                    {bundles.map((bundle) => (
                        <li
                          key={bundle.bundleId}
                          onClick={() => handleBundleSelect(bundle)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        >
                          {bundle.title}
                        </li>
                    ))}
                  </ul>
                )}
              </div>
              {!bundleHasValidPlan && (
                <p className="text-red-500 text-xs mt-1">{bundlePricingError}</p>
              )}
            </div>
          </div>

          {/* Course Select (only if no bundle selected) */}
          {!selectedBundle && (
            <div>
              <label className="block text-sm font-medium mb-1">Course <span className="text-red-500">*</span></label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm flex justify-between items-center"
                >
                  {selectedCourse?.title || "Select a course"}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                {dropdownOpen && (
                  <ul className="absolute z-10 bg-white border border-gray-200 mt-1 w-full rounded shadow-md max-h-60 overflow-y-auto">
                    {courseData.map((course) => (
                      <li
                        key={course.courseId}
                        onClick={() => handleCourseSelect(course)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        {course.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {!courseHasValidPlan && (
                <p className="text-red-500 text-xs mt-1">{pricingError}</p>
              )}
            </div>
          )}

          {/* Bundle Course Selection */}
          {selectedBundle && bundleCourses.length > 0 && (
            <div className="mt-6">
              <label className="block text-base font-semibold mb-2">Select Courses in Bundle <span className="text-red-500">*</span></label>
              {validatingCoursePlans && (
                <div className="text-sm text-blue-600 mb-2">Validating payment plans for courses...</div>
              )}
              <div className="relative mb-4">
                <button
                  type="button"
                  className="w-full border rounded px-3 py-2 text-sm flex justify-between items-center bg-white"
                  onClick={() => setDropdownOpen((open) => !open)}
                >
                  {selectedBundleCourses.length > 0
                    ? bundleCourses.filter(c => selectedBundleCourses.includes(c.courseId)).map(c => c.title).join(", ")
                    : "Select courses"}
                  <span className="ml-2">▼</span>
                </button>
                {dropdownOpen && (
                  <ul className="absolute z-10 bg-white border border-gray-200 mt-1 w-full rounded shadow-md max-h-60 overflow-y-auto">
                    {bundleCourses.map((course) => {
                      const courseValidation = coursePaymentPlans[course.courseId];
                      const hasValidPlan = courseValidation?.hasPlan;
                      const errorMessage = courseValidation?.error;
                      
                      return (
                        <li
                          key={course.courseId}
                          className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2 ${
                            !hasValidPlan ? 'text-red-600' : ''
                          }`}
                          onClick={() => handleBundleCourseToggle(course.courseId)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedBundleCourses.includes(course.courseId)}
                            readOnly
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span>{course.title}</span>
                              {!hasValidPlan && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                  No Payment Plan
                                </span>
                              )}
                            </div>
                            {!hasValidPlan && errorMessage && (
                              <div className="text-xs text-red-500 mt-1">{errorMessage}</div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Curriculum Selection for Single Course */}
          {selectedCourse?.curriculums?.length > 0 && (
            <div className="mt-6">
              <label className="block text-base font-semibold mb-2">Select Curriculums</label>
              <div className="flex flex-wrap gap-4">
                {selectedCourse.curriculums.map((c) => (
                  <label
                    key={c.curriculumId}
                    className="text-xs flex items-center space-x-1"
                  >
                          <input
                            type="checkbox"
                      checked={selectedCurriculumIds.includes(c.curriculumId)}
                      onChange={() => handleCurriculumToggle(c.curriculumId)}
                          />
                    <span>{c.title}</span>
                        </label>
                ))}
              </div>
            </div>
          )}

          {/* Curriculum Selection for Bundle Courses */}
          {selectedBundle && selectedBundleCourses.length > 0 && (
            <div className="mt-4">
              <label className="block text-base font-semibold mb-2">Select Curriculums for Each Course</label>
              <div className="space-y-6">
                {bundleCourses.filter(course => selectedBundleCourses.includes(course.courseId)).map((course) => (
                  <div key={course.courseId} className="border-b pb-4 last:border-b-0">
                    <div className="font-semibold mb-1">{course.title}</div>
                    {course.curriculums && course.curriculums.length > 0 && (
                      <div className="ml-4 mt-2 flex flex-wrap gap-4">
                              {course.curriculums.map((curriculum) => (
                                <label
                                  key={curriculum.curriculumId}
                                  className="text-xs flex items-center space-x-1"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedCurriculumIds.includes(curriculum.curriculumId)}
                                    onChange={() => handleCurriculumToggle(curriculum.curriculumId)}
                                  />
                                  <span>{curriculum.title}</span>
                                </label>
                              ))}
                          </div>
                        )}
                      </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Instructor */}
            <div>
              <label className="block text-sm font-medium mb-1">Instructor <span className="text-red-500">*</span></label>
              <div className="relative" ref={instructorDropdownRef}>
                <button
                  type="button"
                  onClick={() => setInstructorDropdownOpen(!instructorDropdownOpen)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm flex justify-between items-center"
                >
                  {selectedInstructor?.name || "Select an instructor"}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                {instructorDropdownOpen && (
                  <ul className="absolute z-10 bg-white border border-gray-200 mt-1 w-full rounded shadow-md max-h-60 overflow-y-auto">
                    {instrData.map((instructor) => (
                      <li
                        key={instructor.id}
                        onClick={() => {
                          setSelectedInstructor(instructor);
                          setInstructorDropdownOpen(false);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        {instructor.name} ({instructor.role})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className={`px-4 py-2 rounded text-white ${
                isFormValid
                  ? "bg-blue hover:bg-blue-600"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {mode === "edit" ? "Update Batch" : "Create Batch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBatchModal;
