import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import api from "@utils/api";
import { toast } from "react-toastify";

const VALID_TYPES = ["MCQ", "TRUE_FALSE", "MULTIPLE_CORRECT", "ONE_WORD"];

const AddQuestionModal = ({ isOpen, onClose, questionBankId, onSuccess, initialData, questionType }) => {
  const isMixedBank = questionType === "MIXED";

  const [localQuestionType, setLocalQuestionType] = useState(
    isMixedBank ? (initialData?.questionType || "MCQ") : questionType
  );
  const [questionText, setQuestionText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [points, setPoints] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0);
  const [difficultyLevel, setDifficultyLevel] = useState("EASY");
  const [topic, setTopic] = useState("NOUN");
  const editMode = !!initialData;

  const generateOptions = (type) =>
    type === "TRUE_FALSE"
      ? [
          { optionText: "True", isCorrect: false, explanation: "", optionOrder: 1 },
          { optionText: "False", isCorrect: false, explanation: "", optionOrder: 2 },
        ]
      : [
          { optionText: "", isCorrect: false, explanation: "", optionOrder: 1 },
          { optionText: "", isCorrect: false, explanation: "", optionOrder: 2 },
          { optionText: "", isCorrect: false, explanation: "", optionOrder: 3 },
          { optionText: "", isCorrect: false, explanation: "", optionOrder: 4 },
        ];

  const [options, setOptions] = useState(generateOptions(questionType));
  const [correctAnswer, setCorrectAnswer] = useState("");  // For ONE_WORD questions

  useEffect(() => {
    const isMixed = questionType === "MIXED";
    if (initialData) {
      setQuestionText(initialData.questionText || "");
      setExplanation(initialData.explanation || "");
      setPoints(initialData.points || 1);
      setNegativeMarks(initialData.negativeMarks || 0);
      setDifficultyLevel(initialData.difficultyLevel || "EASY");
      setTopic(initialData.topic || "NOUN");
      const resolvedType = initialData.questionType || (isMixed ? "MCQ" : questionType);
      setLocalQuestionType(resolvedType);
      
      // ONE_WORD questions use correctAnswer, not options
      if (resolvedType === "ONE_WORD") {
        setCorrectAnswer(initialData.correctAnswer || "");
        setOptions([]);
      } else {
        setOptions(
          initialData.options?.length
            ? initialData.options
            : generateOptions(resolvedType)
        );
      }
    } else {
      const defaultType = isMixed ? "MCQ" : questionType;
      setLocalQuestionType(defaultType);
      if (defaultType === "ONE_WORD") {
        setCorrectAnswer("");
        setOptions([]);
      } else {
        setOptions(generateOptions(defaultType));
      }
    }
  }, [initialData, questionType]);

  const handleOptionChange = (index, field, value) => {
    const updated = [...options];
    updated[index][field] = value;
    setOptions(updated);
  };

  const handleSubmit = async () => {
    const payload = {
      questionType: localQuestionType,
      questionText,
      explanation,
      points: Number(points),
      negativeMark: Number(negativeMarks),
      difficultyLevel,
      questionOrder: null,
      mediaUrl: null,
      // ONE_WORD uses correctAnswer, other types use options
      ...(localQuestionType === "ONE_WORD" 
        ? { correctAnswer, options: [] }
        : { correctAnswer: null, options }
      ),
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
      toast.error("Error saving question. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{editMode ? "Edit Question" : "Add Question"}</h2>
          <span className="text-sm text-gray-500">
            ({(isMixedBank ? localQuestionType : questionType).replace(/_/g, " ")})
          </span>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question type selector — only shown for MIXED banks */}
        {isMixedBank && (
          <div className="mb-4">
            <label className="text-sm font-medium block mb-1">Question Type</label>
            <select
              value={localQuestionType}
              onChange={(e) => {
                setLocalQuestionType(e.target.value);
                if (e.target.value === "ONE_WORD") {
                  setCorrectAnswer("");
                  setOptions([]);
                } else {
                  setOptions(generateOptions(e.target.value));
                }
              }}
              className="w-full border rounded px-3 py-2"
            >
              {VALID_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Options or Correct Answer section */}
        {localQuestionType === "ONE_WORD" ? (
          <div className="mt-6">
            <label className="text-sm font-medium block mb-1">Correct Answer</label>
            <input
              type="text"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter the correct answer here..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Answer matching is case-insensitive and ignores whitespace (e.g., "Coffee Is Grown" = "coffeeisgrown")
            </p>
          </div>
        ) : (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-sm">Options</div>
              {localQuestionType === "MULTIPLE_CORRECT" && (
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                  ✓ Select all correct answers
                </span>
              )}
            </div>
            {options.map((opt, index) => (
              <div key={index} className="flex items-center gap-2 mb-3">
                <input
                  type={localQuestionType === "MULTIPLE_CORRECT" ? "checkbox" : "radio"}
                  name="correct"
                  checked={opt.isCorrect}
                  onChange={() =>
                    setOptions(
                      options.map((o, i) => ({
                        ...o,
                        isCorrect: localQuestionType === "MULTIPLE_CORRECT" ? (i === index ? !o.isCorrect : o.isCorrect) : i === index,
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
                  disabled={localQuestionType === "TRUE_FALSE"}
                />
              </div>
            ))}
          </div>
        )}

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
