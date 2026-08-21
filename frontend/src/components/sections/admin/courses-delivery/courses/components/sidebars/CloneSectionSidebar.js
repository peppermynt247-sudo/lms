import React, { useState } from 'react';
import { FaClone, FaChevronDown } from 'react-icons/fa6';

const CloneSectionSidebar = ({ allSections, onSave, onClose }) => {
  const [formData, setFormData] = useState({ curriculum: '', section: '', rename: '' });

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 px-5 py-5 space-y-5 overflow-y-auto">

        {/* Info chip */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#0c63e4]/5 border border-[#0c63e4]/10">
          <div className="w-8 h-8 rounded-full bg-[#0c63e4]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FaClone className="w-3.5 h-3.5 text-[#0c63e4]" />
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Copy a section from this curriculum. The cloned section will be independent and won't change if the original is modified.
          </p>
        </div>

        {/* Curriculum select */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Curriculum <span className="text-[#ff5b00]">*</span>
          </label>
          <div className="relative">
            <select
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors appearance-none bg-white text-gray-700"
              value={formData.curriculum}
              onChange={(e) => handleChange('curriculum', e.target.value)}
            >
              <option value="">Select curriculum</option>
              <option value="java-basics">Java Basics</option>
              <option value="advanced-java">Advanced Java</option>
              <option value="spring-boot">Spring Boot</option>
            </select>
            <FaChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Section select */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Section <span className="text-[#ff5b00]">*</span>
          </label>
          <div className="relative">
            <select
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors appearance-none bg-white text-gray-700"
              value={formData.section}
              onChange={(e) => handleChange('section', e.target.value)}
            >
              <option value="">Select section to clone</option>
              {(allSections || []).map((section) => (
                <option key={section.id} value={section.id}>{section.title}</option>
              ))}
            </select>
            <FaChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Rename */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Rename <span className="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <input
            type="text"
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors placeholder-gray-400"
            placeholder="Give the cloned section a new name"
            value={formData.rename}
            onChange={(e) => handleChange('rename', e.target.value)}
            maxLength={100}
          />
          <div className="text-[10px] text-gray-400 text-right mt-1">{formData.rename.length}/100</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-semibold text-gray-500 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#ff5b00] rounded-full hover:bg-[#e55200] transition-colors shadow-sm"
        >
          <FaClone className="w-3 h-3" />
          Clone Section
        </button>
      </div>
    </div>
  );
};

export default CloneSectionSidebar;
