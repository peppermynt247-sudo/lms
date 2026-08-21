"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation"; 
import CurriculumTab from "@/components/sections/admin/courses-delivery/courses/components/CurriculumTab";
import AddCurriculumModal from "@/components/sections/admin/courses-delivery/courses/components/AddCourseCurriculum";
import UpdateCurriculumSidebar from "@/components/sections/admin/courses-delivery/courses/components/UpdateCurriculumSidebar";
import api from "@utils/api";
import { toast } from "react-toastify";

const CurriculumPage = ({ courseId: propCourseId }) => {
  const params = useParams();
  const dynamicCourseId = params?.courseId || propCourseId || 1; 
  const [curriculums, setCurriculums] = useState([]);
  const [defaultCurriculumId, setDefaultCurriculumId] = useState(null);
  const [isAddCurriculumModalOpen, setIsAddCurriculumModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditSidebarOpen, setIsEditSidebarOpen] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const fetchCourseCurriculums = async () => {
      try {
        const [curriculumsRes, courseRes] = await Promise.all([
          api.get(`/api/curriculums/course/${dynamicCourseId}`),
          api.get(`/api/courses/${dynamicCourseId}`),
        ]);

        if (curriculumsRes.data?.success) {
          const rawCurriculums = Array.isArray(curriculumsRes.data.data) ? curriculumsRes.data.data : [];
          const fetchedCurriculums = rawCurriculums.map((c) => ({
            id: c.curriculumId,
            name: c.title,
            sectionCount: c.numberOfSections ?? 0,
          }));
          setCurriculums(fetchedCurriculums);
        }

        if (courseRes.data?.success) {
          setDefaultCurriculumId(courseRes.data.data?.defaultCurriculumId ?? null);
        }
      } catch (error) {
        // Error fetching course curriculums
      } finally {
        setLoading(false);
      }
    };
    fetchCourseCurriculums();
  }, [dynamicCourseId]);

  const handleAddCurriculum = useCallback(() => {
    setIsAddCurriculumModalOpen(true);
  }, []);

  const handleCreateCurriculum = useCallback(
    (curriculumData) => {
      const newCurriculum = {
        id: curriculumData.id || curriculumData.curriculumId || curriculums.length + 1,
        name: curriculumData.name || curriculumData.title,
        sectionCount: curriculumData.numberOfSections ?? curriculumData.sectionCount ?? 0,
      };
      setCurriculums((prev) => [...prev, newCurriculum]);
      setDefaultCurriculumId((prev) => prev ?? newCurriculum.id);
    },
    [curriculums.length]
  );

  const handleUnlinkCurriculum = useCallback(async (curriculum) => {
    try {
      const response = await api.delete(`/api/courses/${dynamicCourseId}/curriculums/${curriculum.id}`);
      setCurriculums((prev) => prev.filter((c) => c.id !== curriculum.id));
      const updatedDefaultId = response?.data?.data?.defaultCurriculumId;
      if (updatedDefaultId !== undefined && updatedDefaultId !== null) {
        setDefaultCurriculumId(updatedDefaultId);
      } else {
        setDefaultCurriculumId((prev) => (prev === curriculum.id ? null : prev));
      }
    } catch (error) {
      toast.error('Failed to unlink curriculum.');
    }
  }, [dynamicCourseId]);

  const handleMakeDefaultCurriculum = useCallback(async (curriculum) => {
    try {
      const response = await api.put(
        `/api/courses/${dynamicCourseId}/curriculums/${curriculum.id}/set-default`
      );
      const updatedDefaultId = response?.data?.data?.defaultCurriculumId;
      setDefaultCurriculumId(updatedDefaultId ?? curriculum.id);
      toast.success("Default curriculum updated.");
    } catch (error) {
      toast.error("Failed to update default curriculum.");
    }
  }, [dynamicCourseId]);

  const handleEditCurriculum = useCallback((curriculum) => {
    setEditingCurriculum(curriculum);
    setIsEditSidebarOpen(true);
  }, []);

  const handleUpdateCurriculum = async (updated) => {
    if (!editingCurriculum) return;
    setEditLoading(true);
    try {
      // Update API call (if needed)
      await api.patch(`/api/curriculums/${editingCurriculum.id}`, {
        title: updated.name,
        description: updated.description,
      });
      setCurriculums((prev) =>
        prev.map((c) =>
          c.id === editingCurriculum.id
            ? { ...c, name: updated.name, description: updated.description }
            : c
        )
      );
      setIsEditSidebarOpen(false);
      setEditingCurriculum(null);
    } catch (e) {
      toast.error("Failed to update curriculum");
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseModal = useCallback(() => {
    setIsAddCurriculumModalOpen(false);
  }, []);
  if (loading) return (
    <div className="space-y-5">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="sk h-4 w-28 rounded" />
          <div className="sk h-5 w-16 rounded-full" />
        </div>
        <div className="sk h-9 w-36 rounded-xl" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
          {[["col-span-1","w-4"],["col-span-7","w-32"],["col-span-2","w-16"],["col-span-2","w-12 ml-auto"]].map(([col, w], i) => (
            <div key={i} className={col}><div className={`sk h-2.5 ${w} rounded`} /></div>
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-100 last:border-b-0">
            <div className="col-span-1"><div className="sk h-3 w-5 rounded" /></div>
            <div className="col-span-7 flex items-center gap-2">
              <div className="sk h-3.5 rounded" style={{ width: `${45 + (i % 4) * 12}%` }} />
              <div className="sk h-3 w-3 rounded" />
            </div>
            <div className="col-span-2"><div className="sk h-5 w-20 rounded-full" /></div>
            <div className="col-span-2 flex justify-end"><div className="sk w-7 h-7 rounded-full" /></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <CurriculumTab 
        curriculums={curriculums} 
        defaultCurriculumId={defaultCurriculumId}
        onAddCurriculum={handleAddCurriculum}
        onDeleteCurriculum={handleUnlinkCurriculum}
        onEditCurriculum={handleEditCurriculum}
        onMakeDefault={handleMakeDefaultCurriculum}
        deleteLabel="Unlink"
      />
      <AddCurriculumModal
        isOpen={isAddCurriculumModalOpen}
        onClose={handleCloseModal}
        onCreateCurriculum={handleCreateCurriculum}
        courseId={dynamicCourseId}
        linkedCurriculumIds={curriculums.map((c) => c.id)}
      />
      <UpdateCurriculumSidebar
        isOpen={isEditSidebarOpen}
        onClose={() => { setIsEditSidebarOpen(false); setEditingCurriculum(null); }}
        onUpdateCurriculum={handleUpdateCurriculum}
        initialName={editingCurriculum?.name || ""}
        initialDescription={editingCurriculum?.description || ""}
        loading={editLoading}
      />
    </>
  );
};

export default CurriculumPage;
