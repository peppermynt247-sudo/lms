"use client";

import React from "react";
import SectionPreviewCard from "@/components/sections/admin/courses-delivery/courses/components/SectionPreviewCard";
import MaterialPreviewCard from "@/components/sections/admin/courses-delivery/courses/components/MaterialPreviewCard";

export default function ActiveCardOverlays({ activeCard, onCloseSection, onCloseMaterial }) {
  if (!activeCard) return null;
  return (
    <>
      {activeCard.type === "sectionPreview" && (
        <SectionPreviewCard data={activeCard.data} onClose={onCloseSection} />
      )}
      {activeCard.type === "materialPreview" && (
        <MaterialPreviewCard data={activeCard.data} onClose={onCloseMaterial} />
      )}
    </>
  );
}


