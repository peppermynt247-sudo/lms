"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit, Archive, ArchiveRestore, BookOpen } from "lucide-react";
import api from "@utils/api";
import { toast } from "react-toastify";

export default function CourseCardView({ courses, onCourseClick, onCourseUpdate }) {
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
    setIsArchiving(course.courseId);
    setOpenDropdown(null);
    try {
      const response = await api.patch(`/api/courses/${course.courseId}/archive`, {
        isArchived: !course.isArchived,
      });
      if (onCourseUpdate) onCourseUpdate(response.data.data);
      toast.success(!course.isArchived ? "Course archived." : "Course unarchived.");
    } catch {
      toast.error("Failed to update archive status.");
    } finally {
      setIsArchiving(null);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {courses.map((course, index) => (
        <div
          key={course.courseId}
          onClick={() => onCourseClick(course.courseId)}
          className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
          style={{ boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" }}
        >
          {/* Thumbnail */}
          <div className="relative h-44 bg-gray-50 overflow-hidden">
            {course.thumbnailUrl ? (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#ff5b00]/5 to-[#0c63e4]/5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff5b00]/15 to-[#0c63e4]/10 flex items-center justify-center border border-[#ff5b00]/10">
                  <BookOpen className="w-6 h-6 text-[#ff5b00]/60" />
                </div>
                <span className="text-xs text-gray-400 font-medium">No thumbnail</span>
              </div>
            )}

            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a2b4e]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            {/* Status badge */}
            <div className="absolute top-3 left-3">
              {course.isArchived ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-900/60 text-white backdrop-blur-sm">
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  Archived
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ff5b00]/90 text-white backdrop-blur-sm">
                  <span className="w-1 h-1 rounded-full bg-white" />
                  Active
                </span>
              )}
            </div>

            {/* Action menu button */}
            <div
              className="absolute top-3 right-3"
              ref={openDropdown === course.courseId ? dropdownRef : null}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => { e.stopPropagation(); handleDropdownToggle(course.courseId); }}
                disabled={isArchiving === course.courseId}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-gray-600 hover:text-[#1a2b4e] hover:bg-white border border-white/50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-150 shadow-sm"
              >
                {isArchiving === course.courseId ? (
                  <div className="w-3 h-3 border-2 border-[#ff5b00] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MoreVertical className="w-3.5 h-3.5" />
                )}
              </button>

              {openDropdown === course.courseId && (
                <div
                  className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl border border-gray-100 z-50 overflow-hidden"
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
                      className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-medium text-[#1a2b4e] hover:bg-[#ff5b00]/5 transition-colors"
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

          {/* Card body */}
          <div className="px-5 py-4">
            <h3 className="text-sm font-bold text-[#1a2b4e] line-clamp-2 leading-snug group-hover:text-[#ff5b00] transition-colors">
              {course.title}
            </h3>
            {course.description && (
              <p className="text-xs text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">
                {course.description}
              </p>
            )}
          </div>

          {/* Card footer */}
          <div className="px-5 pb-4 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              #{String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[10px] font-semibold text-[#0c63e4] group-hover:text-[#ff5b00] transition-colors">
              View details →
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
