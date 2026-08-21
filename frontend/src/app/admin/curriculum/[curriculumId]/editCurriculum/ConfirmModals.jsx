"use client";

import React from "react";
import ConfirmationModal from "@/components/sections/admin/courses-delivery/courses/components/ConfirmationModal";

export default function ConfirmModals({ activeModal, onClose, onConfirmDeleteSection, onConfirmDeleteMaterial }) {
  if (!activeModal) return null;
  return (
    <ConfirmationModal
      type={activeModal.type}
      data={activeModal.data}
      onClose={onClose}
      {...(activeModal.type === "deleteSection"
        ? { onConfirmDeleteSection }
        : { onConfirmDeleteMaterial })}
    />
  );
}


