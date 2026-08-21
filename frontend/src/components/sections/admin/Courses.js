"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@utils/api";
import CourseHeader from "@/components/courses/CourseHeader";
import CoursePagination from "@/components/courses/CoursePagination";
import CreateCourseModal from "@/components/courses/CreateCourseModal";
import CourseListView from "@/components/courses/CourseListView";
import CourseCardView from "@/components/courses/CourseCardView";
import { createInitialFormData } from "@utils/courseUtils";
import { toast } from 'react-toastify';

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState("list");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState("courses");
  const [formData, setFormData] = useState(createInitialFormData());
  const [allCourses, setAllCourses] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [creatingCourse, setCreatingCourse] = useState(false);

  const router = useRouter();
  const coursesPerPage = 15;

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setAuthError(false);
        const endpoint = selectedTab === "courses" ? "/api/courses" : "/api/courses/archived";
        let allCoursesFetched = [];
        let page = 0;
        let totalPages = 1;
        do {
          const response = await api.get(endpoint, {
            params: { page, size: coursesPerPage }
          });
          const responseData = response.data.data;
          allCoursesFetched = allCoursesFetched.concat(responseData?.content || []);
          totalPages = responseData?.totalPages || 1;
          page++;
        } while (page < totalPages);
        setAllCourses(allCoursesFetched);
        setTotalPages(totalPages);
      } catch (error) {
        if (error.response?.status === 401) {
          setAuthError(true);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [refreshKey, selectedTab]);

  const filteredCourses = allCourses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCourse = () => setShowCreateModal(true);

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setFormData(createInitialFormData());
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (courseData) => {
    if (creatingCourse) return; // prevent double submit
    setCreatingCourse(true);
    const formDataToSend = new FormData();
    const courseDetails = {
      title: courseData.courseName,
      prettyName: courseData.prettyName,
      description: courseData.description,
    };

    formDataToSend.append("course", new Blob([JSON.stringify(courseDetails)], { type: "application/json" }));
    if (!courseData.thumbnail) {
      toast.error('Please select a course thumbnail image. It is required.');
      return;
    }
    formDataToSend.append("image", courseData.thumbnail);

    try {
      await api.post("/api/courses", formDataToSend);
      setRefreshKey((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      toast.error(`Failed to create course: ${error.response?.data?.message || error.message}`);
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleCourseUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (query) => setSearchQuery(query);
  const handlePageChange = (page) => setCurrentPage(page);
  const handleViewModeChange = (mode) => setViewMode(mode);
  const handleCourseClick = (courseId) => router.push(`/admin/courses/${courseId}/details`);

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Unauthorized</h2>
        <p className="text-lg text-contentColor mb-2">You are not logged in or your session has expired.</p>
        <button
          className="px-4 py-2 bg-primaryColor text-white rounded hover:bg-primaryColor-dark"
          onClick={() => (window.location.href = "/login")}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="relative p-6 rounded-xl shadow-md overflow-y-auto min-h-screen">
        <CourseHeader
          selectedTab={selectedTab}
          onTabChange={handleTabChange}
          onCreateCourse={handleCreateCourse}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          courseCount={filteredCourses.length}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />

        {loading ? (
          viewMode === "list" ? (
            /* ── List skeleton ── */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
                <div className="col-span-1"><div className="sk h-3 w-6 rounded" /></div>
                <div className="col-span-8"><div className="sk h-3 w-28 rounded" /></div>
                <div className="col-span-3"><div className="sk h-3 w-16 rounded ml-auto" /></div>
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-100 last:border-b-0">
                  <div className="col-span-1"><div className="sk h-3 w-5 rounded" /></div>
                  <div className="col-span-8 flex items-center gap-4">
                    <div className="sk w-14 h-14 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="sk h-3.5 rounded" style={{ width: `${55 + (i % 3) * 15}%` }} />
                      <div className="sk h-2.5 rounded w-3/4" />
                      <div className="sk h-4 w-14 rounded-full" />
                    </div>
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <div className="sk w-7 h-7 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Card skeleton ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="sk w-full h-44 rounded-none" />
                  <div className="px-5 py-4 space-y-2.5">
                    <div className="sk h-4 rounded" style={{ width: `${60 + (i % 3) * 12}%` }} />
                    <div className="sk h-3 rounded w-full" />
                    <div className="sk h-3 rounded w-5/6" />
                  </div>
                  <div className="px-5 pb-4 flex items-center justify-between">
                    <div className="sk h-3 w-8 rounded" />
                    <div className="sk h-3 w-20 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
              <span className="text-3xl">📚</span>
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-[#1a2b4e] mb-1">
                {searchQuery ? "No courses match your search" : "No courses yet"}
              </h3>
              <p className="text-xs text-gray-400">
                {searchQuery ? "Try different keywords" : 'Click "New Course" to create your first one'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {viewMode === "list" ? (
              <CourseListView
                courses={filteredCourses}
                onCourseUpdate={handleCourseUpdate}
                onCourseClick={handleCourseClick}
              />
            ) : (
              <CourseCardView
                courses={filteredCourses}
                onCourseUpdate={handleCourseUpdate}
                onCourseClick={handleCourseClick}
              />
            )}
            <CoursePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      <CreateCourseModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        isSubmitting={creatingCourse}
      />
    </>
  );
}