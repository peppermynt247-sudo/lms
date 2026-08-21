"use client";

import React from "react";
import KebabMenu from "@/components/ui/KebabMenu";
import { MoreVertical } from "lucide-react";
import { getImageDataUrl } from "@/lib/image";

export default function BundleGrid({ bundles, onEdit, onArchive, onUnarchive, onAddCourses }) {
  if (!Array.isArray(bundles) || bundles.length === 0) {
    return <div>No bundles found.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bundles.map((bundle) => (
        <div key={bundle.bundleId} className="bg-white rounded-2xl shadow p-6 flex flex-col gap-2 border border-borderColor">
          {bundle.thumbnailImage ? (
            <img
              src={getImageDataUrl(bundle.thumbnailImage)}
              alt={bundle.title || "Bundle thumbnail"}
              className="w-24 h-24 object-cover rounded-xl border mb-2 self-center"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
                e.target.parentNode.querySelector(".no-image-placeholder").style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 border mb-2 self-center no-image-placeholder"
            style={{ display: bundle.thumbnailImage ? "none" : "flex" }}
          >
            <span className="text-xs">No Image</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-primaryColor">{bundle.title}</span>
            <KebabMenu
              menuItems={[
                { label: "Edit", onClick: () => onEdit(bundle) },
                { label: "Archive", onClick: () => onArchive(bundle) },
                { label: "Unarchive", onClick: () => onUnarchive(bundle) },
                { label: "Add Courses", onClick: () => onAddCourses(bundle) },
              ]}
            >
              <MoreVertical size={20} />
            </KebabMenu>
          </div>
          <p className="mb-1 text-gray-700">{bundle.description}</p>
        </div>
      ))}
    </div>
  );
}


