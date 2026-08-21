"use client";

import { useState, useEffect } from "react";
import { assignmentData, AssignmentAttempts, attemptNow } from "@/services/courseService";
import { Clock, RefreshCcw, Trophy, BookOpen, Play, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { getGrade } from "@/utils/gradeUtils";

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString();
}
function formatTimeTaken(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

/* ─── Skeleton ───────────────────────────────────────────────────────────────── */
function AssignmentSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
           style={{ boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" }}>

        <div className="p-5 flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="sk h-5 rounded w-48" />
            <div className="sk h-3.5 rounded w-64" />
          </div>
          <div className="text-right space-y-1.5 flex-shrink-0">
            <div className="sk h-8 w-14 rounded-lg" />
            <div className="sk h-3 w-20 rounded" />
          </div>
        </div>
        <div className="px-5 pb-5 grid md:grid-cols-3 gap-3">
          {[
            "bg-[#ff5b00]/[0.05]",
            "bg-[#0c63e4]/[0.05]",
            "bg-green-50",
          ].map((bg, i) => (
            <div key={i} className={`flex items-center gap-3 p-4 ${bg} rounded-xl`}>
              <div className="sk w-5 h-5 rounded-lg flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="sk h-3.5 rounded w-3/4" />
                <div className="sk h-3 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3"
           style={{ boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" }}>
        <div className="sk h-4 rounded w-24" />
        <div className="space-y-2">
          {[88, 72, 80, 65, 75].map((w, i) => (
            <div key={i} className="sk h-3 rounded" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5"
           style={{ boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" }}>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="sk h-4 rounded w-32" />
            <div className="sk h-3 rounded w-52" />
          </div>
          <div className="sk h-11 w-36 rounded-xl flex-shrink-0" />
        </div>
      </div>

      {/* Past attempts */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5"
           style={{ boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" }}>
        <div className="sk h-4 rounded w-28 mb-5" />
        <div className="flex flex-col items-center py-6 gap-3">
          <div className="sk w-10 h-10 rounded-full" />
          <div className="sk h-3 rounded w-36" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────── */
export default function ExerciseLayout({ title, contentReferenceId, contentItemId, courseId }) {
  const [isAttempting, setIsAttempting] = useState(false);
  const [exercise,     setExercise]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [attempts,     setAttempts]     = useState([]);
  const router  = useRouter();
  const userId  = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await assignmentData(contentReferenceId);
        setExercise(data);
        if (userId) {
          const res = await AssignmentAttempts(contentReferenceId, userId);
          setAttempts(res || []);
        }
      } catch (error) {
        console.error("Error loading exercise data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [contentReferenceId, userId]);

  const handleAttemptNow = async () => {
    if (!exercise) return;
    setIsAttempting(true);
    try {
      const res = await attemptNow(exercise.exerciseId, contentItemId);
      const attemptId = res.data?.data?.attemptId || res.data?.attemptId;
      router.push(
        `/student/mycourses/courses/assignment/${exercise.exerciseId}?contentItemId=${contentItemId}&attemptId=${attemptId}&courseId=${courseId || ''}`
      );
    } catch (err) {
      console.error("Failed to start exercise:", err);
    } finally {
      setIsAttempting(false);
    }
  };

  if (loading) return <AssignmentSkeleton />;

  if (!exercise) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center"
           style={{ boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" }}>
        <p className="text-sm font-semibold text-gray-400">Failed to load assignment</p>
      </div>
    );
  }

  // Get numQuestions from exercise
  const numQuestions = exercise.numQuestions || null;
  const originalInstructions = exercise.instructions || "";

  const normalizeAttempt = (a) => {
    if (!numQuestions) return { ...a, displayMaxScore: a.maxScore, displayPct: Math.round(a.percentage), displayPassed: a.passed };
    
    const displayCorrect = a.score || 0;
    const displayPct = Math.min(100, Math.round((displayCorrect / numQuestions) * 100));
    const passThreshold = exercise.passingPercentage || 0;
    const displayPassed = displayPct >= passThreshold;
    
    return {
      ...a,
      displayMaxScore: numQuestions,
      displayPct,
      displayPassed
    };
  };

  const normalizedAttempts = attempts.map(normalizeAttempt);
  const attemptsLeft       = exercise.maxAttempts - attempts.length;
  const exhausted          = attemptsLeft <= 0;
  const bestScore          = normalizedAttempts.length > 0
    ? Math.max(...normalizedAttempts.map((a) => a.displayPct))
    : null;

  const cardShadow = { boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" };

  const cleanInstructions = originalInstructions.trim();

  return (
    <div className="space-y-4">

      {/* ── Assignment details ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={cardShadow}>

        {/* Header row */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-[#1a2b4e] leading-snug mb-0.5">{title}</h3>
            <p className="text-xs text-gray-400">Complete this assignment to proceed further</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold" style={{ color: "#ff5b00" }}>
              {exercise.passingPercentage || 0}%
            </div>
            <div className="text-[11px] text-gray-400 font-medium">Passing mark</div>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="p-5 grid md:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[#ff5b00]/[0.05] border border-[#ff5b00]/[0.08]">
            <div className="w-9 h-9 rounded-lg bg-[#ff5b00]/[0.10] flex items-center justify-center flex-shrink-0">
              <RefreshCcw className="w-4 h-4 text-[#ff5b00]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1a2b4e]">Attempts Left</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {attemptsLeft} of {exercise.maxAttempts}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-[#0c63e4]/[0.05] border border-[#0c63e4]/[0.08]">
            <div className="w-9 h-9 rounded-lg bg-[#0c63e4]/[0.10] flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-[#0c63e4]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1a2b4e]">Time Limit</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {exercise.timeLimitMinutes ? `${exercise.timeLimitMinutes} min` : "No limit"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-100">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1a2b4e]">Best Score</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {bestScore !== null ? `${bestScore}%` : "Not attempted yet"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Instructions ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5" style={cardShadow}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-md bg-[#ff5b00]/[0.10] flex items-center justify-center">
            <BookOpen className="w-3 h-3 text-[#ff5b00]" />
          </div>
          <h3 className="text-xs font-bold text-[#1a2b4e] uppercase tracking-wide">Instructions</h3>
        </div>
        <ul className="space-y-2 text-xs text-gray-500 leading-relaxed list-none pl-0">
          {[
            "The test consists of True/False or MCQ questions.",
            "Carefully read each question before selecting your answer.",
            "Each correct answer awards 1 mark. No negative marking.",
            "Use Save & Next to save and move to the next question.",
            "You can mark questions for review and revisit before submitting.",
            "Click Submit Exercise once you have completed the test.",
            "Avoid refreshing or closing the page during the test.",
          ].map((line, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: "#ff5b00", marginTop: "5px" }}
              />
              {line}
            </li>
          ))}
        </ul>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5" style={cardShadow}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#1a2b4e] mb-0.5">Ready to Start?</h3>
            <p className="text-xs text-gray-400">
              {exhausted
                ? "You have used all your attempts for this exercise."
                : "Click the button below to begin your assignment."}
            </p>
          </div>
          <button
            onClick={handleAttemptNow}
            disabled={isAttempting || exhausted}
            className={`inline-flex items-center gap-2 text-white text-sm font-bold
                       px-7 py-3 rounded-xl shadow-sm transition-all duration-150
                       active:scale-95 disabled:cursor-not-allowed disabled:transform-none flex-shrink-0
                       ${exhausted ? "bg-gray-400" : "bg-[#ff5b00] hover:bg-[#e55200]"}`}
          >
            {isAttempting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Starting…
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Attempt Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Past attempts ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={cardShadow}>
        {/* Card header */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
          <div className="w-5 h-5 rounded-md bg-[#ff5b00]/[0.10] flex items-center justify-center">
            <Trophy className="w-3 h-3 text-[#ff5b00]" />
          </div>
          <span className="text-xs font-bold text-[#1a2b4e] uppercase tracking-wide">Past Attempts</span>
          {attempts.length > 0 && (
            <span
              className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border"
              style={{
                background:   "rgba(255,91,0,0.08)",
                color:         "#ff5b00",
                borderColor:  "rgba(255,91,0,0.15)",
              }}
            >
              {attempts.length}
            </span>
          )}
        </div>

        {attempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["#", "Date & Time", "Time Taken", "Score", "Percentage", "Grade", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {normalizedAttempts.map((attempt) => {
                  const pct    = attempt.displayPct;
                  const passed = attempt.displayPassed;
                  return (
                    <tr
                      key={attempt.attemptId}
                      className="hover:bg-[#ff5b00]/[0.025] transition-colors duration-150 cursor-pointer group"
                      onClick={() => router.push(`/student/mycourses/courses/result/${attempt.attemptId}${courseId ? `?courseId=${courseId}` : ''}`)}
                    >
                      <td className="px-5 py-3.5 text-xs text-gray-400">{attempt.attemptNumber}</td>
                      <td className="px-5 py-3.5 text-xs text-[#0c63e4] font-medium">
                        {formatDateTime(attempt.completedAt)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600">
                        {formatTimeTaken(attempt.timeSpentSeconds)}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-[#1a2b4e]">
                        {(attempt.score ?? 0)}/{attempt.displayMaxScore}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-[#ff5b00]">{pct}%</td>
                      <td className={`px-5 py-3.5 text-xs font-bold ${getGrade(pct).color}`}>{getGrade(pct).label}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            passed
                              ? "bg-green-50 text-green-600 border-green-100"
                              : "bg-red-50 text-red-500 border-red-100"
                          }`}
                        >
                          {passed
                            ? <CheckCircle2 className="w-3 h-3" />
                            : <XCircle      className="w-3 h-3" />
                          }
                          {passed ? "Pass" : "Fail"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#ff5b00] opacity-0 group-hover:opacity-100 transition-opacity">
                          Review <ChevronRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-xs font-semibold text-gray-400">No previous attempts</p>
            <p className="text-[11px] text-gray-300 mt-0.5">Your history will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
