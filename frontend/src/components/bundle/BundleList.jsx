"use client";

import React from "react";
import KebabMenu from "@/components/ui/KebabMenu";
import { MoreVertical } from "lucide-react";
import { getImageDataUrl } from "@/lib/image";

export default function BundleList({
  bundles,
  onRowToggle,
  expandedIndex,
  expandedCourses,
  expandedBundleId,
  onUnlinkCourse,
  onEdit,
  onArchive,
  onUnarchive,
  onAddCourses,
  router,
}) {
  if (!Array.isArray(bundles) || bundles.length === 0) {
    return <div>No bundles found.</div>;
  }

  return (
    <table className="min-w-full table-auto rounded-2xl overflow-hidden shadow border border-borderColor bg-white">
      <thead>
        <tr>
          <th className="px-4 py-3 text-left bg-gray-50 font-semibold text-lg">S. No.</th>
          <th className="px-4 py-3 text-left bg-gray-50 font-semibold text-lg" aria-label="Thumbnail"></th>
          <th className="px-4 py-3 text-left bg-gray-50 font-semibold text-lg">Name</th>
          <th className="px-4 py-3 text-left bg-gray-50 font-semibold text-lg">Description</th>
          <th className="px-4 py-3 text-left bg-gray-50 font-semibold text-lg rounded-tr-2xl">Actions</th>
        </tr>
      </thead>
      <tbody>
        {bundles.map((bundle, idx) => (
          <React.Fragment key={bundle.bundleId}>
            <tr
              onClick={(e) => {
                if (e.target.closest("button")) return;
                onRowToggle(idx, bundle);
              }}
              className={`transition-colors duration-200 ${expandedIndex === idx ? "bg-blue-50" : "hover:bg-gray-50"} cursor-pointer`}
              style={{ borderRadius: "1rem" }}
            >
              <td className="px-4 py-3">{idx + 1}</td>
              <td className="px-4 py-3">
                {bundle.thumbnailImage ? (
                  <img
                    src={getImageDataUrl(bundle.thumbnailImage)}
                    alt={bundle.title || "Bundle thumbnail"}
                    className="w-14 h-14 object-cover rounded-lg border"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                      e.target.parentNode.querySelector(".no-image-placeholder").style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 border no-image-placeholder"
                  style={{ display: bundle.thumbnailImage ? "none" : "flex" }}
                >
                  <span className="text-xs">No Image</span>
                </div>
              </td>
              <td className="px-4 py-3">{bundle.title}</td>
              <td className="px-4 py-3">{bundle.description}</td>
              <td className="px-4 py-3 rounded-r-2xl">
                <KebabMenu
                  menuItems={[
                    { label: "Edit", onClick: () => onEdit(bundle) },
                    { label: "Archive", onClick: () => onArchive(bundle) },
                    { label: "Unarchive", onClick: () => onUnarchive(bundle) },
                    { label: "Add Courses", onClick: () => onAddCourses(bundle) },
                  ]}
                  openUpwards={idx === bundles.length - 1}
                >
                  <MoreVertical size={20} />
                </KebabMenu>
              </td>
            </tr>
            {expandedIndex === idx && (
              <tr>
                <td colSpan={7} className="bg-blue-50 px-4 py-2 rounded-b-2xl">
                  <div
                    style={{
                      maxHeight: "300px",
                      overflowY: "auto",
                      border: "1px solid #2563eb",
                      borderRadius: "0.75rem",
                      padding: "1rem",
                      background: "#f8fafc",
                    }}
                  >
                    <h4 className="font-semibold mb-4 text-blue-700">Courses in this bundle:</h4>
                    {expandedCourses.length > 0 ? (
                      <table className="min-w-full table-auto rounded-2xl overflow-hidden border border-gray-200 bg-white">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left bg-gray-50 font-semibold text-base rounded-tl-2xl">S. No.</th>
                            <th className="px-4 py-3 text-left bg-gray-50 font-semibold text-base">Title</th>
                            <th className="px-4 py-3 text-left bg-gray-50 font-semibold text-base">Description</th>
                            <th className="px-4 py-3 text-left bg-gray-50 font-semibold text-base rounded-tr-2xl">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expandedCourses.map((course, cidx) => (
                            <tr
                              key={course.id || course.courseId || cidx}
                              className={cidx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                              style={{ cursor: "pointer" }}
                              onClick={() => router.push(`/admin/courses/${course.courseId || course.id}/details`)}
                            >
                              <td className="px-4 py-3">{cidx + 1}</td>
                              <td className="px-4 py-3">{course.title || course.name || `Course ${cidx + 1}`}</td>
                              <td className="px-4 py-3">{course.description || "-"}</td>
                              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                <KebabMenu
                                  menuItems={[
                                    {
                                      label: "Unlink",
                                      onClick: () => onUnlinkCourse(expandedBundleId, course.courseId || course.id),
                                    },
                                  ]}
                                >
                                  <MoreVertical size={18} />
                                </KebabMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-gray-500 italic">No courses linked to this bundle.</div>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}


