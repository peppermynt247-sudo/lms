"use client";
import React, { useState, useEffect } from "react";
import NumberTilePicker from "@/components/sections/admin/common/NumberTilePicker";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { toast } from "react-toastify";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });


const MAX_ATTEMPTS_OPTIONS = [
  { value: "1", label: "1", sub: "try"   },
  { value: "2", label: "2", sub: "tries" },
  { value: "3", label: "3", sub: "tries" },
  { value: "5", label: "5", sub: "tries" },
  { value: "10", label: "10", sub: "tries" },
];

const EditProgrammingAssignmentPage = () => {
  const [assignmentName, setAssignmentName] = useState("");
  const [timeLimit, setTimeLimit] = useState({ hh: 0, mm: 0, ss: 0 });
  const [maxMarks, setMaxMarks] = useState("");
  const [maxAttempts, setMaxAttempts] = useState("3");
  const [skipDeclaration, setSkipDeclaration] = useState(false);
  const [generalInstruction, setGeneralInstruction] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [starterCode, setStarterCode] = useState({ java: "", c: "", python: "" });
  const [selectedLang, setSelectedLang] = useState("java");

  const router = useRouter();
  const params = useParams();
  const prog_assignmentId = params?.progAssignmentId;

  useEffect(() => {
    if (!prog_assignmentId) return;

    const stored = localStorage.getItem(`editMaterial_ELAB_${prog_assignmentId}`);
    if (!stored) {
      toast.error("No data found in localStorage for this assignment.");
      return;
    }

    try {
      const parsed = JSON.parse(stored);

      setAssignmentName(parsed.title || "");
      setMaxMarks(parsed.maxMarks?.toString() || "");
      setMaxAttempts(parsed.maxAttempts?.toString() || "3");
      setSkipDeclaration(parsed.skipDeclaration || false);
      setGeneralInstruction(parsed.instructions || parsed.generalInstructions || "");
      setDifficulty(parsed.difficultyLevel || parsed.difficulty || "Easy");
      
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

      // Handle both minutes (new) and seconds (old/fallback)
      if (parsed.timeLimitMinutes) {
        const totalMinutes = parsed.timeLimitMinutes;
        const hh = Math.floor(totalMinutes / 60);
        const mm = totalMinutes % 60;
        setTimeLimit({ hh, mm, ss: 0 });
      } else if (parsed.timeLimitInSeconds) {
        const totalSeconds = parsed.timeLimitInSeconds;
        const hh = Math.floor(totalSeconds / 3600);
        const mm = Math.floor((totalSeconds % 3600) / 60);
        const ss = totalSeconds % 60;
        setTimeLimit({ hh, mm, ss });
      }
    } catch {
      toast.error("Failed to load assignment data.");
    }
  }, [prog_assignmentId]);

  const handleCancel = () => {
    router.back();
  };

  const handleSaveAndContinue = () => {
    if (!assignmentName.trim()) {
      toast.error("Please fill all required fields.");
      return;
    }

    const key = `editMaterial_ELAB_${prog_assignmentId}`;
    const stored = localStorage.getItem(key);
    let parsed = {};
    if (stored) {
      try {
        parsed = JSON.parse(stored);
      } catch {
        // ignore malformed cache — proceed with defaults
      }
    }

    const totalMinutes = parseInt(timeLimit.hh) * 60 + parseInt(timeLimit.mm) + parseInt(timeLimit.ss) / 60;

    const updated = {
      ...parsed,
      title: assignmentName,
      difficultyLevel: difficulty, // Step 2 expects difficultyLevel
      starterCode: JSON.stringify(starterCode),
      instructions: generalInstruction, // Step 2 expects instructions
      timeLimitMinutes: totalMinutes,
      maxAttempts,
      maxMarks: maxMarks ? parseInt(maxMarks) : null,
      skipDeclaration,
    };

    localStorage.setItem(key, JSON.stringify(updated));

    router.push(
      `/admin/curriculum/${params.curriculumId}/section/${params.sectionId}/prog_assignment/${prog_assignmentId}/programingQuestion`
    );
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8 mt-8 mb-8">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold flex-1">Add Programming Assignment</h1>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 border rounded text-gray-700 bg-gray-100 hover:bg-gray-200"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded font-bold ${
              assignmentName.trim()
                ? ""
                : "border text-gray-700 bg-gray-100 hover:bg-gray-200"
            }`}
            style={
              assignmentName.trim()
                ? { backgroundColor: "#2563eb", color: "white" }
                : { backgroundColor: "#f3f4f6", color: "#374151" }
            }
            onClick={handleSaveAndContinue}
            disabled={!assignmentName.trim()}
          >
            Save and Continue
          </button>
        </div>
      </div>

      <div className="mb-8 max-w-md text-left">
        {/* Assignment Name */}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-1">
            Assignment Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2 max-w-md"
            maxLength={100}
            value={assignmentName}
            onChange={(e) => setAssignmentName(e.target.value)}
            placeholder="Enter assignment name"
          />
          <div className="text-xs text-gray-400 text-right mt-1">
            {assignmentName.length} / 100
          </div>
        </div>

        {/* Time Limit */}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-1">Time Limit</label>
          <div className="flex items-center gap-2">
            <input
            type="number"
            placeholder="HH"
            value={timeLimit.hh}
            onChange={(e) => setTimeLimit({ ...timeLimit, hh: +e.target.value })}
            className="w-16 p-2 border rounded"
            />
            <span>HH</span>
            <input
          type="number"
          placeholder="MM"
          value={timeLimit.mm}
          onChange={(e) => setTimeLimit({ ...timeLimit, mm: +e.target.value })}
          className="w-16 p-2 border rounded"
        />
            <span>MM</span>
            <input
          type="number"
          placeholder="SS"
          value={timeLimit.ss}
          onChange={(e) => setTimeLimit({ ...timeLimit, ss: +e.target.value })}
          className="w-16 p-2 border rounded"
        />
            <span>SS</span>
          </div>
        </div>

        {/* Maximum Marks */}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-1">
            Maximum Marks 
          </label>
          <input
        type="number"
        value={maxMarks}
        onChange={(e) => setMaxMarks(e.target.value)}
        placeholder="Max Marks"
        className="w-full mb-4 p-2 border rounded"
      />
        </div>

        {/* Maximum Attempts */}
        <div className="mb-5">
          <NumberTilePicker
            label="Maximum Attempts"
            required
            hint="How many times a student can attempt this assignment"
            value={maxAttempts}
            onChange={setMaxAttempts}
            options={MAX_ATTEMPTS_OPTIONS}
          />
        </div>

        {/* Skip Declaration */}
        <div className="mb-5">
          <div className="font-medium text-sm mb-2">More Options</div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={skipDeclaration}
              onChange={(e) => setSkipDeclaration(e.target.checked)}
            />
            Skip Declaration
          </label>
        </div>


        {/* Difficulty */}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-1">
            Difficulty Level
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full mb-4 p-2 border rounded"
        >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
        </select>
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

export default EditProgrammingAssignmentPage;