"use client";

import React, { useState, useEffect, createContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronLeft,
  BookOpen,
  Users,
  Calendar,
  GraduationCap,
  IndianRupee,
} from "lucide-react";
// BookOpen is still used in the tabs array (Details tab icon)
import api from "../../../../../utils/api";

const tabs = [
  { key: "details",   label: "Details",      icon: BookOpen,      path: "details" },
  { key: "curriculum",label: "Curriculum",   icon: GraduationCap, path: "curriculum" },
  { key: "batches",   label: "Batches",      icon: Calendar,      path: "batches" },
  { key: "pricing",   label: "Fee Template", icon: IndianRupee,   path: "pricing-and-publishing" },
  { key: "learners",  label: "Learners",     icon: Users,         path: "learners" },
];

export const BatchesContext = createContext({ batches: [], setBatches: () => {} });

const CourseLayout = ({ children }) => {
  const router   = useRouter();
  const pathname = usePathname();
  const [activeTab,   setActiveTab]   = useState("details");
  const [batches,     setBatches]     = useState([]);
  const [courseTitle, setCourseTitle] = useState("");

  const pathSegments = pathname.split("/").filter(Boolean);
  const courseId     = pathSegments[2];

  useEffect(() => {
    const isOnDirectTab =
      pathSegments.length === 4 &&
      pathSegments[0] === "admin" &&
      pathSegments[1] === "courses";

    if (!isOnDirectTab) return;

    const currentTabPath = pathSegments[3];
    const found = tabs.find((t) => t.path === currentTabPath);
    if (found) {
      setActiveTab(found.key);
    } else {
      setActiveTab("details");
      router.push(`/admin/courses/${courseId}/details`);
    }
  }, [pathname, courseId, router, pathSegments]);

  useEffect(() => {
    if (courseId) {
      api
        .get(`/api/courses/${courseId}`)
        .then((res) => setCourseTitle(res.data?.data?.title || ""))
        .catch(() => setCourseTitle(""));
    }
  }, [courseId]);

  return (
    <BatchesContext.Provider value={{ batches, setBatches }}>
      {/*
        -mx-3 cancels the admin layout's px-3 so the header spans full width.
        No -mt-3 needed — admin main has no padding-top so sticky top-0 is flush.
      */}
      <div className="min-h-screen bg-gray-50 -mx-3">

        {/* Sticky header — full-width, no gap above */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200"
             style={{ boxShadow: "0 1px 0 0 #e5e7eb, 0 2px 8px -2px rgba(26,43,78,0.08)" }}>
          <div className="max-w-5xl mx-auto px-6">

            {/* Course identity row */}
            <div className="flex items-center gap-3 py-3.5">
              <button
                onClick={() => router.back()}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-[#1a2b4e] hover:bg-gray-100 transition-all duration-150"
                aria-label="Go back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Vertical divider */}
              <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

              <div className="min-w-0">
                {courseTitle ? (
                  <h1 className="text-sm font-bold text-[#1a2b4e] truncate leading-tight">
                    {courseTitle}
                  </h1>
                ) : (
                  <div className="sk h-3.5 w-40 rounded" />
                )}
                <div className="flex items-center gap-1.5 mt-1">
                  {courseTitle ? (
                    <>
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Course</span>
                      <span className="text-gray-300">·</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#0c63e4]/8 text-[10px] font-semibold text-[#0c63e4]">
                        #{courseId}
                      </span>
                    </>
                  ) : (
                    <div className="sk h-2.5 w-24 rounded" />
                  )}
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex items-center -mb-px">
              {tabs.map((tab) => {
                const Icon     = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      router.push(`/admin/courses/${courseId}/${tab.path}`);
                    }}
                    className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? "border-[#ff5b00] text-[#ff5b00]"
                        : "border-transparent text-gray-400 hover:text-[#1a2b4e] hover:border-gray-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Page content — same max-width as header inner content */}
        <div className="max-w-5xl mx-auto px-6 py-7">
          {children}
        </div>
      </div>
    </BatchesContext.Provider>
  );
};

export default CourseLayout;
