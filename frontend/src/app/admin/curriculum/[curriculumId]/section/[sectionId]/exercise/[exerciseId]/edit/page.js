"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import api from "@utils/api";
import NumberTilePicker from "@/components/sections/admin/common/NumberTilePicker";

/* ─── Option Card Picker ─────────────────────────────────────────────────
   Renders a horizontal row of selectable cards (like payment plan tiles).
   Each card shows an optional icon, a label, and an optional sub-label.
   Selected card gets brand-orange border + subtle tint background.
──────────────────────────────────────────────────────────────────────── */
const OptionPicker = ({ label, required, hint, value, onChange, options }) => (
  <div>
    {label && (
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {label}
        {required && <span className="text-[#ff5b00] ml-0.5">*</span>}
      </label>
    )}
    <div className="flex flex-wrap gap-2.5">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value === value ? "" : opt.value)}
            className={`
              group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium
              transition-all duration-150 select-none cursor-pointer
              ${selected
                ? "border-[#ff5b00] bg-[#ff5b00]/5 text-[#ff5b00] shadow-[0_0_0_1px_#ff5b00]"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-[#1a2b4e]"
              }
            `}
          >
            {/* Radio dot */}
            <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
              ${selected ? "border-[#ff5b00]" : "border-gray-300 group-hover:border-gray-400"}`}>
              {selected && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff5b00] block" />
              )}
            </span>

            {/* Icon (optional) */}
            {opt.icon && (
              <span className={`text-base leading-none ${selected ? "opacity-100" : "opacity-60 group-hover:opacity-80"}`}>
                {opt.icon}
              </span>
            )}

            {/* Text */}
            <span className="leading-none">{opt.label}</span>

            {/* Sub-label (optional) */}
            {opt.sub && (
              <span className={`text-[10px] font-normal leading-none ${selected ? "text-[#ff5b00]/70" : "text-gray-400"}`}>
                {opt.sub}
              </span>
            )}
          </button>
        );
      })}
    </div>
    {hint && <p className="text-[11px] text-gray-400 mt-1.5">{hint}</p>}
  </div>
);


/* ─── Toggle ─────────────────────────────────────────────────────────── */
const Toggle = ({ checked, onChange, label, hint }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`w-full flex items-center justify-between py-3.5 px-4 rounded-xl border text-left
      transition-all duration-150
      ${checked
        ? "border-[#ff5b00]/40 bg-[#ff5b00]/5"
        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
  >
    <div>
      <p className={`text-sm font-medium ${checked ? "text-[#ff5b00]" : "text-[#1a2b4e]"}`}>{label}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
    <div className={`relative inline-flex w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ml-4
      ${checked ? "bg-[#ff5b00]" : "bg-gray-200"}`}>
      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
        ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </div>
  </button>
);

/* ─── Plain Input ─────────────────────────────────────────────────────── */
const Input = ({ label, required, hint, suffix, ...props }) => (
  <div>
    {label && (
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {label}{required && <span className="text-[#ff5b00] ml-0.5">*</span>}
      </label>
    )}
    <div className="relative">
      <input
        {...props}
        className={`w-full h-10 border border-gray-200 rounded-xl px-3.5 text-sm text-[#1a2b4e] bg-white
          placeholder:text-gray-400 transition-all duration-150
          hover:border-gray-300
          focus:outline-none focus:border-[#ff5b00] focus:ring-2 focus:ring-[#ff5b00]/15
          ${suffix ? "pr-10" : ""}`}
      />
      {suffix && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
    {hint && <p className="text-[11px] text-gray-400 mt-1.5">{hint}</p>}
  </div>
);

/* ─── Textarea ────────────────────────────────────────────────────────── */
const Textarea = ({ label, required, hint, value, onChange, maxLen, ...props }) => (
  <div>
    {label && (
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {label}{required && <span className="text-[#ff5b00] ml-0.5">*</span>}
      </label>
    )}
    <textarea
      value={value}
      onChange={onChange}
      {...props}
      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#1a2b4e] bg-white
        placeholder:text-gray-400 resize-none transition-all duration-150
        hover:border-gray-300
        focus:outline-none focus:border-[#ff5b00] focus:ring-2 focus:ring-[#ff5b00]/15"
    />
    <div className="flex items-center justify-between mt-1">
      <p className="text-[11px] text-gray-400">{hint}</p>
      {maxLen && <p className="text-[11px] text-gray-400 font-medium">{value?.length ?? 0} / {maxLen}</p>}
    </div>
  </div>
);

/* ─── Section heading within card ────────────────────────────────────── */
const Heading = ({ title, subtitle }) => (
  <div className="mb-3">
    <h3 className="text-sm font-bold text-[#1a2b4e]">{title}</h3>
    {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
  </div>
);

const EXERCISE_TYPE_OPTIONS = [
  { value: "PRACTICE", label: "Practice",   icon: "📝", sub: "Low stakes" },
  { value: "GRADED",   label: "Graded",     icon: "🎯", sub: "Scored"     },
  { value: "MOCK",     label: "Mock Test",  icon: "🧪", sub: "Simulation" },
];

const MAX_ATTEMPTS_OPTIONS = [
  { value: "1", label: "1", sub: "try"   },
  { value: "2", label: "2", sub: "tries" },
  { value: "3", label: "3", sub: "tries" },
  { value: "5", label: "5", sub: "tries" },
  { value: "10", label: "10", sub: "tries" },
];

/* ════════════════════════════════════════════════════════════════════════ */
export default function EditExercisePage() {
  const [title, setTitle]                     = useState("");
  const [description, setDescription]         = useState("");
  const [instructions, setInstructions]       = useState("");
  const [exerciseType, setExerciseType]       = useState("MOCK");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("");
  const [passingPercentage, setPassingPercentage] = useState("");
  const [maxAttempts, setMaxAttempts]         = useState("1");
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [questionsCount, setQuestionsCount]       = useState("");
  const [questionBank, setQuestionBank] = useState(null);
  const [loading, setLoading]     = useState(true);


  const router = useRouter();
  const params = useParams();
  const { curriculumId, sectionId, exerciseId } = params;

  useEffect(() => {
    if (!exerciseId) return;
    (async () => {
      try {
        const { data: responseData } = await api.get(`/api/exercises/${exerciseId}`);
        // Handle both { data: { ... } } and direct response formats
        const d = responseData?.data || responseData;
        
        const instr = (d.instructions || "").trim();
        
        setTitle(d.title || "");
        setDescription(d.description || "");
        setInstructions(instr);
        setExerciseType(d.exerciseType || "MOCK");
        setTimeLimitMinutes(d.timeLimitMinutes != null ? String(d.timeLimitMinutes) : "");
        setPassingPercentage(d.passingPercentage != null ? String(d.passingPercentage) : "");
        
        const stored = d.maxAttempts != null ? String(d.maxAttempts) : "1";
        // Clamp stored value to 1/2/3/5/10; default to "1" if outside range
        setMaxAttempts(["1","2","3","5","10"].includes(stored) ? stored : "1");
        setRandomizeQuestions(d.randomizeQuestions || false);
        setQuestionsCount(d.numQuestions != null ? String(d.numQuestions) : "");
        setQuestionBank(d.questionBank || null);

      } catch {
        toast.error("Failed to load exercise");
      } finally {
        setLoading(false);
      }
    })();
  }, [exerciseId]);

  const isValid = title.trim().length > 0;

  const handleContinue = () => {
    if (!isValid) { toast.error("Exercise name is required."); return; }
    const payload = {
      title:            title.trim(),
      description:      description.trim() || null,
      instructions:     instructions.trim() || null,
      exerciseType:     exerciseType || null,
      timeLimitMinutes: timeLimitMinutes !== "" ? parseInt(timeLimitMinutes, 10) : null,
      passingPercentage: passingPercentage !== "" ? parseInt(passingPercentage, 10) : null,
      maxAttempts:      parseInt(maxAttempts, 10),
      randomizeQuestions,
      numQuestions:     questionsCount !== "" ? parseInt(questionsCount, 10) : null,
      qbId:   questionBank?.questionBankId || questionBank?.id,
      qbName: questionBank?.name,
      qbTotalQuestions: questionBank?.totalQuestions || 0,
      curriculumId,
      sectionId,
      exerciseId,
    };
    localStorage.setItem("exerciseFormData", JSON.stringify(payload));
    
    // Redirect to the question-bank selection step
    router.push(`/admin/curriculum/${curriculumId}/section/${sectionId}/exercise/question-bank`);
  };

  /* ── Skeleton ─────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
          style={{ boxShadow: "0 4px 24px -4px rgba(26,43,78,0.10), 0 1px 4px -1px rgba(26,43,78,0.06)" }}>
          <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-40 bg-gray-200 rounded-full" />
              <div className="h-3 w-28 bg-gray-100 rounded-full" />
            </div>
          </div>
          <div className="px-8 py-7 space-y-7">
            {[80, 48, 120, 48].map((h, i) => (
              <div key={i} style={{ height: h }} className="bg-gray-100 rounded-xl w-full" />
            ))}
          </div>
          <div className="px-8 py-5 border-t border-gray-100 flex justify-end gap-3">
            <div className="h-10 w-24 bg-gray-100 rounded-full" />
            <div className="h-10 w-44 bg-gray-200 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Page ─────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: "0 4px 24px -4px rgba(26,43,78,0.10), 0 1px 4px -1px rgba(26,43,78,0.06)" }}
      >

        {/* ══ Header ════════════════════════════════════════════════════ */}
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center
                text-gray-500 hover:border-[#1a2b4e]/30 hover:text-[#1a2b4e] hover:bg-gray-50
                transition-all flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-[#1a2b4e]">Edit Exercise</h1>
                {exerciseId && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold
                    bg-[#0c63e4]/8 text-[#0c63e4] tracking-wide">
                    ID {exerciseId}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Curriculum → Section → Exercise Settings</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#ff5b00] flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
              <span className="text-xs font-semibold text-[#ff5b00]">Settings</span>
            </div>
            <div className="w-6 h-px bg-gray-300" />
            <div className="flex items-center gap-1.5 opacity-40">
              <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-[10px] font-bold">2</span>
              <span className="text-xs font-medium text-gray-500">Question Bank</span>
            </div>
          </div>
        </div>

        {/* ══ Form Body ════════════════════════════════════════════════ */}
        <div className="px-8 py-5 space-y-5">

          {/* ─ 1. Basic Information ──────────────────────────────────── */}
          <div>
            <Heading title="Basic Information" subtitle="Name and description visible to students" />
            <div className="space-y-3">
              <Input
                label="Exercise Name" required
                placeholder="e.g. JavaScript Fundamentals Quiz"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <div className="text-[11px] text-gray-400 text-right -mt-3 pr-0.5">{title.length} / 100</div>
              <Textarea
                label="Description"
                placeholder="Brief overview shown to students before starting"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-gray-100" />


          <div className="border-t border-gray-100" />

          {/* ─ 3. Scoring & Timing ───────────────────────────────────── */}
          <div>
            <Heading title="Scoring & Timing" subtitle="Controls how students are evaluated and timed" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Time Limit"
                type="number" min={1}
                placeholder="e.g. 60"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value)}
                suffix="min"
                hint="Leave blank — no time limit applied"
              />
              <Input
                label="Passing Percentage"
                type="number" min={0} max={100}
                placeholder="e.g. 70"
                value={passingPercentage}
                onChange={(e) => setPassingPercentage(e.target.value)}
                suffix="%"
                hint="Minimum score required to pass"
              />
            </div>
          </div>


          <div className="border-t border-gray-100" />

          {/* ─ 4. Max Attempts (number tile picker) ──────────────────── */}
          <div>
            <Heading title="Maximum Attempts" subtitle="How many times a student can attempt this exercise" />
            <NumberTilePicker
              value={maxAttempts}
              onChange={setMaxAttempts}
              options={MAX_ATTEMPTS_OPTIONS}
            />
          </div>

          <div className="border-t border-gray-100" />

          {/* ─ 5. Randomization ────────────────────────────────────────── */}
          <div>
            <Heading title="Randomization" subtitle="Pick questions randomly from the bank" />
            <Toggle
              label="Randomize Questions"
              hint="Pick questions randomly from the linked bank for each attempt"
              checked={randomizeQuestions}
              onChange={setRandomizeQuestions}
            />
          </div>

          <div className="border-t border-gray-100" />

          {/* ─ 6. Instructions ───────────────────────────────────────── */}
          {/* <div>
            <Heading title="Instructions" subtitle="Shown to students before they begin the exercise" />
            <Textarea
              placeholder="Enter any instructions to display to students before the exercise begins…"
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div> */}

          {/* ─ Linked Question Bank (read-only) ──────────────────────── */}
          {questionBank && (
            <>
              <div className="border-t border-gray-100" />
              <div>
                <Heading
                  title="Linked Question Bank"
                  subtitle="Cannot be changed after creation — create a new exercise to re-link"
                />
                <div className="flex items-center justify-between px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#0c63e4]/8 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-[#0c63e4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1a2b4e]">{questionBank.name}</p>
                      {questionBank.questionsType && (
                        <p className="text-xs text-gray-400 mt-0.5">{questionBank.questionsType}</p>
                      )}
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#0c63e4]/8 text-[#0c63e4] tracking-wide flex-shrink-0">
                    QB · {questionBank.questionBankId}
                  </span>
                </div>
              </div>
            </>
          )}

        </div>

        {/* ══ Footer (single action row) ════════════════════════════════ */}
        <div className="px-8 py-5 border-t border-gray-100 bg-[#f8f9fb] flex items-center justify-between gap-4">
          <p className="text-xs text-gray-400 hidden sm:block">
            <span className="text-[#ff5b00] font-semibold">*</span> Required fields
          </p>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={() => router.back()}
              className="h-10 px-6 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full
                hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={!isValid}
              className={`h-10 px-7 text-sm font-semibold rounded-full flex items-center gap-2
                transition-all active:scale-95
                ${isValid
                  ? "bg-[#ff5b00] text-white hover:bg-[#e55200] shadow-sm hover:shadow-[0_4px_14px_-2px_rgba(255,91,0,0.50)]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
            >
              Update &amp; Continue
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
