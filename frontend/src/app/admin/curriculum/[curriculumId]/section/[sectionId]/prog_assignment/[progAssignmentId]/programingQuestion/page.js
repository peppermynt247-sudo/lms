"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import {  updateCodingExercise } from "@utils/api";
import { toast } from "react-toastify";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const languageOptions = ["C", "C++", "JAVA", "Python", "Python 3", "Javascript"];

const AddProgrammingAssignmentQuestionPage = () => {
  const [question, setQuestion] = useState("");
  const [allowedLanguages, setAllowedLanguages] = useState([]);
  const [testCases, setTestCases] = useState([{ input: "", output: "" }]);
  const [hiddenTestCases, setHiddenTestCases] = useState([{ input: "", output: "" }]);

  const searchParams = useSearchParams();
  const assignmentName = searchParams.get("assignmentName") || "";
  const difficulty = searchParams.get("difficulty")?.toUpperCase() || "EASY";
  const starterCodeFromQuery = searchParams.get("starterCode") || "";
  const instruction = searchParams.get("generalInstruction") || "";
  const timeLimitMinutes = parseInt(searchParams.get("timeLimitMinutes") || 20);
  const maxAttempts = parseInt(searchParams.get("maxAttempts")|| 3);
  const maxMarks = parseInt(searchParams.get("maxMarks") || 10);

  const [starterCode, setStarterCode] = useState({ java: "", c: "", python: "" });
  const [selectedLang, setSelectedLang] = useState("java");

  const router = useRouter();
  const params = useParams();

useEffect(() => {
  const prog_assignmentId  = params.progAssignmentId;
  if (!prog_assignmentId) return;

  const key = `editMaterial_ELAB_${prog_assignmentId}`;
  const stored = localStorage.getItem(key);
  if (!stored) {
    return;
  }

  try {
    const parsed = JSON.parse(stored);

    setQuestion(parsed.codingQuestion || "");
    setAllowedLanguages(
      Array.isArray(parsed.supportedLanguages)
        ? parsed.supportedLanguages
        : (typeof parsed.supportedLanguages === 'string' ? parsed.supportedLanguages.split(',').map(s => s.trim()) : [])
    );
    
    // Parse starter code - handle both old string format and new JSON format
    if (parsed.starterCode) {
      try {
        const parsedCode = typeof parsed.starterCode === 'string' ? JSON.parse(parsed.starterCode) : parsed.starterCode;
        setStarterCode({
          java: parsedCode.java || "",
          c: parsedCode.c || "",
          python: parsedCode.python || ""
        });
      } catch {
        // If parsing fails, treat as old format (single string for all languages)
        setStarterCode({ java: parsed.starterCode, c: parsed.starterCode, python: parsed.starterCode });
      }
    }

    const visible = (parsed.testCases || []).filter(tc => !tc.isHidden);
    const hidden = (parsed.testCases || []).filter(tc => tc.isHidden);

    setTestCases(
      visible.length > 0
        ? visible.map(tc => ({
          testCaseId: tc.testCaseId, 
            input: tc.input || "",
            output: tc.expectedOutput || "",
          }))
        : [{ input: "", output: "" }]
    );

    setHiddenTestCases(
      hidden.length > 0
        ? hidden.map(tc => ({
            input: tc.input || "",
            output: tc.expectedOutput || "",
          }))
        : [{ input: "", output: "" }]
    );
  } catch {
    toast.error("Failed to load assignment data. Please go back and try again.");
  }
}, [params]);


  const handleLanguageChange = (lang) => {
    setAllowedLanguages((prev) =>
      prev.includes(lang)
        ? prev.filter((l) => l !== lang)
        : [...prev, lang]
    );
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
    const prog_assignmentId = params.progAssignmentId;

    if (!prog_assignmentId) {
      toast.error("Missing programming assignment ID");
      return;
    }

    const key = `editMaterial_ELAB_${prog_assignmentId}`;
    const stored = localStorage.getItem(key);

    if (!stored) {
      toast.error("No stored data found for this assignment");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      
      // Map frontend fields (Step 1) to Backend DTO fields
      const payload = {
        title: parsed.title || assignmentName,
        description: parsed.description || instruction,
        codingQuestion: question?.substring(0, 255) || parsed.codingQuestion?.substring(0, 255) || "",
        instructions: parsed.instructions || instruction,
        difficultyLevel: (parsed.difficultyLevel || parsed.difficulty || difficulty || "EASY").toUpperCase(),
        starterCode: JSON.stringify(starterCode) || parsed.starterCode || "",
        solutionCode: parsed.solutionCode || "",
        timeLimitMinutes: parsed.timeLimitMinutes || timeLimitMinutes || 20,
        maxAttempts: parsed.maxAttempts || maxAttempts || 3,
        supportedLanguages: Array.isArray(allowedLanguages) 
          ? allowedLanguages.join(", ") 
          : (allowedLanguages || parsed.supportedLanguages || "JAVA"),
        testCases: [
          ...testCases.map((tc, idx) => ({
            testCaseId: tc.testCaseId || null,
            input: tc.input || "N/A",
            expectedOutput: tc.output || "N/A",
            explanation: tc.explanation || "",
            isHidden: false,
            testOrder: idx + 1,
          })),
          ...hiddenTestCases.map((tc, idx) => ({
            testCaseId: tc.testCaseId || null,
            input: tc.input || "N/A",
            expectedOutput: tc.output || "N/A",
            explanation: tc.explanation || "",
            isHidden: true,
            testOrder: testCases.length + idx + 1,
          }))
        ],
      };

      await updateCodingExercise(prog_assignmentId, payload);
      localStorage.removeItem(key);
      toast.success("Programming assignment updated successfully");
      router.push(`/admin/curriculum/${params.curriculumId}/editCurriculum`);
    } catch {
      toast.error("Failed to save assignment. Please try again.");
    }
  };


  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8 mt-8 mb-8">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold flex-1">
          Add Programming Assignment Question
        </h1>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 border rounded text-gray-700 bg-gray-100 hover:bg-gray-200"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded font-bold"
            style={{ backgroundColor: "#2563eb", color: "white" }}
            onClick={handleSaveAssignment}
          >
            Save Assignment
          </button>
        </div>
      </div>

      <div className="mb-8 max-w-2xl text-left">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold">
            &#10003;
          </div>
          <span className="font-semibold text-lg">Add Basic Test Data</span>
          <div className="flex-1 border-t border-gray-200 mx-4" />
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">
            2
          </div>
          <span className="text-lg text-blue-700">Add Question</span>
        </div>

        {/* Question */}
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

        {/* Allowed Languages */}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-1">
            Allowed Languages<span className="text-red-500">*</span>
          </label>
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

        {/* Test Cases */}
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

        {/* Hidden Test Cases */}
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

        {/* Starter Code */}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-2">
            Starter Code (Optional)
          </label>
          <div className="flex gap-2 mb-3">
            {['java', 'c', 'python'].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLang(lang)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedLang === lang
                    ? 'bg-[#ff5b00] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </button>
            ))}
          </div>
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2 max-w-md font-mono text-sm"
            value={starterCode[selectedLang]}
            onChange={(e) => setStarterCode({ ...starterCode, [selectedLang]: e.target.value })}
            placeholder={`Enter ${selectedLang.charAt(0).toUpperCase() + selectedLang.slice(1)} starter code`}
            rows={8}
          />
        </div>
      </div>
    </div>
  );
};

export default AddProgrammingAssignmentQuestionPage;