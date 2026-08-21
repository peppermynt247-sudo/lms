import React, { useState } from 'react';
import { Play, Lock, Info } from 'lucide-react';

// Only include Secured DRM in the videoTypes array
const videoTypes = [
  { id: 'normal', label: 'Normal Video', icon: Play, description: 'No DRM. For non-sensitive content.', disabled: true },
  { id: 'secured_drm', label: 'Secured DRM', icon: Lock, description: 'Max protection against piracy.', disabled: false }
];

const videoTypeInfo = {
  normal: 'Normal Video: Uploaded to Vimeo without DRM protection. Ideal for: Non-sensitive content where protection is not a priority.',
  secured_drm: 'Secured DRM: Highest security preventing screenshots and screen recording. Ideal for: Exclusive videos with IP rights',
};

function VideoTypeCard({ type, selected, onClick }) {
  const IconComponent = type.icon;
  return (
    <button
      className={`flex flex-col items-center border rounded-xl p-3 w-24 h-28 shadow-sm transition-all duration-200 focus:outline-none bg-white hover:shadow-md ${selected ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500' : 'border-gray-200'} ${type.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => !type.disabled && onClick(type.id)}
      type="button"
      disabled={type.disabled}
      aria-selected={selected}
      style={{ minWidth: 0, maxWidth: 96 }}
    >
      <IconComponent className={`w-7 h-7 mb-2 ${selected ? 'text-blue-600' : 'text-gray-400'} ${type.disabled ? 'text-gray-300' : ''}`} />
      <span className={`text-xs font-semibold mb-1 text-center ${selected ? 'text-blue-700' : 'text-gray-800'} ${type.disabled ? 'text-gray-400' : ''}`}>{type.label}</span>
      <span className="text-[10px] text-gray-500 text-center mt-1 leading-tight truncate w-full block" title={type.description}>{type.description}</span>
    </button>
  );
}

const SelectVideoTypeSidebar = ({ onSelect, onBack }) => {
  // Default to 'secured_drm' since that's the only enabled option
  const [selected, setSelected] = useState('secured_drm');

  return (
    <div className="max-w-md w-[350px] h-full flex flex-col bg-white rounded-lg shadow-xl overflow-hidden" style={{ position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 50 }}>
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-lg font-bold text-blue-900 mb-1 tracking-tight">Select Video Type</h2>
        <div className="text-xs text-gray-600 mb-2">Choose the type of video you want to upload.</div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col items-center justify-center">
        <div className="flex gap-4 mb-5 w-full justify-center">
          {videoTypes.map((type) => (
            <VideoTypeCard
              key={type.id}
              type={type}
              selected={selected === type.id}
              onClick={setSelected}
            />
          ))}
        </div>
        <div className="w-full bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2 mb-3 shadow-sm">
          <Info className="w-5 h-5 text-blue-400 mt-1" />
          <div className="text-xs text-blue-900">
            <div className="font-semibold mb-1">{videoTypes.find(t => t.id === selected)?.label}</div>
            <div className="whitespace-pre-line leading-tight">{videoTypeInfo[selected]}</div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 p-4 border-t border-gray-100 bg-white sticky bottom-0 z-10">
        <button
          onClick={onBack}
          className="px-4 py-1.5 text-xs rounded-md font-medium text-blue-600 border border-blue-600 bg-white hover:bg-blue-50 transition"
          type="button"
        >
          Back
        </button>
        <button
          onClick={() => onSelect(selected)}
          disabled={!selected}
          className="px-4 py-1.5 text-xs font-medium transition"
          type="button"
          style={selected ? {
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            boxShadow: '0 1px 2px rgba(37,99,235,0.08)',
            cursor: 'pointer',
            borderRadius: '0.5rem', // rounded-md
          } : {
            backgroundColor: '#d1d5db',
            color: '#fff',
            border: 'none',
            cursor: 'not-allowed',
            borderRadius: '0.5rem', // rounded-md
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default SelectVideoTypeSidebar; 