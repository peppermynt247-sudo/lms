"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit, Archive, ArchiveRestore, BookOpen, Layers } from "lucide-react";
import api from "@utils/api";
import { toast } from "react-toastify";

export default function CourseListView({ courses, onCourseClick, onCourseUpdate }) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isArchiving, setIsArchiving] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openDropdown]);

  const handleDropdownToggle = (courseId) => {
    setOpenDropdown(openDropdown === courseId ? null : courseId);
  };

  const handleEdit = (courseId) => {
    if (onCourseClick) onCourseClick(courseId);
    setOpenDropdown(null);
  };

  const handleArchive = async (course) => {
    const newArchiveStatus = !course.isArchived;
    setIsArchiving(course.courseId);
    setOpenDropdown(null);
    try {
      const response = await api.patch(`/api/courses/${course.courseId}/archive`, {
        isArchived: newArchiveStatus,
      });
      if (response.status >= 200 && response.status < 300 && response.data) {
        if (onCourseUpdate) onCourseUpdate(response.data.data);
        toast.success(newArchiveStatus ? "Course archived." : "Course unarchived.");
      } else {
        toast.error("Action failed.");
      }
    } catch {
      toast.error("Action failed.");
    } finally {
      setIsArchiving(null);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-visible">
      {/* Table header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 rounded-t-2xl">
        <div className="col-span-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">#</div>
        <div className="col-span-8 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Course</div>
        <div className="col-span-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</div>
      </div>

      {/* Rows */}
      {courses.map((course, index) => (
        <div
          key={course.courseId}
          onClick={() => onCourseClick(course.courseId)}
          className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-[#ff5b00]/[0.025] transition-colors duration-150 cursor-pointer group"
        >
          {/* Index */}
          <div className="col-span-1">
            <span className="text-xs font-medium text-gray-400">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>

          {/* Thumbnail + info */}
          <div className="col-span-8 flex items-center gap-4 min-w-0">
            {/* Thumbnail */}
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff5b00]/10 to-[#0c63e4]/10">
                  <BookOpen className="w-5 h-5 text-[#ff5b00]/50" />
                </div>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-[#1a2b4e] truncate group-hover:text-[#ff5b00] transition-colors">
                {course.title}
              </h3>
              {course.description && (
                <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{course.description}</p>
              )}
              {/* Status badge */}
              <div className="mt-1.5 flex items-center gap-1.5">
                {course.isArchived ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">
                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                    Archived
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ff5b00]/8 text-[#ff5b00]">
                    <span className="w-1 h-1 rounded-full bg-[#ff5b00]" />
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="col-span-3 flex items-center justify-end">
            <div className="relative" ref={openDropdown === course.courseId ? dropdownRef : null} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDropdownToggle(course.courseId);
                }}
                disabled={isArchiving === course.courseId}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#1a2b4e] hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all duration-150 opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                {isArchiving === course.courseId ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#ff5b00] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MoreVertical className="w-3.5 h-3.5" />
                )}
              </button>

              {openDropdown === course.courseId && (
                <div
                  className={`absolute right-0 w-44 bg-white rounded-xl border border-gray-100 z-50 overflow-hidden ${
                    index >= courses.length - 2 ? "bottom-full mb-1" : "top-full mt-1"
                  }`}
                  style={{ boxShadow: "0 8px 32px -4px rgba(26,43,78,0.18)" }}
                >
                  <div className="py-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(course.courseId); }}
                      className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-medium text-[#1a2b4e] hover:bg-[#ff5b00]/5 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#0c63e4]" />
                      Edit Course
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleArchive(course); }}
                      disabled={isArchiving === course.courseId}
                      className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-medium text-[#1a2b4e] hover:bg-[#ff5b00]/5 transition-colors disabled:opacity-50"
                    >
                      {course.isArchived ? (
                        <ArchiveRestore className="w-3.5 h-3.5 text-[#ff5b00]" />
                      ) : (
                        <Archive className="w-3.5 h-3.5 text-[#ff5b00]" />
                      )}
                      {course.isArchived ? "Unarchive" : "Archive"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
