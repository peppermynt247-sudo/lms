"use client";

import { useState, useEffect } from "react";
import { ImagePlus, X } from "lucide-react";

export default function ThumbnailUpload({ thumbnail, onThumbnailChange }) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (thumbnail && typeof thumbnail === "string") {
      setPreviewUrl(thumbnail);
    } else if (thumbnail instanceof File) {
      const url = URL.createObjectURL(thumbnail);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [thumbnail]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFiles(e.dataTransfer.files[0]);
  };

  const handleFiles = (file) => {
    if (file?.type.startsWith("image/")) onThumbnailChange(file);
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
        Thumbnail Image <span className="text-[#ff5b00]">*</span>
      </label>

      {previewUrl ? (
        <div className="flex justify-center">
          <div className="relative w-44 h-44 rounded-2xl overflow-hidden border-2 border-[#ff5b00]/20 shadow-sm group">
            <img src={previewUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-[#1a2b4e]/0 group-hover:bg-[#1a2b4e]/30 transition-colors duration-200 flex items-center justify-center">
              <button
                type="button"
                onClick={() => onThumbnailChange(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 text-gray-700 hover:bg-white shadow opacity-0 group-hover:opacity-100 transition-all duration-200"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label
          className={`relative flex flex-col items-center justify-center gap-3 w-full h-36 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
            dragActive
              ? "border-[#ff5b00] bg-[#ff5b00]/5"
              : "border-gray-200 bg-gray-50 hover:border-[#ff5b00]/50 hover:bg-[#ff5b00]/3"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            dragActive ? "bg-[#ff5b00]/10" : "bg-gray-100"
          }`}>
            <ImagePlus className={`w-5 h-5 transition-colors ${dragActive ? "text-[#ff5b00]" : "text-gray-400"}`} />
          </div>
          <div className="text-center px-4">
            <p className={`text-xs font-semibold transition-colors ${dragActive ? "text-[#ff5b00]" : "text-gray-600"}`}>
              Click or drag to upload
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG, WebP — max 5 MB</p>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files[0])}
            className="sr-only"
          />
        </label>
      )}
    </div>
  );
}
