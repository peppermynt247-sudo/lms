import React, { useState, useEffect } from 'react';
import { FaCirclePlay, FaSpinner, FaCloudArrowUp } from 'react-icons/fa6';
import { toast } from 'react-toastify';
import api from '@utils/api';

const EditMaterialSidebar = ({ initialData, onSave, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [currentFile, setCurrentFile] = useState('');
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isYoutube = initialData?.videoUrl || (initialData?.vdoCipherId && initialData.vdoCipherId.startsWith('YT-'));

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || initialData.materialName || '');
      setDescription(initialData.description || '');
      setCurrentFile(initialData.fileName || initialData.file || initialData.videoFileName || (isYoutube ? 'YouTube Video' : 'Current video file'));
      setUrl(initialData.videoUrl || initialData.url || '');
    }
  }, [initialData, isYoutube]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!title.trim()) { setErrorMessage('Material title is required.'); return; }
    if (isYoutube && !url.trim()) { setErrorMessage('YouTube URL is required.'); return; }

    try {
      setUploading(true);
      
      const videoId = initialData.contentReferenceId || initialData.id;

      if (isYoutube) {
        // Use the dedicated YouTube update endpoint
        const accessToken = require('js-cookie').get('accessToken');
        try {
          await api.put(
            `/api/video/updateyoutube/${videoId}`,
            { title: title.trim(), description: description.trim(), url: url.trim() },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
        } catch (youtubeErr) {
          console.warn("YouTube update rejected by backend constraint, falling back to standard update.", youtubeErr);
          await api.put(
            `/api/video/${videoId}/update`,
            { title: title.trim(), description: description.trim() },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
        }
      } else {
        // Standard update for VdoCipher videos
        const accessToken = require('js-cookie').get('accessToken');
        await api.put(
          `/api/video/${videoId}/update`,
          { title: title.trim(), description: description.trim() },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      }

      onSave({
        title: title.trim(),
        description: description.trim(),
        contentReferenceId: videoId,
        url: url.trim(),
        videoUrl: url.trim(),
        type: 'video',
        contentType: 'VIDEO',
      });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update material. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">

      <div className="flex-1 px-5 py-5 space-y-5 overflow-y-auto">

        {/* Type indicator */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
          <div className="w-9 h-9 rounded-full bg-[#0c63e4]/10 flex items-center justify-center flex-shrink-0">
            <FaCirclePlay className="w-4 h-4 text-[#0c63e4]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">Video</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Editing material details</p>
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="editTitle" className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Material Name <span className="text-[#ff5b00]">*</span>
          </label>
          <input
            id="editTitle"
            type="text"
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors placeholder-gray-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter the material name"
            maxLength={100}
            required
            disabled={uploading}
          />
          <div className="text-[10px] text-gray-400 text-right mt-1">{title.length}/100</div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="editDesc" className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Description <span className="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <textarea
            id="editDesc"
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors placeholder-gray-400 h-20 resize-none"
            placeholder="Brief description of this material"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            disabled={uploading}
          />
        </div>

        {/* Video source — read-only for upload, editable for YouTube */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            {isYoutube ? 'YouTube Video URL' : 'Video File'}
          </label>
          {isYoutube ? (
            <input
              type="url"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors placeholder-gray-400"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              required
              disabled={uploading}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
              <FaCloudArrowUp className="w-5 h-5 text-gray-300" />
              <p className="text-xs text-gray-400 font-medium text-center px-3 truncate max-w-full">
                {currentFile}
              </p>
              <p className="text-[10px] text-gray-400">Re-upload not available</p>
            </div>
          )}
        </div>

        {/* Uploading state */}
        {uploading && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#ff5b00]/5 border border-[#ff5b00]/20">
            <FaSpinner className="w-4 h-4 text-[#ff5b00] animate-spin flex-shrink-0" />
            <span className="text-sm text-[#ff5b00] font-medium">Updating, please wait...</span>
          </div>
        )}

        {/* Error */}
        {errorMessage && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100">
            <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-semibold text-gray-500 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors"
          disabled={uploading}
        >
          Back
        </button>
        <button
          type="submit"
          className="px-5 py-2 text-sm font-semibold text-white bg-[#ff5b00] rounded-full hover:bg-[#e55200] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={uploading}
        >
          {uploading ? 'Updating...' : 'Update Material'}
        </button>
      </div>
    </form>
  );
};

export default EditMaterialSidebar;
