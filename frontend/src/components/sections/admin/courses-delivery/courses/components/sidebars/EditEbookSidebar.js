import React, { useState } from "react";
import { FaBookOpen, FaXmark, FaSpinner, FaCloudArrowUp } from "react-icons/fa6";
import { toast } from "react-toastify";
import api from "@utils/api";

const EditEbookSidebar = ({ initialData = {}, onSave, onClose }) => {
  const [title, setTitle] = useState(initialData.title || initialData.materialName || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [ebookFile, setEbookFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!title.trim()) { setErrorMessage("Title is required."); return; }

    const ebookId = initialData.contentReferenceId || initialData.ebookId || initialData.id;
    if (!ebookId) { toast.error("eBook ID is missing."); return; }

    const accessToken = require("js-cookie").get("accessToken");
    if (!accessToken) { toast.error("Access token is missing."); return; }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("title", title);
      if (description) formData.append("description", description);
      if (ebookFile) formData.append("ebookFile", ebookFile);

      const res = await api.put(`/api/ebooks/${ebookId}`, formData, {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "multipart/form-data" },
      });

      if (!res.data) { setErrorMessage("Failed to update eBook. Please try again."); return; }

      toast.success("eBook updated successfully!");
      if (onSave) onSave({ title, description });
      if (onClose) onClose();
    } catch {
      setErrorMessage("eBook update failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="h-full w-96 flex flex-col bg-white shadow-2xl" style={{ maxHeight: "100vh" }}>

      {/* Top accent */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#ff5b00] to-[#0c63e4] flex-shrink-0" />

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#f2277e]/10 flex items-center justify-center">
            <FaBookOpen className="w-3 h-3 text-[#f2277e]" />
          </div>
          <h2 className="text-sm font-bold text-[#1a2b4e]">Edit eBook</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <FaXmark className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 px-5 py-5 space-y-5 overflow-y-auto">

          {/* Type indicator */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-9 h-9 rounded-full bg-[#f2277e]/10 flex items-center justify-center flex-shrink-0">
              <FaBookOpen className="w-4 h-4 text-[#f2277e]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">eBook / PDF</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Editing material details</p>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Title <span className="text-[#ff5b00]">*</span>
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors placeholder-gray-400"
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter the eBook title"
              required
              disabled={uploading}
            />
            <div className="text-[10px] text-gray-400 text-right mt-1">{title.length}/100</div>
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
              placeholder="Brief description"
              maxLength={500}
              disabled={uploading}
            />
          </div>

          {/* File replace */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Replace File <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <label className={`flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${ebookFile ? 'border-[#f2277e]/40 bg-[#f2277e]/5' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
              <FaCloudArrowUp className={`w-5 h-5 ${ebookFile ? 'text-[#f2277e]' : 'text-gray-400'}`} />
              <span className="text-xs text-gray-500 font-medium text-center px-2">
                {ebookFile ? ebookFile.name : 'Click to upload (PDF, PPT, PPTX)'}
              </span>
              <input type="file" className="sr-only" accept=".pdf,.ppt,.pptx" onChange={(e) => setEbookFile(e.target.files[0] || null)} disabled={uploading} />
            </label>
            <p className="text-[10px] text-gray-400 mt-1.5">Leave empty to keep the existing file.</p>
          </div>

          {/* Uploading */}
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
            {uploading ? "Updating..." : "Update eBook"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditEbookSidebar;
