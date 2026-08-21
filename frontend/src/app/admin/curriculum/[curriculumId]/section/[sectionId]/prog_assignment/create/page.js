"use client";

import React, { useState } from "react";
import NumberTilePicker from "@/components/sections/admin/common/NumberTilePicker";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { toast } from "react-toastify";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });


const MAX_ATTEMPTS_OPTIONS = [
  { value: "1", label: "1", sub: "try" },
  { value: "2", label: "2", sub: "tries" },
  { value: "3", label: "3", sub: "tries" },
  { value: "5", label: "5", sub: "tries" },
  { value: "10", label: "10", sub: "tries" },
];

const AddProgrammingAssignmentPage = () => {
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

  const handleCancel = () => {
    router.back();
  };

  const handleSaveAndContinue = () => {
    if (!assignmentName.trim() || !maxMarks.trim()) {
      toast.error("Please fill all required fields (Assignment Name and Maximum Marks).");
      return;
    }

    const newProgAssignmentId = "985"; // Simulated ID; ideally get this from backend after POST

    const paramsObj = {
      assignmentName,
      difficulty,
      generalInstruction,
      timeLimitMinutes:
        parseInt(timeLimit.hh) * 60 +
        parseInt(timeLimit.mm) +
        parseInt(timeLimit.ss) / 60,
      maxMarks,
      maxAttempts: parseInt(maxAttempts, 10),
      skipDeclaration,
      starterCode: JSON.stringify(starterCode),
    };

    const queryString = Object.entries(paramsObj)
      .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
      .join("&");

    router.push(
      `/admin/curriculum/${params.curriculumId}/section/${params.sectionId}/prog_assignment/${newProgAssignmentId}?${queryString}`
    );
  };

  // --- UI Replica from AddExercisePage ---
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
                <h1 className="text-base font-bold text-[#1a2b4e]">Add Programming Assignment</h1>
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
          {/* 1. Basic Information */}
          <div>
            <div className="mb-3">
              <h3 className="text-sm font-bold text-[#1a2b4e]">Basic Information</h3>
              <p className="text-xs text-gray-400 mt-0.5">Name and description visible to students</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Assignment Name <span className="text-[#ff5b00] ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  className="w-full h-10 border border-gray-200 rounded-xl px-3.5 text-sm text-[#1a2b4e] bg-white
                    placeholder:text-gray-400 transition-all duration-150
                    hover:border-gray-300 focus:outline-none focus:border-[#ff5b00] focus:ring-2 focus:ring-[#ff5b00]/15"
                  maxLength={100}
                  value={assignmentName}
                  onChange={(e) => setAssignmentName(e.target.value)}
                  placeholder="Enter assignment name"
                />
                <div className="text-[11px] text-gray-400 text-right mt-1">{assignmentName.length} / 100</div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Limit */}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-1">Time Limit</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={99}
              className="w-12 border rounded px-1 py-1 max-w-[60px]"
              value={timeLimit.hh}
              onChange={(e) =>
                setTimeLimit({ ...timeLimit, hh: e.target.value })
              }
              placeholder="HH"
            />
            <span>HH</span>
            <input
              type="number"
              min={0}
              max={59}
              className="w-12 border rounded px-1 py-1 max-w-[60px]"
              value={timeLimit.mm}
              onChange={(e) =>
                setTimeLimit({ ...timeLimit, mm: e.target.value })
              }
              placeholder="MM"
            />
            <span>MM</span>
            <input
              type="number"
              min={0}
              max={59}
              className="w-12 border rounded px-1 py-1 max-w-[60px]"
              value={timeLimit.ss}
              onChange={(e) =>
                setTimeLimit({ ...timeLimit, ss: e.target.value })
              }
              placeholder="SS"
            />
            <span>SS</span>
          </div>
        </div>

        {/* Maximum Marks */}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-1">
            Maximum Marks <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={0}
            className="w-full border border-gray-300 rounded px-3 py-2 max-w-md"
            value={maxMarks}
            onChange={(e) => setMaxMarks(e.target.value)}
            placeholder="Enter maximum marks"
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

        {/* 3. Options */}
        <div className="border-t border-gray-100" />
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-bold text-[#1a2b4e]">Options</h3>
            <p className="text-xs text-gray-400 mt-0.5">Additional assignment behaviour</p>
          </div>
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
            className="w-full border border-gray-300 rounded px-3 py-2 max-w-md"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>
    </div>
  );
}