"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAllQuestionBanks, createExerciseForSection, updateExerciseForSection } from "@utils/api";
import { toast } from "react-toastify";
import AddQuestionBankModal from "@/components/sections/admin/question-bank/Components/AddQuestionBankModal";

/* ─── Difficulty badge ───────────────────────────────────────────────── */
const DIFFICULTY_STYLES = {
  EASY:   "bg-emerald-50 text-emerald-600 border-emerald-100",
  MEDIUM: "bg-amber-50   text-amber-600   border-amber-100",
  HARD:   "bg-red-50     text-red-500     border-red-100",
};
const TYPE_STYLES = {
  MCQ:               "bg-[#0c63e4]/8  text-[#0c63e4]",
  TRUE_FALSE:        "bg-purple-50    text-purple-600",
  ONE_WORD:          "bg-teal-50      text-teal-600",
  MULTIPLE_CORRECT:  "bg-[#ff5b00]/8  text-[#ff5b00]",
};

const DiffBadge = ({ level }) => level ? (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide ${DIFFICULTY_STYLES[level] || "bg-gray-50 text-gray-500 border-gray-100"}`}>
    {level}
  </span>
) : null;

const TypeBadge = ({ type }) => {
  const label = { MCQ: "MCQ", TRUE_FALSE: "True / False", ONE_WORD: "One Word", MULTIPLE_CORRECT: "Multi-correct" }[type] || type;
  return type ? (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${TYPE_STYLES[type] || "bg-gray-100 text-gray-500"}`}>
      {label}
    </span>
  ) : null;
};

/* ─── Link QB Modal ──────────────────────────────────────────────────── */
const LinkModal = ({ open, currentQBId, onClose, onSelect }) => {
  const [banks, setBanks]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery]     = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setQuery("");
    getAllQuestionBanks()
      .then((d) => setBanks(d.data || d))
      .catch(() => toast.error("Failed to load question banks"))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const filtered = banks.filter((qb) =>
    (qb.name || "").toLowerCase().includes(query.toLowerCase()) ||
    (qb.description || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26,43,78,0.55)", backdropFilter: "blur(2px)" }}>
      <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden flex flex-col"
        style={{ maxHeight: "80vh", boxShadow: "0 24px 64px -12px rgba(26,43,78,0.28)" }}>

        {/* Modal header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#1a2b4e]">Select Question Bank</h2>
            <p className="text-xs text-gray-400 mt-0.5">Choose a bank to link to this exercise</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search question banks…"
              className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg bg-gray-50
                placeholder:text-gray-400 focus:outline-none focus:border-[#ff5b00] focus:bg-white focus:ring-2 focus:ring-[#ff5b00]/15 transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {loading && (
            <div className="space-y-2 py-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">No question banks found</p>
              <p className="text-xs text-gray-400 mt-0.5">Try a different search term</p>
            </div>
          )}
          {!loading && filtered.map((qb) => {
            const isLinked = String(qb.questionBankId) === String(currentQBId);
            return (
              <button
                key={qb.questionBankId}
                onClick={() => onSelect(qb)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 group
                  ${isLinked
                    ? "border-[#ff5b00] bg-[#ff5b00]/5"
                    : "border-gray-100 bg-gray-50 hover:border-[#ff5b00]/40 hover:bg-white hover:shadow-sm"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold truncate ${isLinked ? "text-[#ff5b00]" : "text-[#1a2b4e] group-hover:text-[#ff5b00]"}`}>
                        {qb.name}
                      </p>
                      {isLinked && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#ff5b00] text-white">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <TypeBadge type={qb.questionsType} />
                      <DiffBadge level={qb.difficultyLevel} />
                    </div>
                    {qb.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{qb.description}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-gray-300 group-hover:text-[#ff5b00]/40 flex-shrink-0 mt-0.5 transition-colors">
                    #{qb.questionBankId}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer count */}
        <div className="px-6 py-3 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400">
            {filtered.length} bank{filtered.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════ */
export default function QuestionBankPage() {
  const router = useRouter();
  const params = useParams();

  const [exerciseFormData, setExerciseFormData]   = useState(null);
  const [linkedBank, setLinkedBank]               = useState(null);
  const [questionsCount, setQuestionsCount]       = useState(null);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [showLinkModal, setShowLinkModal]         = useState(false);
  const [showCreateModal, setShowCreateModal]     = useState(false);
  const [saving, setSaving]                       = useState(false);
  const [pageReady, setPageReady]                 = useState(false);


  useEffect(() => {
    const raw = localStorage.getItem("exerciseFormData");
    if (!raw) { toast.error("Exercise data is missing."); setPageReady(true); return; }
    const parsed = JSON.parse(raw);
    setExerciseFormData(parsed);
    if (parsed.qbId) {
      setLinkedBank({ 
        questionBankId: parsed.qbId, 
        name: parsed.qbName,
        totalQuestions: parsed.qbTotalQuestions || 0
      });
    }
    if (parsed.numQuestions) {
      setQuestionsCount(String(parsed.numQuestions));
    } else if (parsed.qbTotalQuestions) {
      // Default to 5 or total if no count was previously set
      setQuestionsCount(String(Math.min(parsed.qbTotalQuestions, 5) || 1));
    }
    setRandomizeQuestions(!!parsed.randomizeQuestions);
    setPageReady(true);
  }, []);


  const handleSelect = useCallback((qb) => {
    setLinkedBank(qb);
    // Default question count to first 5 or total if less than 5
    setQuestionsCount(Math.min(qb.totalQuestions || 0, 5) || 1);
    setShowLinkModal(false);
    toast.success("Question bank linked.");
  }, []);

  const handleUnlink = () => {
    setLinkedBank(null);
    toast.info("Question bank unlinked.");
  };

  const handleSave = async () => {
    if (!exerciseFormData) { toast.error("Exercise data is missing."); return; }
    if (!linkedBank)       { toast.error("Please link a question bank first."); return; }
    const parsedCount = Number(questionsCount);
    if (!Number.isInteger(parsedCount) || parsedCount < 1) {
      toast.error("Please enter a valid whole number for question count.");
      return;
    }
    if (linkedBank?.totalQuestions && parsedCount > linkedBank.totalQuestions) {
      toast.error(`Question count cannot exceed the bank total (${linkedBank.totalQuestions}).`);
      return;
    }
    
    setSaving(true);
    try {
      const cleanInstructions = (exerciseFormData.instructions || "").trim();

      const payload = { 
        ...exerciseFormData, 
        instructions: cleanInstructions,
        questionBankId: linkedBank.questionBankId || linkedBank.id,
        randomizeQuestions,
        numQuestions: parsedCount
      };
      
      // Remove stale fields that don't belong in the API payload
      delete payload.questionsCount;
      delete payload.qbId;
      delete payload.qbName;
      delete payload.qbTotalQuestions;
      delete payload.curriculumId;
      delete payload.sectionId;
      delete payload.exerciseId;

      if (exerciseFormData.exerciseId) {
        await updateExerciseForSection(exerciseFormData.exerciseId, payload);
        toast.success("Exercise updated successfully.");
      } else {
        await createExerciseForSection(params.sectionId, payload);
        toast.success("Exercise created successfully.");
      }
      localStorage.removeItem("exerciseFormData");
      router.push(`/admin/curriculum/${params.curriculumId}/editCurriculum`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save exercise.");
    } finally {
      setSaving(false);
    }
  };

  const exerciseName = exerciseFormData?.title || "Exercise";
  const exerciseId   = exerciseFormData?.exerciseId || params.exerciseId;

  if (!pageReady) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
          style={{ boxShadow: "0 4px 24px -4px rgba(26,43,78,0.10), 0 1px 4px -1px rgba(26,43,78,0.06)" }}
        >
          {/* Header skeleton */}
          <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="h-4 w-44 bg-gray-200 rounded-full" />
                <div className="h-3 w-56 bg-gray-100 rounded-full" />
              </div>
            </div>
            <div className="hidden sm:block h-8 w-52 bg-gray-100 rounded-full" />
          </div>

          {/* Body skeleton */}
          <div className="px-8 py-6">
            <div className="mb-5 space-y-2">
              <div className="h-4 w-36 bg-gray-200 rounded-full" />
              <div className="h-3 w-72 bg-gray-100 rounded-full" />
            </div>
            {/* Dashed empty state placeholder */}
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-200" />
              <div className="h-4 w-40 bg-gray-200 rounded-full" />
              <div className="h-3 w-64 bg-gray-100 rounded-full" />
              <div className="flex gap-3 mt-2">
                <div className="h-9 w-32 bg-gray-200 rounded-full" />
                <div className="h-9 w-28 bg-gray-100 rounded-full" />
              </div>
            </div>
          </div>

          {/* Footer skeleton */}
          <div className="px-8 py-5 border-t border-gray-100 bg-[#f8f9fb] flex items-center justify-between">
            <div className="h-3 w-40 bg-gray-200 rounded-full hidden sm:block" />
            <div className="flex gap-2.5 ml-auto">
              <div className="h-10 w-20 bg-gray-100 rounded-full" />
              <div className="h-10 w-36 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <LinkModal
        open={showLinkModal}
        currentQBId={linkedBank?.questionBankId}
        onClose={() => setShowLinkModal(false)}
        onSelect={handleSelect}
      />

      <AddQuestionBankModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateOrUpdate={(data) => {
          setLinkedBank(data);
          setShowCreateModal(false);
          toast.success("Question bank created and linked.");
        }}
      />

      <div className="max-w-4xl mx-auto py-8 px-4">
        <div
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: "0 4px 24px -4px rgba(26,43,78,0.10), 0 1px 4px -1px rgba(26,43,78,0.06)" }}
        >

          {/* ══ Header ══════════════════════════════════════════════════ */}
          <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.back()}
                aria-label="Go back"
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center
                  text-gray-500 hover:border-[#1a2b4e]/30 hover:text-[#1a2b4e] hover:bg-gray-50 transition-all flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base font-bold text-[#1a2b4e] truncate">{exerciseName}</h1>
                  {exerciseId && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0c63e4]/8 text-[#0c63e4] tracking-wide flex-shrink-0">
                      ID {exerciseId}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Curriculum → Section → Question Bank</p>
              </div>
            </div>

            {/* Stepper */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 flex-shrink-0">
              <div className="flex items-center gap-1.5 opacity-50">
                <span className="w-5 h-5 rounded-full bg-[#ff5b00] flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                <span className="text-xs font-semibold text-[#ff5b00]">Settings</span>
              </div>
              <div className="w-6 h-px bg-[#ff5b00]/30" />
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#ff5b00] flex items-center justify-center text-white text-[10px] font-bold">2</span>
                <span className="text-xs font-semibold text-[#ff5b00]">Question Bank</span>
              </div>
            </div>
          </div>

          {/* ══ Body ════════════════════════════════════════════════════ */}
          <div className="px-8 py-6">

            <div className="mb-5">
              <h3 className="text-sm font-bold text-[#1a2b4e]">Question Bank</h3>
              <p className="text-xs text-gray-400 mt-0.5">Link a question bank to populate this exercise with questions</p>
            </div>

            {/* ── Empty state ─────────────────────────────────────────── */}
            {!linkedBank && (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 flex flex-col items-center text-center transition-colors hover:border-gray-300">
                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
                  <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[#1a2b4e] mb-1">No question bank linked</p>
                <p className="text-xs text-gray-400 mb-6 max-w-xs">
                  Link an existing bank or create a new one to add questions to this exercise.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setShowLinkModal(true)}
                    className="h-9 px-5 text-sm font-semibold text-white bg-[#ff5b00] rounded-full
                      hover:bg-[#e55200] shadow-sm hover:shadow-[0_4px_14px_-2px_rgba(255,91,0,0.45)]
                      active:scale-95 transition-all flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                    Link Existing
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="h-9 px-5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-full
                      hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Create New
                  </button>
                </div>
              </div>
            )}

            {/* ── Linked bank card ─────────────────────────────────────── */}
            {linkedBank && (
              <div className="rounded-2xl border border-[#ff5b00]/25 bg-[#ff5b00]/3 overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(255,91,0,0.03) 0%, rgba(255,255,255,1) 60%)" }}>

                <div className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-[#ff5b00]/10 border border-[#ff5b00]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-[#ff5b00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-[#1a2b4e] truncate">{linkedBank.name}</p>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-600">
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                          LINKED
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <TypeBadge type={linkedBank.questionsType} />
                        <DiffBadge level={linkedBank.difficultyLevel} />
                        <span className="text-[10px] font-bold text-gray-300">
                          QB · {linkedBank.questionBankId || linkedBank.id}
                        </span>
                      </div>
                      {linkedBank.description && (
                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{linkedBank.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setShowLinkModal(true)}
                      className="h-8 px-3.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-full
                        hover:border-[#0c63e4]/40 hover:text-[#0c63e4] hover:bg-[#0c63e4]/5 active:scale-95 transition-all"
                    >
                      Change
                    </button>
                    <button
                      onClick={handleUnlink}
                      className="h-8 px-3.5 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-full
                        hover:border-red-200 hover:text-red-500 hover:bg-red-50 active:scale-95 transition-all"
                    >
                      Unlink
                    </button>
                  </div>
                </div>

                {/* ── Question Count Selection ────────────────────────────── */}
                <div className="px-5 py-4 bg-white/50 border-t border-[#ff5b00]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-[#1a2b4e]">Number of Questions</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Specify how many questions to pull (randomly selected if enabled below)
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={linkedBank.totalQuestions || 100}
                        value={questionsCount || ""}
                        onChange={(e) => setQuestionsCount(e.target.value)}
                        className="w-24 h-9 pl-3 pr-8 text-sm font-bold border border-gray-200 rounded-lg bg-white
                        focus:outline-none focus:border-[#ff5b00] transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-300 pointer-events-none">
                        MAX
                      </span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 flex flex-col">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none">Available</span>
                      <span className="text-sm font-black text-[#1a2b4e] leading-tight">
                        {linkedBank.totalQuestions || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Randomization Toggle ───────────────────────────────── */}
                <div className="px-5 py-3.5 bg-[#f8f9fb] border-t border-[#ff5b00]/10 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#1a2b4e]">Randomize Questions</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Pick questions randomly from the bank for each attempt</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRandomizeQuestions(!randomizeQuestions)}
                    className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors focus:outline-none
                      ${randomizeQuestions ? "bg-[#ff5b00]" : "bg-gray-200"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform
                        ${randomizeQuestions ? "translate-x-5" : "translate-x-1"}`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* ── Quick re-link hint when empty ────────────────────────── */}
            {!linkedBank && (
              <p className="text-xs text-gray-400 text-center mt-4">
                A question bank must be linked before the exercise can be saved.
              </p>
            )}

          </div>

          {/* ══ Footer ══════════════════════════════════════════════════ */}
          <div className="px-8 py-5 border-t border-gray-100 bg-[#f8f9fb] flex items-center justify-between gap-4">
            <p className="text-xs text-gray-400 hidden sm:block">
              {!linkedBank && (
                <span><span className="text-[#ff5b00] font-semibold">*</span> Question bank required to save</span>
              )}
            </p>
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                onClick={() => router.back()}
                className="h-10 px-6 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full
                  hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={!linkedBank || saving}
                className={`h-10 px-7 text-sm font-semibold rounded-full flex items-center gap-2 transition-all active:scale-95
                  ${linkedBank && !saving
                    ? "bg-[#ff5b00] text-white hover:bg-[#e55200] shadow-sm hover:shadow-[0_4px_14px_-2px_rgba(255,91,0,0.50)]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
              >
                {saving ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  <>
                    {exerciseFormData?.exerciseId ? "Update Exercise" : "Save Exercise"}
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
