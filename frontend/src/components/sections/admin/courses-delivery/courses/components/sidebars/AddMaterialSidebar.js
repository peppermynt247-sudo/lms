// components/sidebars/AddMaterialSidebar.js
import React, { useState, useEffect } from 'react';
import { UploadCloud } from 'lucide-react'; // Example icon

const AddMaterialSidebar = ({ sectionData, preSelectedType, onSave, onClose }) => {
  const [title, setTitle] = useState('');
  const [materialType, setMaterialType] = useState(preSelectedType || 'video'); // Default or pre-selected
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // Add other fields relevant to the material type, e.g., videoUrl, quizQuestions, etc.

  useEffect(() => {
    setMaterialType(preSelectedType || 'video');
    // Reset other fields if preSelectedType changes, or on mount
    setTitle('');
    setFile(null);
    setDescription('');
    setErrorMessage('');
  }, [preSelectedType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!title.trim()) {
      setErrorMessage("Material title is required.");
      return;
    }
    if (materialType === 'video' && !file) {
      setErrorMessage("Please select a video file to upload.");
      return;
    }
    
    try {
      setUploading(true);
      // For file uploads, you'd handle the actual upload process here or pass the File object
      const materialDetails = {
        title,
        type: materialType,
        description, // Example field
        file: file ? file.name : null, // Or the actual file object for upload handling
        // ...other specific fields based on materialType
      };
      await onSave(materialDetails); // onSave will receive sectionId via page.js's onSave setup
    } catch (error) {
      setErrorMessage('Failed to upload material. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 p-5 space-y-5 overflow-y-auto">
        <p className="text-xs text-gray-600 mb-1">
          Adding new material to section: <span className="font-semibold text-gray-800">{sectionData?.title}</span>
        </p>
        <div>
          <label htmlFor="materialTitle" className="block text-xs font-medium text-gray-900 mb-1.5">
            Material Title <span className="text-red-500">*</span>
          </label>
          <input
            id="materialTitle"
            type="text"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter material title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={uploading}
          />
        </div>

        <div>
          <label htmlFor="materialType" className="block text-xs font-medium text-gray-900 mb-1.5">
            Material Type
          </label>
          <select
            id="materialType"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            value={materialType}
            onChange={(e) => setMaterialType(e.target.value)}
            disabled={uploading}
          >
            <option value="video">Video</option>
            <option value="document">Document</option>
            <option value="quiz">Quiz</option>
            <option value="text">Text / Article</option>
            <option value="code">Code Snippet</option>
            <option value="audio">Audio</option>
            <option value="link">Web Link</option>
            <option value="survey">Survey / Poll</option>
            <option value="scorm">SCORM / xAPI</option>
            <option value="assignment">Assignment</option>
          </select>
        </div>

        {/* Conditional fields based on materialType */}
        {materialType === 'video' && (
          <div>
            <label htmlFor="videoFile" className="block text-xs font-medium text-gray-900 mb-1.5">
              Upload Video or Enter URL
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded mb-2"
              placeholder="Enter Video URL (e.g., YouTube, Vimeo)"
              disabled={uploading}
            />
            <div className="text-center my-1 text-xs text-gray-500">OR</div>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                    <label
                        htmlFor="video-file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                        <span>Upload a file</span>
                        <input id="video-file-upload" name="video-file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="video/*" disabled={uploading}/>
                    </label>
                    <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">MP4, MOV, AVI up to 500MB</p>
                    {file && <p className="text-xs text-green-600 mt-1">Selected: {file.name}</p>}
                </div>
            </div>
          </div>
        )}
        {/* Add more conditional fields for other types (document, quiz etc.) */}

        <div>
          <label htmlFor="materialDescription" className="block text-xs font-medium text-gray-900 mb-1.5">
            Description (Optional)
          </label>
          <textarea
            id="materialDescription"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20 resize-none"
            placeholder="Briefly describe this material"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            disabled={uploading}
          />
        </div>
        
        {uploading && (
          <div className="flex items-center text-blue-600 text-sm font-medium">
            <svg className="animate-spin h-5 w-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
            Uploading material, please wait...
          </div>
        )}
        
        {errorMessage && (
          <div className="text-red-600 text-sm font-medium">{errorMessage}</div>
        )}
      </div>

      <div className="p-5 border-t border-gray-200 bg-gray-50 sticky bottom-0">
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 font-medium text-gray-700" disabled={uploading}>Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Add Material'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddMaterialSidebar;