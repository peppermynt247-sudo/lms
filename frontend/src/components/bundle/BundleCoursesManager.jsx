"use client";

import React, { useEffect, useState } from "react";
import api from "@utils/api";
import { toast } from "react-toastify";

export default function BundleCoursesManager({ bundleId, title = "Add/Remove Courses from Bundle", onDone }) {
  const [courses, setCourses] = useState([]);
  const [linkedIds, setLinkedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [linkingId, setLinkingId] = useState(null);

  useEffect(() => {
    if (!bundleId) return;
    setLoading(true);
    api
      .get("/api/courses?size=100")
      .then((res) => {
        setCourses(res.data.data?.content || res.data.data || res.data || []);
      })
      .catch(() => setCourses([]));
    api
      .get(`/api/course-bundles/${bundleId}`)
      .then((res) => {
        const bundleCourses = res.data.data?.courses || [];
        setLinkedIds(bundleCourses.map((c) => c.courseId));
      })
      .catch(() => setLinkedIds([]))
      .finally(() => setLoading(false));
  }, [bundleId]);

  const handleLink = async (courseId) => {
    setLinkingId(courseId);
    try {
      await api.post("/api/course-bundles/link", { courseId, bundleId });
      setLinkedIds((prev) => [...prev, courseId]);
      toast.success("Course linked successfully!");
    } catch (err) {
      toast.error("Failed to link course: " + (err.response?.data?.message || err.message));
    } finally {
      setLinkingId(null);
    }
  };

  const handleUnlink = async (courseId) => {
    setLinkingId(courseId);
    try {
      await api.post("/api/course-bundles/unlink", { courseId, bundleId });
      setLinkedIds((prev) => prev.filter((id) => id !== courseId));
      toast.success("Course unlinked successfully!");
    } catch (err) {
      toast.error("Failed to unlink course: " + (err.response?.data?.message || err.message));
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-10">
        <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>
        {loading ? (
          <div className="text-center text-lg py-20">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="text-center text-gray-500 py-20">No courses found.</div>
        ) : (
          <>
            <div
              className="overflow-x-auto"
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                borderRadius: "0.5rem",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <table className="min-w-full table-auto bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left w-16">S. No.</th>
                    <th className="px-4 py-2 text-left">Course Title</th>
                    <th className="px-4 py-2 text-center w-32">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, idx) => (
                    <tr key={course.courseId} className="border-b hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-2 font-medium text-gray-700">{idx + 1}</td>
                      <td className="px-4 py-2 text-gray-900">{course.title}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          style={
                            linkedIds.includes(course.courseId)
                              ? {
                                  background: "#ef4444",
                                  color: "#fff",
                                  border: "1px solid #ef4444",
                                  borderRadius: "0.375rem",
                                  fontWeight: 600,
                                  fontSize: "0.875rem",
                                  padding: "0.25rem 1rem",
                                  transition: "background 0.2s, color 0.2s",
                                }
                              : {
                                  background: "#2563eb",
                                  color: "#fff",
                                  border: "1px solid #2563eb",
                                  borderRadius: "0.375rem",
                                  fontWeight: 600,
                                  fontSize: "0.875rem",
                                  padding: "0.25rem 1rem",
                                  transition: "background 0.2s, color 0.2s",
                                }
                          }
                          disabled={linkingId === course.courseId}
                          onClick={() =>
                            linkedIds.includes(course.courseId)
                              ? handleUnlink(course.courseId)
                              : handleLink(course.courseId)
                          }
                        >
                          {linkingId === course.courseId
                            ? linkedIds.includes(course.courseId)
                              ? "Unlinking..."
                              : "Linking..."
                            : linkedIds.includes(course.courseId)
                            ? "Unlink"
                            : "Link"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-6">
              <button
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: "1px solid #2563eb",
                  borderRadius: "0.375rem",
                  fontWeight: 600,
                  fontSize: "1rem",
                  padding: "0.5rem 2rem",
                  transition: "background 0.2s, color 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
                onClick={() => onDone && onDone()}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


