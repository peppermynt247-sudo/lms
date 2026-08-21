"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import CourseHeader from '@/components/sections/admin/courses-delivery/courses/components/CourseHeader';
import SectionList from '@/components/sections/admin/courses-delivery/courses/components/SectionList';
import DropdownMenu from '@/components/sections/admin/courses-delivery/courses/components/DropdownMenu';
import ActiveSidebar from './ActiveSidebar';
import ActiveCardOverlays from './ActiveCardOverlays';
import ConfirmModals from './ConfirmModals';
import { useRouter, usePathname, useParams } from 'next/navigation';
import {toast} from 'react-toastify';
import {getCodingExerciseById, handleDeleteMaterial, getExerciseById, getCurriculumSections, addCurriculumSection, getCurriculumById, getSectionContent } from '@utils/api';
import api from '@utils/api';

const CourseManagementUI = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const curriculumId = params?.curriculumId || (pathname.split('/').filter(Boolean)[2] || '');

  if (!curriculumId || isNaN(Number(curriculumId))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-red-600">
        <h2 className="text-xl font-bold mb-2">Error: Invalid or missing curriculum ID</h2>
        <p>Please check the URL or navigate from the curriculum list page.</p>
      </div>
    );
  }

  const [curriculumDetails, setCurriculumDetails] = useState(null);
  const [courseData, setCourseData] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [activeSidebar, setActiveSidebar] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingContent, setLoadingContent] = useState({});
  const dropdownRefs = useRef({});

  useEffect(() => {
    async function fetchCurriculumDetails() {
      try {
        const data = await getCurriculumById(curriculumId);
        setCurriculumDetails(data.data || data);
      } catch (err) {
        setCurriculumDetails({ name: 'Unknown Curriculum', description: '' });
      }
    }
    if (curriculumId) fetchCurriculumDetails();
  }, [curriculumId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && dropdownRefs.current[activeDropdown]) {
        if (!dropdownRefs.current[activeDropdown].contains(event.target)) {
          setActiveDropdown(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  const toggleSection = useCallback((sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  const handleSelectMaterialType = useCallback((type, sectionData) => {
    if (!sectionData) {
      toast.error("Invalid section data.");
      return;
    }
    let sidebarData = sectionData;
    if (!sidebarData.curriculumId) {
      sidebarData = { ...sidebarData, curriculumId, sectionId: sectionData.sectionId || sectionData.id };
    }
    if (type === 'video') {
      setActiveSidebar({
        type: 'addMaterialFlow',
        data: sidebarData,
        size: 'default',
        onSelectMaterialType: handleSelectMaterialType
      });
    }
    else if(type === 'EXERCISE' || type === 'ELAB' || type === 'PROGRAMMING') {
      closeSidebar();
      setActiveSidebar(null);
    } 
    if (type === 'EXERCISE' || type === 'exercise') {
      router.push(`/admin/curriculum/${curriculumId}/section/${sidebarData.sectionId}/exercise/create`);
      setActiveSidebar(null);
    } else if (type === 'ELAB' || type === 'PROGRAMMING' || type ==='programming') {
      router.push(`/admin/curriculum/${curriculumId}/section/${sidebarData.sectionId}/prog_assignment/create`);
      setActiveSidebar(null);
    } else {
      setActiveSidebar({
        type: 'addMaterial',
        data: { ...sidebarData, preSelectedType: type },
        size: 'default',
        onSelectMaterialType: handleSelectMaterialType
      });
    }
    setActiveDropdown(null);
  }, [curriculumId]);

  const handleSave = useCallback(async (action, formData, sidebarData) => {
    try {
      switch (action) {
        case 'addSection':
          const response = await addCurriculumSection(curriculumId, formData);
          toast.success("Section added successfully!");
          // Use the real section ID returned from the backend
          const realSectionId = response.sectionId;
          if (!realSectionId) {
            toast.error("Failed to get section ID from backend response");
            return;
          }
          const newSection = {
            ...formData,
            curriculumId,
            id: realSectionId, // Use real section ID from backend
            sectionId: realSectionId, // Also set sectionId for consistency
            items: [],
            progress: "0%"
          };
          setCourseData(prev => [...prev, newSection]);
          setAllSections(prev => [...prev, { id: realSectionId, title: newSection.title }]);
          break;
        case 'editSection':
          // Update the section using PATCH API
          const sectionId = sidebarData?.id || sidebarData?.sectionId;
          if (!sectionId) {
            toast.error("Section ID is missing. Cannot update section.");
            return;
          }
          await api.patch(`/api/curriculumsections/${sectionId}`, formData);
          toast.success("Section updated successfully!");
          // Update UI directly without additional API call
          setCourseData(prev => prev.map(section => 
            section.id === sectionId 
              ? { ...section, ...formData }
              : section
          ));
          setAllSections(prev => prev.map(section => 
            section.id === sectionId 
              ? { ...section, title: formData.title }
              : section
          ));
          break;
        case 'addMaterial':
          // The sidebar has already made the backend API call and passed the response data
          const targetSectionId = sidebarData?.sectionId || sidebarData?.id;
          if (targetSectionId && formData) {
            // Get the correct ID for the material (this is what preview functionality needs)
            const materialId = formData.ebookId || formData.videoId || formData.exerciseId || formData.id || Date.now();
            
            // Use the data returned from the backend API call made by the sidebar
            const newMaterial = {
              // Set id to contentReferenceId for preview functionality to work
              id: materialId,
              title: formData.title || formData.materialName || "New Material",
              type: formData.type || formData.contentType?.toLowerCase() || "material",
              contentReferenceId: materialId, // This is what preview functionality uses
              contentType: formData.contentType || formData.type?.toUpperCase(),
              itemOrder: formData.itemOrder || 1,
              isPublished: formData.isPublished || false,
              isRequired: formData.isRequired || false,
              estimatedMinutes: formData.estimatedMinutes,
              xpPoints: formData.xpPoints,
              curriculumId,
              sectionId: targetSectionId,
              description: formData.description,
              fileUrl: formData.fileUrl,
              // Include all necessary data for preview functionality
              materialName: formData.title || formData.materialName,
              materialType: formData.type || formData.contentType?.toLowerCase(),
              // For videos
              videoId: formData.videoId,
              durationSeconds: formData.durationSeconds,
              uploadStatus: formData.uploadStatus,
              videoUrl: formData.videoUrl || formData.url || '',
              url: formData.videoUrl || formData.url || '',
              // For ebooks
              ebookId: formData.ebookId,
              // For exercises
              exerciseId: formData.exerciseId,
              // Include any additional metadata that might be needed for preview
              metadata: formData.metadata || {},
              // Status for display
              status: formData.status || 'Active',
              // File information
              file: formData.fileName || formData.file || '',
              // Ensure we have the proper structure for preview cards
              previewData: {
                title: formData.title || formData.materialName,
                description: formData.description,
                type: formData.type || formData.contentType?.toLowerCase(),
                fileUrl: formData.fileUrl,
                durationSeconds: formData.durationSeconds,
                uploadStatus: formData.uploadStatus,
                ...formData
              }
            };
            
            setCourseData(prev => prev.map(section => 
              section.id === targetSectionId 
                ? { 
                    ...section, 
                    items: [...(section.items || []), newMaterial]
                  }
                : section
            ));
          }
          toast.success("Material added successfully!");
          break;
        case 'editMaterial':
          // Update the specific material in the section
          const materialSectionId = sidebarData?.sectionId || sidebarData?.id;
          const materialId = sidebarData?.contentReferenceId || sidebarData?.id;
          
          if (materialSectionId && materialId) {
            setCourseData(prev => prev.map(section => 
              section.id === materialSectionId 
                ? {
                    ...section,
                    items: (section.items || []).map(item => 
                      item.contentReferenceId === materialId || item.id === materialId
                        ? { ...item, ...formData, title: formData.title || formData.materialName || item.title }
                        : item
                    )
                  }
                : section
            ));
          }
          toast.success("Material updated successfully!");
          break;
        case 'editVideo':
          // Update video using the video update API
          const videoId = sidebarData?.contentReferenceId || sidebarData?.id;
          if (!videoId) {
            toast.error("Video ID is missing. Cannot update video.");
            return;
          }
          
          try {
            // Make API call to update video
            await api.put(`/api/video/${videoId}/update`, {
              title: formData.title || formData.materialName,
              description: formData.description
            });
            
            // Update UI directly after successful API call
            const videoSectionId = sidebarData?.sectionId;
            if (videoSectionId) {
              setCourseData(prev => prev.map(section => 
                section.id === videoSectionId 
                  ? {
                      ...section,
                      items: (section.items || []).map(item => 
                        item.contentReferenceId === videoId || item.id === videoId
                          ? { 
                              ...item, 
                              title: formData.title || formData.materialName || item.title,
                              description: formData.description || item.description
                            }
                          : item
                      )
                    }
                  : section
              ));
            }
            toast.success("Video updated successfully!");
          } catch (error) {
            toast.error("Failed to update video. Please try again.");
          }
          break;
        case 'reorderMaterials':
          // Update material order in real-time
          const reorderSectionId = sidebarData?.sectionId || sidebarData?.id;
          if (reorderSectionId && formData.newOrder) {
            reorderMaterialsInSection(reorderSectionId, formData.newOrder);
            toast.success("Materials reordered successfully!");
          }
          break;
        case 'rearrangeSections':
          // Update section order in real-time
          if (formData.newOrder) {
            setCourseData(formData.newOrder);
            setAllSections(formData.newOrder.map(section => ({ id: section.id, title: section.title })));
            toast.success("Sections rearranged successfully!");
          }
          break;
        case 'cloneSection':
          // Handle cloned section with real-time update
          if (formData.clonedSection) {
            const newClonedSection = {
              ...formData.clonedSection,
              id: Date.now(), // Temporary ID
              title: formData.newTitle || formData.clonedSection.title,
              items: formData.clonedSection.items || []
            };
            setCourseData(prev => [...prev, newClonedSection]);
            setAllSections(prev => [...prev, { id: newClonedSection.id, title: newClonedSection.title }]);
            toast.success("Section cloned successfully!");
          }
          break;
        default:
      }
      closeSidebar();
    } catch (error) {
      toast.error("Failed to save changes.");
    }
  }, [curriculumId]);

  const openSidebar = useCallback((type, data = null, size = 'default') => {
    let sidebarData = data;
    if ((type === 'addMaterialOptions' || type === 'addMaterialFlow') && data && !data.curriculumId) {
      sidebarData = { ...data, curriculumId };
    }
    setActiveSidebar({
      type,
      data: sidebarData,
      size,
      onSelectMaterialType: handleSelectMaterialType
    });
    setActiveDropdown(null);
  }, [curriculumId, handleSelectMaterialType]);

  const closeSidebar = useCallback(() => {
    setActiveSidebar(null);
  }, []);

  const toggleDropdown = useCallback((id) => setActiveDropdown(activeDropdown === id ? null : id), [activeDropdown]);

  const openModal = useCallback((type, data = null) => {
    setActiveModal({ type, data });
    setActiveDropdown(null);
  }, []);

  const closeModal = useCallback(() => setActiveModal(null), []);

  const handleEditMaterialRedirect = useCallback(async (material) => {
    try {
      if (!material) {
        toast.error("Invalid material data.");
        return;
      }

      const typeRaw = material.type || material.contentType;
      const type = typeRaw ? typeRaw.toLowerCase() : '';
      const referenceId = material.contentReferenceId;
      const curriculum = material.curriculumId || curriculumId;
      const section = material.sectionId;

      if (!curriculum || !section) {
        toast.error("Missing curriculum or section ID.");
        return;
      }

      if (type === "exercise") {
        setActiveSidebar(false);
        const res = await getExerciseById(referenceId);
        localStorage.setItem(`editMaterial_EXERCISE_${referenceId}`, JSON.stringify(res.data || res));
        router.push(`/admin/curriculum/${curriculum}/section/${section}/exercise/${referenceId}/edit`);
      } else if (type === "elab" || type === "programming") {
        setActiveSidebar(false);
        const refId = typeof referenceId === "object" ? referenceId.id : referenceId;
        const res = await getCodingExerciseById(refId);
        localStorage.setItem(`editMaterial_ELAB_${refId}`, JSON.stringify(res.data || res));
        router.push(`/admin/curriculum/${curriculum}/section/${section}/prog_assignment/${refId}/edit`);
      } else if (type === "video") {
        // Open video edit sidebar instead of redirecting to play
        try {
          // Get video ID
          const videoId = material.contentReferenceId || material.id;
          if (!videoId) {
            toast.error("Video ID is missing. Cannot fetch details.");
            return;
          }
          
          // Open the edit material sidebar for video using existing data
          setActiveSidebar({
            type: 'editVideo',
            data: {
              ...material,
              contentReferenceId: videoId,
              sectionId: material.sectionId,
              curriculumId: material.curriculumId || curriculumId,
              type: 'video',
              contentType: 'VIDEO',
              title: material.title,
              description: material.description || '', // Use description from material object
            },
            size: 'default',
          });
        } catch (err) {
          toast.error("Failed to open video edit form.");
        }
      } else if (type === "ebook") {
        try {
          const ebookId = material.contentReferenceId || material.ebookId || material.id;
          if (!ebookId) {
            toast.error("eBook ID is missing. Cannot fetch details.");
            return;
          }
          const res = await (await import("@utils/api")).default.get(`/api/ebooks/${ebookId}`);
          const ebookData = res.data.data || res;
          setActiveSidebar({
            type: 'editEbook',
            data: {
              ...ebookData,
              contentReferenceId: ebookId,
            },
            size: 'default',
          });
        } catch (err) {
          toast.error("Failed to fetch eBook details.");
        }
      } else {
        toast.error("Editing for this material type is not implemented yet.");
      }
    } catch (error) {
      toast.error("Failed to redirect to edit page.", error);
    }
  }, [router, curriculumId]);

  const handleDeleteSection = useCallback(async (sectionId) => {
    try {
      await api.delete(`/api/curriculumsections/${sectionId}`);
      // Update UI directly without additional API call
      setCourseData(prevData => prevData.filter(section => section.id !== sectionId));
      setAllSections(prevData => prevData.filter(section => section.id !== sectionId));
      // Close any expanded sections that were deleted
      setExpandedSections(prev => {
        const newExpanded = { ...prev };
        delete newExpanded[sectionId];
        return newExpanded;
      });
      toast.success('Section deleted successfully.');
      closeModal();
    } catch (err) {
      toast.error('Failed to delete section.');
    }
  }, [closeModal]);

  // Real-time update function for materials
  const updateMaterialInSection = useCallback((sectionId, materialId, updates) => {
    setCourseData(prev => prev.map(section => 
      section.id === sectionId 
        ? {
            ...section,
            items: (section.items || []).map(item => 
              item.contentReferenceId === materialId || item.id === materialId
                ? { ...item, ...updates }
                : item
            )
          }
        : section
    ));
  }, []);

  // Real-time update function for sections
  const updateSection = useCallback((sectionId, updates) => {
    setCourseData(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, ...updates }
        : section
    ));
    setAllSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, ...updates }
        : section
    ));
  }, []);

  // Real-time update function for material reordering
  const reorderMaterialsInSection = useCallback((sectionId, newOrder) => {
    setCourseData(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, items: newOrder }
        : section
    ));
  }, []);

  // useEffect for real-time updates when courseData changes
  useEffect(() => {
    // This effect will run whenever courseData changes
    // You can add any additional real-time update logic here
  }, [courseData]);

  // useEffect for real-time updates when expanded sections change
  useEffect(() => {
    // This effect will run whenever expandedSections changes
  }, [expandedSections]);


  const handleDropdownAction = useCallback((action, itemData) => {
    // Detect if this is a section (no 'type' property) or a material (has 'type')
    const isSection = !!itemData && itemData.hasOwnProperty('title') && itemData.hasOwnProperty('id') && !itemData.type;
    switch (action) {
      case "preview":
        setActiveCard({ type: "materialPreview", data: itemData });
        break;
      case "editSection":
        openSidebar("editSection", itemData);
        break;
      case "edit":
        handleEditMaterialRedirect(itemData);
        break;
      case 'delete':
        // Only handle material delete here, section delete untouched
        if (!isSection) {
          const typeRaw = itemData.type || itemData.contentType;
          const type = typeRaw ? typeRaw.toLowerCase() : '';
          if (type === 'ebook') {
            const ebookId = itemData.contentReferenceId || itemData.ebookId || itemData.id;
            if (!ebookId) {
              toast.error('eBook ID is missing. Cannot delete eBook.');
              return;
            }
            (async () => {
              try {
                const apiModule = await import('@utils/api');
                await apiModule.default.delete(`/api/ebooks/${ebookId}`);
                toast.success('eBook deleted successfully.');
                // Remove from UI using real-time update
                const sectionId = itemData.sectionId;
                if (sectionId) {
                  setCourseData(prevData => prevData.map(section => ({
                    ...section,
                    items: Array.isArray(section.items)
                      ? section.items.filter(item => 
                          item.contentReferenceId !== ebookId && 
                          item.id !== ebookId &&
                          item.ebookId !== ebookId
                        )
                      : section.items
                  })));
                }
              } catch (err) {
                toast.error('Failed to delete eBook.');
              }
            })();
          } else {
            // Handle other material types with real-time updates
            const materialId = itemData.contentReferenceId || itemData.id;
            const contentItemId = itemData.id || itemData.itemId;
            const type = itemData.type?.toLowerCase();
            
            const isYoutube = !!(itemData.videoUrl || (itemData.vdoCipherId && itemData.vdoCipherId.startsWith('YT-')));
            
            if (materialId) {
              handleDeleteMaterial(contentItemId, itemData.contentReferenceId, type, isYoutube).then(success => {
                if (success) {
                  setCourseData(prevData => prevData.map(section => ({
                    ...section,
                    items: Array.isArray(section.items)
                      ? section.items.filter(item => 
                          (item.contentReferenceId !== materialId && item.id !== materialId) &&
                          (item.id !== contentItemId)
                        )
                      : section.items
                  })));
                }
              });
            }
          }
        } else {
          // Delete section immediately without confirmation modal
          handleDeleteSection(itemData.id);
        }
        break;
      case "reorder":
        openSidebar("reorderMaterials", itemData);
        break;
      default:
        toast.error("Unknown dropdown action: " + action);
    }
  }, [openSidebar, openModal, handleEditMaterialRedirect]);

  const getItemIcon = useCallback((type) => {
    const Icons = require('./icons');
    return Icons.getItemIcon(type);
  }, []);

  const handleExpandSection = useCallback(async (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));

    if (!expandedSections[sectionId]) {
      setLoadingContent(prev => ({ ...prev, [sectionId]: true }));
      try {
        const content = await getSectionContent(sectionId);
        const data = content.data || content;

        const items = (data.contentItems || []).map((item) => {
          let title = "";
          let type = item.contentType?.toLowerCase() || "material";

          if (item.contentType === "VIDEO") {
            if (data.videos?.[item.contentReferenceId]) {
              title = data.videos[item.contentReferenceId].title || "Untitled Video";
              // Include description from the videos object
              const videoData = data.videos[item.contentReferenceId];
              return {
                id: item.itemId,
                title,
                description: videoData.description || '',
                videoUrl: videoData.videoUrl || '',
                ...item,
                curriculumId,
                sectionId,
                type: "video",
              };
            } else {
              title = item.title || "Untitled Video";
            }
            type = "video";
          } else if (item.contentType === "EXERCISE" && data.exercises?.[item.contentReferenceId]) {
            title = data.exercises[item.contentReferenceId].title || "Untitled Exercise";
            type = "exercise";
          } else if (item.contentType === "ELAB" && data.elabs?.[item.contentReferenceId]) {
            title = data.elabs[item.contentReferenceId].title || "Untitled eLab";
            type = "elab";
          } else if (item.contentType === "EBOOK" && data.ebooks?.[item.contentReferenceId]) {
            title = data.ebooks[item.contentReferenceId].title || "Untitled eBook";
            type = "ebook";
          } else if (item.contentType === "TEST" && data.tests?.[item.contentReferenceId]) {
            title = data.tests[item.contentReferenceId].title || "Untitled Test";
            type = "test";
          } else {
            title = item.title || item.contentType || "Material";
          }

          return {
            id: item.itemId,
            title,
            ...item,
            curriculumId,
            sectionId,
            type,
          };
        });

        setCourseData((prev) =>
          prev.map((section) =>
            section.id === sectionId ? { ...section, items } : section
          )
        );
      } catch (err) {
        toast.error("Failed to fetch section content", err);
      } finally {
        setLoadingContent(prev => ({ ...prev, [sectionId]: false }));
      }
    }
  }, [expandedSections, curriculumId]);

  useEffect(() => {
    async function fetchSections() {
      if (!curriculumId || isNaN(Number(curriculumId))) return;
      setLoadingSections(true);
      try {
        const data = await getCurriculumSections(curriculumId);
        setCourseData(
          (Array.isArray(data) ? data : data.data || []).map(section => ({
            ...section,
            curriculumId,
            id: section.id || section.sectionId
          }))
        );
        setAllSections(
          (Array.isArray(data) ? data : data.data || []).map(section => ({
            id: section.id || section.sectionId,
            title: section.title
          }))
        );
      } catch (err) {
       
      } finally {
        setLoadingSections(false);
      }
    }
    if (curriculumId) fetchSections();
  }, [curriculumId]);

  const handleCloseActiveCard = useCallback(() => setActiveCard(null), []);
  
  const handleCloseMaterialPreview = useCallback(() => setActiveCard(null), []);

  return (
    <div className="relative">
      <div className="mx-auto">
        <CourseHeader
          onAddSection={useCallback(() => openSidebar("addSection"), [openSidebar])}
          onCloneSection={useCallback(() => openSidebar("cloneSection", { allSectionsData: allSections }), [openSidebar, allSections])}
          onRearrangeSections={useCallback(() => openSidebar("rearrangeSections", { currentSections: courseData.map(s => ({ id: s.id, title: s.title })) }), [openSidebar, courseData])}
          totalSections={courseData.length}
        />
        {loadingSections ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-200 rounded-full" />
                  <div className="w-7 h-7 bg-[#ff5b00]/10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded-full w-1/3" />
                    <div className="h-3 bg-gray-100 rounded-full w-1/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <SectionList
            sections={courseData}
            expandedSections={expandedSections}
            loadingContent={loadingContent}
            activeDropdown={activeDropdown}
            onToggleSection={handleExpandSection}
            onToggleDropdown={toggleDropdown}
            onOpenSidebar={openSidebar}
            onHandleDropdownAction={handleDropdownAction}
            getItemIcon={getItemIcon}
            DropdownMenuComponent={DropdownMenu}
            dropdownRefs={dropdownRefs}
            curriculumId={curriculumId}
            allSectionsData={courseData}
          />
        )}
      </div>

      <ActiveSidebar
        activeSidebar={activeSidebar}
        onClose={closeSidebar}
        onSave={handleSave}
        allSections={allSections}
        courseData={courseData}
      />

      <ConfirmModals
        activeModal={activeModal}
        onClose={closeModal}
        onConfirmDeleteSection={(id) => handleDeleteSection(id)}
        onConfirmDeleteMaterial={async () => {
          const isYoutube = !!(activeModal.data.videoUrl || (activeModal.data.vdoCipherId && activeModal.data.vdoCipherId.startsWith('YT-')));
          const materialId = activeModal.data.id || activeModal.data.contentReferenceId;
          const contentItemId = activeModal.data.itemId || activeModal.data.id;

          const success = await handleDeleteMaterial(
            contentItemId, 
            activeModal.data.contentReferenceId, 
            activeModal.data.type, 
            isYoutube
          );

          if (success) {
            setCourseData(prevData => prevData.map(section => ({
              ...section,
              items: Array.isArray(section.items)
                ? section.items.filter(item => 
                    (item.contentReferenceId !== materialId && item.id !== materialId) &&
                    (item.id !== contentItemId)
                  )
                : section.items
            })));
            closeModal();
          }
        }}
      />

      <ActiveCardOverlays
        activeCard={activeCard}
        onCloseSection={handleCloseActiveCard}
        onCloseMaterial={handleCloseMaterialPreview}
      />
      {/* {activeCard && activeCard.type === 'materialInfo' && (
        <MaterialInfoCard data={activeCard.data} onClose={() => setActiveCard(null)} />
      )} */}
    </div>
  );
};

export default CourseManagementUI;