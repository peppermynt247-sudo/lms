import React, { useState } from 'react';
import { FaCirclePlay, FaCode, FaFilePdf, FaClipboardList, FaChalkboard, FaArrowRight } from 'react-icons/fa6';

const MATERIAL_TYPES = [
  { key: 'video',       label: 'Video',                   icon: FaCirclePlay,    bg: 'bg-[#0c63e4]/10',  text: 'text-[#0c63e4]',  border: 'border-[#0c63e4]/30',  activeBg: 'bg-[#0c63e4]/10' },
  { key: 'programming', label: 'Programming Assignment',  icon: FaCode,          bg: 'bg-[#1a2b4e]/10',  text: 'text-[#1a2b4e]',  border: 'border-[#1a2b4e]/30',  activeBg: 'bg-[#1a2b4e]/10' },
  { key: 'slide',       label: 'Slide',                   icon: FaChalkboard,    bg: 'bg-[#ff5b00]/10',  text: 'text-[#ff5b00]',  border: 'border-[#ff5b00]/30',  activeBg: 'bg-[#ff5b00]/10' },
  { key: 'exercise',    label: 'Exercise',                icon: FaClipboardList, bg: 'bg-[#f2277e]/10',  text: 'text-[#f2277e]',  border: 'border-[#f2277e]/30',  activeBg: 'bg-[#f2277e]/10' },
  { key: 'pdf',         label: 'PDF',                     icon: FaFilePdf,       bg: 'bg-[#f2277e]/10',  text: 'text-[#f2277e]',  border: 'border-[#f2277e]/30',  activeBg: 'bg-[#f2277e]/10' },
];

const AddMaterialOptionsCard = ({ onSelectMaterialType, onClose, onBack, sectionData }) => {
  const [selectedType, setSelectedType] = useState(null);

  return (
    <div className="flex flex-col h-full">

      {/* Intro */}
      <div className="px-5 pt-5 pb-4">
        <p className="text-xs text-gray-500">Choose the type of content you want to add to this section.</p>
      </div>

      {/* Type grid */}
      <div className="flex-1 px-5 pb-4">
        <div className="grid grid-cols-3 gap-3">
          {MATERIAL_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.key;
            return (
              <button
                key={type.key}
                type="button"
                onClick={() => setSelectedType(type.key)}
                className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-150 ${
                  isSelected
                    ? `${type.activeBg} ${type.border} shadow-sm`
                    : 'border-gray-100 bg-gray-50/60 hover:border-gray-200 hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type.bg}`}>
                  <Icon className={`w-4.5 h-4.5 w-5 h-5 ${isSelected ? type.text : 'text-gray-500'}`} />
                </div>
                <span className={`text-[11px] font-semibold text-center leading-tight ${isSelected ? type.text : 'text-gray-600'}`}>
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
        <button
          type="button"
          onClick={onBack || onClose}
          className="px-4 py-2 text-sm font-semibold text-gray-500 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => selectedType && onSelectMaterialType(selectedType, sectionData)}
          disabled={!selectedType}
          className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
            selectedType
              ? 'bg-[#ff5b00] text-white hover:bg-[#e55200] shadow-sm'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
          <FaArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default AddMaterialOptionsCard;
