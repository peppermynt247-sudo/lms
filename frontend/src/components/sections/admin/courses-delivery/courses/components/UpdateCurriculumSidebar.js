import React, { useState, useEffect } from "react";
import { X, GraduationCap, Loader2, Save } from "lucide-react";

const UpdateCurriculumSidebar = ({
  isOpen,
  onClose,
  onUpdateCurriculum,
  initialName = "",
  initialDescription = "",
  loading = false,
}) => {
  const [name,        setName]        = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription(initialDescription);
    }
  }, [isOpen, initialName, initialDescription]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateCurriculum({ name, description });
  };

  if (!isOpen) return null;

  const inputClass =
    "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors placeholder-gray-400 text-[#1a2b4e] bg-white";
  const labelClass =
    "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ animation: "ucFadeIn 0.2s ease-out" }}
    >
      <style>{`
        @keyframes ucFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes ucSlideIn { from { transform:translateX(100%) } to { transform:translateX(0) } }
      `}</style>

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1a2b4e]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-96 h-full bg-white shadow-2xl flex flex-col z-10"
        style={{ animation: "ucSlideIn 0.28s cubic-bezier(0.16,1,0.3,1)" }}
      >
        {/* Gradient accent */}
        <div className="h-0.5 w-full bg-gradient-to-r from-[#ff5b00] via-[#f2277e] to-[#0c63e4] flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff5b00]/15 to-[#ff5b00]/5 flex items-center justify-center border border-[#ff5b00]/15">
              <GraduationCap className="w-4 h-4 text-[#ff5b00]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1a2b4e]">Update Curriculum</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Edit the name and description.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-[#1a2b4e] hover:bg-gray-100 transition-all duration-150"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            <div>
              <label className={labelClass}>
                Name <span className="text-[#ff5b00]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                required
                placeholder="Enter curriculum name"
              />
            </div>

            <div>
              <label className={labelClass}>
                Description{" "}
                <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputClass} resize-none`}
                rows={4}
                placeholder="Brief description of this curriculum"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-gray-500 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#ff5b00] rounded-full hover:bg-[#e55200] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateCurriculumSidebar;
