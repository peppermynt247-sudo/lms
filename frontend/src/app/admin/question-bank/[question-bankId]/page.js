"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Upload, Plus, Trash2, Pencil } from "lucide-react";
import api from "@utils/api";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";
import AddQuestionModal from "@/components/sections/admin/question-bank/Components/AddQuestionModal";
import mammoth from "mammoth";
import {toast} from "react-toastify";


const QuestionBankDetails = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState({ isOpen: false, initialData: null });
  const [questionType, setQuestionType] = useState("");

  const fetchQuestions = async () => {
    try {
      const res = await api.get(`/api/question-banks/${id}/questions`);
      setQuestions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error("Failed to load questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await api.get(`/api/question-banks/${id}`);
        setQuestionType(res.data.data?.questionsType);
      } catch (err) {
        console.error("Failed to fetch question bank meta:", err);
      }
    };

    if (id) {
      fetchMeta();
      fetchQuestions();
    }
  }, [id]);

  const handleAddQuestion = () => {
    setModalData({ isOpen: true, initialData: null });
  };

  const handleExport = async () => {
    try {
      const doc = new Document({
        sections: [
          {
            children: questions
              .map((q, index) => {
                const questionTitle = new Paragraph({
                  children: [
                    new TextRun({
                      text: `${index + 1}. ${q.questionText || "Untitled Question"}`,
                      bold: true,
                    }),
                  ],
                });

                const options = (q.options || []).map((opt) =>
                  new Paragraph({
                    children: [new TextRun(`- ${opt.optionText || "No text"} ${opt.isCorrect ? "(Correct)" : ""}`)],
                  })
                );

                return [questionTitle, ...options];
              })
              .flat(),
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `question-bank-${id}.docx`);
    } catch (err) {
      console.error("Failed to export questions:", err);
      toast.error("Failed to export questions. Please try again.");
    }
  };

  const DIFFICULTY_MAP = { beginner: "EASY", intermediate: "MEDIUM", advanced: "HARD" };
  const TYPE_MAP = { 0: "MCQ", 1: "MULTIPLE_CORRECT", 6: "TRUE_FALSE" };

  const parseQuestionsFromText = (text) => {
    try {
      // --- Parse document-level header metadata ---
      const headerTypeMatch = text.match(/\[Type\]\s*(\d+)/i);
      const marksMatch = text.match(/\[Marks\]\s*([\d.]+)/i);
      const negMarksMatch = text.match(/\[Negative Marks\]\s*([\d.]+)/i);
      const difficultyMatch = text.match(/\[Difficulty\]\s*(\w+)/i);

      const docPoints = marksMatch ? parseInt(marksMatch[1], 10) || 1 : 1;
      const docNegativeMark = negMarksMatch ? parseFloat(negMarksMatch[1]) || 0 : 0;
      const docDifficulty = difficultyMatch
        ? DIFFICULTY_MAP[difficultyMatch[1].toLowerCase()] || "EASY"
        : "EASY";
      // docType is used as a hint but content-based detection takes precedence for safety
      const docTypeHint = headerTypeMatch ? TYPE_MAP[parseInt(headerTypeMatch[1])] : null;

      // --- Split into per-question blocks ---
      const blocks = text
        .split(/(?=Q\.\d+\))/g)
        .filter((b) => b.trim().startsWith("Q."));

      return blocks.map((block) => {
        const blockNoHint = block.replace(/\[hint\][^\n]*/gi, "").trim();

        const solutionPos = blockNoHint.search(/\[s\d+\]/i);
        const explanation =
          solutionPos !== -1
            ? blockNoHint.slice(solutionPos).replace(/\[s\d+\]\s*/i, "").trim()
            : "";
        const blockClean =
          solutionPos !== -1 ? blockNoHint.slice(0, solutionPos).trim() : blockNoHint;

        const qMatch = blockClean.match(/^Q\.\d+\)\s*([\s\S]*?)(?=\*?\[[a-d]\]|\[answer\]|$)/i);
        if (!qMatch) return null;

        const questionText = qMatch[1]?.trim() || "";
        if (!questionText) return null;

        // ONE_WORD: [answer] tag
        const answerMatch = blockClean.match(/\[answer\]\s*(.*)/i);
        if (answerMatch) {
          return {
            questionType: "ONE_WORD",
            questionText,
            explanation,
            points: docPoints,
            difficultyLevel: docDifficulty,
            negativeMark: docNegativeMark,
            mediaUrl: null,
            correctAnswer: answerMatch[1]?.trim() || "",
            options: [],
          };
        }

        const optionMatches = [
          ...blockClean.matchAll(/(\*?)\[(a|b|c|d)\]\s*([\s\S]*?)(?=\*?\[[a-d]\]|$)/gi),
        ];

        const options = optionMatches.map((match, idx) => ({
          optionText: match[3]?.trim() || "",
          isCorrect: match[1] === "*",
          explanation: "",
          optionOrder: idx + 1,
        }));

        if (options.length === 0) return null;

        // Detect type from content; fall back to document header hint
        const correctCount = options.filter((o) => o.isCorrect).length;
        const isTrueFalse =
          options.length === 2 &&
          options.every((o) => ["true", "false"].includes(o.optionText.toLowerCase()));
        const questionType = isTrueFalse
          ? "TRUE_FALSE"
          : correctCount > 1
          ? "MULTIPLE_CORRECT"
          : docTypeHint || "MCQ";

        return {
          questionType,
          questionText,
          explanation,
          points: docPoints,
          difficultyLevel: docDifficulty,
          negativeMark: docNegativeMark,
          mediaUrl: null,
          options,
        };
      }).filter(Boolean);
    } catch (err) {
      toast.error("Error parsing document. Please check the file format.");
      return [];
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file || !file.name.endsWith(".docx")) {
      toast.error("Please upload a .docx file");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const { value: rawText } = await mammoth.extractRawText({ arrayBuffer });

      const questionsPayload = parseQuestionsFromText(rawText);

      if (questionsPayload.length === 0) {
        toast.error("No valid questions found in the document. Check the file format.");
        return;
      }

      await api.post(`/api/question-banks/${id}/bulkquestions`, questionsPayload);
      toast.success(`${questionsPayload.length} question${questionsPayload.length > 1 ? "s" : ""} imported successfully.`);
      fetchQuestions();
    } catch (err) {
      toast.error("Failed to import questions. Please check the file format and try again.");
    }
  };

  const handleDeleteQuestion = async (questionId) => {
      try {
        await api.delete(`/api/question-banks/${id}/questions/${questionId}`);
        setQuestions(questions.filter((q) => q.questionId !== questionId));
      } catch (err) {
        console.error("Failed to delete question:", err);
        toast.error("Failed to delete question. Please try again.");
      }
  };

  const handleEditQuestion = (questionId) => {
    const editQuestion = questions.find((q) => q.questionId === questionId);
    if (editQuestion) {
      setModalData({ isOpen: true, initialData: editQuestion });
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow">
      <AddQuestionModal
        isOpen={modalData.isOpen}
        onClose={() => setModalData({ isOpen: false, initialData: null })}
        questionBankId={id}
        questionType={questionType}
        initialData={modalData.initialData}
        onSuccess={() => {
          setModalData({ isOpen: false, initialData: null });
          fetchQuestions();
        }}
      />

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <ArrowLeft className="w-5 h-5 text-gray-600 cursor-pointer" onClick={() => router.back()} />
          <div>
            <h1 className="text-xl font-semibold">Question Bank Details</h1>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 border rounded-lg text-sm"
          >
            <Download className="w-4 h-4 mr-2" /> Export
          </button>

          <label className="flex items-center px-4 py-2 border rounded-lg text-sm cursor-pointer">
            <Upload className="w-4 h-4 mr-2" /> Import
            <input
              type="file"
              accept=".docx"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          <button
            className="flex items-center px-4 py-2 bg-blue text-white rounded-lg text-sm hover:bg-blue"
            onClick={handleAddQuestion}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Question
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <p className="text-center text-gray-500">No questions available.</p>
      ) : (
        questions.map((q, index) => (
          <div key={q.questionId || index} className="border-t pt-6 mt-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-lg font-medium">
                  {String(index + 1).padStart(2, "0")}. {q.questionText || "Untitled Question"}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <span className="text-green-600">+{q.points || 0} mark</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="p-1 hover:bg-gray-100 rounded"
                  onClick={() => handleDeleteQuestion(q.questionId)}
                >
                  <Trash2 className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  className="p-1 hover:bg-gray-100 rounded"
                  onClick={() => handleEditQuestion(q.questionId)}
                >
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {(q.options || []).map((opt, optIndex) => (
                <div key={opt.optionId || optIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`question_${q.questionId || index}`}
                    checked={opt.isCorrect || false}
                    disabled
                    className="accent-blue-600"
                  />
                  <label className="w-full border rounded px-4 py-2">
                    {opt.optionText || "No text"}
                    {opt.explanation && (
                      <div className="text-xs text-gray-400 mt-1">
                        Explanation: {opt.explanation}
                      </div>
                    )}
                  </label>
                </div>
              ))}
            </div>
            {q.explanation && (
              <p className="text-sm text-gray-500 mt-2">
                <strong>Explanation:</strong> {q.explanation}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default QuestionBankDetails;