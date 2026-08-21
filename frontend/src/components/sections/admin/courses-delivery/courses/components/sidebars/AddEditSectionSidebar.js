import React, { useState, useEffect } from 'react';
import { FaLayerGroup } from 'react-icons/fa6';
import { toast } from 'react-toastify';

const AddEditSectionSidebar = ({ mode = 'add', initialData, onSave, onClose }) => {
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setTitle(initialData.title || '');
      setShortDescription(initialData.shortDescription || '');
    } else {
      setTitle('');
      setShortDescription('');
    }
  }, [mode, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warn('Section name is required.');
      return;
    }
    onSave({ title, shortDescription });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">

      {/* Form fields */}
      <div className="flex-1 px-5 py-5 space-y-5 overflow-y-auto">

        {/* Live preview chip */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
          <div className="w-9 h-9 rounded-full bg-[#ff5b00]/10 flex items-center justify-center flex-shrink-0">
            <FaLayerGroup className="w-4 h-4 text-[#ff5b00]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-700 truncate">
              {title || (mode === 'add' ? 'New Section' : 'Section Name')}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Section preview</p>
          </div>
        </div>

        {/* Section Name */}
        <div>
          <label htmlFor="sectionName" className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Section Name <span className="text-[#ff5b00]">*</span>
          </label>
          <input
            id="sectionName"
            type="text"
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors placeholder-gray-400"
            placeholder="e.g. Introduction to JavaScript"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Short Description */}
        <div>
          <label htmlFor="shortDescription" className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Description <span className="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <div className="relative">
            <textarea
              id="shortDescription"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors placeholder-gray-400 h-24 resize-none"
              placeholder="Briefly describe what this section covers"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              maxLength={250}
            />
            <span className="absolute bottom-2.5 right-3 text-[10px] text-gray-400">
              {shortDescription.length}/250
            </span>
          </div>
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
          type="submit"
          className="px-5 py-2 text-sm font-semibold text-white bg-[#ff5b00] rounded-full hover:bg-[#e55200] transition-colors shadow-sm"
        >
          {mode === 'add' ? 'Add Section' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default AddEditSectionSidebar;
