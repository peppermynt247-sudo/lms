// components/courses/CoursePagination.jsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CoursePagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 mt-7">
      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-[#1a2b4e] hover:border-[#ff5b00]/40 hover:bg-[#ff5b00]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {/* Page numbers */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all duration-150 ${
            currentPage === page
              ? "bg-[#ff5b00] text-white shadow-sm"
              : "border border-gray-200 text-gray-500 hover:border-[#ff5b00]/40 hover:text-[#ff5b00] hover:bg-[#ff5b00]/5"
          }`}
          aria-label={`Go to page ${page}`}
        >
          {page}
        </button>
      ))}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-[#1a2b4e] hover:border-[#ff5b00]/40 hover:bg-[#ff5b00]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
        aria-label="Next page"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
