// components/courses/CourseHeader.jsx
"use client";

import { Plus, Grid3X3, List, Search, BookOpen } from "lucide-react";

export default function CourseHeader({
  selectedTab,
  onTabChange,
  onCreateCourse,
  viewMode,
  onViewModeChange,
  courseCount,
  searchQuery,
  onSearchChange,
}) {
  return (
    <div className="mb-7">
      {/* Page title row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff5b00]/15 to-[#0c63e4]/10 flex items-center justify-center border border-[#ff5b00]/15 flex-shrink-0">
            <BookOpen className="w-5 h-5 text-[#ff5b00]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a2b4e] leading-tight">Courses</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage and organise your course catalogue</p>
          </div>
        </div>

        {/* New Course CTA */}
        <button
          onClick={onCreateCourse}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#ff5b00] text-white text-sm font-semibold rounded-xl hover:bg-[#e55200] active:scale-95 transition-all duration-150 shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          New Course
        </button>
      </div>

      {/* Controls row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Tab pills */}
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
          <button
            onClick={() => onTabChange("courses")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
              selectedTab === "courses"
                ? "bg-white text-[#1a2b4e] shadow-sm"
                : "text-gray-500 hover:text-[#1a2b4e]"
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => onTabChange("archives")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
              selectedTab === "archives"
                ? "bg-white text-[#1a2b4e] shadow-sm"
                : "text-gray-500 hover:text-[#1a2b4e]"
            }`}
          >
            Archives
          </button>
        </div>

        {/* Count badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ff5b00]/8 border border-[#ff5b00]/15">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff5b00]" />
          <span className="text-xs font-semibold text-[#ff5b00]">
            {courseCount} {selectedTab === "courses" ? "Active" : "Archived"}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-56 pl-9 pr-4 py-2 text-sm border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] placeholder-gray-400 text-[#1a2b4e] transition-colors"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-2 rounded-xl transition-all duration-200 ${
              viewMode === "list"
                ? "bg-[#ff5b00] text-white shadow-sm"
                : "text-gray-500 hover:text-[#1a2b4e]"
            }`}
            aria-label="List view"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-2 rounded-xl transition-all duration-200 ${
              viewMode === "grid"
                ? "bg-[#ff5b00] text-white shadow-sm"
                : "text-gray-500 hover:text-[#1a2b4e]"
            }`}
            aria-label="Grid view"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="mt-5 h-px bg-gradient-to-r from-[#ff5b00]/20 via-gray-200 to-transparent" />
    </div>
  );
}
