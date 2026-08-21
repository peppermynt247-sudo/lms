"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Clock, Trophy, BookOpen, Play, Code, CheckCircle2, X, ChevronRight, BarChart2, Target, XCircle, ArrowLeft, ListChecks } from "lucide-react"
import { toast } from "react-toastify"
import { getGrade } from "@/utils/gradeUtils"
import { useRouter } from "next/navigation"
import { getCodingExerciseById } from "@/services/codingExerciseService"
import elabAttemptService from "@/services/elabAttemptService"

export default function ProgAssignmentLayout({ title = "Programming Assignment", contentReferenceId = null }) {
  const [isAttempting, setIsAttempting] = useState(false)
  const [exercise,     setExercise]     = useState(null)
  const [attempts,     setAttempts]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [loadingAttempt, setLoadingAttempt] = useState(false)
  const router = useRouter()
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null

  useEffect(() => {
    if (!contentReferenceId) { setLoading(false); return }
    const fetchData = async () => {
      try {
        const data = await getCodingExerciseById(contentReferenceId)
        setExercise(data)
        if (userId) {
          try {
            const att = await elabAttemptService.getElabAttempts(contentReferenceId)
            setAttempts(Array.isArray(att) ? att : (att?.content ? att.content : []))
          } catch {
            setAttempts([])
          }
        }
      } catch {
        toast.error("Failed to load exercise. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [contentReferenceId, userId])

  const handleAttemptNow = () => {
    if (!contentReferenceId) return
    setIsAttempting(true)
    setTimeout(() => {
      setIsAttempting(false)
      router.push(`/student/elab/${contentReferenceId}`)
    }, 300)
  }

  const handleAttemptClick = async (submissionId) => {
    if (!userId) return;
    setLoadingAttempt(true);
    try {
      const details = await elabAttemptService.getElabAttemptDetails(submissionId);
      setSelectedAttempt(details);
    } catch (err) {
      toast.error("Failed to load attempt details");
    } finally {
      setLoadingAttempt(false);
    }
  };

  const cardShadow = { boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" }

  const maxAttempts      = exercise?.maxAttempts ?? null
  const remainingAttempts = exercise?.remainingAttempts ?? (maxAttempts !== null ? Math.max(0, maxAttempts - attempts.length) : null)
  const exhausted        = remainingAttempts !== null && remainingAttempts <= 0
  const bestScore        = attempts.length > 0 ? Math.max(...attempts.map(a => a.score ?? 0)) : null
  const timeLimitMinutes = exercise?.timeLimitMinutes ?? null
  const totalTestCases   = Array.isArray(exercise?.testCases) ? exercise.testCases.length : null

  // Calculate inclusive test case metrics for review modal
  const publicTestsCount = exercise?.testCases?.filter(tc => !tc.isHidden)?.length || 0;
  const displayTotalTests = selectedAttempt ? ((selectedAttempt.totalTestCases ?? 0) + publicTestsCount) : 0;
  const displayPassedTests = selectedAttempt ? ((selectedAttempt.passedTestCases ?? 0) + publicTestsCount) : 0;
  const displayFailedTests = selectedAttempt ? (selectedAttempt.failedTestCases ?? 0) : 0;
  const displayAccuracy = displayTotalTests > 0 ? ((displayPassedTests / displayTotalTests) * 100).toFixed(1) : "0.0";

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={cardShadow}>
          <div className="p-5 space-y-3">
            <div className="sk h-5 w-48 rounded" />
            <div className="sk h-3.5 w-64 rounded" />
          </div>
          <div className="px-5 pb-5 grid md:grid-cols-3 gap-3">
            {[1,2,3].map(i => <div key={i} className="sk h-16 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── Assignment details ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={cardShadow}>

        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-[#1a2b4e] mb-0.5">{title}</h3>
            <p className="text-xs text-gray-400">Complete this assignment to proceed further</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-bold uppercase tracking-wide" style={{ color: "#ff5b00" }}>
              {exercise?.difficultyLevel || "EASY"}
            </div>
            <div className="text-[11px] text-gray-400 font-medium">Difficulty Level</div>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="p-5 grid md:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[#ff5b00]/[0.05] border border-[#ff5b00]/[0.08]">
            <div className="w-9 h-9 rounded-lg bg-[#ff5b00]/[0.10] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-[#ff5b00]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1a2b4e]">Attempts Left</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {maxAttempts !== null
                  ? `${remainingAttempts} of ${maxAttempts}`
                  : "Unlimited"}
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
                {timeLimitMinutes ? `${timeLimitMinutes} min` : "No limit"}
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
                {bestScore !== null ? `${bestScore} pts` : "Not attempted yet"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Instructions ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5" style={cardShadow}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-md bg-[#ff5b00]/[0.10] flex items-center justify-center">
            <Code className="w-3 h-3 text-[#ff5b00]" />
          </div>
          <h3 className="text-xs font-bold text-[#1a2b4e] uppercase tracking-wide">Instructions</h3>
        </div>
        <ul className="space-y-2 text-xs text-gray-500 leading-relaxed">
          {[
            "The test consists of Programming questions.",
            "Read the question and sample output before starting to code.",
            "Click Attempt Now to open the coding editor in a separate page.",
            "Use Run to check against visible test cases. Submit activates after all pass.",
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

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5" style={cardShadow}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#1a2b4e] mb-0.5">Ready to Start?</h3>
            <p className="text-xs text-gray-400">
              {exhausted
                ? "You have used all your attempts for this exercise."
                : "Click below to open the coding editor."}
            </p>
          </div>
          <button
            onClick={handleAttemptNow}
            disabled={isAttempting || !contentReferenceId || exhausted}
            className={`inline-flex items-center gap-2 text-white text-sm font-bold
                       px-7 py-3 rounded-xl shadow-sm transition-all duration-150
                       active:scale-95 disabled:cursor-not-allowed disabled:transform-none flex-shrink-0
                       ${exhausted ? "bg-gray-400" : "bg-[#ff5b00] hover:bg-[#e55200]"} disabled:opacity-50`}
          >
            {isAttempting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Opening…
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

      {/* ── Previous attempts ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={cardShadow}>
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
          <div className="w-5 h-5 rounded-md bg-[#ff5b00]/[0.10] flex items-center justify-center">
            <Trophy className="w-3 h-3 text-[#ff5b00]" />
          </div>
          <span className="text-xs font-bold text-[#1a2b4e] uppercase tracking-wide">Past Attempts</span>
          {attempts.length > 0 && (
            <span
              className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border"
              style={{ background: "rgba(255,91,0,0.08)", color: "#ff5b00", borderColor: "rgba(255,91,0,0.15)" }}
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
                  {["#", "Date & Time", "Score", "Percentage", "Grade", "Status", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attempts.map((att, i) => {
                  const pct = att.maxScore > 0 ? Math.round(((att.score ?? 0) / att.maxScore) * 100) : 0;
                  return (
                  <tr key={att.submissionId ?? att.attemptId ?? i} 
                      className="hover:bg-[#ff5b00]/[0.025] transition-colors duration-150 cursor-pointer group"
                      onClick={() => handleAttemptClick(att.submissionId ?? att.attemptId)}>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{att.attemptNumber ?? i + 1}</td>
                    <td className="px-5 py-3.5 text-xs text-[#0c63e4] font-medium">
                      {att.submittedAt || att.createdAt
                        ? new Date(att.submittedAt || att.createdAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-[#1a2b4e]">
                      {att.score ?? 0}/{att.maxScore ?? "--"}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-[#ff5b00]">{pct}%</td>
                    <td className={`px-5 py-3.5 text-xs font-bold ${getGrade(pct).color}`}>{getGrade(pct).label}</td>
                    <td className="px-5 py-3.5 text-xs">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        att.status?.toLowerCase() === 'pass' ? 'bg-green-50 text-green-600 border-green-100' : 
                        att.status?.toLowerCase() === 'fail' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>
                        {att.status?.toLowerCase() === 'pass' && <CheckCircle2 className="w-3 h-3" />}
                        {att.status?.toLowerCase() === 'fail' && <XCircle className="w-3 h-3" />}
                        {att.status ? (att.status.charAt(0).toUpperCase() + att.status.slice(1).toLowerCase()) : "Unknown"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#ff5b00] opacity-0 group-hover:opacity-100 transition-opacity">
                        Review <ChevronRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-xs font-semibold text-gray-400">No past attempts</p>
            <p className="text-[11px] text-gray-300 mt-0.5">Your attempt history will appear here</p>
          </div>
        )}
      </div>

      {/* ── Attempt Details Modal (Result.jsx Layout mapped to eLab) ── */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-[100] bg-gray-50 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {/* Header */}
            <div
              className="flex items-center justify-between text-white px-6 py-4 rounded-2xl mb-6 relative overflow-hidden shadow-sm"
              style={{ background: "linear-gradient(135deg, #1a2b4e 0%, #2d3a6b 100%)" }}
            >
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-0.5">Exercise Result</p>
                <h2 className="text-base font-bold">Review Summary</h2>
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-0.5">Attempt</p>
                  <p className="text-sm font-bold text-white/80">{selectedAttempt.attemptNumber}</p>
                </div>
                <button onClick={() => setSelectedAttempt(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

              <div className="grid grid-cols-12 gap-5">
                {/* ── Left Panel ─────────────────────────────────────────────────── */}
                <div className="col-span-12 lg:col-span-7 space-y-4">

                  {/* Submission confirmation */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5" style={cardShadow}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#1a2b4e]">Exercise Submitted</h3>
                        <p className="text-[11px] text-gray-400">Your coding assignment was recorded successfully.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        <p className="text-gray-400 font-medium mb-0.5">Submitted On</p>
                        <p className="font-bold text-[#1a2b4e]">{new Date(selectedAttempt.submittedAt || selectedAttempt.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        <p className="text-gray-400 font-medium mb-0.5">Language</p>
                        <p className="font-bold text-[#1a2b4e] uppercase">
                          {(() => {
                            const lId = selectedAttempt.language;
                            if (isNaN(lId) && lId?.length > 0) return lId;
                            const match = exercise?.languages?.find(l => String(l.languageId) === String(lId));
                            if (match) return match.languageName;
                            const judge0Map = { 50: "C", 54: "C++", 51: "C#", 60: "Go", 62: "Java", 63: "JavaScript", 71: "Python", 72: "Ruby", 73: "Rust", 74: "TypeScript", 82: "SQL" };
                            return judge0Map[lId] || (lId ? `Lang ID: ${lId}` : "Code");
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Score grid */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5" style={cardShadow}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-lg bg-[#ff5b00]/10 flex items-center justify-center">
                        <Trophy className="w-3.5 h-3.5 text-[#ff5b00]" />
                      </div>
                      <h3 className="text-xs font-bold text-[#1a2b4e] uppercase tracking-wide">Score Breakdown</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      {[
                        { label: "Marks Scored", value: `${selectedAttempt.score ?? 0} / ${selectedAttempt.maxScore ?? 0}`, color: "text-[#ff5b00]" },
                        { label: "Percentage", value: `${selectedAttempt.maxScore > 0 ? Math.round(((selectedAttempt.score ?? 0) / selectedAttempt.maxScore) * 100) : 0}%`, color: "text-[#0c63e4]" },
                        { label: "Grade", value: getGrade(selectedAttempt.maxScore > 0 ? ((selectedAttempt.score ?? 0) / selectedAttempt.maxScore) * 100 : 0)?.label || "-", color: getGrade(selectedAttempt.maxScore > 0 ? ((selectedAttempt.score ?? 0) / selectedAttempt.maxScore) * 100 : 0)?.color || "text-gray-500" },
                        { label: "Accuracy", value: `${displayAccuracy}%`, color: "text-green-600" }
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-gray-50 rounded-xl py-4 border border-gray-100">
                          <p className={`text-xl font-bold ${color}`}>{value}</p>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attempt stats */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5" style={cardShadow}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-lg bg-[#0c63e4]/10 flex items-center justify-center">
                        <BarChart2 className="w-3.5 h-3.5 text-[#0c63e4]" />
                      </div>
                      <h3 className="text-xs font-bold text-[#1a2b4e] uppercase tracking-wide">Attempt Details</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", label: "Tests Passed", value: displayPassedTests },
                        { icon: XCircle, color: "text-red-500", bg: "bg-red-50", label: "Tests Failed", value: displayFailedTests },
                        { icon: Target, color: "text-[#0c63e4]", bg: "bg-[#0c63e4]/10", label: "Total Tests", value: displayTotalTests },
                        { icon: Code, color: "text-amber-500", bg: "bg-amber-50", label: "Result Status", value: (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              selectedAttempt.status?.toLowerCase() === 'pass' ? 'bg-green-50 text-green-600 border border-green-100' : 
                              selectedAttempt.status?.toLowerCase() === 'fail' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}>
                              {selectedAttempt.status || "Completed"}
                            </span>
                          )
                        }
                      ].map(({ icon: Icon, color, bg, label, value }) => (
                        <div key={label} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                          <div className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-3.5 h-3.5 ${color}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-gray-400 font-medium truncate">{label}</p>
                            <p className="font-bold text-[#1a2b4e] truncate">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Public Test Cases Section */}
                  {Array.isArray(exercise?.testCases) && exercise.testCases.filter(tc => !tc.isHidden).length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5" style={cardShadow}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <ListChecks className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <h3 className="text-xs font-bold text-[#1a2b4e] uppercase tracking-wide">Public Test Cases</h3>
                      </div>
                      <div className="space-y-3">
                        {exercise.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                            <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 text-xs font-bold text-[#1a2b4e] flex items-center justify-between">
                              <span>Test Case {idx + 1}</span>
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-green-50 text-green-600 border border-green-100">
                                Passed
                              </span>
                            </div>
                            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <div className="font-semibold text-gray-400 mb-1">Input</div>
                                <pre className="bg-white p-2 rounded border border-gray-100 whitespace-pre-wrap text-gray-700 font-mono">
                                  {tc.input}
                                </pre>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-400 mb-1">Expected Output</div>
                                <pre className="bg-white p-2 rounded border border-gray-100 whitespace-pre-wrap text-gray-700 font-mono">
                                  {tc.expectedOutput}
                                </pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedAttempt(null)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#ff5b00] hover:bg-[#e55200] rounded-xl transition-colors shadow-sm"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                  </div>

                </div>

                {/* ── Right Panel ────────────────────────────────────────────────── */}
                <div className="col-span-12 lg:col-span-5">
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-full min-h-[400px]" style={cardShadow}>
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                      <h4 className="text-xs font-bold text-[#1a2b4e] uppercase tracking-wide">Submitted Source Code</h4>
                    </div>
                    <div className="flex-1 bg-white relative">
                      <pre className="absolute inset-0 p-5 overflow-auto text-xs text-gray-800 leading-relaxed font-mono">
                        {selectedAttempt.code || "No code submitted."}
                      </pre>
                    </div>
                  </div>
                </div>

              </div>
          </div>
        </div>
      )}

    </div>
  )
}
