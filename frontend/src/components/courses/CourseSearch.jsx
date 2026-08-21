// components/courses/CourseSearch.jsx
"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function CourseSearch({ searchQuery, onSearchChange }) {
  return (
    <div className="relative w-64 mb-6">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-contentColor dark:text-contentColor-dark w-5 h-5 opacity-70" />
      <Input
        type="text"
        placeholder="Search courses..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-12 pr-4 py-3 h-9 bg-whitegrey2/80 dark:bg-darkdeep1/80 backdrop-blur-xl border border-borderColor dark:border-borderColor-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-primaryColor focus:border-transparent transition-all duration-300 text-contentColor dark:text-contentColor-dark placeholder-opacity-50"
        aria-label="Search courses"
      />
    </div>
  );
}