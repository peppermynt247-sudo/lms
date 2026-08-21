'use client';
import React, { useEffect, useState } from "react"
import StudentMyCoursesServices from "@/services/MyCoursesServices"
import CourseCard from "@/components/shared/Cards/CourseCard"
import { BookOpen } from "lucide-react"



const MyCourses = () => {

 const [myCourseData, setCourseData] = useState({ courses: [],
 bundles: [] });
 const [loading, setLoading] = useState(true);
  const totalCourses = myCourseData.courses.length
  const totalBundles = myCourseData.bundles.length
  const activeCourses = myCourseData.courses.filter((course) => course.paymentStatus === "COMPLETED").length
  const activeBundles = myCourseData.bundles.filter((bundle) => bundle.paymentStatus === "COMPLETED").length


  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await StudentMyCoursesServices.getCourses();
        setCourseData(response);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Section header skeleton */}
          <div className="flex items-center gap-3 mb-8">
            <div className="sk w-1 h-7 rounded-full" />
            <div className="sk h-7 w-32 rounded-lg" />
            <div className="sk h-5 w-20 rounded-full ml-2" />
          </div>
          {/* Card grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100"
                style={{ boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" }}
              >
                {/* Thumbnail */}
                <div className="sk h-40 rounded-none" />
                <div className="p-5 space-y-3">
                  <div className="sk h-5 rounded w-3/4" />
                  <div className="sk h-3.5 rounded w-full" />
                  <div className="sk h-3.5 rounded w-2/3" />
                  <div className="flex gap-2 pt-1">
                    <div className="sk h-5 rounded-full w-16" />
                    <div className="sk h-5 rounded-full w-14" />
                  </div>
                  <div className="sk h-10 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  
  if (myCourseData.courses.length === 0 && myCourseData.bundles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-6 max-w-sm">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(255,91,0,0.08)" }}
          >
            <BookOpen className="w-7 h-7 text-[#ff5b00]" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-bold text-[#1a2b4e] mb-1">No Courses Found</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            You haven't enrolled in any courses yet. Explore available programmes to get started.
          </p>
        </div>
      </div>
    )
  }

  /* ── Section header component ── */
  const SectionHeader = ({ title, count, unit }) => (
    <div className="flex items-center gap-3 mb-7">
      {/* Brand gradient accent bar */}
      <div className="w-1 h-7 rounded-full flex-shrink-0 bg-[#ff5b00]" />
      <h2 className="text-xl font-bold text-[#1a2b4e]">{title}</h2>
      <span
        className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border ml-1"
        style={{
          background:  "rgba(255,91,0,0.08)",
          color:        "#ff5b00",
          borderColor: "rgba(255,91,0,0.15)",
        }}
      >
        {count} {unit}
      </span>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Bundles */}
        {totalBundles > 0 && (
          <div className="mb-12">
            <SectionHeader title="My Bundles" count={totalBundles} unit="bundles" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCourseData.bundles.map((bundle) => (
                <CourseCard key={bundle.bundleId} item={bundle} isBundle={true} />
              ))}
            </div>
          </div>
        )}

        {/* Courses */}
        {totalCourses > 0 && (
          <div>
            <SectionHeader title="My Courses" count={totalCourses} unit="courses" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCourseData.courses.map((course) => (
                <CourseCard key={course.courseId} item={course} isBundle={false} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default MyCourses
