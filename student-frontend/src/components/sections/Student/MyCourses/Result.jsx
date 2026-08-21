"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { CheckCircle2, Clock, Trophy, Target, XCircle, BarChart2, ArrowLeft, Code, ChevronDown, ChevronUp } from "lucide-react";
import { getGrade } from "@/utils/gradeUtils";


const formatTime = (seconds) => {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

export default function ResultPage({ data }) {
  const router  = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const [expandedQuestion, setExpandedQuestion] = React.useState(null);

  const toggleQuestion = (index) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  const handleClose = () => {
    if (courseId) {
      router.push(`/student/mycourses/courses/${courseId}`);
    } else {
      router.back();
    }
  };

  const cleanInstructions = (data.exerciseMetadata?.instructions || "").trim();

  const displayCorrect = data.correctAnswers ?? 0;
  const displayPercentage = data.percentage ?? 0;
  const totalQuestions = (data.correctAnswers ?? 0) + (data.incorrectAnswers ?? 0) + (data.unansweredQuestions ?? 0);

  // Order questions by the served order the backend recorded — the single source of truth.
  const servedQuestionIds = data.servedQuestionIds || [];
  let displayQuestions = data.questionsResponse || [];
  if (servedQuestionIds.length > 0) {
    const indexMap = new Map(servedQuestionIds.map((id, i) => [id, i]));
    displayQuestions = [...displayQuestions].sort((a, b) => {
      const ia = indexMap.has(a.questionId) ? indexMap.get(a.questionId) : Infinity;
      const ib = indexMap.has(b.questionId) ? indexMap.get(b.questionId) : Infinity;
      return ia - ib;
    });
  }

  const grade = getGrade(displayPercentage);
  const accuracy = totalQuestions > 0
    ? ((displayCorrect / totalQuestions) * 100).toFixed(1)
    : "0.0";

  const stats = [
    { label: "Marks Scored", value: `${displayCorrect} / ${totalQuestions}`, color: "text-[#ff5b00]" },
    { label: "Percentage", value: `${displayPercentage}%`, color: "text-[#0c63e4]" },
    { label: "Grade", value: grade.label, color: grade.color },
    { label: "Accuracy", value: `${accuracy}%`, color: "text-green-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Header */}
      <div className="flex items-center justify-between text-white px-6 py-4 rounded-2xl mb-6 bg-[linear-gradient(135deg,#1a2b4e_0%,#2d3a6b_100%)]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-0.5">Exercise Result</p>
          <h2 className="text-base font-bold">Review Summary</h2>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-white/60" />
          <span className="text-sm font-medium text-white/80">
            {formatTime(data.timeSpentSeconds)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">

        {/* ── Left Panel ─────────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-6 space-y-4">

          {/* Submission confirmation */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_1px_6px_-1px_rgba(26,43,78,0.08)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1a2b4e]">Exercise Submitted</h3>
                <p className="text-[11px] text-gray-400">Your responses have been recorded successfully.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <p className="text-gray-400 font-medium mb-0.5">Student</p>
                <p className="font-bold text-[#1a2b4e]">{data.username}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <p className="text-gray-400 font-medium mb-0.5">Attempt</p>
                <p className="font-bold text-[#1a2b4e]">{data.attemptNumber || data.attemptId}</p>
              </div>
            </div>
          </div>

          {/* Score grid */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_1px_6px_-1px_rgba(26,43,78,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-[#ff5b00]/10 flex items-center justify-center">
                <Trophy className="w-3.5 h-3.5 text-[#ff5b00]" />
              </div>
              <h3 className="text-xs font-bold text-[#1a2b4e] uppercase tracking-wide">Score Breakdown</h3>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
              {stats.map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl py-4 border border-gray-100">
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Attempt stats */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_1px_6px_-1px_rgba(26,43,78,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-[#0c63e4]/10 flex items-center justify-center">
                <BarChart2 className="w-3.5 h-3.5 text-[#0c63e4]" />
              </div>
              <h3 className="text-xs font-bold text-[#1a2b4e] uppercase tracking-wide">Attempt Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { icon: Clock, color: "text-[#0c63e4]", bg: "bg-[#0c63e4]/10", label: "Time Taken", value: formatTime(data.timeSpentSeconds) },
                { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", label: "Correct Answers", value: displayCorrect },
                { icon: XCircle, color: "text-red-500", bg: "bg-red-50", label: "Incorrect Answers", value: displayQuestions.filter(q => q.isCorrect === false && (q.selectedOptionId != null || q.textResponse != null)).length },
                { icon: Target, color: "text-gray-500", bg: "bg-gray-100", label: "Unanswered", value: data.unansweredQuestions ?? displayQuestions.filter(q => q.selectedOptionId == null && q.textResponse == null).length },
                {
                  icon: Code, color: "text-amber-500", bg: "bg-amber-50", label: "Result Status", value: (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${displayPercentage >= (data.exerciseMetadata?.passingPercentage || 0) ? 'bg-green-50 text-green-600 border border-green-100' :
                      'bg-red-50 text-red-500 border border-red-100'
                      }`}>
                      {displayPercentage >= (data.exerciseMetadata?.passingPercentage || 0) ? "Pass" : "Fail"}
                    </span>
                  )
                },
              ].map(({ icon: Icon, color, bg, label, value }) => (
                <div key={label} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  <div className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium">{label}</p>
                    <p className="font-bold text-[#1a2b4e]">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#ff5b00] hover:bg-[#e55200] rounded-xl transition-colors shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          </div>
        </div>

        {/* ── Right Panel ────────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_1px_6px_-1px_rgba(26,43,78,0.08)]">
            <div className="px-5 py-4 border-b border-gray-100">
              <h4 className="text-xs font-bold text-[#1a2b4e] uppercase tracking-wide mb-3">Question Review</h4>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-100">
                  <CheckCircle2 className="w-3 h-3" />
                  {displayCorrect} Correct
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-500 border border-red-100">
                  <XCircle className="w-3 h-3" />
                  {displayQuestions.filter(q => q.isCorrect === false && (q.selectedOptionId != null || q.textResponse != null)).length} Wrong
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                  {data.unansweredQuestions ?? displayQuestions.filter(q => q.selectedOptionId == null && q.textResponse == null).length} Skipped
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto">
              {displayQuestions.map((q, i) => (
                <div
                  key={`${q.questionId}-${i}`}
                  className={`${q.isCorrect ? "" : ""} transition-colors duration-100`}
                >
                  {/* Question Header - Clickable */}
                  <button
                    onClick={() => toggleQuestion(i)}
                    className={`w-full flex items-start justify-between gap-3 px-5 py-3.5 text-left ${
                      q.isCorrect === true ? "hover:bg-green-50/40" : 
                      q.isCorrect === false ? "hover:bg-red-50/40" : 
                      "hover:bg-gray-50/40"
                    } transition-colors duration-100`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                        q.isCorrect === true ? "bg-green-50" : 
                        q.isCorrect === false ? "bg-red-50" : 
                        "bg-gray-100"
                      }`}>
                        {q.isCorrect === true ? (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        ) : q.isCorrect === false ? (
                          <XCircle className="w-3 h-3 text-red-400" />
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400">{i + 1}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 leading-snug line-clamp-2">
                        <span className="font-semibold text-gray-400">Q{i + 1}. </span>
                        {q.questionText}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-bold ${
                        q.isCorrect === true ? "text-green-600" : 
                        q.isCorrect === false ? "text-red-400" : 
                        "text-gray-300"
                      }`}>
                        +{q.pointsAwarded ?? 0}
                      </span>
                      {expandedQuestion === i
                        ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                        : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      }
                    </div>
                  </button>

                  {/* Expandable Detail */}
                  {expandedQuestion === i && (
                    <div className="px-5 pb-4 space-y-3">
                      {/* Options - for MCQ, TRUE_FALSE, MULTIPLE_CORRECT */}
                      {q.options && q.options.length > 0 && (
                        <div className="space-y-1.5">
                          {q.options
                            .sort((a, b) => (a.optionOrder ?? 0) - (b.optionOrder ?? 0))
                            .map((opt) => {
                              const isSelected = q.selectedOptionId === opt.optionId
                                || (q.selectedOptionIds && q.selectedOptionIds.includes(opt.optionId));
                              const isCorrectOpt = opt.isCorrect;

                              let optClass = "bg-gray-50 border-gray-100 text-gray-600";
                              if (isCorrectOpt && isSelected) {
                                optClass = "bg-green-50 border-green-200 text-green-700";
                              } else if (isCorrectOpt && !isSelected) {
                                optClass = "bg-green-50 border-green-200 text-green-700";
                              } else if (!isCorrectOpt && isSelected) {
                                optClass = "bg-red-50 border-red-200 text-red-600";
                              }

                              return (
                                <div
                                  key={opt.optionId}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] ${optClass}`}
                                >
                                  {/* Selection indicator */}
                                  <div className="flex-shrink-0">
                                    {isSelected && isCorrectOpt && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                    {isSelected && !isCorrectOpt && <XCircle className="w-3 h-3 text-red-400" />}
                                    {!isSelected && isCorrectOpt && <CheckCircle2 className="w-3 h-3 text-green-400 opacity-60" />}
                                    {!isSelected && !isCorrectOpt && <span className="w-3 h-3 rounded-full border border-gray-300 inline-block" />}
                                  </div>
                                  <span className="flex-1 font-medium">{opt.optionText}</span>
                                  {isCorrectOpt && (
                                    <span className="text-[9px] font-bold uppercase text-green-500 tracking-wide">Correct</span>
                                  )}
                                  {isSelected && !isCorrectOpt && (
                                    <span className="text-[9px] font-bold uppercase text-red-400 tracking-wide">Your Answer</span>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}

                      {/* ONE_WORD: show student's text response */}
                      {q.questionType === "ONE_WORD" && (
                        <div className="space-y-1.5">
                          {q.textResponse ? (
                            <>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Your Answer</p>
                              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] ${
                                q.isCorrect 
                                  ? "bg-green-50 border-green-200 text-green-700" 
                                  : "bg-red-50 border-red-200 text-red-600"
                              }`}>
                                {q.isCorrect ? (
                                  <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                                )}
                                <span className="flex-1 font-medium">{q.textResponse}</span>
                                {q.isCorrect ? (
                                  <span className="text-[9px] font-bold uppercase text-green-500 tracking-wide">Correct</span>
                                ) : (
                                  <span className="text-[9px] font-bold uppercase text-red-400 tracking-wide">Your Answer</span>
                                )}
                              </div>
                            </>
                          ) : (
                            <p className="text-[11px] text-gray-400 italic">No answer provided</p>
                          )}
                          
                          {/* Show correct answer if different from student's answer */}
                          {q.correctAnswer && (
                            q.textResponse?.replace(/\s+/g, '').toLowerCase() !== 
                            q.correctAnswer.replace(/\s+/g, '').toLowerCase()
                          ) && (
                            <>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-3">Correct Answer</p>
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] bg-green-50 border-green-200 text-green-700">
                                <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                                <span className="flex-1 font-medium">{q.correctAnswer}</span>
                                <span className="text-[9px] font-bold uppercase text-green-500 tracking-wide">Correct</span>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Explanation */}
                      {(q.questionExplanation || q.correctExplanation) && (
                        <div className="bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-2.5">
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-1">Explanation</p>
                          <p className="text-[11px] text-blue-800 leading-relaxed">
                            {q.questionExplanation || q.correctExplanation}
                          </p>
                        </div>
                      )}

                      {/* Question type badge */}
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-gray-100 text-gray-500 border border-gray-200">
                          {q.questionType?.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {q.points ?? 1} {q.points === 1 ? "point" : "points"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
