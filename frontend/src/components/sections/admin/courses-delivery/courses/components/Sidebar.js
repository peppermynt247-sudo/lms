import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaXmark, FaPlus, FaPencil, FaClone, FaArrowsUpDown, FaLayerGroup } from 'react-icons/fa6';
import AddEditSectionSidebar from '@/components/sections/admin/courses-delivery/courses/components/sidebars/AddEditSectionSidebar';
import AddMaterialOptionsCard from '@/components/sections/admin/courses-delivery/courses/components/sidebars/AddMaterialOptionsCard';
import AddEditMaterialSidebar from '@/components/sections/admin/courses-delivery/courses/components/sidebars/AddEditMaterialSidebar';
import EditMaterialSidebar from '@/components/sections/admin/courses-delivery/courses/components/sidebars/EditMaterialSidebar';
import CloneSectionSidebar from '@/components/sections/admin/courses-delivery/courses/components/sidebars/CloneSectionSidebar';
import RearrangeSectionsSidebar from '@/components/sections/admin/courses-delivery/courses/components/sidebars/RearrangeSectionsSidebar';
import ReorderMaterialsSidebar from '@/components/sections/admin/courses-delivery/courses/components/sidebars/ReorderMaterialsSidebar';
import SelectVideoTypeSidebar from '@/components/sections/admin/courses-delivery/courses/components/sidebars/SelectVideoTypeSidebar';

const SIDEBAR_META = {
  addSection:         { title: 'Add New Section',      icon: FaPlus         },
  editSection:        { title: 'Edit Section',          icon: FaPencil       },
  addMaterial:        { title: 'Add Material',          icon: FaPlus         },
  addMaterialOptions: { title: 'Add Material',          icon: FaPlus         },
  addMaterialFlow:    { title: 'Add Material',          icon: FaPlus         },
  editMaterial:       { title: 'Edit Material',         icon: FaPencil       },
  editVideo:          { title: 'Edit Video',            icon: FaPencil       },
  cloneSection:       { title: 'Clone Section',         icon: FaClone        },
  rearrangeSections:  { title: 'Rearrange Sections',   icon: FaArrowsUpDown },
  reorderMaterials:   { title: 'Reorder Materials',    icon: FaArrowsUpDown },
  selectVideoType:    { title: 'Select Video Type',     icon: FaLayerGroup   },
};

const Sidebar = ({
  sidebarType,
  sidebarData,
  sidebarSize = 'default',
  onClose,
  onSave,
  onSelectMaterialType,
  allSectionsForClone,
  currentCourseSections,
}) => {
  const router = useRouter();
  const [materialStep, setMaterialStep] = useState(null);
  const [selectedMaterialType, setSelectedMaterialType] = useState(null);
  const [selectedVideoType, setSelectedVideoType] = useState(null);

  const isWide = sidebarType === 'addMaterialOptions';
  const meta = SIDEBAR_META[sidebarType] || { title: 'Sidebar', icon: FaLayerGroup };
  const TitleIcon = meta.icon;

  const renderContent = () => {
    try {
      if (sidebarType === 'addMaterialFlow') {
        if (materialStep === 'options') {
          return (
            <AddMaterialOptionsCard
              sectionData={sidebarData}
              onSelectMaterialType={(type) => {
                const sectionObj = sidebarData?.section || sidebarData;
                if (typeof onSelectMaterialType === 'function') onSelectMaterialType(type, sectionObj);
                setSelectedMaterialType(type);
                if (type === 'video') setMaterialStep('videoType');
                else setMaterialStep('details');
              }}
              onClose={onClose}
            />
          );
        }
        if (materialStep === 'videoType') {
          return (
            <SelectVideoTypeSidebar
              onSelect={(videoType) => { setSelectedVideoType(videoType); setMaterialStep('details'); }}
              onBack={() => setMaterialStep('options')}
              onClose={onClose}
            />
          );
        }
        if (materialStep === 'details') {
          return (
            <AddEditMaterialSidebar
              mode="add"
              sectionData={sidebarData.section || sidebarData}
              curriculumId={sidebarData.curriculumId}
              sectionId={sidebarData.sectionId}
              initialData={sidebarData}
              preSelectedType={selectedMaterialType}
              videoType={selectedVideoType}
              onSave={(formData) => onSave('addMaterial', formData, { ...sidebarData, section: sidebarData.section || sidebarData, sectionId: sidebarData.sectionId || sidebarData.id })}
              onBack={() => { if (selectedMaterialType === 'video') setMaterialStep('videoType'); else setMaterialStep('options'); }}
              onClose={onClose}
            />
          );
        }
      }

      switch (sidebarType) {
        case 'addSection':
          return <AddEditSectionSidebar mode="add" onSave={(d) => onSave('addSection', d, null)} onClose={onClose} />;
        case 'editSection':
          return <AddEditSectionSidebar mode="edit" initialData={sidebarData} onSave={(d) => onSave('editSection', d, sidebarData)} onClose={onClose} />;
        case 'addMaterialOptions':
          return <AddMaterialOptionsCard sectionData={sidebarData} onSelectMaterialType={onSelectMaterialType} onClose={onClose} />;
        case 'selectVideoType':
          return <SelectVideoTypeSidebar onSelect={(vt) => onSave('selectVideoType', { videoType: vt }, sidebarData)} onBack={onClose} />;
        case 'addMaterial':
          return (
            <AddEditMaterialSidebar
              mode="add"
              sectionData={sidebarData.section || sidebarData}
              curriculumId={sidebarData.curriculumId}
              sectionId={sidebarData.sectionId}
              initialData={sidebarData}
              preSelectedType={sidebarData?.preSelectedType}
              videoType={sidebarData?.videoType}
              onSave={(d) => onSave('addMaterial', d, { ...sidebarData, section: sidebarData.section || sidebarData, sectionId: sidebarData.sectionId || sidebarData.id })}
              onClose={onClose}
            />
          );
        case 'editMaterial':
          return <AddEditMaterialSidebar mode="edit" initialData={sidebarData} onSave={(d) => onSave('editMaterial', d, sidebarData)} onClose={onClose} />;
        case 'editVideo':
          return <EditMaterialSidebar initialData={sidebarData} onSave={(d) => onSave('editVideo', d, sidebarData)} onClose={onClose} />;
        case 'cloneSection':
          return <CloneSectionSidebar allSections={allSectionsForClone} onSave={(d) => onSave('cloneSection', d, sidebarData)} onClose={onClose} />;
        case 'rearrangeSections':
          return <RearrangeSectionsSidebar currentSections={currentCourseSections} onSave={(d) => onSave('rearrangeSections', d, sidebarData)} onClose={onClose} />;
        case 'reorderMaterials':
          return <ReorderMaterialsSidebar sectionData={sidebarData} onSave={(d) => onSave('reorderMaterials', d, sidebarData)} onClose={onClose} />;
        default:
          return <div className="p-6 text-sm text-red-500">Unknown sidebar type: {sidebarType}</div>;
      }
    } catch (error) {
      return <div className="p-6 text-sm text-red-500">Error: {error.message}</div>;
    }
  };

  return (
    <div className={`h-full flex flex-col bg-white shadow-2xl ${isWide ? 'w-[460px]' : 'w-96'}`} style={{ maxHeight: '100vh' }}>

      {/* Top accent */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#ff5b00] to-[#0c63e4] flex-shrink-0" />

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#ff5b00]/10 flex items-center justify-center">
            <TitleIcon className="w-3 h-3 text-[#ff5b00]" />
          </div>
          <h2 className="text-sm font-bold text-[#1a2b4e]">{meta.title}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <FaXmark className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default Sidebar;
