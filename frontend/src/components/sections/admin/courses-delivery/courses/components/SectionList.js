import React from 'react';
import SectionItem from './SectionItem';
import { FaLayerGroup, FaPlus } from 'react-icons/fa6';

const SectionList = ({
  sections,
  expandedSections,
  loadingContent = {},
  activeDropdown,
  onToggleSection,
  onToggleDropdown,
  onOpenSidebar,
  onHandleDropdownAction,
  getItemIcon,
  DropdownMenuComponent,
  dropdownRefs
}) => {
  if (!sections || sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
        <div className="w-14 h-14 rounded-full bg-[#ff5b00]/10 flex items-center justify-center mb-4">
          <FaLayerGroup className="w-6 h-6 text-[#ff5b00]" />
        </div>
        <h3 className="text-base font-semibold text-gray-700 mb-1">No sections yet</h3>
        <p className="text-sm text-gray-400 mb-5 max-w-xs">
          Start building your curriculum by adding your first section.
        </p>
        <button
          onClick={() => onOpenSidebar?.("addSection")}
          className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-[#ff5b00] rounded-full hover:bg-[#e55200] transition-colors shadow-sm"
        >
          <FaPlus className="w-3 h-3" />
          Add First Section
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((section, index) => (
        <SectionItem
          key={section.id}
          section={section}
          index={index}
          isExpanded={!!expandedSections[section.id]}
          isLoadingContent={!!loadingContent[section.id]}
          activeDropdown={activeDropdown}
          onToggleSection={onToggleSection}
          onToggleDropdown={onToggleDropdown}
          onOpenSidebar={onOpenSidebar}
          onHandleDropdownAction={onHandleDropdownAction}
          getItemIcon={getItemIcon}
          DropdownMenuComponent={DropdownMenuComponent}
          dropdownRefs={dropdownRefs}
        />
      ))}
    </div>
  );
};

export default SectionList;
