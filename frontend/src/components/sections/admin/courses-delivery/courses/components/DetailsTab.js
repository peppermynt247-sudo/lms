"use client";
import React, { useState } from "react";
import {
  ImagePlus,
  X,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  BookOpen,
  FileText,
  AlignLeft,
  Tag,
} from "lucide-react";

const DetailsTab = ({
  courseData,
  thumbnailUrl,
  handleInputChange,
  handleImageUpload,
  removeImage,
  handleSave,
  isDirty,
  saving,
  success,
  error,
}) => {
  const [thumbnailError, setThumbnailError] = useState("");
  const [dragActive,     setDragActive]     = useState(false);
  const [editThumb,      setEditThumb]      = useState(false);

  const onSave = (e) => {
    e.preventDefault();
    if (!thumbnailUrl && !courseData?.thumbnailUrl) {
      setThumbnailError("Please upload a course thumbnail image.");
      return;
    }
    setThumbnailError("");
    handleSave();
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) {
      handleImageUpload(file);
      setThumbnailError("");
      setEditThumb(false);
    }
  };

  const showUploader = !thumbnailUrl || editThumb;

  const inputClass =
    "w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors placeholder-gray-400 text-[#1a2b4e] bg-white";
  const labelClass =
    "flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2";

  return (
    <div className="space-y-5">

      {/* ── Thumbnail card ── */}
      <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
        thumbnailError ? "border-red-300" : "border-gray-200"
      }`}>
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#ff5b00]/10 flex items-center justify-center">
              <ImagePlus className="w-3.5 h-3.5 text-[#ff5b00]" />
            </div>
            <span className="text-xs font-bold text-[#1a2b4e] uppercase tracking-wide">
              Thumbnail Image
            </span>
            <span className="text-[#ff5b00] text-xs font-bold">*</span>
          </div>
          {thumbnailUrl && !editThumb && (
            <button
              type="button"
              onClick={() => setEditThumb(true)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#0c63e4] bg-[#0c63e4]/8 rounded-full hover:bg-[#0c63e4]/15 transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Replace
            </button>
          )}
        </div>

        <div className="p-5">
          {/* Preview */}
          {thumbnailUrl && !editThumb ? (
            <div className="flex items-start gap-5">
              <div className="relative group flex-shrink-0">
                <img
                  src={thumbnailUrl}
                  alt="Course thumbnail"
                  className="w-56 h-36 object-cover rounded-xl border border-gray-200 shadow-sm"
                  onError={(e) => { e.target.onerror = null; e.target.src = "/images/course-sample.jpg"; }}
                />
                <button
                  type="button"
                  onClick={() => { removeImage(); setEditThumb(false); }}
                  className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 shadow-sm transition-all duration-150 opacity-0 group-hover:opacity-100"
                  aria-label="Remove thumbnail"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="pt-1">
                <p className="text-xs font-semibold text-[#1a2b4e]">Thumbnail set</p>
                <p className="text-xs text-gray-400 mt-1">
                  Click <span className="font-semibold text-[#0c63e4]">Replace</span> to upload a new image, or hover the thumbnail to remove it.
                </p>
              </div>
            </div>
          ) : (
            /* Upload zone */
            <label
              className={`flex flex-col items-center justify-center gap-3 w-full h-36 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                dragActive
                  ? "border-[#ff5b00] bg-[#ff5b00]/5"
                  : thumbnailError
                  ? "border-red-300 bg-red-50/40"
                  : "border-gray-200 bg-gray-50 hover:border-[#ff5b00]/50 hover:bg-[#ff5b00]/3"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                dragActive ? "bg-[#ff5b00]/12" : "bg-gray-100"
              }`}>
                <ImagePlus className={`w-5 h-5 ${dragActive ? "text-[#ff5b00]" : "text-gray-400"}`} />
              </div>
              <div className="text-center">
                <p className={`text-xs font-semibold ${dragActive ? "text-[#ff5b00]" : "text-gray-600"}`}>
                  Click or drag to upload
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG, WebP — max 10 MB</p>
              </div>
              {editThumb && thumbnailUrl && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setEditThumb(false); }}
                  className="text-xs text-[#0c63e4] hover:underline"
                >
                  Cancel
                </button>
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImageUpload(e.target.files[0]);
                    setThumbnailError("");
                    setEditThumb(false);
                  }
                }}
              />
            </label>
          )}
          {thumbnailError && (
            <p className="flex items-center gap-1.5 text-xs text-red-500 font-medium mt-2">
              <AlertCircle className="w-3.5 h-3.5" />
              {thumbnailError}
            </p>
          )}
        </div>
      </div>

      {/* ── Course details card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
          <div className="w-6 h-6 rounded-lg bg-[#0c63e4]/10 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-[#0c63e4]" />
          </div>
          <span className="text-xs font-bold text-[#1a2b4e] uppercase tracking-wide">
            Course Details
          </span>
        </div>

        <div className="p-5 space-y-5">

          {/* Course Name */}
          <div>
            <label className={labelClass}>
              <FileText className="w-3 h-3" />
              Course Name <span className="text-[#ff5b00]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={courseData?.title || ""}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={inputClass}
                placeholder="Enter course name"
                maxLength={350}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium pointer-events-none">
                {courseData?.title?.length || 0}/350
              </span>
            </div>
          </div>

          {/* Pretty Name */}
          <div>
            <label className={labelClass}>
              <Tag className="w-3 h-3" />
              Pretty Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={courseData?.prettyName || ""}
                onChange={(e) => handleInputChange("prettyName", e.target.value)}
                className={inputClass}
                placeholder="e.g. react-basics"
                maxLength={50}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium pointer-events-none">
                {courseData?.prettyName?.length || 0}/50
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Used in URLs — lowercase, no spaces.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>
              <AlignLeft className="w-3 h-3" />
              Description
            </label>
            <div className="relative">
              <textarea
                value={courseData?.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                className={`${inputClass} resize-none`}
                placeholder="A short description of your course"
                maxLength={2000}
              />
              <span className="absolute right-3 bottom-3 text-[10px] text-gray-400 font-medium pointer-events-none">
                {courseData?.description?.length || 0}/2000
              </span>
            </div>
          </div>

          {/* Overview */}
          <div>
            <label className={labelClass}>
              <BookOpen className="w-3 h-3" />
              Overview
            </label>
            <textarea
              value={courseData?.overview || ""}
              onChange={(e) => handleInputChange("overview", e.target.value)}
              rows={5}
              className={`${inputClass} resize-none`}
              placeholder="Detailed overview of what students will learn"
            />
          </div>
        </div>
      </div>

      {/* ── Save bar ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            {success && !error && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                Saved successfully
              </div>
            )}
            {error && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            {!success && !error && isDirty && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </span>
            )}
            {!isDirty && !success && !error && (
              <span className="text-xs text-gray-400 font-medium">No unsaved changes</span>
            )}
          </div>

          <button
            onClick={onSave}
            disabled={!isDirty || saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#ff5b00] rounded-full hover:bg-[#e55200] active:scale-95 transition-all duration-150 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

    </div>
  );
};

export default DetailsTab;
