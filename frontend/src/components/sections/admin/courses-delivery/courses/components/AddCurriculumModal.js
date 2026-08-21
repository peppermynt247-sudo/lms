"use client";
import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import api from "@utils/api";
import { toast } from "react-toastify";
import { title } from "@uiw/react-md-editor";

const AddCurriculumModal = ({
  isOpen,
  onClose,
  onCreateCurriculum,
  courseId,
  initialName = "",
  initialBranch = [],
  initialMaxViewDuration = "unlimited",
  isEditMode = false,
}) => {
  const [curriculumName, setCurriculumName] = useState(initialName);
  const [branch, setBranch] = useState(initialBranch);
  const [maxViewDuration, setMaxViewDuration] = useState(
    initialMaxViewDuration
  );
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isOpen && !hasInitialized.current) {
      setCurriculumName(initialName);
      setBranch(initialBranch);
      setMaxViewDuration(initialMaxViewDuration);
      hasInitialized.current = true;
    } else if (!isOpen) {
      hasInitialized.current = false;
    }
  }, [isOpen, initialName, initialBranch, initialMaxViewDuration]);

  const handleCreate = async () => {
  setSubmitting(true);
  try {
    await onCreateCurriculum({
      name: curriculumName,
      description,
      branch,
      maxViewDuration,
    });
    toast.success("Curriculum created successfully!");
    handleResetAndClose();
  } catch (error) {
    console.error("Error creating curriculum:", error);
    toast.error("Something went wrong while creating the curriculum!");
  } finally {
    setSubmitting(false);
  }
};


  const handleResetAndClose = () => {
    setCurriculumName("");
    setDescription("");
    setBranch([]);
    setMaxViewDuration("unlimited");
    onClose();
  };

  const handleCancel = () => {
    handleResetAndClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      ></div>

      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">
              {isEditMode ? "Update Curriculum" : "Add Curriculum"}
            </h2>
            <p className="text-sm text-gray-500">
              {isEditMode
                ? "Update curriculum details."
                : "Add some basic details to create your course."}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={curriculumName}
              onChange={(e) => setCurriculumName(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg"
              placeholder="Enter curriculum name"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg"
              rows={3}
              placeholder="Enter curriculum description"
            />
          </div>
        </div>

        <div className="flex space-x-3 p-6 border-t">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={submitting || !curriculumName.trim()}
            className="flex-1 px-4 py-2 bg-blue text-white rounded disabled:bg-gray"
          >
            {submitting
              ? "Saving..."
              : isEditMode
              ? "Update Curriculum"
              : "Create Curriculum"}
          </button>
        </div>
      </div>
    </>
  );
};

export default AddCurriculumModal;