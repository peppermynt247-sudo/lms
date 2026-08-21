"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft,
  Upload,
  FileText,
  Volume2,
  Check,
  Plus,
  Link,
  Settings
} from "lucide-react";

export default function CreateTestPage() {
  const router = useRouter();
  const params = useParams();
  const curriculumId = params.id;

  const [currentStep, setCurrentStep] = useState(1);
  const [sections, setSections] = useState([
    {
      id: 1,
      name: "Part A",
      questionsRandomized: true,
      optionsRandomized: false,
      maxQuestions: "", // Added for consistency with modal data
      generalInstruction: "" // Added for consistency with modal data
    }
  ]);

  const [formData, setFormData] = useState({
    testName: "",
    timeLimit: { enabled: false, hours: 0, minutes: 0, seconds: 0 },
    maxAttempts: "unlimited",
    passingPercentage: "",
    calculator: "none",
    resultDeclaration: "immediate",
    isPrerequisite: false,
    partialMarking: false,
    skipDeclaration: false,
    allowSectionalTiming: false,
    strictMode: false,
    referenceSheet: "",
    generalInstructions: ""
  });

  // New state variables for the section modal
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [currentSectionData, setCurrentSectionData] = useState({
    name: "",
    maxQuestions: "",
    randomizeQuestions: false,
    randomizeOptions: false,
    generalInstruction: ""
  });
  const [editingSection, setEditingSection] = useState(null); // To track if we are editing an existing section

  const handleBack = () => {
    if (currentStep === 1) {
      router.push(`/admin/curriculum/${curriculumId}/tests`);
    } else {
      setCurrentStep(1);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTimeLimitChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      timeLimit: {
        ...prev.timeLimit,
        [field]: value
      }
    }));
  };

  const handleSubmit = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else {
      // Handle final submission of test with sections
    }
  };

  // Updated handleAddSection function
  const handleAddSection = () => {
    setEditingSection(null); // Ensure we are in "add" mode
    setCurrentSectionData({
      name: "",
      maxQuestions: "",
      randomizeQuestions: false,
      randomizeOptions: false,
      generalInstruction: ""
    });
    setShowSectionModal(true);
  };

  // Updated handleSectionSettings function to open modal for editing
  const handleSectionSettings = (sectionId) => {
    const sectionToEdit = sections.find((sec) => sec.id === sectionId);
    if (sectionToEdit) {
      setEditingSection(sectionToEdit);
      setCurrentSectionData({
        name: sectionToEdit.name,
        maxQuestions: sectionToEdit.maxQuestions || "",
        randomizeQuestions: sectionToEdit.questionsRandomized,
        randomizeOptions: sectionToEdit.optionsRandomized,
        generalInstruction: sectionToEdit.generalInstruction || ""
      });
      setShowSectionModal(true);
    } else {
    }
  };

  // New function to handle section data changes in the modal
  const handleSectionDataChange = (field, value) => {
    setCurrentSectionData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // New function to save section settings (handles both add and edit)
  const handleSaveSectionSettings = () => {
    if (editingSection) {
      // Editing existing section
      const updatedSections = sections.map((sec) =>
        sec.id === editingSection.id
          ? {
              ...sec,
              name: currentSectionData.name || sec.name,
              questionsRandomized: currentSectionData.randomizeQuestions,
              optionsRandomized: currentSectionData.randomizeOptions,
              maxQuestions: currentSectionData.maxQuestions,
              generalInstruction: currentSectionData.generalInstruction
            }
          : sec
      );
      setSections(updatedSections);
    } else {
      // Adding new section
      const newSection = {
        id:
          sections.length > 0 ? Math.max(...sections.map((s) => s.id)) + 1 : 1,
        name:
          currentSectionData.name ||
          `Part ${String.fromCharCode(65 + sections.length)}`,
        questionsRandomized: currentSectionData.randomizeQuestions,
        optionsRandomized: currentSectionData.randomizeOptions,
        maxQuestions: currentSectionData.maxQuestions,
        generalInstruction: currentSectionData.generalInstruction
      };
      setSections([...sections, newSection]);
    }
    setShowSectionModal(false);
    setEditingSection(null);
    setCurrentSectionData({
      // Reset form data
      name: "",
      maxQuestions: "",
      randomizeQuestions: false,
      randomizeOptions: false,
      generalInstruction: ""
    });
  };

  const handleCreateQuestionBank = () => {
  };

  const handleLinkQuestionBank = () => {
  };

  const handleUploadQuestionBank = () => {
  };

  // Section Settings Modal Component
  const SectionSettingsModal = () => {
    if (!showSectionModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded shadow-xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingSection ? "Edit Section Settings" : "Add New Section"}
            </h2>
            <button
              onClick={() => setShowSectionModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6">
            {/* Section Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter section name"
                  value={currentSectionData.name}
                  onChange={(e) =>
                    handleSectionDataChange("name", e.target.value)
                  }
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute right-3 top-2.5 text-xs text-gray-400">
                  {currentSectionData.name.length} / 100
                </div>
              </div>
            </div>

            {/* Max Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max. number of questions allowed to attempt
              </label>
              <input
                type="number"
                placeholder="00"
                value={currentSectionData.maxQuestions}
                onChange={(e) =>
                  handleSectionDataChange("maxQuestions", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent no-spinner"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank or 0 if all questions in the linked bank are to be
                attempted.
              </p>
            </div>

            {/* Randomization Options */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="randomizeQuestions"
                  checked={currentSectionData.randomizeQuestions}
                  onChange={(e) =>
                    handleSectionDataChange(
                      "randomizeQuestions",
                      e.target.checked
                    )
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="randomizeQuestions"
                  className="ml-3 text-sm font-medium text-gray-700"
                >
                  Randomize Questions
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="randomizeOptions"
                  checked={currentSectionData.randomizeOptions}
                  onChange={(e) =>
                    handleSectionDataChange(
                      "randomizeOptions",
                      e.target.checked
                    )
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="randomizeOptions"
                  className="ml-3 text-sm font-medium text-gray-700"
                >
                  Randomize Options within questions
                </label>
              </div>
            </div>

            {/* General Instruction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                General Instruction for this section (Optional)
              </label>
              <textarea
                placeholder="Enter instructions specific to this section"
                value={currentSectionData.generalInstruction}
                onChange={(e) =>
                  handleSectionDataChange("generalInstruction", e.target.value)
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Add Audio File - Placeholder functionality */}
            <div>
              <button className="flex items-center text-blue-600 hover:text-blue-700 transition-colors text-sm">
                <Volume2 className="w-4 h-4 mr-2" />
                Add Audio File for section instruction (Optional)
              </button>
              <p className="text-xs text-gray-500 mt-1">
                This audio will play as part of the section's instructions.
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white z-10">
            <button
              onClick={() => setShowSectionModal(false)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSectionSettings}
              className="px-6 py-2 bg-blue text-white rounded hover:bg-blue-700 transition-colors"
            >
              {editingSection ? "Save Changes" : "Add Section"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <div className="p-6">
          <div className="space-y-6">
            {/* Test Name */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2">
                Test Name <span className="text-red-500">*</span>
              </label>
              <div className="relative w-3/5">
                <input
                  type="text"
                  placeholder="Enter test name"
                  value={formData.testName}
                  onChange={(e) =>
                    handleInputChange("testName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute right-3 top-4 text-xs text-gray-400">
                  {formData.testName.length} / 100
                </div>
              </div>
            </div>

            {/* Time Limit */}
            <div className="w-full md:w-3/5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Time Limit
                </label>
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.timeLimit.enabled}
                    onChange={(e) =>
                      handleTimeLimitChange("enabled", e.target.checked)
                    }
                    className="sr-only"
                  />
                  <div
                    onClick={() =>
                      handleTimeLimitChange(
                        "enabled",
                        !formData.timeLimit.enabled
                      )
                    }
                    className={`w-11 h-6 rounded-full cursor-pointer transition-colors ${
                      formData.timeLimit.enabled ? "bg-blue" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        formData.timeLimit.enabled
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      } mt-0.5`}
                    />
                  </div>
                </div>
              </div>
              {formData.timeLimit.enabled && (
                <div className="space-y-4">
                  <div className="flex space-x-3">
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={formData.timeLimit.hours}
                        onChange={(e) =>
                          handleTimeLimitChange(
                            "hours",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-10 px-1 py-1 border border-gray-300 no-spinner rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-500">HH</span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={formData.timeLimit.minutes}
                        onChange={(e) =>
                          handleTimeLimitChange(
                            "minutes",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-10 px-1 py-1 border border-gray-300 no-spinner rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-500">MM</span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={formData.timeLimit.seconds}
                        onChange={(e) =>
                          handleTimeLimitChange(
                            "seconds",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-10 px-1 py-1 border border-gray-300 no-spinner rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-500">SS</span>
                    </div>
                  </div>

                  {/* Allow Sectional Timing */}
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      checked={formData.allowSectionalTiming}
                      onChange={(e) =>
                        handleInputChange(
                          "allowSectionalTiming",
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                    />
                    <div className="ml-3">
                      <label className="text-sm font-medium text-gray-700">
                        Allow Sectional Timing
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        You can add time limit to individual sections of your
                        test.
                      </p>
                    </div>
                  </div>

                  {/* Strict Mode */}
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      checked={formData.strictMode}
                      onChange={(e) =>
                        handleInputChange("strictMode", e.target.checked)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                    />
                    <div className="ml-3">
                      <label className="text-sm font-medium text-gray-700">
                        Strict Mode
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Learners will not be allowed to submit the test if it is
                        timed test. In case of sectional timing learners will
                        not be allowed to select, submit or skip sections.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Maximum Attempts and Passing Percentage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Attempts
                </label>
                <select
                  value={formData.maxAttempts}
                  onChange={(e) =>
                    handleInputChange("maxAttempts", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="unlimited">Unlimited</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
            </div>

            {/* Allow Calculator and Result Declaration */}
            <div className="w-full md:w-3/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passing Percentage <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Enter passing percentage"
                    value={formData.passingPercentage}
                    onChange={(e) =>
                      handleInputChange("passingPercentage", e.target.value)
                    }
                    className="w-full px-3 py-2 border no-spinner border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allow Calculator
                  </label>
                  <select
                    value={formData.calculator}
                    onChange={(e) =>
                      handleInputChange("calculator", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">None</option>
                    <option value="basic">Basic</option>
                    <option value="scientific">Scientific</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Result Declaration
                  </label>
                  <select
                    value={formData.resultDeclaration}
                    onChange={(e) =>
                      handleInputChange("resultDeclaration", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="immediate">
                      Declare immediately on test submission
                    </option>
                    <option value="manual">
                      Declare later (You'll be given an option to declare)
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* More Options */}
            <div className="w-full md:w-3/5">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                More Options
              </h3>
              <div className="space-y-4">
                {/* Prerequisite */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.isPrerequisite}
                    onChange={(e) =>
                      handleInputChange("isPrerequisite", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                  />
                  <div className="ml-3">
                    <label className="text-sm font-medium text-gray-700">
                      Make this a prerequisite
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Students won't be able to move on to next lessons unless
                      they complete this assessment.
                    </p>
                  </div>
                </div>

                {/* Partial Marking */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.partialMarking}
                    onChange={(e) =>
                      handleInputChange("partialMarking", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                  />
                  <div className="ml-3">
                    <label className="text-sm font-medium text-gray-700">
                      Partial Marking
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Partial credit will be awarded for multi-correct
                      multiple-choice questions based on correctly selected
                      options. Full marks are given if all options are correct,
                      while negative/zero marks are awarded if any wrong options
                      are selected.
                    </p>
                  </div>
                </div>

                {/* Skip Declaration */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.skipDeclaration}
                    onChange={(e) =>
                      handleInputChange("skipDeclaration", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                  />
                  <div className="ml-3">
                    <label className="text-sm font-medium text-gray-700">
                      Skip Declaration
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      If this option is selected, the test will start
                      immediately without requiring students to accept the test
                      declaration.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Audio File */}
            <div className="w-full md:w-3/5">
              <div className="border-gray-300 rounded p-6 bg-gray-100">
                <div className="flex items-center">
                  <Volume2 className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">Add Audio File</span>
                </div>
              </div>
            </div>

            {/* Add Reference Sheet */}
            <div className="w-full md:w-3/5 border-gray-300 rounded p-6 bg-gray-100">
              <div className="mb-4">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">Add Reference Sheet</span>
                </div>
              </div>

              <div className="w-full relative mb-2">
                <input
                  type="text"
                  placeholder="What's this sheet called?"
                  value={formData.referenceSheet}
                  maxLength={25}
                  onChange={(e) =>
                    handleInputChange("referenceSheet", e.target.value)
                  }
                  className="w-full pr-16 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                  {formData.referenceSheet.length} / 25
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Use this reference sheet
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 rounded p-4 bg-white">
                <div className="flex items-center border-b space-x-2 mb-3 text-sm">
                  <button className="p-1 hover:bg-gray-100 rounded">B</button>
                  <button className="p-1 hover:bg-gray-100 rounded italic">
                    I
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded underline">
                    U
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">≡</button>
                  <button className="p-1 hover:bg-gray-100 rounded">⋯</button>
                </div>
                <div className="min-h-32 text-sm text-gray-500">
                  Reference Sheet Content
                </div>
              </div>
            </div>

            {/* General Instructions */}
            <div className="w-full md:w-3/5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                General Instruction
              </label>
              <div className="border border-gray-200 rounded">
                <div className="flex items-center space-x-2 p-3 border-b border-gray-200 text-sm">
                  <select className="text-sm border-none outline-none bg-transparent">
                    <option>Paragraph</option>
                  </select>
                  <button className="p-1 hover:bg-gray-100 rounded font-bold">
                    B
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded italic">
                    I
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded underline">
                    U
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded line-through">
                    S
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">x²</button>
                  <button className="p-1 hover:bg-gray-100 rounded">x₂</button>
                </div>
                <textarea
                  placeholder="Enter general instructions"
                  value={formData.generalInstructions}
                  onChange={(e) =>
                    handleInputChange("generalInstructions", e.target.value)
                  }
                  className="w-full p-3 min-h-32 border-none outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Step 2: Question Bank
    return (
      <div className="space-y-6 p-6">
        {sections.map((section) => (
          <div key={section.id} className="bg-gray-50 rounded p-6 shadow">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  {section.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Questions Randomized:{" "}
                  {section.questionsRandomized ? "Yes" : "No"}, Options
                  Randomized: {section.optionsRandomized ? "Yes" : "No"}
                </p>
                {section.maxQuestions && (
                  <p className="text-sm text-gray-500 mt-1">
                    Max Questions to Attempt: {section.maxQuestions}
                  </p>
                )}
                {section.generalInstruction && (
                  <p className="text-sm text-gray-500 mt-1 truncate max-w-md">
                    Instruction: {section.generalInstruction}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleSectionSettings(section.id)}
                className="flex items-center px-3 py-2 text-sm text-blue hover:bg-blue-100 rounded transition-colors border border-blue-600"
              >
                <Settings className="w-4 h-4 mr-2" />
                Section Settings
              </button>
            </div>

            {/* Question Bank Options */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 bg-white p-6 rounded-md border border-dashed border-gray-300">
              {/* Create Question Bank */}
              <button
                onClick={handleCreateQuestionBank}
                className="flex-1 py-4 px-4 border-2 border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 transition-all duration-150 text-center group min-w-[180px] h-auto"
                style={{ minHeight: "auto" }}
              >
                <Plus className="w-7 h-7 text-gray-400 group-hover:text-blue-500 mx-auto mb-2 transition-colors duration-150" />
                <div className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-150">
                  Create <br /> Question Bank
                </div>
              </button>

              <div className="mx-2 text-gray-400 text-sm font-medium">OR</div>

              {/* Link Question Bank */}
              <button
                onClick={handleLinkQuestionBank}
                className="flex-1 py-4 px-4 border-2 border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 transition-all duration-150 text-center group min-w-[180px] h-auto"
                style={{ minHeight: "auto" }}
              >
                <Link className="w-7 h-7 text-gray-400 group-hover:text-blue-500 mx-auto mb-2 transition-colors duration-150" />
                <div className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-150">
                  Link Question <br /> Bank
                </div>
              </button>

              <div className="mx-2 text-gray-400 text-sm font-medium">OR</div>

              {/* Upload Question Bank */}
              <button
                onClick={handleUploadQuestionBank}
                className="flex-1 py-4 px-4 border-2 border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 transition-all duration-150 text-center group min-w-[180px] h-auto"
                style={{ minHeight: "auto" }}
              >
                <Upload className="w-7 h-7 text-gray-400 group-hover:text-blue-500 mx-auto mb-2 transition-colors duration-150" />
                <div className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-150">
                  Upload <br /> Question Bank
                </div>
              </button>
            </div>
          </div>
        ))}

        {/* Add New Section Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleAddSection}
            className="flex items-center px-6 py-3 text-blue bg-blue-50 hover:bg-blue-100 rounded transition-colors duration-150 font-medium border border-blue-200 shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Section
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen  p-4 md:p-1">
      <div className="max-w-4xl mx-auto  shadow-lg rounded">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 md:space-x-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                Add Test
              </h1>
              <div className="flex items-center text-xs md:text-sm text-gray-500 mt-1">
                <span>Java</span> {/* This should likely be dynamic */}
                <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 mx-1 rotate-180" />
                <span>1. Introduction to Java</span>{" "}
                {/* This should likely be dynamic */}
              </div>
            </div>
          </div>
          <div className="flex space-x-2 md:space-x-3">
            <button
              onClick={handleBack}
              className="px-3 py-2 md:px-4 md:py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-3 py-2 md:px-4 md:py-2 text-sm bg-blue text-white rounded hover:bg-blue-700 transition-colors"
            >
              {currentStep === 1 ? "Create and Continue" : "Save Test"}{" "}
              {/* Updated button text for step 2 */}
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="p-6">
          <div className="flex items-center mb-8 w-3/5">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  currentStep >= 1
                    ? "bg-blue text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {currentStep > 1 ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <span
                className={`ml-3 text-sm font-medium transition-colors duration-300 ${
                  currentStep >= 1 ? "text-blue-600" : "text-gray-700"
                }`}
              >
                Basic Test Details
              </span>
            </div>
            <div
              className={`flex-1 h-px mx-4 transition-all duration-300 ${
                currentStep > 1 ? "bg-blue" : "bg-gray-300"
              }`}
            ></div>
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  currentStep === 2
                    ? "bg-blue text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                2
              </div>
              <span
                className={`ml-3 text-sm transition-colors duration-300 ${
                  currentStep === 2
                    ? "font-medium text-blue-600"
                    : "text-gray-500"
                }`}
              >
                Add Sections & Questions
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Content based on step */}
        {renderStepContent()}

        {/* Modal Invocation */}
        <SectionSettingsModal />
        {/* Can also be conditionally rendered as:
          {showSectionModal && <SectionSettingsModal />}
          but since the modal itself returns null when !showSectionModal,
          direct invocation is also fine.
        */}
      </div>
    </div>
  );
}
