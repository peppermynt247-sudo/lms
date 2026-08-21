"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FaChevronLeft, FaGraduationCap } from "react-icons/fa6";
import api from "../../../../../utils/api";

const CurriculumLayout = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [curriculumName, setCurriculumName] = useState("");

  const pathSegments = pathname.split("/").filter(Boolean);
  let curriculumId = null;

  if (
    pathSegments.length >= 3 &&
    pathSegments[0] === "admin" &&
    pathSegments[1] === "curriculum"
  ) {
    curriculumId = pathSegments[2];
  }

  useEffect(() => {
    if (curriculumId) {
      api
        .get(`/api/curriculums/${curriculumId}`)
        .then((res) => {
          setCurriculumName(
            res.data?.data?.title || res.data?.data?.name || res.data?.title || res.data?.name || ""
          );
        })
        .catch(() => setCurriculumName(""));
    }
  }, [curriculumId]);

  if (!curriculumId) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading curriculum editor...
      </div>
    );
  }

  return (
    <div className="relative p-6 overflow-y-auto min-h-screen">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/admin/curriculum")}
          title="Back to Curriculum list"
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors duration-200"
        >
          <FaChevronLeft className="w-3 h-3" />
        </button>

        <FaGraduationCap className="flex-shrink-0 w-5 h-5 text-[#ff5b00]" />

        <h1 className="text-xl font-bold text-[#1a2b4e] leading-tight truncate">
          {curriculumName || (
            <span className="inline-block h-5 w-52 bg-gray-200 rounded-full animate-pulse align-middle" />
          )}
        </h1>

        {curriculumName && (
          <span className="flex-shrink-0 text-xs text-gray-400 font-medium">
            · ID {curriculumId}
          </span>
        )}
      </div>

      {/* Page content */}
      <div className="mx-auto">{children}</div>
    </div>
  );
};

export default CurriculumLayout;
