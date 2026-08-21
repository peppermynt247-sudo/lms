"use client";

import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import api from "@utils/api";
import { toast } from 'react-toastify';

const EditBundleBatchModal = ({
  isOpen,
  onClose,
  initialData,
  onUpdate,
  bundleData,
  instrData,
}) => {
  const [batchName, setBatchName] = useState("");
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bundleCourses, setBundleCourses] = useState([]);
  const [selectedBundleCourses, setSelectedBundleCourses] = useState([]); // courseIds
  const [selectedCurriculumIdsByCourse, setSelectedCurriculumIdsByCourse] = useState({}); // { courseId: [curriculumId, ...] }
  const [loadingBundleCourses, setLoadingBundleCourses] = useState(false);
  const [instructorDropdownOpen, setInstructorDropdownOpen] = useState(false);
  const instructorDropdownRef = useRef();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // New state for individual course payment plan validation within bundles
  const [coursePaymentPlans, setCoursePaymentPlans] = useState({}); // { courseId: { hasPlan: boolean, error: string } }
  const [validatingCoursePlans, setValidatingCoursePlans] = useState(false);

  useEffect(() => {
    if (isOpen && initialData?.batchId && instrData.length === 0) {
      // If instructor data is not available, fetch it
      const fetchInstructorData = async () => {
        try {
          const response = await api.get("/api/admin/getadminsandinstructors");
          const instructors = response.data || [];
          // Re-run the fetchCompleteBatchData with the new instructor data
          await fetchCompleteBatchData(initialData.batchId, instructors);
        } catch (error) {
          console.error('Error fetching instructor data:', error);
        }
      };
      fetchInstructorData();
    } else if (isOpen && initialData?.batchId) {
      fetchCompleteBatchData(initialData.batchId);
    }
  }, [isOpen, initialData?.batchId, instrData.length]);

  const fetchCompleteBatchData = async (batchId, customInstructorData = null) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/batches/${batchId}`);
      const batchData = response.data?.data || response.data;
      
      // Use custom instructor data if provided, otherwise use the prop
      const instructorDataToUse = customInstructorData || instrData;
      
      if (batchData) {
        
        // Set basic batch info
        setBatchName(batchData.batchName || "");
        
        // Improved date handling with debugging
      
        let startDateValue = "";
        let endDateValue = "";
        
        if (batchData.startDate) {
          if (typeof batchData.startDate === 'string') {
            // Handle different date formats
            if (batchData.startDate.includes('T')) {
              startDateValue = batchData.startDate.split('T')[0];
            } else {
              startDateValue = batchData.startDate;
            }
          } else if (batchData.startDate instanceof Date) {
            startDateValue = batchData.startDate.toISOString().split('T')[0];
          }
        }
        
        if (batchData.endDate) {
          if (typeof batchData.endDate === 'string') {
            // Handle different date formats
            if (batchData.endDate.includes('T')) {
              endDateValue = batchData.endDate.split('T')[0];
            } else {
              endDateValue = batchData.endDate;
            }
          } else if (batchData.endDate instanceof Date) {
            endDateValue = batchData.endDate.toISOString().split('T')[0];
          }
        }
        
        setStartDate(startDateValue);
        setEndDate(endDateValue);
        
        // Find bundle object from bundleData
        let bundleObj = null;
        if (batchData.bundle?.bundleId) {
          bundleObj = bundleData.find((b) => b.bundleId === batchData.bundle.bundleId);
        } else if (batchData.bundleId) {
          bundleObj = bundleData.find((b) => b.bundleId === batchData.bundleId);
        }
        
        // Fallback: try to infer bundle from courses if not found
        if (!bundleObj && batchData.courses && batchData.courses.length > 0) {
          bundleObj = bundleData.find((b) => {
            const bundleCourseIds = (b.courses || []).map(c => c.courseId).sort().join(',');
            const batchCourseIds = batchData.courses.map(c => c.courseId).sort().join(',');
            return bundleCourseIds === batchCourseIds;
          });
        }
        
        setSelectedBundle(bundleObj || null);
        
        // Pre-select courses and curriculums from the fetched data
        const courseIds = (batchData.courses || []).map(c => c.courseId);
        setSelectedBundleCourses(courseIds);
        
        // Map courseId to curriculumIds
        const currByCourse = {};
        (batchData.courses || []).forEach(c => {
          currByCourse[c.courseId] = (c.curriculums || []).map(curr => curr.curriculumId);
        });
        setSelectedCurriculumIdsByCourse(currByCourse);
        
        // Fetch bundle courses if we have a bundle
        if (bundleObj?.bundleId) {
          await fetchBundleCourses(bundleObj.bundleId);
        } else {
          setBundleCourses([]);
        }
        
        
        // Try multiple ways to find the instructor
        let instructorObj = null;
        if (batchData.batchManager?.id) {
          // First try exact ID match
          instructorObj = instructorDataToUse.find((i) => i.id === batchData.batchManager.id);
          
          // If not found, try string comparison
          if (!instructorObj) {
            instructorObj = instructorDataToUse.find((i) => String(i.id) === String(batchData.batchManager.id));
          }
          
          // If still not found, try by name
          if (!instructorObj && batchData.batchManager.name) {
            instructorObj = instructorDataToUse.find((i) => i.name === batchData.batchManager.name);
          }
        }
        
        setSelectedInstructor(instructorObj || null);
      }
    } catch (error) {
      toast.error("Failed to fetch batch data");
      // Fallback to initial data if API call fails
      if (initialData) {
        setBatchName(initialData.batchName || "");
        
      
        let startDateValue = "";
        let endDateValue = "";
        
        if (initialData.startDate) {
          if (typeof initialData.startDate === 'string') {
            if (initialData.startDate.includes('T')) {
              startDateValue = initialData.startDate.split('T')[0];
            } else {
              startDateValue = initialData.startDate;
            }
          } else if (initialData.startDate instanceof Date) {
            startDateValue = initialData.startDate.toISOString().split('T')[0];
          }
        }
        
        if (initialData.endDate) {
          if (typeof initialData.endDate === 'string') {
            if (initialData.endDate.includes('T')) {
              endDateValue = initialData.endDate.split('T')[0];
            } else {
              endDateValue = initialData.endDate;
            }
          } else if (initialData.endDate instanceof Date) {
            endDateValue = initialData.endDate.toISOString().split('T')[0];
          }
        }
        
       
        setStartDate(startDateValue);
        setEndDate(endDateValue);
        
        let bundleObj = bundleData.find((b) => b.bundleId === initialData.bundleId);
        if (!bundleObj && initialData.courses && initialData.courses.length > 0) {
          bundleObj = bundleData.find((b) => {
            const bundleCourseIds = (b.courses || []).map(c => c.courseId).sort().join(',');
            const batchCourseIds = initialData.courses.map(c => c.courseId).sort().join(',');
            return bundleCourseIds === batchCourseIds;
          });
        }
        setSelectedBundle(bundleObj || null);
        
        const courseIds = (initialData.courses || []).map(c => c.courseId);
        setSelectedBundleCourses(courseIds);
        
        const currByCourse = {};
        (initialData.courses || []).forEach(c => {
          currByCourse[c.courseId] = c.curriculumIds || [];
        });
        setSelectedCurriculumIdsByCourse(currByCourse);
        
        if (bundleObj?.bundleId) {
          await fetchBundleCourses(bundleObj.bundleId);
        }
        
       
        let instructorObj = null;
        if (initialData.batchManagerId) {
          // First try exact ID match
          instructorObj = instrData.find((i) => i.id === initialData.batchManagerId);
          
          // If not found, try string comparison
          if (!instructorObj) {
            instructorObj = instrData.find((i) => String(i.id) === String(initialData.batchManagerId));
          }
        }
        setSelectedInstructor(instructorObj || null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  }, [selectedBundle, bundleCourses]);

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

  const handleBundleCourseToggle = (courseId) => {
    setSelectedBundleCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
    // If unchecking, also clear curriculums for that course
    setSelectedCurriculumIdsByCourse((prev) => {
      const newObj = { ...prev };
      if (newObj[courseId]) delete newObj[courseId];
      return newObj;
    });
  };

  const handleCurriculumToggle = (courseId, curriculumId) => {
    setSelectedCurriculumIdsByCourse((prev) => {
      const prevArr = prev[courseId] || [];
      return {
        ...prev,
        [courseId]: prevArr.includes(curriculumId)
          ? prevArr.filter((id) => id !== curriculumId)
          : [...prevArr, curriculumId],
      };
    });
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
    if (!batchName || !selectedBundle || !selectedInstructor || selectedBundleCourses.length === 0) {
      toast.warn("Please fill all required fields.");
      return;
    }

    // Validate individual course payment plans within bundle
    const bundleCourseValidation = validateSelectedBundleCourses();
    if (!bundleCourseValidation.isValid) {
      const errorMessage = `The following courses do not have payment plans:\n${bundleCourseValidation.errors.join('\n')}`;
      toast.warn(errorMessage);
      return;
    }
    
    // Build payload: each course has curriculumIds as a single array
    const courses = selectedBundleCourses.map(courseId => {
      return {
        courseId,
        curriculumIds: selectedCurriculumIdsByCourse[courseId] || [],
      };
    });
    
    const batchData = {
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
    };
    
    onUpdate(batchData);
    onClose();
  };

  const isFormValid = batchName && selectedBundle && selectedInstructor && selectedBundleCourses.length > 0;

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
          <div className="flex items-center justify-center h-32">
            <div className="text-lg">Loading batch data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold mb-4">Edit Bundle Batch</h2>
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
            <div>
              <label className="block text-sm font-medium mb-1">Bundle <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                value={selectedBundle?.title || ""}
                disabled
              />
            </div>
          </div>

          {/* Course and Curriculum Selection UI */}
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
          
          {/* For each selected course, show curriculums with checkboxes */}
          {selectedBundleCourses.length > 0 && (
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
                              checked={(selectedCurriculumIdsByCourse[course.courseId] || []).includes(curriculum.curriculumId)}
                              onChange={() => handleCurriculumToggle(course.courseId, curriculum.curriculumId)}
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
                  <span className="ml-2">▼</span>
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
              Update Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBundleBatchModal;