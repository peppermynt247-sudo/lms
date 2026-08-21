"use client";

import React, { useEffect, useState } from "react";
import AddBatchModal from "@/components/sections/admin/batches/Components/AddBatchModal";
import BatchTable from "@/components/sections/admin/batches/Section/batchTable";
import api from "@utils/api";
import {toast} from "react-toastify";
import EditBundleBatchModal from "@/components/sections/admin/batches/Components/EditBundleBatchModal";
import EditCourseBatchModal from "@/components/sections/admin/batches/Components/EditCourseBatchModal";

const Batches = () => {
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [initialData, setInitialData] = useState(null);
  const [course, setCourse] = useState([]);
  const [instructor, setInstructor] = useState([]);
  const [editModalType, setEditModalType] = useState(null); // 'bundle' | 'course' | null
  const [bundleData, setBundleData] = useState([]);

  const fetchData = async () => {
    try {
      const res = await api.get("/api/batches");
      const rawData = res.data?.data?.content || [];

      const transformed = rawData.map((b) => ({
        ...b,
        id: b.batchId,
        name: b.batchName,
        batchManager: b.batchManager?.name || "N/A",
        curriculumTitle:
          b.courses?.map((c) => c.curriculums?.[0]?.title || "-").join(", ") || "-",
        courses: b.courses || [],
      }));

      setBatch(transformed);
    } catch (err) {
      console.error("Failed to fetch batches", err);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchData(),
      api.get("/api/courses").then((res) => setCourse(res.data?.data?.content || [])),
      api.get("/api/admin/getadminsandinstructors").then((res) => setInstructor(res.data || [])),
      api.get("/api/course-bundles").then((res) => setBundleData(Array.isArray(res.data) ? res.data : (res.data.data || []))),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
  if (modalMode === "edit" && initialData) {
  }
}, [initialData, modalMode]);


  const handleAddBatch = () => {
    setModalMode("create");
    setInitialData(null);
    setIsModalOpen(true);
  };

  const handleEditBatch = (batchData) => {
    setModalMode("edit");
    setInitialData(batchData);
    // Detect type: if batchData has bundleId or bundle property, it's a bundle batch
    if (batchData.bundleId || batchData.bundle) {
      setEditModalType("bundle");
    } else {
      setEditModalType("course");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setInitialData(null);
    setEditModalType(null);
  };

  const handleCreateOrUpdateBatch = async (data, apiEndpoint = "/api/batches") => {
    try {
      if (modalMode === "edit") {
        await api.put(`/api/batches/${data.batchId}`, data);
      } else {
        await api.post(apiEndpoint, data);
      }
      await fetchData();
    } catch (err) {
      toast.error("Failed to create/update batch.");
    } finally {
      setIsModalOpen(false);
      setInitialData(null);
    }
  };

  const handleUpdateBatch = async (data) => {
    try {
      await api.put(`/api/batches/${data.batchId}`, data);
      await fetchData();
    } catch (err) {
      toast.error("Failed to update batch.");
    } finally {
      setIsModalOpen(false);
      setInitialData(null);
      setEditModalType(null);
    }
  };

  const handleDelete = async (batchId) => {
    try {
      await api.delete(`/api/batches/${batchId}`);
      toast.success("Batch deleted successfully");
      setBatch((prev) => prev.filter((b) => b.id !== batchId));
    } catch (err) {
      toast.error("Failed to delete batch.");
    }
  };

  return (
    <div className="p-6">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <BatchTable
            batch={batch}
            setBatch={setBatch}
            onAddBatch={handleAddBatch}
            onEditBatch={handleEditBatch}
            onDelete={handleDelete}
          />
          {/* Creation Modal */}
          {isModalOpen && modalMode === "create" && (
            <AddBatchModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              mode={modalMode}
              initialData={initialData}
              onCreateOrUpdate={handleCreateOrUpdateBatch}
              courseData={course}
              instrData={instructor}
            />
          )}
          {/* Edit Modals */}
          {isModalOpen && modalMode === "edit" && editModalType === "bundle" && (
            <EditBundleBatchModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              initialData={initialData}
              onUpdate={handleUpdateBatch}
              bundleData={bundleData}
              instrData={instructor}
            />
          )}
          {isModalOpen && modalMode === "edit" && editModalType === "course" && (
            <EditCourseBatchModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              initialData={initialData}
              onUpdate={handleUpdateBatch}
              courseData={course}
              instrData={instructor}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Batches;
