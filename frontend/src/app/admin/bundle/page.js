"use client";
import React, { useEffect, useState } from 'react';
import api from "@utils/api";
import { Plus, Grid3X3, List, Search } from "lucide-react";
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import AddCoursesModal from "@/components/AddCoursesModal";
import CreateBundleModal from "@/components/bundle/CreateBundleModal";
import BundleList from "@/components/bundle/BundleList";
import BundleGrid from "@/components/bundle/BundleGrid";

export default function BundlePage() {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [bundleForm, setBundleForm] = useState({ name: '', description: '', price: '', validity: '' });
  const [creating, setCreating] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [showAddCoursesModal, setShowAddCoursesModal] = useState(false);
  const [addCoursesBundleId, setAddCoursesBundleId] = useState(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [expandedBundleIdx, setExpandedBundleIdx] = useState(null);
  const [expandedBundleCourses, setExpandedBundleCourses] = useState([]);
  const [expandedBundleId, setExpandedBundleId] = useState(null);

  const router = useRouter();

  const fetchBundles = () => {
    setLoading(true);
    api.get('/api/course-bundles')
      .then(res => setBundles(Array.isArray(res.data) ? res.data : (res.data.data || [])))
      .catch(() => setBundles([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBundles();
  }, []);

  // Also fetch bundles when modal closes (after creation)
  useEffect(() => {
    if (!showCreateModal) {
      fetchBundles();
    }
  }, [showCreateModal]);

  // Filter bundles based on tab and search
  const filteredBundles = bundles.filter(bundle => {
    if (selectedTab === "archived") {
      return bundle.isArchived === true;
    }
    // Only show non-archived bundles in the main list
    return bundle.isArchived === false;
  }).filter(bundle =>
    (bundle.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setThumbnail(null);
      setThumbnailPreview('');
    }
  };

  const handleCreateBundle = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('title', bundleForm.name);
      formData.append('description', bundleForm.description);
      formData.append('price', bundleForm.price);
      formData.append('validityInDays', bundleForm.validity);
      if (thumbnail) formData.append('thumbnailImage', thumbnail);
      const res = await api.post('/api/course-bundles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const bundleId = res.data.bundleId || res.data.data?.bundleId;
      if (bundleId) {
        setShowCreateModal(false);
        setBundleForm({ name: '', description: '', price: '', validity: '' });
        setThumbnail(null);
        setThumbnailPreview('');
        toast.success('Bundle created!');
        fetchBundles(); // Always fetch after creation
        router.push(`/admin/bundle/${bundleId}/add-courses`);
      } else {
        toast.error('Failed to create bundle: No bundleId returned.');
      }
    } catch (err) {
      toast.error('Failed to create bundle');
    } finally {
      setCreating(false);
      setLoading(false);
    }
  };

  const handleArchive = async (bundleId) => {
    try {
      const res = await api.put(`/api/course-bundles/${bundleId}/archive`);
      if (res.status === 200 && (!res.data || res.data.success !== false)) {
        fetchBundles();
        toast.success('Bundle archived');
        // window.location.reload(); // Forced refresh removed
      }
    } catch (err) {
      toast.error('Failed to archive bundle');
    }
  };

  const handleUnarchive = async (bundleId) => {
    try {
      const res = await api.put(`/api/course-bundles/${bundleId}/unarchive`);
      if (res.status === 200 && (!res.data || res.data.success !== false)) {
        fetchBundles();
        toast.success('Bundle unarchived');
        // window.location.reload(); // Forced refresh removed
      }
    } catch (err) {
      toast.error('Failed to unarchive bundle');
    }
  };

  // no-op

  // Replace openAddCoursesModal with an async version that fetches the latest linked courses
  const openAddCoursesModal = async (bundleId) => {
    setAddCoursesBundleId(bundleId);
    setShowAddCoursesModal(true);
    try {
      const res = await api.get(`/api/course-bundles/${bundleId}`);
      const linkedIds = res.data.data?.courses ? res.data.data.courses.map(c => c.courseId) : [];
      setSelectedCourseIds(linkedIds);
    } catch {
      setSelectedCourseIds([]);
    }
  };

  const handleUnlinkCourseFromExpanded = async (bundleId, courseId) => {
    try {
      await api.post('/api/course-bundles/unlink', { bundleId, courseId });
      setExpandedBundleCourses(prev => prev.filter(c => (c.courseId || c.id) !== courseId));
      toast.success('Course unlinked from bundle');
    } catch (err) {
      toast.error('Failed to unlink course');
    }
  };

  return (
    <div className="relative p-6 rounded-2xl shadow-lg bg-white mt-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-headingColor dark:text-headingColor-dark mb-2">Bundles</h1>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              {filteredBundles.length} {selectedTab === "all" ? "ACTIVE" : "ARCHIVED"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedTab}
              onChange={e => setSelectedTab(e.target.value)}
              className="px-4 py-2 border border-borderColor dark:border-borderColor-dark rounded-xl bg-white dark:bg-darkdeep1/80 text-contentColor dark:text-contentColor-dark focus:outline-none focus:ring-2 focus:ring-primaryColor transition-all duration-300"
              aria-label="Select bundle view"
            >
              <option value="all">All Bundles</option>
              <option value="archived">Archived Bundles</option>
            </select>
            <span className="text-contentColor dark:text-contentColor-dark font-medium">
              {filteredBundles.length}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-4">
          <button
            className="flex items-center gap-2 px-6 py-3 bg-primaryColor text-white rounded-xl shadow hover:scale-105 hover:shadow-xl hover:bg-primaryColor/90 transition-all duration-300"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-5 h-5" />
            Create Bundle
          </button>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-contentColor dark:text-contentColor-dark w-5 h-5 opacity-70" />
            <input
              type="text"
              placeholder="Search bundles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 h-11 bg-whitegrey2/80 dark:bg-darkdeep1/80 border border-borderColor dark:border-borderColor-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-primaryColor text-contentColor dark:text-contentColor-dark placeholder-opacity-50"
              aria-label="Search bundles"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-xl transition-all duration-200 ${viewMode === "list" ? "bg-primaryColor text-white shadow-sm" : "text-contentColor dark:text-contentColor-dark hover:bg-whitegrey2 dark:hover:bg-darkdeep2"}`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl transition-all duration-200 ${viewMode === "grid" ? "bg-primaryColor text-white shadow-sm" : "text-contentColor dark:text-contentColor-dark hover:bg-whitegrey2 dark:hover:bg-darkdeep2"}`}
              aria-label="Grid view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <CreateBundleModal
        open={showCreateModal}
        onClose={() => {
                    setShowCreateModal(false);
                    setBundleForm({ name: '', description: '', price: '', validity: '' });
                    setThumbnail(null);
                    setThumbnailPreview('');
                  }}
        onSubmit={handleCreateBundle}
        form={bundleForm}
        setForm={setBundleForm}
        creating={creating}
        thumbnailPreview={thumbnailPreview}
        onThumbnailChange={handleThumbnailChange}
      />
      {/* Bundle List/Table */}
      <div className="overflow-x-auto">
        {viewMode === "list" ? (
          <BundleList
            bundles={filteredBundles}
            onRowToggle={(idx, bundle) => {
                      if (expandedBundleIdx === idx) {
                        setExpandedBundleIdx(null);
                        setExpandedBundleCourses([]);
                        setExpandedBundleId(null);
                        return;
                      }
                      setExpandedBundleIdx(idx);
                      setExpandedBundleCourses(bundle.courses || []);
                      setExpandedBundleId(bundle.bundleId);
                    }}
            expandedIndex={expandedBundleIdx}
            expandedCourses={expandedBundleCourses}
            expandedBundleId={expandedBundleId}
            onUnlinkCourse={handleUnlinkCourseFromExpanded}
            onEdit={(bundle) => router.push(`/admin/bundle/${bundle.bundleId}/edit`)}
            onArchive={(bundle) => handleArchive(bundle.bundleId)}
            onUnarchive={(bundle) => handleUnarchive(bundle.bundleId)}
            onAddCourses={(bundle) => openAddCoursesModal(bundle.bundleId)}
            router={router}
          />
        ) : (
          <BundleGrid
            bundles={filteredBundles}
            onEdit={(bundle) => router.push(`/admin/bundle/${bundle.bundleId}/edit`)}
            onArchive={(bundle) => handleArchive(bundle.bundleId)}
            onUnarchive={(bundle) => handleUnarchive(bundle.bundleId)}
            onAddCourses={(bundle) => openAddCoursesModal(bundle.bundleId)}
          />
        )}
      </div>
      <AddCoursesModal
        open={showAddCoursesModal}
        onClose={() => setShowAddCoursesModal(false)}
        bundleId={addCoursesBundleId}
        onSuccess={fetchBundles}
        linkedCourseIds={selectedCourseIds}
      />
    </div>
  );
}