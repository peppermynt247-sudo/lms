"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import api from "@utils/api";

const Discussions = () => {
  const router = useRouter();
  const [discussions, setDiscussions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  useEffect(() => {
    const fetchDiscussions = async () => {
      try {
        const res = await api.get("/api/discussion-forums");
        setDiscussions(res.data);
      } catch (err) {
        console.error("Error fetching discussions:", err);
      }
    };

    const fetchCourses = async () => {
      try {
        const res = await api.get("/api/courses");
        setCourses(res.data.data.content);
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };

    fetchDiscussions();
    fetchCourses();
  }, []);

  const handleDelete = async (forumId) => {
    try {
      await api.delete(`/api/discussion-forums/${forumId}`);
      setDiscussions((prev) => prev.filter((d) => d.forumId !== forumId));
    } catch (err) {
      console.error("Failed to delete discussion:", err);
    }
  };

  const handleNavigate = (forumId) => {
    router.push(`/admin/discussions/${forumId}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Discussions</h1>

      {/* Course Package Dropdown */}
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-medium">Select Course</label>
        <div className="relative">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="appearance-none border border-gray-300 px-4 py-2 rounded shadow-sm text-sm"
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
            <option key={course.courseId} value={course.courseId}>
                {course.title}
            </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Discussions Table */}
      <table className="min-w-full bg-white border rounded text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-2 border-b">S.No.</th>
            <th className="text-left p-2 border-b">Title</th>
            <th className="text-left p-2 border-b">Last Updates</th>
            <th className="text-left p-2 border-b">No. of Comments</th>
            <th className="text-left p-2 border-b">Course/Material</th>
            <th className="text-left p-2 border-b">Action</th>
          </tr>
        </thead>
        <tbody>
          {discussions
            .filter((d) => !selectedCourseId || d.courseId == selectedCourseId)
            .map((item, index) => (
              <tr
                key={item.forumId}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="p-2">{String(index + 1).padStart(2, "0")}</td>
                <td className="p-2">
                  <div
                    onClick={() => handleNavigate(item.forumId)}
                    className="text-blue-600 font-medium cursor-pointer hover:underline"
                  >
                    {item.content}
                  </div>
                  <div className="text-sm text-gray-600">
                    Author: {item.userName}
                  </div>
                  {!item.isActive && (
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded mt-1 inline-block">
                      Disapproved
                    </span>
                  )}
                </td>
                <td className="p-2">
                  {new Date(item.updatedAt).toLocaleString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="p-2">{item.replies.length}</td>
                <td className="p-2">
                  {item.courseName} / {item.batchName}
                </td>
                <td className="p-2 space-x-2">
                  <button
                    className={`text-white text-xs font-semibold px-3 py-1 rounded ${item.isActive ? "bg-yellow-500" : "bg-blue-600"}`}
                  >
                    {item.isActive ? "Disapprove" : "Approve"}
                  </button>
                  <button
                    className="bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded"
                    onClick={() => handleDelete(item.forumId)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default Discussions;
