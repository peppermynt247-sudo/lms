"use client";

import React from "react";
import Sidebar from "@/components/sections/admin/courses-delivery/courses/components/Sidebar";

export default function ActiveSidebar({ activeSidebar, onClose, onSave, allSections, courseData }) {
  if (!activeSidebar) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} style={{ zIndex: 0 }} />
      <div className="ml-auto z-10">
        {activeSidebar.type === "editEbook" ? (
          <React.Suspense fallback={<div>Loading...</div>}>
            {React.createElement(
              require("@/components/sections/admin/courses-delivery/courses/components/sidebars/EditEbookSidebar").default,
              {
                initialData: activeSidebar.data,
                onSave: (data) => {
                  onSave("editMaterial", data, activeSidebar.data);
                },
                onClose,
              }
            )}
          </React.Suspense>
        ) : (
          <Sidebar
            sidebarType={activeSidebar.type}
            sidebarData={activeSidebar.data}
            sidebarSize={activeSidebar.size}
            onSelectMaterialType={activeSidebar.onSelectMaterialType}
            onClose={onClose}
            onSave={onSave}
            allSectionsForClone={allSections}
            currentCourseSections={courseData.map((s) => ({ id: s.id, title: s.title }))}
          />
        )}
      </div>
    </div>
  );
}


