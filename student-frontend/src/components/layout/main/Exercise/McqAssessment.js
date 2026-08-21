"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  getExerciseQuestions, submitResponses,
  saveAnswer, getAttemptProgress, assignmentData
} from "@/services/courseService"
import {
  BookOpen, AlertCircle, X, ChevronLeft, ChevronRight,
  Flag, Send, CheckCircle2, Loader2, Timer, ChevronDown, ChevronUp
} from "lucide-react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { toast } from "react-toastify"

const cardShadow = { boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" }

/*
 * Backend QuestionStatusType enum (StudentTestDTO.QuestionStatusType):
 *   NOT_ATTEMPTED | ANSWERED | MARKED_FOR_REVIEW | ANSWERED_AND_MARKED
 *
 * Questions are fetched from GET /api/exercises/{exerciseId}/questions
 * which returns StudentTestDTO.StudentQuestion (correct answers stripped, STUDENT role allowed).
 *
 * Per-question save: POST /api/exercises/attempts/{attemptId}/answer
 * → returns AttemptProgressResponse (drives the navigator panel)
 *
 * Final submit: POST /api/exercises/attempts/{attemptId}/complete
 * → backend uses all progressively saved answers; any unsaved in request body are merged
 */

/* ─── Skeleton ───────────────────────────────────────────────────────────────── */
function McqSkeleton() {
  return (
    <div className="flex w-full h-screen bg-gray-50">
      <div className="flex-1 flex flex-col bg-white border-r border-gray-100">
        <div className="px-8 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="sk h-3 w-20 rounded" />
            <div className="sk h-5 w-36 rounded" />
          </div>
          <div className="sk h-2.5 w-48 rounded-full" />
        </div>
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="sk h-3 w-24 rounded mb-4" />
          <div className="bg-gray-50 rounded-xl p-5 mb-8 space-y-2">
            <div className="sk h-4 rounded w-full" />
            <div className="sk h-4 rounded w-5/6" />
            <div className="sk h-4 rounded w-3/4" />
          </div>
          <div className="space-y-3 mb-8">
            {[1, 2, 3, 4].map((i) => <div key={i} className="sk h-14 rounded-xl" />)}
          </div>
          <div className="flex items-center justify-between">
            <div className="sk h-9 w-36 rounded-xl" />
            <div className="flex gap-2">
              <div className="sk h-9 w-24 rounded-xl" />
              <div className="sk h-9 w-28 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
      <div className="w-72 flex flex-col bg-white border-l border-gray-100">
        <div className="p-5 border-b border-gray-100 space-y-3">
          <div className="flex justify-between items-center">
            <div className="sk h-4 w-36 rounded" />
            <div className="sk h-8 w-16 rounded-xl" />
          </div>
          <div className="sk h-20 rounded-xl" />
        </div>
        <div className="flex-1 p-5">
          <div className="sk h-3 w-32 rounded mb-4" />
          <div className="grid grid-cols-5 gap-1.5">
            {[...Array(15)].map((_, i) => <div key={i} className="sk w-9 h-9 rounded-lg" />)}
          </div>
        </div>
        <div className="p-5 border-t border-gray-100">
          <div className="sk h-11 w-full rounded-xl" />
          <div className="sk h-3 w-32 rounded mx-auto mt-2" />
        </div>
      </div>
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────────────────────── */
export default function McqAssessment() {
  const [currentIndex,     setCurrentIndex]    = useState(0)
  const [questions,        setQuestions]       = useState([])
  /* answers: questionId (string) → selectedOptionId (Long) | textResponse (string) */
  const [answers,          setAnswers]         = useState({})
  /*
   * markedLocally: Set<questionId> — local mark state, pre-populated from progress on mount.
   * Synced to backend on every toggleMark and navigateTo call.
   */
  const [markedLocally,    setMarkedLocally]   = useState(new Set())
  /*
   * questionStatuses: questionId (string) → QuestionStatusType string
   * Driven exclusively by AttemptProgressResponse from backend after each saveAnswer call.
   * This is the single source of truth for the navigator panel colours.
   */
  const [questionStatuses, setQuestionStatuses] = useState({})
  const [progressStats,    setProgressStats]   = useState(null)
  const [loading,          setLoading]         = useState(true)
  const [saving,           setSaving]          = useState(false)
  const [submitting,       setSubmitting]      = useState(false)
  const [showExitModal,    setShowExitModal]   = useState(false)
  const [showSubmitModal,  setShowSubmitModal] = useState(false)
  const [timeLeft,         setTimeLeft]        = useState(null)
  const [originalTimeLimit, setOriginalTimeLimit] = useState(null)  // Store original time limit in seconds
  const [isTimeExpired,    setIsTimeExpired]   = useState(false)  // Track if auto-submit due to time expiry
  const [exerciseTitle,    setExerciseTitle]   = useState("")
  const [instructions,     setInstructions]    = useState("")
  const [showInstructions, setShowInstructions] = useState(false)
  
  // Ref to hold the latest handleSubmit logic to avoid stale closures in setInterval
  const handleSubmitRef = useRef(null)

  /* Track when each question was first displayed, for responseTimeSeconds */
  const questionStartRef = useRef(Date.now())

  const { assignmentId } = useParams()
  const searchParams     = useSearchParams()
  const attemptId        = searchParams.get("attemptId")
  const courseId         = searchParams.get("courseId")
  const router           = useRouter()

  /* ── Apply backend progress snapshot ──
   * NOTE: The backend does NOT persist markedForReview (field removed from entity).
   * It will always return ANSWERED or NOT_ATTEMPTED — never MARKED_FOR_REVIEW or
   * ANSWERED_AND_MARKED. So we MUST overlay the local mark state on top of every
   * backend status update, otherwise the yellow/blue navigator colors disappear.
   */
  const applyProgress = useCallback((progressData) => {
    if (!progressData?.questionStatuses) return

    setQuestionStatuses((prevStatuses) => {
      const nextStatuses = { ...prevStatuses }
      progressData.questionStatuses.forEach((qs) => {
        // Preserve any optimistic mark state already in the map;
        // only overwrite if the backend says ANSWERED (i.e. trust answer presence)
        const existing = prevStatuses[String(qs.questionId)]
        const backendStatus = String(qs.status).toUpperCase()
        // If we already recorded MARKED_FOR_REVIEW / ANSWERED_AND_MARKED locally,
        // keep it — the backend can't know about marks.
        if (existing === "ANSWERED_AND_MARKED" || existing === "MARKED_FOR_REVIEW") {
          // If backend now says ANSWERED, upgrade to ANSWERED_AND_MARKED
          if (backendStatus === "ANSWERED") {
            nextStatuses[String(qs.questionId)] = "ANSWERED_AND_MARKED"
          }
          // else keep the existing local mark status
        } else {
          nextStatuses[String(qs.questionId)] = backendStatus
        }
      })
      return nextStatuses
    })

    setProgressStats(progressData)
  }, [])

  /* ── Boot: load questions + restore attempt progress in parallel ── */
  useEffect(() => {
    if (!assignmentId || !attemptId) { setLoading(false); return }

    const init = async () => {
      try {
        const [questionsRes, progressRes, assignRes] = await Promise.all([
          getExerciseQuestions(assignmentId),           // STUDENT-safe endpoint
          getAttemptProgress(attemptId).catch(() => null), // non-fatal; fresh attempt has no progress yet
          assignmentData(assignmentId).catch(() => null),
        ])

        const tl = assignRes?.timeLimitMinutes;
        if (tl && tl > 0) {
          setTimeLeft(tl * 60);
          setOriginalTimeLimit(tl * 60);  // Store in seconds
        }

        // Extract exercise title and instructions
        setExerciseTitle(assignRes?.title || "");
        setInstructions((assignRes?.instructions || "").trim());

        /*
         * getExerciseQuestions returns ApiResponse<List<StudentQuestion>>
         * Axios response shape: { data: { status, message, data: [...] } }
         */
        const qs = questionsRes.data?.data ?? []
        if (!Array.isArray(qs) || qs.length === 0) {
          throw new Error("No questions returned from the server.")
        }
        setQuestions(qs)

        if (progressRes?.data?.data) {
          applyProgress(progressRes.data.data)
          /*
           * NOTE: AttemptProgressResponse.QuestionStatus only carries questionId, questionOrder,
           * status — it does NOT carry selectedOptionId/textResponse.
           * For in-progress attempts the backend's getExerciseAttemptById also returns an empty
           * questionsResponse list (by design — scores aren't computed until /complete).
           * Therefore, radio selections are not pre-populated on page reload.
           * The navigator correctly reflects answered/marked state; students re-select on revisit.
           * All previously saved answers are preserved in the backend and used at /complete.
           */
        }
      } catch (err) {
        toast.error("Failed to load questions. Please try refreshing the page.")
      } finally {
        setLoading(false)
        questionStartRef.current = Date.now()
      }
    }

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, attemptId])

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return
    const timerId = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timerId)
  }, [timeLeft])

  useEffect(() => {
    if (timeLeft === 0 && !submitting) {
      setIsTimeExpired(true)  // Mark that time has expired
      toast.error("Time is up! Auto-submitting...")
      if (handleSubmitRef.current) {
        handleSubmitRef.current()
      }
    }
  }, [timeLeft, submitting])

  const formatTime = (seconds) => {
    if (seconds === null) return "--:--"
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  /* Reset per-question timer whenever current question changes */
  useEffect(() => {
    questionStartRef.current = Date.now()
  }, [currentIndex])

  /* ── Submit: saves current question first, then calls /complete ── */
  const handleSubmit = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)

    const currentQ = questions[currentIndex]
    if (!currentQ) { setSubmitting(false); return }

    // Persist the currently displayed question before submitting
    const qId     = currentQ.questionId
    const elapsed = Math.floor((Date.now() - questionStartRef.current) / 1000)
    if (attemptId) {
      const isText = currentQ.questionType === "ONE_WORD"
      const isMultipleCorrect = currentQ.questionType === "MULTIPLE_CORRECT"
      const answer = answers[String(qId)]
      const payload = {
        questionId: qId,
        responseTimeSeconds: elapsed ?? 0,
        ...(answer !== null && answer !== undefined && answer !== ''
          ? isText 
            ? { textResponse: String(answer) }
            : isMultipleCorrect && Array.isArray(answer)
              ? { selectedOptionIds: answer }
              : { selectedOptionId: Number(answer) }
          : {}
        ),
      }
      try {
        const res = await saveAnswer(attemptId, payload)
        if (res?.data?.data) applyProgress(res.data.data)
      } catch (err) {
        // Silently handle error - answer will be saved on next attempt
      }
    }

    /*
     * Build the final payload from local answers state.
     * The backend will merge these with all previously persisted answers —
     * so even questions answered in earlier sessions but absent here will be scored.
     * 
     * If time expired (isTimeExpired), use the original time limit as total time.
     * Otherwise, calculate actual elapsed time.
     */
    const totalTimeForThisSubmission = isTimeExpired && originalTimeLimit
      ? originalTimeLimit
      : Math.floor((Date.now() - questionStartRef.current) / 1000) + (originalTimeLimit ? (originalTimeLimit - timeLeft) : 0)
    
    const submitPayload = questions
      .filter((q) => {
        const a = answers[String(q.questionId)]
        if (a === null || a === undefined) return false
        if (Array.isArray(a)) return a.length > 0  // MULTIPLE_CORRECT
        return a !== ''  // Other types
      })
      .map((q) => {
        const a      = answers[String(q.questionId)]
        const isText = q.questionType === "ONE_WORD"
        const isMultipleCorrect = q.questionType === "MULTIPLE_CORRECT"
        // For time expiry, distribute time evenly or use 0 for previously saved answers
        const el     = isTimeExpired ? 0 : (q.questionId === qId ? totalTimeForThisSubmission : 0)
        return {
          questionId:          q.questionId,
          responseTimeSeconds: el,
          ...(isText 
            ? { textResponse: String(a) }
            : isMultipleCorrect && Array.isArray(a)
              ? { selectedOptionIds: a }
              : { selectedOptionId: Number(a) }
          ),
        }
      })

    try {
      await submitResponses(attemptId, submitPayload)
      toast.success("Assessment submitted successfully!")
      router.push(`/student/mycourses/courses/result/${attemptId}${courseId ? `?courseId=${courseId}` : ''}`)
    } catch (err) {
      toast.error("Failed to submit. Please try again.")
    } finally {
      setSubmitting(false)
      setShowSubmitModal(false)
      setIsTimeExpired(false)  // Reset the flag
    }
  }, [submitting, questions, currentIndex, answers, markedLocally, attemptId, router, applyProgress, isTimeExpired, originalTimeLimit, timeLeft])

  // bind ref so the timer interval can always call the latest version
  useEffect(() => {
    handleSubmitRef.current = handleSubmit
  }, [handleSubmit])

  if (loading) return <McqSkeleton />

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#ff5b00]/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-[#ff5b00]" />
          </div>
          <p className="text-sm font-semibold text-[#1a2b4e]">No questions found</p>
          <p className="text-xs text-gray-400 mt-1">This exercise has no questions configured.</p>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const totalQuestions  = questions.length

  /* Answered count: prefer backend truth, fall back to local answers map */
  const answeredCount = progressStats != null
    ? (progressStats.answeredCount ?? 0) + (progressStats.answeredAndMarkedCount ?? 0)
    : Object.values(answers).filter((a) => {
        if (Array.isArray(a)) return a.length > 0  // MULTIPLE_CORRECT
        return a !== null && a !== undefined && a !== ""
      }).length

  const markedCount = progressStats != null
    ? (progressStats.markedForReviewCount ?? 0) + (progressStats.answeredAndMarkedCount ?? 0)
    : 0

  // Progress should be based on answered questions, not current position
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  /* ── Navigator: backend status controls fill color; current index is outline-only highlight ── */
  const getNavStatus = (questionId, index) => {
    const raw = questionStatuses[String(questionId)]
    if (!raw) return "unanswered"
    const s = String(raw).toUpperCase()
    if (s === "ANSWERED_AND_MARKED") return "answered-marked"
    if (s === "ANSWERED")            return "answered"
    if (s === "MARKED_FOR_REVIEW")   return "marked"
    return "unanswered"
  }

  const getNavButtonClass = (status) => {
    switch (status) {
      case "answered":        return "bg-[#10B981] text-white border-[#10B981] shadow-sm"
      case "marked":          return "bg-[#F59E0B] text-white border-[#F59E0B] shadow-sm"
      case "answered-marked": return "bg-[#0c63e4] text-white border-[#0c63e4] shadow-sm"
      default:                return "bg-white text-gray-400 border-gray-200 hover:border-[#ff5b00]/40 hover:text-[#ff5b00]"
    }
  }

  /*
   * ── Optimistic navigator update ──
   * Apply status immediately before the API responds so the navigator reacts
   * the instant the user clicks. The backend response will confirm or correct it.
   */
  const applyOptimisticStatus = (questionId, answer, marked) => {
    // Handle different answer types
    let hasAns = false
    if (Array.isArray(answer)) {
      hasAns = answer.length > 0  // MULTIPLE_CORRECT: check if array has elements
    } else {
      hasAns = answer !== null && answer !== undefined && answer !== ""
    }
    
    const status =
      hasAns && marked ? "ANSWERED_AND_MARKED"
      : hasAns         ? "ANSWERED"
      : marked         ? "MARKED_FOR_REVIEW"
      :                  "NOT_ATTEMPTED"
    setQuestionStatuses((prev) => ({ ...prev, [String(questionId)]: status }))
  }

  const setAnswerAndStatus = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [String(questionId)]: value }))
    const isMarked = markedLocally.has(questionId) || markedLocally.has(Number(questionId))
    applyOptimisticStatus(questionId, value, isMarked)
  }

  /* ── Persist a single answer to backend ──
   * Includes markedForReview flag for accurate status tracking.
   */
  const persistAnswer = async ({ questionId, questionType, answer, elapsedSeconds, markedForReview }) => {
    if (!attemptId) return
    const isText = questionType === "ONE_WORD"
    const isMultipleCorrect = questionType === "MULTIPLE_CORRECT"
    const payload = {
      questionId,
      responseTimeSeconds: elapsedSeconds ?? 0,
      markedForReview: markedForReview ?? false,
      ...(answer !== null && answer !== undefined && answer !== ""
        ? isText
          ? { textResponse: String(answer) }
          : isMultipleCorrect && Array.isArray(answer)
            ? { selectedOptionIds: answer }
            : { selectedOptionId: Number(answer) }
        : {}
      ),
    }
    try {
      const res = await saveAnswer(attemptId, payload)
      // Merge backend progress with current local mark state
      if (res?.data?.data) applyProgress(res.data.data)
    } catch (err) {
      // Optimistic state remains — navigator still shows the right colour
    }
  }

  /* ── Navigate: optimistically update navigator, save, then move ── */
  const navigateTo = async (targetIndex) => {
    if (saving) return
    setSaving(true)

    const qId    = currentQuestion.questionId
    const answer = answers[String(qId)]
    const marked = markedLocally.has(qId)

    // Update navigator colour immediately — no waiting for API
    applyOptimisticStatus(qId, answer, marked)

    try {
      const elapsed = Math.floor((Date.now() - questionStartRef.current) / 1000)
      await persistAnswer({
        questionId:     qId,
        questionType:   currentQuestion.questionType,
        answer,
        elapsedSeconds: elapsed,
        markedForReview: marked,
      })
    } finally {
      setSaving(false)
      setCurrentIndex(targetIndex)
    }
  }

  const goNext = () => { if (currentIndex < totalQuestions - 1) navigateTo(currentIndex + 1) }
  const goPrev = () => { if (currentIndex > 0)                  navigateTo(currentIndex - 1) }

  /* ── Save current question and navigate to next (or stay if last) ── */
  const saveAndNext = async () => {
    if (saving) return
    setSaving(true)

    const qId    = currentQuestion.questionId
    const answer = answers[String(qId)]
    const marked = markedLocally.has(qId)

    // Update navigator colour immediately
    applyOptimisticStatus(qId, answer, marked)

    try {
      const elapsed = Math.floor((Date.now() - questionStartRef.current) / 1000)
      await persistAnswer({
        questionId:     qId,
        questionType:   currentQuestion.questionType,
        answer,
        elapsedSeconds: elapsed,
        markedForReview: marked,
      })
      // Only navigate if not on the last question
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    } finally {
      setSaving(false)
    }
  }

  /* ── Toggle mark-for-review and navigate to next question ── */
  const toggleMark = async () => {
    if (saving) return
    const qId      = currentQuestion.questionId
    const newState = !markedLocally.has(qId)
    const answer   = answers[String(qId)]

    setMarkedLocally((prev) => {
      const s = new Set(prev)
      newState ? s.add(qId) : s.delete(qId)
      return s
    })

    // Optimistically reflect the new mark state in the navigator right away
    applyOptimisticStatus(qId, answer, newState)

    setSaving(true)
    try {
      const elapsed = Math.floor((Date.now() - questionStartRef.current) / 1000)
      await persistAnswer({
        questionId:     qId,
        questionType:   currentQuestion.questionType,
        answer,
        elapsedSeconds: elapsed,
        markedForReview: newState,
      })
      
      // Navigate to next question after marking
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    } finally {
      setSaving(false)
    }
  }

  /* ── Answer input rendering ── */
  const renderAnswerInput = (question) => {
    const { questionType, options, questionId } = question
    const currentAnswer = answers[String(questionId)] ?? null

    if (questionType === "ONE_WORD") {
      return (
        <div className="mb-8">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Your Answer</p>
          <input
            type="text"
            value={answers[String(questionId)] || ""}
            onChange={(e) => setAnswerAndStatus(questionId, e.target.value)}
            placeholder="Type your answer here…"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1a2b4e]
                       placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20
                       focus:border-[#ff5b00] transition-colors"
          />
        </div>
      )
    }

    // MULTIPLE_CORRECT: Allow multiple selections
    if (questionType === "MULTIPLE_CORRECT") {
      // Store as array of optionIds
      const selectedOptions = Array.isArray(currentAnswer) ? currentAnswer : []

      const toggleOption = (optionId) => {
        const newSelection = selectedOptions.includes(optionId)
          ? selectedOptions.filter(id => id !== optionId)  // Deselect
          : [...selectedOptions, optionId]                  // Select
        setAnswers((prev) => ({ ...prev, [String(questionId)]: newSelection }))
        
        // Update status optimistically
        const isMarked = markedLocally.has(questionId) || markedLocally.has(Number(questionId))
        const hasAns = newSelection.length > 0
        const status = hasAns && isMarked ? "ANSWERED_AND_MARKED"
          : hasAns ? "ANSWERED"
          : isMarked ? "MARKED_FOR_REVIEW"
          : "NOT_ATTEMPTED"
        setQuestionStatuses((prev) => ({ ...prev, [String(questionId)]: status }))
      }

      return (
        <div className="mb-8">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            Select All Correct Answers
            <span className="ml-2 text-[10px] font-normal text-blue-600">(Multiple choices allowed)</span>
          </p>
          <div className="space-y-2.5">
            {options.map((opt, index) => {
              const isSelected = selectedOptions.includes(opt.optionId)
              return (
                <label
                  key={opt.optionId}
                  htmlFor={`opt-${opt.optionId}`}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer
                              transition-all duration-150 select-none ${
                    isSelected
                      ? "border-[#0c63e4] bg-[#0c63e4]/[0.07] shadow-sm ring-1 ring-[#0c63e4]/20"
                      : "border-gray-200 bg-white hover:border-[#0c63e4]/40 hover:bg-[#0c63e4]/[0.03]"
                  }`}
                  onClick={() => toggleOption(opt.optionId)}
                >
                  {/* Letter badge */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center
                                   text-xs font-bold flex-shrink-0 transition-colors ${
                    isSelected ? "bg-[#0c63e4] text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>

                  <span className={`flex-1 text-sm leading-relaxed ${
                    isSelected ? "text-[#1a2b4e] font-semibold" : "text-gray-700"
                  }`}>
                    {opt.optionText}
                  </span>

                  {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0c63e4] flex-shrink-0" />}
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    // MCQ / TRUE_FALSE: Single selection
    return (
      <div className="mb-8">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Select an Answer</p>
        <RadioGroup
          value={currentAnswer !== null ? String(currentAnswer) : ""}
          onValueChange={(val) => setAnswerAndStatus(questionId, Number(val))}
          className="space-y-2.5"
        >
          {options.map((opt, index) => {
            const isSelected = currentAnswer === opt.optionId
            return (
              <label
                key={opt.optionId}
                htmlFor={`opt-${opt.optionId}`}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer
                            transition-all duration-150 select-none ${
                  isSelected
                    ? "border-[#0c63e4] bg-[#0c63e4]/[0.07] shadow-sm ring-1 ring-[#0c63e4]/20"
                    : "border-gray-200 bg-white hover:border-[#0c63e4]/40 hover:bg-[#0c63e4]/[0.03]"
                }`}
                onClick={() => setAnswerAndStatus(questionId, opt.optionId)}
              >
                {/* Letter / T-F badge */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center
                                 text-xs font-bold flex-shrink-0 transition-colors ${
                  isSelected ? "bg-[#0c63e4] text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {questionType === "TRUE_FALSE"
                    ? opt.optionText?.[0]?.toUpperCase()
                    : String.fromCharCode(65 + index)}
                </div>

                <RadioGroupItem value={String(opt.optionId)} id={`opt-${opt.optionId}`} className="sr-only" />

                <span className={`flex-1 text-sm leading-relaxed ${
                  isSelected ? "text-[#1a2b4e] font-semibold" : "text-gray-700"
                }`}>
                  {opt.optionText}
                </span>

                {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0c63e4] flex-shrink-0" />}
              </label>
            )
          })}
        </RadioGroup>
      </div>
    )
  }

  const isMarked  = markedLocally.has(currentQuestion.questionId)
  const isLastQ   = currentIndex === totalQuestions - 1
  const isFirstQ  = currentIndex === 0

  const getDifficultyStyle = (level) => {
    switch (level) {
      case "EASY":   return "bg-green-50 text-green-600 border-green-200"
      case "MEDIUM": return "bg-amber-50 text-amber-600 border-amber-200"
      case "HARD":   return "bg-red-50 text-red-500 border-red-200"
      default:       return "bg-gray-50 text-gray-500 border-gray-200"
    }
  }

  return (
    <div className="flex w-full h-screen bg-gray-50 overflow-hidden">

      {/* ── Exit Modal ── */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4" style={cardShadow}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#1a2b4e]">Exit Assessment?</h3>
              <button
                onClick={() => setShowExitModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Your progress is saved. You can resume this attempt later from the course page.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Stay
              </button>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Submit Confirm Modal ── */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4" style={cardShadow}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#ff5b00]/10 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-[#ff5b00]" />
                </div>
                <h3 className="text-sm font-bold text-[#1a2b4e]">Submit Assessment?</h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2.5 border border-gray-100">
              {[
                { label: "Answered",          value: progressStats?.answeredCount         ?? 0, color: "text-green-600" },
                { label: "Answered + Marked",  value: progressStats?.answeredAndMarkedCount ?? 0, color: "text-[#0c63e4]" },
                { label: "Marked only",        value: progressStats?.markedForReviewCount  ?? 0, color: "text-amber-600" },
                { label: "Not attempted",      value: progressStats?.notAttemptedCount     ?? 0, color: "text-red-500"   },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{label}</span>
                  <span className={`font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
            {(progressStats?.notAttemptedCount ?? 0) > 0 && (
              <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
                {progressStats.notAttemptedCount} question{progressStats.notAttemptedCount > 1 ? "s" : ""} not yet attempted.
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Review More
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#ff5b00] hover:bg-[#e55200] rounded-xl transition-colors disabled:opacity-50"
              >
                {submitting
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Send className="w-3.5 h-3.5" />
                }
                {submitting ? "Submitting…" : "Submit Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          Left Panel — Question Area
      ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col bg-white border-r border-gray-100 overflow-hidden">

        {/* Header bar */}
        <div className="flex-shrink-0 px-8 py-4 border-b border-gray-100 flex items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold text-[#ff5b00] uppercase tracking-widest mb-0.5">Exercise</p>
            <p className="text-sm font-bold text-[#1a2b4e]">
              Question {currentIndex + 1}
              <span className="font-normal text-gray-400"> / {totalQuestions}</span>
            </p>
          </div>

          {/* Progress bar */}
          <div className="flex-1 max-w-xs">
            <div className="flex justify-between text-[10px] font-semibold text-gray-400 mb-1.5">
              <span>Progress</span>
              <span style={{ color: "#ff5b00" }}>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: "#ff5b00" }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {currentQuestion.difficultyLevel && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getDifficultyStyle(currentQuestion.difficultyLevel)}`}>
                {currentQuestion.difficultyLevel}
              </span>
            )}
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
              {currentQuestion.questionType === "ONE_WORD"   ? "Fill in Blank"
                : currentQuestion.questionType === "TRUE_FALSE" ? "True / False"
                : "Multiple Choice"}
            </span>
          </div>
        </div>

        {/* Question body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">

          {/* ── Instructions ── */}
          {instructions && (
            <div className="mb-6">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Instructions</span>
                </div>
                {showInstructions ? (
                  <ChevronUp className="w-4 h-4 text-blue-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-blue-600" />
                )}
              </button>
              {showInstructions && (
                <div className="mt-2 bg-white border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{instructions}</p>
                </div>
              )}
            </div>
          )}

          {/* Question text card */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1a2b4e] text-white text-[11px] font-bold flex items-center justify-center mt-0.5">
                {currentIndex + 1}
              </span>
              <p className="text-sm leading-relaxed text-[#1a2b4e] font-medium flex-1">
                {currentQuestion.questionText}
              </p>
            </div>
            {currentQuestion.points && (
              <p className="text-[10px] text-gray-400 font-semibold mt-3 ml-10">
                {currentQuestion.points} {currentQuestion.points === 1 ? "point" : "points"}
              </p>
            )}
          </div>

          {renderAnswerInput(currentQuestion)}

          {/* Action row */}
          <div className="sticky bottom-0 z-10 -mx-8 px-8 py-3 bg-white/95 backdrop-blur-sm border-t border-gray-100 flex items-center justify-between">

            {/* Mark for review & next */}
            <button
              onClick={toggleMark}
              disabled={saving}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl
                          border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                isMarked
                  ? "bg-amber-50 border-amber-300 text-amber-600 hover:bg-amber-100"
                  : "bg-white border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600"
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              {isLastQ
                ? (isMarked ? "Unmark" : "Mark for Review")
                : (isMarked ? "Unmark & Next" : "Mark & Next")
              }
            </button>

            {/* Prev / Save & Next */}
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={isFirstQ || saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-600
                           bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>

              {isLastQ ? (
                <button
                  onClick={saveAndNext}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white
                             bg-[#ff5b00] hover:bg-[#e55200] rounded-xl transition-colors shadow-sm
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      Save
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white
                             bg-[#ff5b00] hover:bg-[#e55200] rounded-xl transition-colors shadow-sm
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      Save & Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          Right Panel — Navigator
      ════════════════════════════════════════ */}
      <div className="w-80 flex flex-col bg-white border-l border-gray-100 flex-shrink-0">

        {/* Panel header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#1a2b4e]">Assessment Control</span>
            {timeLeft !== null && (
              <span className={`text-xs font-bold flex items-center gap-1.5 mt-1 ${timeLeft < 60 ? 'text-red-500' : 'text-gray-500'}`}>
                <Timer className="w-3.5 h-3.5" />
                {formatTime(timeLeft)}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowExitModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                       text-red-500 bg-red-50 border border-red-100 rounded-xl
                       hover:bg-red-100 transition-colors"
          >
            <X className="w-3 h-3" />
            Exit
          </button>
        </div>

        {/* Stats panel — driven by backend AttemptProgressResponse */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100">
          <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 space-y-2.5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-[#ff5b00]/10 flex items-center justify-center">
                <BookOpen className="w-3 h-3 text-[#ff5b00]" />
              </div>
              <span className="text-xs font-semibold text-[#1a2b4e]">{totalQuestions} Questions</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="text-center bg-white rounded-lg py-2 border border-gray-100">
                <p className="text-base font-bold text-green-600">{answeredCount}</p>
                <p className="text-[10px] text-gray-400 font-medium">Answered</p>
              </div>
            </div>
            {markedCount > 0 && (
              <div className="text-center bg-amber-50 rounded-lg py-2 border border-amber-100">
                <p className="text-sm font-bold text-amber-600">{markedCount}</p>
                <p className="text-[10px] text-amber-500 font-medium">Marked for Review</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigator grid */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Navigator</p>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-4">
            {[
              { type: "current",          label: "Current"      },
              { color: "bg-[#10B981]",    label: "Answered"     },
              { color: "bg-[#F59E0B]",    label: "Marked"       },
              { color: "bg-[#0c63e4]",    label: "Ans + Marked" },
            ].map(({ color, type, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                {type === "current" ? (
                  <div className="w-3 h-3 rounded flex-shrink-0 border-2 border-[#ff5b00] bg-white" />
                ) : (
                  <div className={`w-3 h-3 rounded flex-shrink-0 ${color}`} />
                )}
                <span className="text-[10px] text-gray-400 font-medium">{label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, index) => {
              const status = getNavStatus(q.questionId, index)
              const isCurrent = index === currentIndex
              return (
                <button
                  key={q.questionId}
                  onClick={() => navigateTo(index)}
                  disabled={saving && index !== currentIndex}
                  className={`w-9 h-9 rounded-lg border text-xs font-bold transition-all duration-150 disabled:cursor-not-allowed ${getNavButtonClass(status)} ${
                    isCurrent ? "!border-[#ff5b00] ring-2 ring-[#ff5b00]/70 scale-105" : ""
                  }`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
        </div>

        {/* Submit footer */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100">
          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={saving || submitting}
            className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-bold
                       text-white bg-[#ff5b00] hover:bg-[#e55200] rounded-xl transition-colors
                       shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Submit Assessment
          </button>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            {answeredCount} of {totalQuestions} answered
          </p>
        </div>
      </div>
    </div>
  )
}
