"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, MoreVertical, ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import BatchLearners from "@/components/sections/admin/batches/Section/BatchLearners";
import ContentProgress from "@/components/sections/admin/batches/Section/ContentProgress";
import AssessmentProgress from "@/components/sections/admin/batches/Section/AssessmentProgress";
import AddBatchModal from "@/components/sections/admin/batches/Components/AddBatchModal";
import api from "@utils/api";

const BatchDetails = () => {
  // Track enrolled learners count from child
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [activeTab, setActiveTab] = useState("Learners");
  const tabs = ["Learners", "Content Progress", "Assessment Progress"];
  const router = useRouter();
  const { batchId } = useParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [batchData, setBatchData] = useState(null);
  const [courseData, setCourseData] = useState([]);
  const [instructorData, setInstructorData] = useState([]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [batchRes, courseRes, instructorRes] = await Promise.all([
          api.get(`/api/batches/${batchId}`),
          api.get("/api/courses"),
          api.get("/api/admin/getadminsandinstructors"),
        ]);

        const batch = batchRes?.data?.data || batchRes?.data;
        const courses = courseRes?.data?.data?.content || [];
        const instructors = instructorRes?.data || [];

        if (batch) {
          setBatchData(batch);
          setInitialData({
            batchId: batch.batchId || batch.id,
            batchName: batch.batchName || batch.name,
            startDate: batch.startDate || null,
            endDate: batch.endDate || null,
            batchManagerId: batch.batchManager?.id || null,
            courses: batch.courses || [],
          });
          // Set batch/course name globally for export
          if (typeof window !== 'undefined') {
            window.__BATCH_COURSE_NAME = batch.batchName || batch.name || "course";
          }
        }
        setCourseData(courses);
        setInstructorData(instructors);
      } catch (error) {
        toast.error("Failed to fetch batch details", error);
      }
    };

    if (batchId) {
      fetchDetails();
    }
  }, [batchId]);

  const handleEditBatch = () => {
    setIsModalOpen(true);
  };

  const handleAddLearners = () => {
    router.push("/admin/users/new-enrollment");
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setInitialData(null);
  };

  const handleCreateOrUpdate = async (updatedData, apiEndpoint = "/api/batches") => {
    try {
      if (updatedData.batchId) {
        await api.put(`/api/batches/${updatedData.batchId}`, updatedData);
      } else {
        await api.post(apiEndpoint, updatedData);
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Batch update failed", err);
    }
  };

  if (!batchData) return <p>Loading...</p>;

  return (
    <div className="bg-white rounded-xl p-6 shadow border">
      {/* Top Heading Section */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ArrowLeft
              className="w-5 h-5 text-gray-600 cursor-pointer"
              onClick={() => router.back()}
            />
            {batchData.batchName}
          </h2>
          {/* <p className="text-sm text-primary font-medium">
            {batchData?.courses?.[0]?.curriculums?.length || 0} Curriculums Linked{" "}
            <span className="text-blue-600 underline cursor-pointer">
              View List
            </span>
          </p> */}
        </div>
        <div>
          <select
            className="px-3 py-2 border rounded-md text-sm"
            onChange={(e) => {
              const selected = e.target.value;
              if (selected === "edit") handleEditBatch();
              else if (selected === "add") handleAddLearners();
              e.target.value = ""; // Reset after action
            }}
          >
            <option value="">Actions</option>
            <option value="edit">Edit Batch</option>
            <option value="add">Add Learners</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-10 text-sm text-gray-700 mb-4">
        <div>
          <div className="text-xs text-gray-500">Learners Enrolled</div>
          <div className="font-semibold text-base">{enrolledCount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Class Progress</div>
          <div className="flex items-center gap-2 text-base font-semibold text-green-600">
            <span>0%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-6 border-b border-gray-200 text-sm font-medium mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 ${
                activeTab === tab
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-blue-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "Learners" && <BatchLearners batchId={batchId} onEnrolledCountChange={setEnrolledCount} />}
        {activeTab === "Content Progress" && <ContentProgress />}
        {activeTab === "Assessment Progress" && <AssessmentProgress />}
      </div>

      {/* AddBatchModal */}
      {isModalOpen && (
        <AddBatchModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          initialData={initialData}
          mode="edit"
          onCreateOrUpdate={handleCreateOrUpdate}
          courseData={courseData}
          instrData={instructorData}
        />
      )}
    </div>
  );
};

export default BatchDetails;
