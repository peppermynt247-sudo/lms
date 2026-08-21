"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown } from "lucide-react";
import { toast } from 'react-toastify';
import api from "@utils/api";

const EditCourseBatchModal = ({
    isOpen,
    onClose,
    initialData,
    onUpdate,
    courseData,
    instrData,
}) => {
    const [batchName, setBatchName] = useState("");
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedCurriculumIds, setSelectedCurriculumIds] = useState([]);
    const [allCurriculums, setAllCurriculums] = useState([]); // New state for all curriculums
    const [selectedInstructor, setSelectedInstructor] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [instructorDropdownOpen, setInstructorDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const instructorDropdownRef = useRef();

    // Fetch complete batch data by ID when modal opens
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
            const instructorDataToUse = customInstructorData || instrData;

            if (batchData) {
                setBatchName(batchData.batchName || "");

                let startDateValue = "";
                let endDateValue = "";

                if (batchData.startDate) {
                    if (typeof batchData.startDate === 'string') {
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

                const course = batchData.courses?.[0];
                const courseObj = courseData.find((c) => c.courseId === course?.courseId);
                setSelectedCourse(courseObj || null);

                // Fetch all curriculums for the selected course
                if (courseObj?.courseId) {
                    try {
                        const courseRes = await api.get(`/api/courses/${courseObj.courseId}`);
                        const courseDetails = courseRes.data?.data || courseRes.data;
                        if (courseDetails?.curriculums) {
                            setAllCurriculums(courseDetails.curriculums);
                        }
                    } catch (err) {
                        toast.error("Failed to fetch all curriculums for the course.");
                        setAllCurriculums([]);
                    }
                }

                // Set the selected curriculums based on the batch data
                if (course?.curriculumIds) {
                    setSelectedCurriculumIds(course.curriculumIds);
                } else if (course?.curriculums) {
                    setSelectedCurriculumIds(course.curriculums.map(c => c.curriculumId));
                } else {
                    setSelectedCurriculumIds([]);
                }

                let instructorObj = null;
                if (batchData.batchManager?.id) {
                    instructorObj = instructorDataToUse.find((i) => i.id === batchData.batchManager.id);
                    if (!instructorObj) {
                        instructorObj = instructorDataToUse.find((i) => String(i.id) === String(batchData.batchManager.id));
                    }
                    if (!instructorObj && batchData.batchManager.name) {
                        instructorObj = instructorDataToUse.find((i) => i.name === batchData.batchManager.name);
                    }
                }
                setSelectedInstructor(instructorObj || null);
            }
        } catch (error) {
            toast.error("Failed to fetch batch data");
            if (initialData) {
                setBatchName(initialData.batchName || initialData.name || "");
                setStartDate(initialData.startDate?.includes('T') ? initialData.startDate.split('T')[0] : initialData.startDate);
                setEndDate(initialData.endDate?.includes('T') ? initialData.endDate.split('T')[0] : initialData.endDate);

                const course = initialData.courses?.[0];
                const courseObj = courseData.find((c) => c.courseId === course?.courseId);
                setSelectedCourse(courseObj || null);
                setSelectedCurriculumIds(course?.curriculumIds || course?.curriculums?.map(c => c.curriculumId) || []);

                let instructorObj = null;
                if (initialData.batchManagerId) {
                    instructorObj = instrData.find((i) => i.id === initialData.batchManagerId);
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

    const handleCurriculumToggle = (id) => {
        setSelectedCurriculumIds((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!batchName || !selectedCourse || !selectedInstructor) {
            toast.warn("Please fill all required fields.");
            return;
        }

        const batchData = {
            batchId: initialData?.batchId,
            batchName,
            startDate: startDate || null,
            endDate: endDate || null,
            status: initialData?.status || "ACTIVE",
            accommodation: initialData?.accommodation || null,
            batchManagerId: selectedInstructor.id,
            additionalBatchManager: initialData?.additionalBatchManager || null,
            courses: [{
                courseId: selectedCourse.courseId,
                courseName: selectedCourse.title,
                curriculumIds: selectedCurriculumIds,
                primary: true,
            }, ],
            bundleId: undefined,
            default: initialData?.default || false,
        };

        onUpdate(batchData);
        onClose();
    };

    const isFormValid = batchName && selectedCourse && selectedInstructor;

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                    <div className="flex items-center justify-center h-32">
                        <div className="text-lg">Loading batch data...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900">
                    <X className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold mb-4">Edit Course Batch</h2>
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
                            <label className="block text-sm font-medium mb-1">Course <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                                value={selectedCourse?.title || ""}
                                placeholder="Course"
                                disabled
                            />
                        </div>
                    </div>

                    {/* Corrected Curriculum Selection UI */}
                    {allCurriculums.length > 0 && (
                        <div className="mt-6">
                            <label className="block text-base font-semibold mb-2">Select Curriculums</label>
                            <div className="flex flex-wrap gap-4">
                                {/* Render selected curriculums first */}
                                {allCurriculums
                                    .filter(c => selectedCurriculumIds.includes(c.curriculumId))
                                    .map(c => (
                                        <label
                                            key={c.curriculumId}
                                            className="text-xs flex items-center space-x-1"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={true}
                                                onChange={() => handleCurriculumToggle(c.curriculumId)}
                                            />
                                            <span>{c.title}</span>
                                        </label>
                                    ))}

                                {/* Render unselected curriculums after */}
                                {allCurriculums
                                    .filter(c => !selectedCurriculumIds.includes(c.curriculumId))
                                    .map(c => (
                                        <label
                                            key={c.curriculumId}
                                            className="text-xs flex items-center space-x-1"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={false}
                                                onChange={() => handleCurriculumToggle(c.curriculumId)}
                                            />
                                            <span>{c.title}</span>
                                        </label>
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
                                    ? "bg-blue-500 hover:bg-blue-600"
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

export default EditCourseBatchModal;