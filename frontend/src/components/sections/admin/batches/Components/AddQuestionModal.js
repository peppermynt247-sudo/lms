import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import api from "@utils/api";

const AddQuestionModal = ({ isOpen, onClose, questionBankId, onSuccess, initialData }) => {
  const [questionText, setQuestionText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [points, setPoints] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0);
  const [difficultyLevel, setDifficultyLevel] = useState("EASY");
  const [questionType, setQuestionType] = useState("TRUE_FALSE");
  const [topic, setTopic] = useState("NOUN"); // default topic
  const editMode = !!initialData;

  const [options, setOptions] = useState([
    { optionText: "", isCorrect: false, explanation: "", optionOrder: 1 },
    { optionText: "", isCorrect: false, explanation: "", optionOrder: 2 },
    { optionText: "", isCorrect: false, explanation: "", optionOrder: 3 },
    { optionText: "", isCorrect: false, explanation: "", optionOrder: 4 },
  ]);

  useEffect(() => {
    if (initialData) {
      setQuestionText(initialData.questionText || "");
      setExplanation(initialData.explanation || "");
      setPoints(initialData.points || 1);
      setDifficultyLevel(initialData.difficultyLevel || "EASY");
      setQuestionType(initialData.questionType || "TRUE_FALSE");
      setTopic(initialData.topic || "NOUN");
      setOptions(
        initialData.options?.length
          ? initialData.options
          : [
              { optionText: "", isCorrect: false, explanation: "", optionOrder: 1 },
              { optionText: "", isCorrect: false, explanation: "", optionOrder: 2 },
              { optionText: "", isCorrect: false, explanation: "", optionOrder: 3 },
              { optionText: "", isCorrect: false, explanation: "", optionOrder: 4 },
            ]
      );
    }
  }, [initialData]);

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    const payload = {
      questionId: initialData?.questionId,
      questionType: options.length === 2 ? "TRUE_FALSE" : "MCQ",
      questionText,
      explanation,
      points: Number(points),
      negativeMarks: Number(negativeMarks),
      difficultyLevel,
      topic,
      mediaUrl: null,
      options,
    };

    try {
      if (editMode) {
        await api.put(`/api/question-banks/${questionBankId}/questions/${initialData.questionId}`, payload);
      } else {
        await api.post(`/api/question-banks/${questionBankId}/questions`, payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to submit question:", err);
      alert("Error saving question. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{editMode ? "Edit Question" : "Add Question"}</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* <div>
            <label className="text-sm font-medium block mb-1">Question Type</label>
            <select
              value={questionType}
              onChange={(e) => {
                setQuestionType(e.target.value);
                if (e.target.value === "TRUE_FALSE") {
                  setOptions([
                    { optionText: "True", isCorrect: false, explanation: "", optionOrder: 1 },
                    { optionText: "False", isCorrect: false, explanation: "", optionOrder: 2 },
                  ]);
                } else {
                  setOptions([
                    { optionText: "", isCorrect: false, explanation: "", optionOrder: 1 },
                    { optionText: "", isCorrect: false, explanation: "", optionOrder: 2 },
                    { optionText: "", isCorrect: false, explanation: "", optionOrder: 3 },
                    { optionText: "", isCorrect: false, explanation: "", optionOrder: 4 },
                  ]);
                }
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value="TRUE_FALSE">True/False</option>
              <option value="MCQ">MCQ</option>
            </select>
          </div> */}

          {/* <div>
            <label className="text-sm font-medium block mb-1">Topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="NOUN">Noun & its Types</option>
              <option value="VERB">Verb</option>
              <option value="ADJECTIVE">Adjective</option>
            </select>
          </div> */}

          <div className="col-span-1">
            <label className="text-sm font-medium block mb-1">Difficulty Level</label>
            <div className="flex gap-2">
              {["EASY", "MEDIUM", "HARD"].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficultyLevel(level)}
                  className={`px-4 py-1 rounded border ${
                    difficultyLevel === level
                      ? "bg-green-100 border-green-500 text-green-700"
                      : "bg-white"
                  }`}
                >
                  {level.charAt(0) + level.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium block mb-1">Marks</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="w-full border rounded px-3 py-2"
                min="0"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium block mb-1">Negative Marks</label>
              <input
                type="number"
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(e.target.value)}
                className="w-full border rounded px-3 py-2"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium block mb-1">Question</label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="w-full border rounded px-3 py-2 min-h-[100px]"
            placeholder="Enter your question here..."
          />
        </div>

        <div className="mt-6">
          <div className="font-medium text-sm mb-2">Options</div>
          {options.map((opt, index) => (
            <div key={index} className="flex items-center gap-2 mb-3">
              <input
                type="radio"
                name="correct"
                checked={opt.isCorrect}
                onChange={() =>
                  setOptions(
                    options.map((o, i) => ({
                      ...o,
                      isCorrect: i === index,
                    }))
                  )
                }
                className="accent-blue-600"
              />
              <input
                type="text"
                placeholder={`Option ${index + 1}`}
                value={opt.optionText}
                onChange={(e) => handleOptionChange(index, "optionText", e.target.value)}
                className="flex-1 border rounded px-3 py-2"
              />
            </div>
          ))}
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium block mb-1">Explanation</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="w-full border rounded px-3 py-2 min-h-[100px]"
            placeholder="Enter your explanation here..."
          />
        </div>

        <div className="flex justify-end mt-6 gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded border">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded bg-blue text-white hover:bg-blue"
          >
            Save and Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddQuestionModal;