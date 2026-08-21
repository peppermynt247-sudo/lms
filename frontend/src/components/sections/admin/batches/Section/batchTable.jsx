"use client";

import React, { useState } from "react";
import { Plus, MoreVertical, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@utils/api";
import { toast } from "react-toastify";

const BatchTable = ({
  batch,
  setBatch,
  onAddBatch,
  onEditBatch,
  onDelete
}) => {
  const router = useRouter();
  const [dropdownId, setDropdownId] = useState(null);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    if (!dropdownId) return;
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownId]);
  const [search, setSearch] = useState("");

  const handleEditClick = (batchId) => {
    const batchData = batch.find((b) => b.id === batchId);
    // Transform courses to only have courseId and curriculumIds (array of ids)
    const formattedCourses = (batchData.courses || []).map(course => {
      let curriculumIds = [];
      if (course.curriculumIds) {
        curriculumIds = course.curriculumIds;
      } else if (course.curriculums) {
        curriculumIds = course.curriculums.map(c => c.curriculumId);
      }
      return {
        courseId: course.courseId,
        curriculumIds
      };
    });
    const formatted = {
      batchId: batchData.id,
      name: batchData.name,
      courses: formattedCourses,
      startDate: batchData.startDate,
      endDate: batchData.endDate,
      bundleId: batchData.bundleId || batchData.bundle, // ensure bundleId is present if it's a bundle batch
      batchManagerId: batchData.batchManagerId,
      status: batchData.status,
      accommodation: batchData.accommodation,
      additionalBatchManager: batchData.additionalBatchManager,
      default: batchData.default,
    };
    onEditBatch(formatted);
    setDropdownId(null);
  };

  const handleRowClick = (batchId) => {
    router.push(`/admin/batches/${batchId}`);
  };

  const handleDelete = (batchId) => {
    onDelete(batchId);
  };

  const handleMakeDefault = async (batchId) => {
    // Find courseId from batch data
    const batchData = batch.find(b => b.id === batchId);
    const courseId = batchData?.courses?.[0]?.courseId;
    if (!courseId) {
      toast.success('Course ID not found for this batch.');
      return;
    }
    try {
      await api.put(`/api/courses/${courseId}/batches/${batchId}/set-default`);
      toast.success('Batch set as default successfully.');
      // Update UI: set default true for this batch, false for other batches in the same course
      setBatch(prev => prev.map(b => {
        if (b.id === batchId) return { ...b, default: true };
        const isSameCourse = b.courses?.some(c => c.courseId === courseId);
        if (isSameCourse) return { ...b, default: false };
        return b;
      }));
      setDropdownId(null);
    } catch (err) {
      toast.error('Failed to set batch as default.');
    }
  };

  const filteredBatches = batch.filter((b) =>
    b.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">Batches</h1>
          <p className="text-sm text-gray-500">
            Manage batches and curriculum for your courses
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by batch name..."
            className="px-3 py-2 border rounded-md text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={onAddBatch}
            className="flex items-center gap-1 bg-blue text-white px-4 py-2 rounded-md hover:bg-blue/90"
          >
            <Plus className="w-4 h-4" />
            <span>Create Batch</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white min-h-[300px]">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Batch Name</th>
              <th className="px-4 py-3">Courses</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Batch Manager</th>
              <th className="px-4 py-3">Batch Progress</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBatches.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                  No batches found.
                </td>
              </tr>
            ) : (
              filteredBatches.map((b, index) => (
                <tr
                  key={b.id}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(b.id)}
                >
                  <td className="px-4 py-4 font-medium">
                    {(index + 1).toString().padStart(2, "0")}
                  </td>
                  <td className="px-4 py-4 space-y-1">
                    <div className="font-semibold">{b.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      {b.default && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          DEFAULT
                        </span>
                      )}
                      {/* Bundle vs Course Badge */}
                      {b.bundle ? (
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          BUNDLE
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          COURSE
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <div className="font-semibold">{b.learnersCount} Learners</div>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-white ${
                          b.status === "OLD"
                            ? "bg-yellow-600"
                            : "bg-blue-600"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {b.courses && b.courses.length > 0
                      ? b.courses.map((c) => c.courseName).join(", ")
                      : "-"}
                  </td>
                  <td className="px-4 py-4">
                    {b.startDate && b.endDate
                      ? `${b.startDate} - ${b.endDate}`
                      : "Not set"}
                  </td>
                  <td className="px-4 py-4">{b.curriculumTitle || "-"}</td>
                  <td className="px-4 py-4">{b.batchManager || "-"}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `0%`,
                          }}
                        />
                      </div>
                      <span className="text-xs">0%</span>
                    </div>
                  </td>
                  <td className="relative px-4 py-4">
                    <button
                      className="hover:text-gray-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownId(dropdownId === b.id ? null : b.id);
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {dropdownId === b.id && (
                      <div ref={dropdownRef} className="absolute right-4 top-10 bg-white border rounded-lg shadow-lg z-50">
                        <button
                          className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(b.id);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMakeDefault(b.id);
                          }}
                        >
                          Make Default
                        </button>
                        <button
                          className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(b.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BatchTable;
