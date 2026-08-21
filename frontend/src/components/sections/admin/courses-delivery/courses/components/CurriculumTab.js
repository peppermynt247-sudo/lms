"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Plus, GraduationCap, ChevronRight, MoreVertical, Edit3, Unlink, Loader2, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const CurriculumTab = ({
  curriculums,
  defaultCurriculumId,
  onAddCurriculum,
  onEditCurriculum,
  onDeleteCurriculum,
  onMakeDefault,
  deleteLabel = "Delete",
}) => {
  const router     = useRouter();
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);
  // Close menu when clicking outside
  useEffect(() => {
    if (openMenuId === null) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const handleRowClick = useCallback(
    (curriculumId) => {
      if (!curriculumId) { toast.error("Invalid curriculum ID"); return; }
      router.push(`/admin/curriculum/${curriculumId}/editCurriculum`);
    },
    [router]
  );

  const handleMenuToggle = (id) =>
    setOpenMenuId((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-[#1a2b4e]">Curriculums</h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ff5b00]/8 border border-[#ff5b00]/15 text-[10px] font-semibold text-[#ff5b00]">
            <span className="w-1 h-1 rounded-full bg-[#ff5b00]" />
            {String(curriculums.length).padStart(2, "0")} linked
          </span>
        </div>

        <button
          onClick={onAddCurriculum}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#ff5b00] rounded-xl hover:bg-[#e55200] active:scale-95 transition-all duration-150 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Curriculum
        </button>
      </div>

      {/* ── List ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-visible">
        {/* Column headers */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="col-span-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">#</div>
          <div className="col-span-7 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Curriculum Name</div>
          <div className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Content</div>
          <div className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</div>
        </div>

        {/* Empty state */}
        {curriculums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff5b00]/8 to-[#0c63e4]/8 flex items-center justify-center border border-gray-100">
              <GraduationCap className="w-6 h-6 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#1a2b4e]">No curriculums linked</p>
              <p className="text-xs text-gray-400 mt-0.5">Click "Add Curriculum" to link one to this course.</p>
            </div>
          </div>
        ) : (
          curriculums.map((curriculum, index) => (
            <div
              key={curriculum.id ? `curr-${curriculum.id}` : `idx-${index}`}
              onClick={() => handleRowClick(curriculum.id)}
              className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-[#ff5b00]/[0.025] transition-colors duration-150 cursor-pointer group"
            >
              {/* Index */}
              <div className="col-span-1">
                <span className="text-xs font-medium text-gray-400">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              {/* Name */}
              <div className="col-span-7 flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold text-[#1a2b4e] truncate group-hover:text-[#ff5b00] transition-colors">
                  {curriculum.name || curriculum.title}
                </span>
                {curriculum.id === defaultCurriculumId && (
                  <span className="text-[10px] font-semibold text-[#0c63e4] bg-[#0c63e4]/8 border border-[#0c63e4]/15 rounded-full px-2 py-0.5 flex-shrink-0">
                    (Default)
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#ff5b00] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>

              {/* Section count */}
              <div className="col-span-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0c63e4]/8 text-[10px] font-semibold text-[#0c63e4]">
                  <Layers className="w-2.5 h-2.5" />
                  {curriculum.sectionCount ?? curriculum.numberOfSections ?? 0} sections
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
                <div className="relative">
                  <button
                    onClick={() => handleMenuToggle(curriculum.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-[#1a2b4e] hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all duration-150 opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {openMenuId === curriculum.id && (
                    <div
                      ref={menuRef}
                      className={`absolute right-0 w-44 bg-white rounded-xl border border-gray-100 z-20 overflow-hidden ${
                        index >= curriculums.length - 2 ? "bottom-full mb-1" : "top-full mt-1"
                      }`}
                      style={{ boxShadow: "0 8px 32px -4px rgba(26,43,78,0.18)" }}
                    >
                      <div className="h-0.5 w-full bg-gradient-to-r from-[#ff5b00] to-[#0c63e4]" />
                      <div className="py-1">
                        <button
                          onClick={() => { setOpenMenuId(null); onEditCurriculum(curriculum); }}
                          className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-medium text-[#1a2b4e] hover:bg-[#ff5b00]/5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#0c63e4]" />
                          Edit Details
                        </button>
                        {/* Make Default button, only show if not already default */}
                        {curriculum.id !== defaultCurriculumId && (
                          <button
                            onClick={() => { setOpenMenuId(null); onMakeDefault && onMakeDefault(curriculum); }}
                            className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-medium text-[#0c63e4] hover:bg-[#0c63e4]/10 transition-colors"
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                            Make Default
                          </button>
                        )}
                        {/* Unlink button: default curriculum cannot be unlinked until another is set as default */}
                        <button
                          onClick={() => { setOpenMenuId(null); onDeleteCurriculum(curriculum); }}
                          className={`flex items-center gap-2.5 w-full px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors ${
                            (curriculums.length === 1 || curriculum.id === defaultCurriculumId)
                              ? 'opacity-50 pointer-events-none' : ''
                          }`}
                          disabled={
                            curriculums.length === 1 || curriculum.id === defaultCurriculumId
                          }
                        >
                          <Unlink className="w-3.5 h-3.5" />
                          {deleteLabel}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CurriculumTab;
