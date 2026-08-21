"use client";
import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const AddAssignmentPage = () => {
  const [assignmentName, setAssignmentName] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [passingPercentage, setPassingPercentage] = useState("");
  const [resultDeclaration, setResultDeclaration] = useState("Declare immediately on test submission");
  const [file, setFile] = useState(null);
  const [maxAttempts, setMaxAttempts] = useState("Unlimited");
  const [isPrerequisite, setIsPrerequisite] = useState(false);
  const [generalInstruction, setGeneralInstruction] = useState("");

  const router = useRouter();
  const params = useParams();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.size > 100 * 1024 * 1024) {
      alert("File size exceeds 100MB limit.");
      return;
    }
    setFile(selectedFile);
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSaveAndContinue = () => {
    if (!assignmentName.trim() || !maxMarks.trim()) {
      alert("Please fill all required fields (Assignment Name and Maximum Marks).");
      return;
    }
    // TODO: Backend integration for saving assignment
    alert("Assignment saved! (Backend integration pending)");
    // router.push(...); // Navigate to next step if needed
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8 mt-8 mb-8">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold flex-1">Add Assignment</h1>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 border rounded text-gray-700 bg-gray-100 hover:bg-gray-200"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded font-bold ${assignmentName.trim() && maxMarks.trim() ? '' : 'border text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
            style={assignmentName.trim() && maxMarks.trim()
              ? { backgroundColor: '#2563eb', color: 'white' }
              : { backgroundColor: '#f3f4f6', color: '#374151' }}
            onClick={handleSaveAndContinue}
            disabled={!assignmentName.trim() || !maxMarks.trim()}
          >
            Save and Continue
          </button>
        </div>
      </div>
      <div className="mb-8 max-w-md text-left">
        <div className="mb-5">
          <label className="block text-sm font-medium mb-1">Assignment Name <span className="text-red-500">*</span></label>
          <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 max-w-md" maxLength={100} value={assignmentName} onChange={e => setAssignmentName(e.target.value)} placeholder="Enter assignment name" />
          <div className="text-xs text-gray-400 text-right mt-1">{assignmentName.length} / 100</div>
        </div>
        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Maximum Marks <span className="text-red-500">*</span></label>
            <input type="number" min={0} className="w-full border border-gray-300 rounded px-3 py-2 max-w-md" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} placeholder="Enter maximum marks" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Passing Percentage</label>
            <input type="number" min={0} max={100} className="w-full border border-gray-300 rounded px-3 py-2 max-w-md" value={passingPercentage} onChange={e => setPassingPercentage(e.target.value)} placeholder="Enter passing percentage" />
          </div>
        </div>
        <div className="mb-5">
          <label className="block text-sm font-medium mb-1">Result Declaration</label>
          <select className="w-full border border-gray-300 rounded px-3 py-2 max-w-md" value={resultDeclaration} onChange={e => setResultDeclaration(e.target.value)}>
            <option value="Declare immediately on test submission">Declare immediately on test submission</option>
            <option value="Declare after review">Declare after review</option>
          </select>
        </div>
        <div className="mb-5">
          <label className="block text-sm font-medium mb-1">Upload Assignment File</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.zip"
              onChange={handleFileChange}
              className="hidden"
              id="assignment-file-upload"
            />
            <label htmlFor="assignment-file-upload" className="cursor-pointer block">
              <div className="flex flex-col items-center justify-center">
                <span className="text-2xl">&#8682;</span>
                <span className="mt-2 text-sm text-gray-600">Upload a file</span>
                <span className="text-xs text-gray-400">Supports PDF, DOC and ZIP formats. Max file size: 100 MB</span>
                {file && <span className="text-xs text-green-600 mt-2">Selected: {file.name}</span>}
              </div>
            </label>
          </div>
        </div>
        <div className="mb-5">
          <label className="block text-sm font-medium mb-1">Maximum Attempts</label>
          <select className="w-full border border-gray-300 rounded px-3 py-2 max-w-md" value={maxAttempts} onChange={e => setMaxAttempts(e.target.value)}>
            <option value="Unlimited">Unlimited</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="10">10</option>
          </select>
        </div>
        <div className="mb-5">
          <div className="font-medium text-sm mb-2">More Options</div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPrerequisite} onChange={e => setIsPrerequisite(e.target.checked)} />
            Make this a prerequisite
          </label>
          <div className="text-xs text-gray-500 ml-6 mt-1">Students won't be able to move on to next lessons unless they complete this assessment.</div>
        </div>
      </div>
    </div>
  );
};

export default AddAssignmentPage; 