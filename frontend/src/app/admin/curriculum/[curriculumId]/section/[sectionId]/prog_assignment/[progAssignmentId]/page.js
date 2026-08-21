"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { createCodingExercise } from "@utils/api";
import { toast } from "react-toastify";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const languageOptions = ["C", "C++", "JAVA", "Python", "Python 3", "Javascript"];

const AddProgrammingAssignmentQuestionPage = () => {
  const [question, setQuestion] = useState("");
  const [allowedLanguages, setAllowedLanguages] = useState([]);
  const [testCases, setTestCases] = useState([{ input: "", output: "" }]);
  const [hiddenTestCases, setHiddenTestCases] = useState([{ input: "", output: "" }]);
  const [starterCode, setStarterCode] = useState({ java: "", c: "", python: "" });
  const [selectedLang, setSelectedLang] = useState("java");

  const searchParams = useSearchParams();
  const assignmentName = searchParams.get("assignmentName") || "";
  const difficulty = searchParams.get("difficulty")?.toUpperCase() || "EASY";
  const instruction = searchParams.get("generalInstruction") || "";
  const timeLimitMinutes = parseInt(searchParams.get("timeLimitMinutes") || 20);
  const maxAttempts = parseInt(searchParams.get("maxAttempts") || 3);
  const maxMarks = parseInt(searchParams.get("maxMarks") || 10);
  const starterCodeFromQuery = searchParams.get("starterCode") || "";

  // Parse starter code from query params
  React.useEffect(() => {
    if (starterCodeFromQuery) {
      try {
        const parsed = typeof starterCodeFromQuery === 'string' ? JSON.parse(starterCodeFromQuery) : starterCodeFromQuery;
        setStarterCode({
          java: parsed.java || "",
          c: parsed.c || "",
          python: parsed.python || ""
        });
      } catch {
        setStarterCode({ java: starterCodeFromQuery, c: starterCodeFromQuery, python: starterCodeFromQuery });
      }
    }
  }, [starterCodeFromQuery]);

  const router = useRouter();
  const params = useParams();

  const handleLanguageChange = (lang) => {
    setAllowedLanguages((prev) => {
      const newLanguages = prev.includes(lang)
        ? prev.filter((l) => l !== lang)
        : [...prev, lang];

      // Auto-select the first available language tab when languages change
      if (newLanguages.length > 0) {
        const firstLang = newLanguages[0];
        let firstLangKey = 'java';
        if (['C'].includes(firstLang)) firstLangKey = 'c';
        else if (['Python', 'Python 3', 'python'].includes(firstLang)) firstLangKey = 'python';
        setSelectedLang(firstLangKey);
      }

      return newLanguages;
    });
  };

  const handleTestCaseChange = (idx, field, value) => {
    setTestCases((prev) =>
      prev.map((tc, i) =>
        i === idx ? { ...tc, [field]: value } : tc
      )
    );
  };
  const handleAddTestCase = () =>
    setTestCases((prev) => [...prev, { input: "", output: "" }]);
  const handleDeleteTestCase = (idx) =>
    setTestCases((prev) => prev.filter((_, i) => i !== idx));

  const handleHiddenTestCaseChange = (idx, field, value) => {
    setHiddenTestCases((prev) =>
      prev.map((tc, i) =>
        i === idx ? { ...tc, [field]: value } : tc
      )
    );
  };
  const handleAddHiddenTestCase = () =>
    setHiddenTestCases((prev) => [...prev, { input: "", output: "" }]);
  const handleDeleteHiddenTestCase = (idx) =>
    setHiddenTestCases((prev) => prev.filter((_, i) => i !== idx));

  const handleCancel = () => router.back();

  const handleSaveAssignment = async () => {
    const curriculumSectionId = params.sectionId;

    const exerciseData = {
      title: assignmentName,
      codingQuestion: question ? question.substring(0, 255) : "",
      description: instruction,
      instructions: instruction,
      difficultyLevel: difficulty,
      starterCode: JSON.stringify(starterCode),
      solutionCode: "",
      timeLimitMinutes: timeLimitMinutes || 20,
      maxAttempts: maxAttempts || 3,
      supportedLanguages: Array.isArray(allowedLanguages) ? allowedLanguages.join(", ") : allowedLanguages,
      testCases: [
        ...testCases
          .filter(tc => tc.input?.trim() || tc.output?.trim())
          .map((tc, idx) => ({
            input: tc.input || "N/A", // 'N/A' instead of space to pass backend @NotBlank
            expectedOutput: tc.output || "N/A",
            explanation: "",
            isHidden: false,
            testOrder: idx + 1,
          })),
        ...hiddenTestCases
          .filter(tc => tc.input?.trim() || tc.output?.trim())
          .map((tc, idx) => ({
            input: tc.input || "N/A",
            expectedOutput: tc.output || "N/A",
            explanation: "",
            isHidden: true,
            testOrder: testCases.length + idx + 1,
          })),
      ],
    };

    try {
      const res = await createCodingExercise(curriculumSectionId, exerciseData);
      toast.success("Programming assignment created successfully");
      router.push(`/admin/curriculum/${params.curriculumId}/editCurriculum`);
    } catch {
      toast.error("Failed to save assignment. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: "0 4px 24px -4px rgba(26,43,78,0.10), 0 1px 4px -1px rgba(26,43,78,0.06)" }}
      >
        {/* Header with Stepper */}
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleCancel}
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
                <h1 className="text-base font-bold text-[#1a2b4e]">Add Programming Assignment Question</h1>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Curriculum → Section → Programming Assignment</p>
            </div>
          </div>
          {/* Step indicator (always visible) */}
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
              <span className="text-xs font-semibold text-[#ff5b00]">Programming Assignment</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-8 py-5 space-y-5">
          {/* 1. Question */}
          <div>
            <div className="mb-3">
              <h3 className="text-sm font-bold text-[#1a2b4e]">Question</h3>
              <p className="text-xs text-gray-400 mt-0.5">Enter the programming question statement</p>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium mb-1">Question<span className="text-red-500">*</span></label>
              <MDEditor
                value={question}
                onChange={setQuestion}
                height={120}
                preview="edit"
                placeholder="Enter question statement"
              />
            </div>
          </div>

          {/* 2. Allowed Languages */}
          <div className="border-t border-gray-100" />
          <div>
            <div className="mb-3">
              <h3 className="text-sm font-bold text-[#1a2b4e]">Allowed Languages</h3>
              <p className="text-xs text-gray-400 mt-0.5">Select which languages students can use</p>
            </div>
            <div className="flex flex-wrap gap-4">
              {languageOptions.map((lang) => (
                <label key={lang} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={allowedLanguages.includes(lang)}
                    onChange={() => handleLanguageChange(lang)}
                  />
                  {lang}
                </label>
              ))}
            </div>
          </div>

          {/* 3. Test Cases */}
          <div className="border-t border-gray-100" />
          <div>
            <div className="mb-3">
              <h3 className="text-sm font-bold text-[#1a2b4e]">Test Cases</h3>
              <p className="text-xs text-gray-400 mt-0.5">Visible test cases for students</p>
            </div>
            <div className="mb-5 bg-gray-50 border p-4 rounded">
              <div className="font-semibold mb-2">Test Cases<span className="text-red-500">*</span></div>
              {testCases.map((tc, idx) => (
                <div
                  key={idx}
                  className="mb-4 p-3 bg-white rounded border"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Case {idx + 1}</span>
                    {testCases.length > 1 && (
                      <button
                        className="text-red-600 text-sm"
                        onClick={() => handleDeleteTestCase(idx)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs mb-1">Input</label>
                    <textarea
                      className="w-full border rounded px-2 py-1"
                      rows={2}
                      value={tc.input}
                      onChange={(e) =>
                        handleTestCaseChange(idx, "input", e.target.value)
                      }
                      placeholder="Enter input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Output</label>
                    <textarea
                      className="w-full border rounded px-2 py-1"
                      rows={2}
                      value={tc.output}
                      onChange={(e) =>
                        handleTestCaseChange(idx, "output", e.target.value)
                      }
                      placeholder="Enter output"
                    />
                  </div>
                </div>
              ))}
              <button
                className="text-blue-600 text-sm"
                onClick={handleAddTestCase}
              >
                + Add Test Case
              </button>
            </div>
          </div>

          {/* 4. Hidden Test Cases */}
          <div className="border-t border-gray-100" />
          <div>
            <div className="mb-3">
              <h3 className="text-sm font-bold text-[#1a2b4e]">Hidden Test Cases</h3>
              <p className="text-xs text-gray-400 mt-0.5">Not visible to students, used for grading</p>
            </div>
            <div className="mb-5 bg-gray-50 border p-4 rounded">
              <div className="font-semibold mb-2">Hidden Test Cases<span className="text-red-500">*</span></div>
              {hiddenTestCases.map((tc, idx) => (
                <div
                  key={idx}
                  className="mb-4 p-3 bg-white rounded border"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Case {idx + 1}</span>
                    {hiddenTestCases.length > 1 && (
                      <button
                        className="text-red-600 text-sm"
                        onClick={() => handleDeleteHiddenTestCase(idx)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs mb-1">Input</label>
                    <textarea
                      className="w-full border rounded px-2 py-1"
                      rows={2}
                      value={tc.input}
                      onChange={(e) =>
                        handleHiddenTestCaseChange(idx, "input", e.target.value)
                      }
                      placeholder="Enter input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Output</label>
                    <textarea
                      className="w-full border rounded px-2 py-1"
                      rows={2}
                      value={tc.output}
                      onChange={(e) =>
                        handleHiddenTestCaseChange(idx, "output", e.target.value)
                      }
                      placeholder="Enter output"
                    />
                  </div>
                </div>
              ))}
              <button
                className="text-blue-600 text-sm"
                onClick={handleAddHiddenTestCase}
              >
                + Add Hidden Test Case
              </button>
            </div>
          </div>

          {/* 5. Starter Code */}
          <div className="border-t border-gray-100" />
          <div>
            <div className="mb-3">
              <h3 className="text-sm font-bold text-[#1a2b4e]">Starter Code (Optional)</h3>
            </div>
            {allowedLanguages.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Please select allowed languages above to enable starter code editing.</p>
            ) : (
              <>
                <div className="flex gap-2 mb-3">
                  {(() => {
                    const seenKeys = new Set();
                    const uniqueLangTabs = [];

                    allowedLanguages.forEach(lang => {
                      if (['JAVA', 'Java', 'java'].includes(lang) || ['C'].includes(lang) || ['Python', 'Python 3', 'python'].includes(lang)) {
                        let langKey = 'java';
                        if (['C'].includes(lang)) langKey = 'c';
                        else if (['Python', 'Python 3', 'python'].includes(lang)) langKey = 'python';

                        if (!seenKeys.has(langKey)) {
                          seenKeys.add(langKey);
                          uniqueLangTabs.push({ lang, langKey });
                        }
                      }
                    });

                    return uniqueLangTabs.map(({ lang, langKey }) => (
                      <button
                        key={langKey}
                        type="button"
                        onClick={() => setSelectedLang(langKey)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedLang === langKey
                          ? 'bg-[#ff5b00] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {langKey.charAt(0).toUpperCase() + langKey.slice(1)}
                      </button>
                    ));
                  })()}
                </div>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2 max-w-md font-mono text-sm"
                  value={starterCode[selectedLang]}
                  onChange={(e) => setStarterCode({ ...starterCode, [selectedLang]: e.target.value })}
                  placeholder={`Enter ${selectedLang.charAt(0).toUpperCase() + selectedLang.slice(1)} starter code`}
                  rows={8}
                />
              </>
            )}
          </div>
        </div>

        {/* Footer (single action row) */}
        <div className="px-8 py-5 border-t border-gray-100 bg-[#f8f9fb] flex items-center justify-between gap-4">
          <p className="text-xs text-gray-400 hidden sm:block">
            <span className="text-[#ff5b00] font-semibold">*</span> Required fields
          </p>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={handleCancel}
              className="h-10 px-6 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full
                hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAssignment}
              className="h-10 px-7 text-sm font-semibold rounded-full flex items-center gap-2
                transition-all active:scale-95 bg-[#ff5b00] text-white hover:bg-[#e55200] shadow-sm hover:shadow-[0_4px_14px_-2px_rgba(255,91,0,0.50)]"
            >
              Save Assignment
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProgrammingAssignmentQuestionPage;