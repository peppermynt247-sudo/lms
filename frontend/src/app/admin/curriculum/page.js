"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import CurriculumTab from "@/components/sections/admin/courses-delivery/courses/components/CurriculumTab";
import AddCurriculumModal from "@/components/sections/admin/courses-delivery/courses/components/AddCurriculumModal";
import api, { deleteCurriculum as deleteCurriculumApi } from "../../../../utils/api";

export default function CurriculumPage() {
  const [curriculums, setCurriculums] = useState([]);
  const [isAddCurriculumModalOpen, setIsAddCurriculumModalOpen] = useState(false);
  const [isEditCurriculumModalOpen, setIsEditCurriculumModalOpen] = useState(false);
  const [editCurriculum, setEditCurriculum] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, curriculum: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCurriculums = async () => {
      setLoading(true);
      setError("");
      try {
        let token = null;
        if (typeof window !== 'undefined') {
          token = localStorage.getItem('authToken');
        }
        const response = await api.get("/api/curriculums");
        setCurriculums(response.data.data.map(c => ({
          ...c,
          id: c.id || c.curriculumId,
          name: c.name || c.title,
          sectionCount: c.numberOfSections ?? c.sectionCount ?? 0,
        })));
      } catch (err) {
        setError("Failed to load curriculums");
      } finally {
        setLoading(false);
      }
    };
    fetchCurriculums();
  }, []);

  const memoizedEditCurriculum = useMemo(() => editCurriculum, [editCurriculum?.id, editCurriculum?.name]);

  const editModalInitialValues = useMemo(() => ({
    initialName: memoizedEditCurriculum?.name || "",
    initialBranch: [],
    initialMaxViewDuration: "unlimited"
  }), [memoizedEditCurriculum?.name]);

  const handleAddCurriculum = useCallback(() => {
    setIsAddCurriculumModalOpen(true);
  }, []);

  const handleCreateCurriculum = useCallback(async (curriculumData) => {
    setLoading(true);
    setError("");
    try {
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('authToken');
      }

      await api.post("/api/curriculums", {
        title: curriculumData.name,
        description: curriculumData.description || "",
        version: "v1",
        isActive: true
      });
      const response = await api.get("/api/curriculums");
      setCurriculums(response.data.data.map(c => ({
        ...c,
        id: c.id || c.curriculumId,
        name: c.name || c.title,
        sectionCount: c.numberOfSections ?? c.sectionCount ?? 0,
      })));
      setIsAddCurriculumModalOpen(false);
    } catch (err) {
      setError("Failed to create curriculum", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEditCurriculum = useCallback((curriculum) => {
    setEditCurriculum(curriculum);
    setIsEditCurriculumModalOpen(true);
  }, []);

  const handleUpdateCurriculum = useCallback(async (updatedData) => {
    setLoading(true);
    setError("");
    try {
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('authToken');
      }
    
      await api.patch(`/api/curriculums/${editCurriculum.id}`, {
        title: updatedData.name,
        description: updatedData.description || "",
        version: "v1",
        isActive: true
      });
      // Refresh the curriculum list
      const response = await api.get("/api/curriculums");
      setCurriculums(response.data.data.map(c => ({
        ...c,
        id: c.id || c.curriculumId,
        name: c.name || c.title,
        sectionCount: c.numberOfSections ?? c.sectionCount ?? 0,
      })));
      setIsEditCurriculumModalOpen(false);
      setEditCurriculum(null);
    } catch (err) {
      setError("Failed to update curriculum");
    } finally {
      setLoading(false);
    }
  }, [editCurriculum?.id]);

  const handleDeleteCurriculum = useCallback((curriculum) => {
    setDeleteConfirm({ open: true, curriculum });
  }, []);

  const confirmDeleteCurriculum = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('authToken');
      }
      await deleteCurriculumApi(deleteConfirm.curriculum.id);
      // Refresh the curriculum list
      const response = await api.get("/api/curriculums");
      setCurriculums(response.data.data.map(c => ({
        ...c,
        id: c.id || c.curriculumId,
        name: c.name || c.title,
        sectionCount: c.numberOfSections ?? c.sectionCount ?? 0,
      })));
      setDeleteConfirm({ open: false, curriculum: null });
    } catch (err) {
      setError("Failed to delete curriculum");
    } finally {
      setLoading(false);
    }
  }, [deleteConfirm.curriculum?.id]);

  const handleCloseAddModal = useCallback(() => {
    setIsAddCurriculumModalOpen(false);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditCurriculumModalOpen(false);
    setEditCurriculum(null);
  }, []);

  const handleCloseDeleteConfirm = useCallback(() => {
    setDeleteConfirm({ open: false, curriculum: null });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Curriculum</h1>
      <p className="mb-6 text-gray-600">Manage all your course curriculum in one place.</p>
      {loading && <div className="mb-4 text-blue-600">Loading curriculums...</div>}
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <CurriculumTab
        curriculums={curriculums}
        onAddCurriculum={handleAddCurriculum}
        onEditCurriculum={handleEditCurriculum}
        onDeleteCurriculum={handleDeleteCurriculum}
      />
      <AddCurriculumModal
        isOpen={isAddCurriculumModalOpen}
        onClose={handleCloseAddModal}
        onCreateCurriculum={handleCreateCurriculum}
      />
      {/* Edit Curriculum Modal (reuse AddCurriculumModal for now) */}
      {isEditCurriculumModalOpen && memoizedEditCurriculum && (
        <AddCurriculumModal
          isOpen={isEditCurriculumModalOpen}
          onClose={handleCloseEditModal}
          onCreateCurriculum={handleUpdateCurriculum}
          initialName={editModalInitialValues.initialName}
          initialBranch={editModalInitialValues.initialBranch}
          initialMaxViewDuration={editModalInitialValues.initialMaxViewDuration}
          isEditMode={true}
        />
      )}
      {/* Delete Confirmation Dialog */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Delete Curriculum</h2>
            <p className="mb-6">Are you sure you want to delete <span className="font-bold">{deleteConfirm.curriculum.name}</span>?</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={handleCloseDeleteConfirm}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={confirmDeleteCurriculum}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
