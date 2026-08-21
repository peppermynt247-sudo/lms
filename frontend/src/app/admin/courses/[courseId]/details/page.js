"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@utils/api";
import DetailsTab from "@/components/sections/admin/courses-delivery/courses/components/DetailsTab";

const CourseDetailsPage = () => {
  const { courseId } = useParams();
  const [courseData,      setCourseData]      = useState(null);
  const [originalData,    setOriginalData]    = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [success,         setSuccess]         = useState(null);
  const [saving,          setSaving]          = useState(false);
  const [thumbnailPreview,setThumbnailPreview] = useState(null);
  const [thumbnailFile,   setThumbnailFile]   = useState(null);

  useEffect(() => {
    if (!courseId) return;
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res  = await api.get(`/api/courses/${courseId}`);
        const data = res.data.data;
        setCourseData(data);
        setOriginalData(data);
        if (data.thumbnailUrl) setThumbnailPreview(data.thumbnailUrl);
      } catch {
        setError("Failed to load course data.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
    return () => { if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview); };
  }, [courseId]);

  const handleInputChange = (field, value) =>
    setCourseData((prev) => ({ ...prev, [field]: value }));

  const handleImageUpload = (file) => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(null);
    setThumbnailFile(null);
    setCourseData((prev) => ({ ...prev, thumbnailUrl: null }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append(
        "course",
        new Blob(
          [JSON.stringify({
            title:       courseData.title,
            prettyName:  courseData.prettyName,
            description: courseData.description,
            overview:    courseData.overview,
          })],
          { type: "application/json" }
        )
      );
      if (thumbnailFile) formData.append("image", thumbnailFile);
      await api.put(`/api/courses/${courseId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Course updated successfully!");
      setOriginalData(courseData);
      setThumbnailFile(null);
    } catch {
      setError("Failed to save course changes.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-5">
        {/* Thumbnail card skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
            <div className="sk w-6 h-6 rounded-lg" />
            <div className="sk h-3 w-28 rounded" />
          </div>
          <div className="p-5 flex items-start gap-5">
            <div className="sk w-56 h-36 rounded-xl" />
            <div className="pt-1 space-y-2 flex-1">
              <div className="sk h-3.5 w-24 rounded" />
              <div className="sk h-2.5 w-48 rounded" />
              <div className="sk h-2.5 w-36 rounded" />
            </div>
          </div>
        </div>

        {/* Details card skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
            <div className="sk w-6 h-6 rounded-lg" />
            <div className="sk h-3 w-28 rounded" />
          </div>
          <div className="p-5 space-y-6">
            {[["w-24", "h-10"], ["w-20", "h-10"], ["w-28", "h-24"], ["w-20", "h-28"]].map(([lw, fh], i) => (
              <div key={i} className="space-y-2">
                <div className={`sk h-2.5 ${lw} rounded`} />
                <div className={`sk w-full ${fh} rounded-xl`} />
              </div>
            ))}
          </div>
        </div>

        {/* Save bar skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="sk h-3 w-28 rounded" />
            <div className="sk h-9 w-32 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Hard error (no data at all) ── */
  if (error && !courseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100">
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-[#1a2b4e]">Failed to load</p>
          <p className="text-xs text-gray-400 mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  if (!courseData) return null;

  return (
    <DetailsTab
      courseData={courseData}
      thumbnailUrl={thumbnailPreview}
      handleInputChange={handleInputChange}
      handleImageUpload={handleImageUpload}
      removeImage={removeImage}
      handleSave={handleSave}
      saving={saving}
      isDirty={
        JSON.stringify(courseData) !== JSON.stringify(originalData) ||
        thumbnailFile !== null
      }
      success={success}
      error={error}
    />
  );
};

export default CourseDetailsPage;
