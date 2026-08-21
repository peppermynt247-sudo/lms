import React from 'react';
import { X, AlertTriangle } from "lucide-react";

const ConfirmationModal = ({ type, data, onClose, onConfirmDeleteSection, onConfirmDeleteMaterial }) => {
  const getModalContent = () => {
    switch (type) {
      case 'deleteSection':
        return {
          title: 'Delete Section',
          icon: <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />,
          content: (
            <div className="space-y-3 text-center">
              <p className="text-md text-gray-700">
                Are you sure you want to delete this section?
              </p>
              <div className="bg-red-50 p-3 rounded border border-red-200 text-left">
                <h4 className="text-sm font-semibold text-red-900">{data?.title}</h4>
                <p className="text-xs text-red-700 mt-1">
                  This will permanently delete the section and its {data?.items?.length || 0} material(s). This action cannot be undone.
                </p>
              </div>
            </div>
          ),
          actions: (
            <>
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 w-full sm:w-auto">Cancel</button>
              <button onClick={() => onConfirmDeleteSection(data.id)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 w-full sm:w-auto">Delete Section</button>
            </>
          )
        };
      case 'deleteMaterial':
        return {
          title: 'Delete Material',
          icon: <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />,
          content: (
            <div className="space-y-3 text-center">
              <p className="text-md text-gray-700">
                Are you sure you want to delete this material?
              </p>
              <div className="bg-red-50 p-3 rounded border border-red-200 text-left">
                <h4 className="text-sm font-semibold text-red-900">{data?.title}</h4>
                <p className="text-xs text-red-700 mt-1">
                  Type: {data?.type}. This action cannot be undone.
                </p>
              </div>
            </div>
          ),
          actions: (
            <>
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 w-full sm:w-auto">Cancel</button>
              <button onClick={() => onConfirmDeleteMaterial(data.id, data.sectionId)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 w-full sm:w-auto">Delete Material</button>
            </>
          )
        };
      default:
        return {
          title: data?.title || 'Confirm Action',
          icon: <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />,
          content: <p className="text-md text-gray-700 text-center">Are you sure you want to {type} "{data?.title || 'this item'}"?</p>,
          actions: (
            <>
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 w-full sm:w-auto">Cancel</button>
              <button onClick={() => { /* Implement generic confirm */ onClose(); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full sm:w-auto">Confirm</button>
            </>
          )
        };
    }
  };

  const modalContent = getModalContent();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
        <div className="p-6">
          {modalContent.icon}
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">{modalContent.title}</h3>
          <div className="mb-6">{modalContent.content}</div>
          <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-3">{modalContent.actions}</div>
        </div>
         <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
        >
            <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ConfirmationModal;