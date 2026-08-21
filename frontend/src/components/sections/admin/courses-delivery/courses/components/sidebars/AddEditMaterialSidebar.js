import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { toast } from "react-toastify";
import api from "@utils/api";
import { FaCloudArrowUp, FaCirclePlay, FaCode, FaFilePdf, FaClipboardList, FaChalkboard, FaSpinner } from "react-icons/fa6";

const TYPE_META = {
  video:       { icon: FaCirclePlay,    label: 'Video',                  color: 'text-[#0c63e4]',  bg: 'bg-[#0c63e4]/10' },
  programming: { icon: FaCode,          label: 'Programming Assignment', color: 'text-[#1a2b4e]',  bg: 'bg-[#1a2b4e]/10' },
  slide:       { icon: FaChalkboard,    label: 'Slide',                  color: 'text-[#ff5b00]',  bg: 'bg-[#ff5b00]/10' },
  exercise:    { icon: FaClipboardList, label: 'Exercise',               color: 'text-[#f2277e]',  bg: 'bg-[#f2277e]/10' },
  pdf:         { icon: FaFilePdf,       label: 'PDF',                    color: 'text-[#f2277e]',  bg: 'bg-[#f2277e]/10' },
};

const AddEditMaterialSidebar = ({
  mode = "add",
  materialType = "",
  videoType,
  initialData = {},
  onSave,
  onClose,
  onBack,
  preSelectedType,
  curriculumId,
  sectionId,
}) => {
  const router = useRouter();

  const memoizedInitialData = useMemo(() => initialData, [
    initialData.materialName,
    initialData.title,
    initialData.description,
  ]);

  const [materialName, setMaterialName] = useState(memoizedInitialData.materialName || "");
  const [description, setDescription] = useState(memoizedInitialData.description || "");
  const [file, setFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [maxViews] = useState(memoizedInitialData.maxViews || 'unlimited');
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(initialData.url || initialData.videoUrl || '');
  const [videoAddMode, setVideoAddMode] = useState('upload'); // 'upload' or 'youtube'
  const [errorMessage, setErrorMessage] = useState('');

  const selectedType = preSelectedType || materialType || 'video';
  const typeMeta = TYPE_META[selectedType] || TYPE_META.video;
  const TypeIcon = typeMeta.icon;

  useEffect(() => {
    if (selectedType === "programming") {
      router.push(`/admin/curriculum/${curriculumId}/section/${sectionId}/prog_assignment/create`);
    } else if (selectedType === "exercise") {
      router.push(`/admin/curriculum/${curriculumId}/section/${sectionId}/exercise/create`);
    }
  }, [selectedType, curriculumId, sectionId, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!materialName.trim()) {
      setErrorMessage('Material name is required.');
      return;
    }

    // Slide / PDF upload
    if (selectedType === 'slide' || selectedType === 'pdf') {
      if (mode === 'add') {
        if (!pdfFile && !url) {
          setErrorMessage('Please select a PDF file or provide a slides URL.');
          return;
        }
        try {
          setUploading(true);
          const sectionIdValue = sectionId || initialData.sectionId || initialData.id || initialData.section?.id;
          if (!sectionIdValue) { toast.error('Section ID is missing.'); setUploading(false); return; }
          const accessToken = require('js-cookie').get('accessToken');
          if (!accessToken) { toast.error('Access token is missing.'); setUploading(false); return; }

          let res;
          if (pdfFile) {
            const formData = new FormData();
            formData.append('title', materialName);
            formData.append('description', description || '');
            formData.append('ebookFile', pdfFile);
            res = await api.post(`/api/curriculum-sections/${sectionIdValue}/ebooks`, formData,
              { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'multipart/form-data' } });
          } else {
            res = await api.post(`/api/curriculum-sections/${sectionIdValue}/ebooks`,
              { title: materialName, description: description || '', fileUrl: url },
              { headers: { Authorization: `Bearer ${accessToken}` } });
          }
          if (!res.data) { setErrorMessage('Failed to upload. Please try again.'); setUploading(false); return; }
          toast.success('Slides uploaded successfully!');
          onSave({ materialName, title: materialName, description: description || '', fileUrl: res.data.fileUrl || url, type: selectedType });
        } catch (err) {
          setErrorMessage('Upload failed. Please try again.');
        } finally {
          setUploading(false);
        }
        return;
      }
    }

    // Video upload / YouTube
    if (selectedType === 'video') {
      if (mode === 'add') {
        if (videoAddMode === 'upload') {
          if (!file) {
            setErrorMessage('Please select a video file to upload.');
            return;
          }
          try {
            setUploading(true);
            const sectionIdValue = initialData.sectionId || initialData.id || initialData.section?.id || sectionId;
            if (!sectionIdValue) { toast.error('Section ID is missing.'); setUploading(false); return; }
            const accessToken = require('js-cookie').get('accessToken');
            if (!accessToken) { toast.error('Access token is missing.'); setUploading(false); return; }

            const res = await api.post(
              `/api/video/upload?curriculumsectionId=${sectionIdValue}`,
              { title: materialName, description: description || '' },
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (!res.data || !res.data.clientPayload || !res.data.videoId) {
              setErrorMessage('Failed to fetch upload credentials.'); setUploading(false); return;
            }
            const { clientPayload, videoId } = res.data;
            const formData = new FormData();
            Object.entries(clientPayload).forEach(([key, value]) => {
              if (key !== 'uploadLink') formData.append(key, value);
            });
            formData.append('success_action_status', '201');
            formData.append('success_action_redirect', '');
            formData.append('file', file);
            await fetch(clientPayload.uploadLink, { method: 'POST', body: formData });

            onSave({ materialName, title: materialName, description: description || '', videoId, maxViews, type: selectedType, ...(videoType ? { videoType } : {}) });
          } catch (err) {
            setErrorMessage('Video upload failed. Please try again.');
          } finally {
            setUploading(false);
          }
        } else {
          // YouTube addition
          if (!url) {
            setErrorMessage('Please provide a YouTube video URL.');
            return;
          }
          try {
            setUploading(true);
            const sectionIdValue = initialData.sectionId || initialData.id || initialData.section?.id || sectionId;
            if (!sectionIdValue) { toast.error('Section ID is missing.'); setUploading(false); return; }
            const accessToken = require('js-cookie').get('accessToken');
            if (!accessToken) { toast.error('Access token is missing.'); setUploading(false); return; }

            const res = await api.post(
              `/api/video/addyoutube?curriculumsectionId=${sectionIdValue}`,
              { title: materialName, description: description || '', url: url },
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            
            if (res.status === 200 || res.status === 201) {
              toast.success('YouTube video added successfully!');
              onSave({ materialName, title: materialName, description: description || '', type: selectedType, url: url, videoUrl: url });
            } else {
              setErrorMessage('Failed to add YouTube video.');
            }
          } catch (err) {
            setErrorMessage('Video addition failed. Please try again.');
          } finally {
            setUploading(false);
          }
        }
        return;
      }
      if (mode === 'edit') {
        onSave({ videoId: initialData.videoId || initialData.id || '', title: materialName || initialData.title || '', description: description !== undefined ? description : (initialData.description || '') });
        return;
      }
    }

    onSave({ materialName, description, file, type: selectedType, ...(videoType ? { videoType } : {}), ...(selectedType === 'slide' ? { fileUrl: url } : {}) });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">

      {/* Form body */}
      <div className="flex-1 px-5 py-5 space-y-5 overflow-y-auto">

        {/* Type indicator */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${typeMeta.bg}`}>
            <TypeIcon className={`w-4 h-4 ${typeMeta.color}`} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">{typeMeta.label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{mode === 'add' ? 'Adding new material' : 'Editing material'}</p>
          </div>
        </div>

        {/* Material name */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Material Name <span className="text-[#ff5b00]">*</span>
          </label>
          <input
            type="text"
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors placeholder-gray-400"
            maxLength={100}
            value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
            placeholder="Enter the material name"
            required
            disabled={uploading}
          />
          <div className="text-[10px] text-gray-400 text-right mt-1">{materialName.length}/100</div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Description <span className="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <textarea
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors placeholder-gray-400 h-20 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this material"
            maxLength={500}
            disabled={uploading}
          />
        </div>

        {/* Video selection tabs */}
        {selectedType === 'video' && mode === 'add' && (
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setVideoAddMode('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${videoAddMode === 'upload' ? 'bg-white text-[#ff5b00] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FaCloudArrowUp className="w-3.5 h-3.5" />
              Upload Video
            </button>
            <button
              type="button"
              onClick={() => setVideoAddMode('youtube')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${videoAddMode === 'youtube' ? 'bg-white text-[#ff5b00] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FaCirclePlay className="w-3.5 h-3.5" />
              YouTube Link
            </button>
          </div>
        )}

        {/* Video file upload */}
        {selectedType === 'video' && mode === 'add' && videoAddMode === 'upload' && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Video File
            </label>
            <label className={`flex flex-col items-center justify-center gap-2 w-full h-28 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${file ? 'border-[#ff5b00]/40 bg-[#ff5b00]/5' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'}`}>
              <FaCloudArrowUp className={`w-6 h-6 ${file ? 'text-[#ff5b00]' : 'text-gray-400'}`} />
              <span className="text-xs text-gray-500 font-medium">
                {file ? file.name : 'Click to upload video (.mp4, .avi, .mov)'}
              </span>
              <input type="file" className="sr-only" accept="video/*" onChange={(e) => setFile(e.target.files[0])} disabled={uploading} />
            </label>
          </div>
        )}

        {/* YouTube URL input */}
        {selectedType === 'video' && mode === 'add' && videoAddMode === 'youtube' && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              YouTube Video URL <span className="text-[#ff5b00]">*</span>
            </label>
            <input
              type="url"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors placeholder-gray-400"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              required
              disabled={uploading}
            />
          </div>
        )}

        {/* PDF / Slide upload */}
        {(selectedType === 'slide' || selectedType === 'pdf') && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Upload PDF File
              </label>
              <label className={`flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${pdfFile ? 'border-[#f2277e]/40 bg-[#f2277e]/5' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                <FaCloudArrowUp className={`w-5 h-5 ${pdfFile ? 'text-[#f2277e]' : 'text-gray-400'}`} />
                <span className="text-xs text-gray-500 font-medium">
                  {pdfFile ? pdfFile.name : 'Click to upload PDF'}
                </span>
                <input type="file" className="sr-only" accept=".pdf" onChange={(e) => setPdfFile(e.target.files[0])} disabled={uploading} />
              </label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Slides URL {pdfFile && <span className="text-gray-400 font-normal normal-case">(optional if file selected)</span>}
              </label>
              <input
                type="url"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors placeholder-gray-400"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                disabled={uploading}
              />
            </div>
          </>
        )}

        {/* Uploading state */}
        {uploading && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#ff5b00]/5 border border-[#ff5b00]/20">
            <FaSpinner className="w-4 h-4 text-[#ff5b00] animate-spin flex-shrink-0" />
            <span className="text-sm text-[#ff5b00] font-medium">Uploading, please wait...</span>
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
          onClick={() => (onBack ? onBack() : onClose())}
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
          {uploading ? 'Uploading...' : mode === 'edit' ? 'Update Material' : 'Add Material'}
        </button>
      </div>
    </form>
  );
};

export default AddEditMaterialSidebar;
