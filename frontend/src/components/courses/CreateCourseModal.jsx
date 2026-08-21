// components/courses/CreateCourseModal.jsx
"use client";

import { X, BookOpen } from "lucide-react";
import ThumbnailUpload from "./ThumbnailUpload";
import CourseFormFields from "./CourseFormFields";
import { toast } from "react-toastify";

export default function CreateCourseModal({
  isOpen,
  onClose,
  formData,
  onInputChange,
  onSubmit,
  isSubmitting = false,
}) {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.courseName) {
      toast.warn("Please fill in the Course Name.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1a2b4e]/60 backdrop-blur-sm z-40"
        onClick={onClose}
        style={{ animation: "cmFadeIn 0.2s ease-out" }}
      />

      {/* Slide-in panel */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col"
        style={{ animation: "cmSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <style>{`
          @keyframes cmFadeIn  { from { opacity: 0 } to { opacity: 1 } }
          @keyframes cmSlideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        `}</style>

        {/* Top gradient accent */}
        <div className="h-0.5 w-full bg-gradient-to-r from-[#ff5b00] via-[#f2277e] to-[#0c63e4] flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff5b00]/15 to-[#ff5b00]/5 flex items-center justify-center border border-[#ff5b00]/15">
              <BookOpen className="w-4.5 h-4.5 text-[#ff5b00]" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1a2b4e]">Create Course</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Add basic details to get started</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#1a2b4e] hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all duration-150 disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <ThumbnailUpload
              thumbnail={formData.thumbnail}
              onThumbnailChange={(file) => onInputChange("thumbnail", file)}
            />
            <CourseFormFields formData={formData} onInputChange={onInputChange} />
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold text-gray-500 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-semibold text-white bg-[#ff5b00] rounded-full hover:bg-[#e55200] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating…" : "Create Course"}
          </button>
        </div>
      </div>
    </>
  );
}
