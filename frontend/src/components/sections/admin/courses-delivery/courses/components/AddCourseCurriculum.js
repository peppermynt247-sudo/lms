import React, { useState, useEffect, useRef } from "react";
import { X, Check, GraduationCap, Sparkles, Link2, Loader2, ChevronDown } from "lucide-react";
import api from "@utils/api";
import { toast } from "react-toastify";

const AddCourseCurriculumModal = ({
  isOpen,
  onClose,
  onCreateCurriculum,
  courseId,
  linkedCurriculumIds = [],
  initialName = "",
  initialBranch = [],
  initialMaxViewDuration = "unlimited",
  isEditMode = false,
}) => {
  const [selectedOption,      setSelectedOption]      = useState("scratch");
  const [curriculumName,      setCurriculumName]      = useState(initialName);
  const [description,         setDescription]         = useState("");
  const [availableCurriculums,setAvailableCurriculums] = useState([]);
  const [selectedCurriculum,  setSelectedCurriculum]  = useState(null);
  const [loadingCurriculums,  setLoadingCurriculums]  = useState(false);
  const [submitting,          setSubmitting]          = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isOpen && selectedOption === "another") fetchCurriculums();
  }, [isOpen, selectedOption]);

  useEffect(() => {
    if (isOpen && !hasInitialized.current) {
      setCurriculumName(initialName);
      hasInitialized.current = true;
    } else if (!isOpen) {
      hasInitialized.current = false;
    }
  }, [isOpen, initialName]);

  const fetchCurriculums = async () => {
    try {
      setLoadingCurriculums(true);
      const res = await api.get("/api/curriculums");
      if (res.data?.success) setAvailableCurriculums(res.data.data);
    } catch {
      toast.error("Failed to load curriculums.");
    } finally {
      setLoadingCurriculums(false);
    }
  };

  const handleCreate = async () => {
    try {
      setSubmitting(true);

      if (selectedOption === "another" && selectedCurriculum) {
        if (linkedCurriculumIds.includes(selectedCurriculum.curriculumId)) {
          toast.error("This curriculum is already linked to the course.");
          return;
        }
        await api.post(`/api/courses/${courseId}/curriculums/${selectedCurriculum.curriculumId}`);
        onCreateCurriculum({ id: selectedCurriculum.curriculumId, title: selectedCurriculum.title, sectionCount: selectedCurriculum.numberOfSections ?? 0 });
        toast.success("Curriculum linked successfully!");
      } else if (selectedOption === "scratch" && curriculumName.trim()) {
        const response = await api.post("/api/curriculums", {
          title: curriculumName.trim(),
          description: description || "",
          version: "v1",
          isActive: true,
        }, { timeout: 10000 });
        const created = response.data.data;
        await api.post(`/api/courses/${courseId}/curriculums/${created.curriculumId}`);
        onCreateCurriculum({ id: created.curriculumId, title: created.title, sectionCount: created.numberOfSections ?? 0 });
        toast.success("Curriculum created and linked successfully!");
      }

      handleResetAndClose();
    } catch (error) {
      toast.error(`Error: ${error.response?.data?.message || error.message || "Something went wrong."}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setCurriculumName("");
    setDescription("");
    setSelectedOption("scratch");
    setSelectedCurriculum(null);
    onClose();
  };

  if (!isOpen) return null;

  const isDisabled =
    submitting ||
    (selectedOption === "scratch" ? !curriculumName.trim() : !selectedCurriculum);

  const inputClass =
    "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors placeholder-gray-400 text-[#1a2b4e] bg-white";
  const labelClass =
    "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1a2b4e]/60 backdrop-blur-sm z-40"
        onClick={handleResetAndClose}
        style={{ animation: "acFadeIn 0.2s ease-out" }}
      />

      {/* Slide-in panel */}
      <div
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col"
        style={{ animation: "acSlideIn 0.28s cubic-bezier(0.16,1,0.3,1)" }}
      >
        <style>{`
          @keyframes acFadeIn  { from { opacity:0 } to { opacity:1 } }
          @keyframes acSlideIn { from { transform:translateX(100%) } to { transform:translateX(0) } }
        `}</style>

        {/* Gradient accent */}
        <div className="h-0.5 w-full bg-gradient-to-r from-[#ff5b00] via-[#f2277e] to-[#0c63e4] flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff5b00]/15 to-[#ff5b00]/5 flex items-center justify-center border border-[#ff5b00]/15">
              <GraduationCap className="w-4 h-4 text-[#ff5b00]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1a2b4e]">
                {isEditMode ? "Update Curriculum" : "Add Curriculum"}
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {isEditMode ? "Update curriculum details." : "Link a curriculum to this course."}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-[#1a2b4e] hover:bg-gray-100 transition-all duration-150"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Option selector */}
          {!isEditMode && (
            <div className="space-y-2.5">
              <p className={labelClass}>Choose an option</p>

              {/* From scratch */}
              <button
                type="button"
                onClick={() => setSelectedOption("scratch")}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                  selectedOption === "scratch"
                    ? "border-[#ff5b00] bg-[#ff5b00]/4"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedOption === "scratch" ? "bg-[#ff5b00]/12" : "bg-gray-100"
                    }`}>
                      <Sparkles className={`w-3.5 h-3.5 ${selectedOption === "scratch" ? "text-[#ff5b00]" : "text-gray-400"}`} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${selectedOption === "scratch" ? "text-[#ff5b00]" : "text-[#1a2b4e]"}`}>
                        Create from scratch
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Build a new curriculum from the ground up.
                      </p>
                    </div>
                  </div>
                  {selectedOption === "scratch" && (
                    <div className="w-5 h-5 rounded-full bg-[#ff5b00] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </button>

              {/* From existing */}
              <button
                type="button"
                onClick={() => setSelectedOption("another")}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                  selectedOption === "another"
                    ? "border-[#0c63e4] bg-[#0c63e4]/4"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedOption === "another" ? "bg-[#0c63e4]/12" : "bg-gray-100"
                    }`}>
                      <Link2 className={`w-3.5 h-3.5 ${selectedOption === "another" ? "text-[#0c63e4]" : "text-gray-400"}`} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${selectedOption === "another" ? "text-[#0c63e4]" : "text-[#1a2b4e]"}`}>
                        Use from another course
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Link a pre-existing curriculum.
                      </p>
                    </div>
                  </div>
                  {selectedOption === "another" && (
                    <div className="w-5 h-5 rounded-full bg-[#0c63e4] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* Existing curriculum picker */}
          {selectedOption === "another" && (
            <div>
              <label className={labelClass}>Select Curriculum</label>
              {loadingCurriculums ? (
                <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ff5b00]" />
                  Loading curriculums…
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedCurriculum?.curriculumId || ""}
                    onChange={(e) => {
                      const found = availableCurriculums.find(
                        (c) => c.curriculumId === Number(e.target.value)
                      );
                      setSelectedCurriculum(found || null);
                    }}
                    className={`${inputClass} appearance-none pr-9`}
                  >
                    <option value="">Select a curriculum…</option>
                    {availableCurriculums.map((c) => (
                      <option
                        key={c.curriculumId}
                        value={c.curriculumId}
                        disabled={linkedCurriculumIds.includes(c.curriculumId)}
                      >
                        {c.title}{linkedCurriculumIds.includes(c.curriculumId) ? " (Already linked)" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )}
              {linkedCurriculumIds.length > 0 && (
                <p className="mt-2 text-[11px] text-gray-400">
                  Already linked curriculums are disabled.
                </p>
              )}
              {selectedCurriculum?.description && (
                <p className="mt-2 text-[11px] text-gray-500 italic leading-relaxed">
                  {selectedCurriculum.description}
                </p>
              )}
            </div>
          )}

          {/* Scratch fields */}
          {selectedOption === "scratch" && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  Name <span className="text-[#ff5b00]">*</span>
                </label>
                <input
                  type="text"
                  value={curriculumName}
                  onChange={(e) => setCurriculumName(e.target.value)}
                  className={inputClass}
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
                  rows={3}
                  placeholder="Brief description of this curriculum"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/60">
          <button
            type="button"
            onClick={handleResetAndClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold text-gray-500 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isDisabled}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#ff5b00] rounded-full hover:bg-[#e55200] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {submitting
              ? selectedOption === "another"
                ? "Linking…"
                : "Saving…"
              : isEditMode
                ? "Update"
                : selectedOption === "another"
                  ? "Link"
                  : "Create & Link"}
          </button>
        </div>
      </div>
    </>
  );
};

export default AddCourseCurriculumModal;
