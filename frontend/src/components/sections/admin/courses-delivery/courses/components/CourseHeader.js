import React from 'react';
import { FaPlus, FaClone, FaArrowsUpDown } from 'react-icons/fa6';

const CourseHeader = ({ onAddSection, onCloneSection, onRearrangeSections, totalSections }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-gray-800">Sections</span>
          {totalSections > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ff5b00]/10 text-[#ff5b00]">
              {totalSections} {totalSections === 1 ? 'section' : 'sections'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRearrangeSections}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:border-[#ff5b00]/40 hover:text-[#ff5b00] hover:bg-[#ff5b00]/5 transition-all duration-200 shadow-sm"
          >
            <FaArrowsUpDown className="w-3 h-3" />
            Reorder
          </button>
          <button
            onClick={onCloneSection}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:border-[#0c63e4]/40 hover:text-[#0c63e4] hover:bg-[#0c63e4]/5 transition-all duration-200 shadow-sm"
          >
            <FaClone className="w-3 h-3" />
            Clone
          </button>
          <button
            onClick={onAddSection}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-[#ff5b00] rounded-full hover:bg-[#e55200] hover:shadow-md transition-all duration-200 shadow-sm"
          >
            <FaPlus className="w-3 h-3" />
            Add Section
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseHeader;
