"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import Editor from "@monaco-editor/react"
import { useParams, useRouter } from "next/navigation"
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, PlayCircle, Send, Info, Terminal, ListChecks, Timer, ChevronDown, ChevronUp, BookOpen } from "lucide-react"
import { getCodingExerciseById, runCodingExercise, submitCodingExercise } from "@/services/codingExerciseService"
import { toast } from "react-toastify"

export default function ElabAttemptPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [exercise, setExercise] = useState(null)
  const [editorCode, setEditorCode] = useState("")
  const [languageId, setLanguageId] = useState(null)
  const [runOutput, setRunOutput] = useState("")
  const [allTestsPassed, setAllTestsPassed] = useState(false)
  const [error, setError] = useState(null)
  const [runCustomEnabled, setRunCustomEnabled] = useState(false)
  const [customInput, setCustomInput] = useState("")
  const [customOutput, setCustomOutput] = useState("")
  const [supportedLangs, setSupportedLangs] = useState(["Python"]) // normalized list
  const [selectedLanguage, setSelectedLanguage] = useState("Python")
  const [outputTab, setOutputTab] = useState("tests") // 'tests' | 'console'
  const [consoleOutput, setConsoleOutput] = useState("")
  const [timeLeft, setTimeLeft] = useState(null)
  const [submissionResult, setSubmissionResult] = useState(null)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    if (exercise?.timeLimitMinutes) {
      setTimeLeft(exercise.timeLimitMinutes * 60)
    }
  }, [exercise])

  const hasAutoSubmitted = useRef(false)

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return
    const timerId = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timerId)
  }, [timeLeft])

  useEffect(() => {
    if (timeLeft === 0 && !hasAutoSubmitted.current) {
      handleTimeUp()
    }
  }, [timeLeft])

  const handleTimeUp = async () => {
    if (hasAutoSubmitted.current) return
    hasAutoSubmitted.current = true

    toast.error("Time is up! Auto-submitting...")
    if (exercise) {
      submitCodingExercise({
         sourceCode: editorCode,
         languageId: String(languageId || 71),
         codingExerciseId: exercise.codingExerciseId,
       })
      .then(res => setSubmissionResult(res))
      .catch(e => console.error("Auto-submit failed", e))
    }
  }

  const formatTime = (seconds) => {
    if (seconds === null) return "--:--"
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const languageIdByName = useMemo(() => ({
    "Python": 71,
    "C": 50,
    "C++": 54,
    "Java": 62,
    "JavaScript": 63,
  }), [])

  const monacoLanguageByName = useMemo(() => ({
    "Python": "python",
    "C": "c",
    "C++": "cpp",
    "Java": "java",
    "JavaScript": "javascript",
  }), [])

  const toCanonicalLanguageName = (name) => {
    if (!name) return "Python"
    const n = String(name).trim().toLowerCase()
    if (n === "py" || n === "python") return "Python"
    if (n === "java") return "Java"
    if (n === "c++" || n === "cpp") return "C++"
    if (n === "c") return "C"
    if (n === "javascript" || n === "js" || n === "node") return "JavaScript"
    return name
  }

  // Detect programming language from code content
  const detectLanguageFromCode = (code) => {
    if (!code || !code.trim()) return null
    
    const trimmed = code.trim()
    
    // Java detection
    if (/\b(public|private|protected)\s+(static\s+)?class\b/.test(trimmed) ||
        /\bpublic\s+static\s+void\s+main\s*\(/.test(trimmed) ||
        /\bSystem\.out\.println\b/.test(trimmed) ||
        /\bimport\s+java\./.test(trimmed)) {
      return "Java"
    }
    
    // C detection
    if (/#include\s*<stdio\.h>/.test(trimmed) ||
        /#include\s*<stdlib\.h>/.test(trimmed) ||
        /\bprintf\s*\(/.test(trimmed) ||
        /\bscanf\s*\(/.test(trimmed) ||
        /\bint\s+main\s*\(\s*\)/.test(trimmed)) {
      return "C"
    }
    
    // C++ detection
    if (/#include\s*<iostream>/.test(trimmed) ||
        /\bstd::cout\b/.test(trimmed) ||
        /\bstd::cin\b/.test(trimmed) ||
        /\busing\s+namespace\s+std\b/.test(trimmed)) {
      return "C++"
    }
    
    // Python detection
    if (/^\s*(def |class |import |from |print\(|if __name__)/.test(trimmed) ||
        (/^\s*(def |class )/.test(trimmed.split('\n')[0]) && !/\b(main|printf|cout)/.test(trimmed))) {
      return "Python"
    }
    
    // JavaScript detection
    if (/\bconsole\.log\b/.test(trimmed) ||
        /\bconst\s+\w+\s*=\s*require\b/.test(trimmed) ||
        /\bdocument\./.test(trimmed)) {
      return "JavaScript"
    }
    
    return null
  }

  useEffect(() => {
    if (!id) return
    let active = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getCodingExerciseById(id)
        if (!active) return
        setExercise(data)
        
        // Parse starter code - handle both old string format and new JSON format
        let starterCodes = { java: "", c: "", python: "" }
        if (data?.starterCode) {
          try {
            starterCodes = typeof data.starterCode === 'string' ? JSON.parse(data.starterCode) : data.starterCode
          } catch {
            // If parsing fails, treat as old format (single string for all languages)
            starterCodes = { java: data.starterCode, c: data.starterCode, python: data.starterCode }
          }
        }
        
        // Normalize supported languages from API (comma-separated string or single value)
        const raw = data?.supportedLanguages
        const listRaw = Array.isArray(raw)
          ? raw
          : typeof raw === "string" && raw.length > 0
          ? raw.split(",")
          : ["Python"]
        const list = listRaw.map((s) => toCanonicalLanguageName(s)).filter(Boolean)
        setSupportedLangs(list.length ? list : ["Python"])
        const initialLang = (list.length ? list[0] : "Python")
        setSelectedLanguage(initialLang)
        setLanguageId(languageIdByName[initialLang] || 71)
        
        // Set initial starter code based on selected language
        const langKey = initialLang.toLowerCase()
        setEditorCode(starterCodes[langKey] || "")
      } catch (e) {
        setError(e?.message || "Failed to load exercise")
      } finally {
        setLoading(false)
      }
    })()
    return () => { active = false }
  }, [id, languageIdByName])

  const handleRun = async () => {
    if (!exercise) return
    
    // Detect language from code and validate against selected compiler
    const detectedLang = detectLanguageFromCode(editorCode)
    if (detectedLang && detectedLang !== selectedLanguage) {
      const errorMsg = `Language mismatch detected! Your code appears to be ${detectedLang}, but you're using the ${selectedLanguage} compiler. Please switch to the ${detectedLang} compiler or update your code.`
      setError(errorMsg)
      setRunOutput(`Error: ${errorMsg}`)
      toast.error(errorMsg)
      return
    }
    
    setLoading(true)
    setError(null)
    setRunOutput("")
    setConsoleOutput("")
    setAllTestsPassed(false)
    try {
      const res = await runCodingExercise({
        sourceCode: editorCode,
<<<<<<< Updated upstream
        languageId: String(languageId || 71),
=======
        languageId: languageId ,
>>>>>>> Stashed changes
        codingExerciseId: exercise.codingExerciseId,
      })
      console.log(res)
      const results = Array.isArray(res) ? res : []
      const lines = []
      const consoleLines = []
      let allPassed = results.length > 0
      for (let i = 0; i < results.length; i++) {
        const r = results[i] || {}
        const status = r.statusDescription || (r.statusId === 3 ? "Accepted" : "Failed")
        const visibleTest = Array.isArray(exercise.testCases) ? exercise.testCases[i] : null
        const expected = visibleTest && visibleTest.isHidden === false ? visibleTest.expectedOutput : null
        const header = `Test ${i + 1}: ${status}`
        const stdout = r.stdout != null ? `stdout: ${r.stdout}` : null
        const stderr = r.stderr ? `stderr: ${r.stderr}` : null
        const compile = r.compileOutput ? `compile: ${r.compileOutput}` : null
        const exp = expected ? `expected: ${expected}` : null
        lines.push([header, stdout, stderr, compile, exp].filter(Boolean).join("\n"))
        // Build console (normal) output
        const hasStdout = r.stdout != null && r.stdout !== ""
        const hasStderr = r.stderr && r.stderr !== ""
        const hasCompile = r.compileOutput && r.compileOutput !== ""
        if (hasStdout || hasStderr || hasCompile) {
          const consoleHeader = results.length > 1 ? `Case ${i + 1}` : `Output`
          consoleLines.push([
            consoleHeader,
            hasStdout ? r.stdout : null,
            hasStderr ? `stderr: ${r.stderr}` : null,
            hasCompile ? `compile: ${r.compileOutput}` : null,
          ].filter(Boolean).join("\n"))
        }
        if (r.statusId !== 3) allPassed = false
      }
      const aggregated = lines.join("\n\n")
      const aggregatedConsole = consoleLines.length ? consoleLines.join("\n\n") : "No output"
      setRunOutput(aggregated)
      setConsoleOutput(aggregatedConsole)
      setAllTestsPassed(allPassed)
      if (runCustomEnabled) {
        // Backend run endpoint currently doesn't take stdin; mirror output to custom for UX.
        setCustomOutput(aggregatedConsole)
      }
    } catch (e) {
      setError(e?.message || "Failed to run code")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!exercise) return
    
    // Check if attempts are exhausted
    const remainingAttempts = exercise.remainingAttempts
    if (remainingAttempts !== null && remainingAttempts !== undefined && remainingAttempts <= 0) {
      toast.error("You have no attempts left for this exercise.")
      return
    }
    
    // Detect language from code and validate against selected compiler
    const detectedLang = detectLanguageFromCode(editorCode)
    if (detectedLang && detectedLang !== selectedLanguage) {
      const errorMsg = `Language mismatch detected! Your code appears to be ${detectedLang}, but you're using the ${selectedLanguage} compiler. Please switch to the ${detectedLang} compiler or update your code.`
      setError(errorMsg)
      setRunOutput(`Error: ${errorMsg}`)
      toast.error(errorMsg)
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const res = await submitCodingExercise({
        sourceCode: editorCode,
        languageId: String(languageId || 71),
        codingExerciseId: exercise.codingExerciseId,
      })
      setSubmissionResult(res)
      setRunOutput("Submission successful.")
    } catch (e) {
      const errorMsg = e?.response?.data || e?.message || "Submission failed"
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-3 md:p-4 max-w-6xl mx-auto space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className={`text-sm flex items-center gap-2 font-semibold px-3 py-1.5 rounded-full ${timeLeft !== null && timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
          <Timer className="w-4 h-4" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-5 items-start gap-3 md:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 md:col-span-2 md:max-h-[80vh] md:overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{exercise?.title || "Programming assignment"}</h2>
          {loading && <div className="text-sm text-gray-500">Loading...</div>}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
          {exercise && (
            <div className="space-y-4">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                <div className="text-xs font-medium text-amber-900 uppercase tracking-wide mb-1">Question</div>
                <div className="text-base font-semibold text-gray-900">{exercise.codingQuestion}</div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5">
          <Clock className="w-3.5 h-3.5" /> {exercise?.timeLimitMinutes ?? 0} min total
        </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5">
                  <span className="font-medium">Languages:</span> {supportedLangs.join(", ")}
                </span>
              </div>

              {exercise.description && (
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-1">Description</div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{exercise.description}</p>
                </div>
              )}

              {exercise.instructions && (
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
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{exercise.instructions}</p>
                    </div>
                  )}
                </div>
              )}

              {Array.isArray(exercise.testCases) && exercise.testCases.filter(tc => !tc.isHidden).length > 0 && (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-900">Sample Test Cases</div>
                  {exercise.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                    <div key={idx} className="rounded-md border border-slate-200 overflow-hidden">
                      <div className="px-3 py-2 bg-slate-50 text-slate-700 text-xs font-medium">Test Case {idx + 1}</div>
                      <div className="p-3 text-xs space-y-2">
                        <div className="font-medium text-gray-900">Input</div>
                        <pre className="bg-white border rounded p-2 whitespace-pre-wrap text-gray-700">{tc.input}</pre>
                        <div className="font-medium text-gray-900">Expected Output</div>
                        <pre className="bg-white border rounded p-2 whitespace-pre-wrap text-gray-700">{tc.expectedOutput}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 md:col-span-3 md:max-h-[80vh] md:overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <span>Language:</span>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={selectedLanguage}
                onChange={(e) => {
                  const lang = toCanonicalLanguageName(e.target.value)
                  setSelectedLanguage(lang)
                  setLanguageId(languageIdByName[lang] || 71)
                  
                  // Update starter code when language changes
                  if (exercise?.starterCode) {
                    try {
                      const starterCodes = typeof exercise.starterCode === 'string' ? JSON.parse(exercise.starterCode) : exercise.starterCode
                      const langKey = lang.toLowerCase()
                      setEditorCode(starterCodes[langKey] || "")
                    } catch {
                      // If parsing fails, use the old format
                      setEditorCode(exercise.starterCode || "")
                    }
                  }
                }}
              >
                {supportedLangs.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              {/* Attempts indicator */}
              {exercise && exercise.remainingAttempts !== null && exercise.remainingAttempts !== undefined && (
                <div className={`text-xs font-semibold px-2 py-1 rounded ${
                  exercise.remainingAttempts <= 0 
                    ? 'bg-red-50 text-red-600 border border-red-200' 
                    : exercise.remainingAttempts <= 1 
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : 'bg-green-50 text-green-600 border border-green-200'
                }`}>
                  {exercise.remainingAttempts} {exercise.remainingAttempts === 1 ? 'attempt' : 'attempts'} left
                </div>
              )}
              <button
                onClick={handleRun}
                disabled={loading || !exercise}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm disabled:opacity-50 bg-orange-500 hover:bg-orange-600 text-white transition-colors"
              >
                <PlayCircle className="w-4 h-4" /> Run
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !exercise || (exercise.remainingAttempts !== null && exercise.remainingAttempts !== undefined && exercise.remainingAttempts <= 0)}
                className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title={exercise && exercise.remainingAttempts !== null && exercise.remainingAttempts !== undefined && exercise.remainingAttempts <= 0 
                  ? "No attempts remaining" 
                  : "Submit against all test cases (visible + hidden)"}
              >
                <Send className="w-4 h-4" /> Submit
              </button>
            </div>
          </div>
          <div className="mx-2 mb-2 bg-amber-50 text-amber-900 border border-amber-200 rounded px-2 py-1 text-xs">
            Note: Test case input is provided via standard input (stdin). Do not print prompts like &quot;Enter a number:&quot;. Print only the required output exactly as specified.
          </div>
          <Editor
            height="520px"
            language={monacoLanguageByName[selectedLanguage] || "plaintext"}
            value={editorCode}
            onChange={(value) => setEditorCode(value || "")}
            theme="vs-dark"
            options={{ fontSize: 14, minimap: { enabled: false } }}
          />
          <div className="px-2 py-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                className="h-4 w-4 border-gray-300 rounded"
                checked={runCustomEnabled}
                onChange={(e) => setRunCustomEnabled(e.target.checked)}
              />
              <span>Run custom case</span>
              <Info className="w-4 h-4 text-gray-400" title="Provide custom stdin and view the output below." />
            </label>

            {runCustomEnabled && (
              <div className="mt-2 mb-3 space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Custom Input</label>
                  <textarea
                    rows={3}
                    className="w-full border rounded p-2 text-sm"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Type input passed to your program (stdin)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Custom Output</label>
                  <textarea
                    rows={3}
                    className="w-full border rounded p-2 text-sm"
                    value={customOutput}
                    onChange={(e) => setCustomOutput(e.target.value)}
                    placeholder="Displays output after running"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Terminal className="w-4 h-4" /> Output
              </div>
              {loading && (
                <div className="flex items-center gap-2 text-orange-600 text-xs">
                  <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin"></div>
                  Running...
                </div>
              )}
            </div>
            <div className="mb-2">
              <div className="inline-flex rounded-md border border-gray-200 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setOutputTab("tests")}
                  className={`${outputTab === 'tests' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} px-3 py-1 inline-flex items-center gap-1`}
                  title="Show test results"
                >
                  <ListChecks className="w-3.5 h-3.5" /> Tests
                </button>
                <button
                  type="button"
                  onClick={() => setOutputTab("console")}
                  className={`${outputTab === 'console' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} px-3 py-1 inline-flex items-center gap-1`}
                  title="Show normal program output"
                >
                  <Terminal className="w-3.5 h-3.5" /> Console
                </button>
              </div>
            </div>
            <pre className="bg-gray-50 border rounded p-3 text-sm font-semibold whitespace-pre-wrap min-h-[200px] max-h-[50vh] overflow-auto text-gray-800">{outputTab === 'tests' ? runOutput : consoleOutput}</pre>
            {allTestsPassed && (
              <div className="mt-2 inline-flex items-center gap-1 text-green-700 text-sm">
                <CheckCircle2 className="w-4 h-4" /> All test cases passed. You can submit now.
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Result Sheet Modal Overlay */}
      {submissionResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 opacity-100 flex flex-col max-h-[90vh]">
            <div className="p-6 text-center text-white relative flex-shrink-0 bg-[linear-gradient(135deg,#ff5b00_0%,#e55200_100%)]">
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full blur-2xl"></div>
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shadow-inner mb-3">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight mb-1">Results Submitted</h2>
                <p className="text-white/80 text-xs font-medium">Your coding assignment has been recorded.</p>
              </div>
            </div>
            
            <div className="p-6 flex flex-col flex-1 min-h-0 overflow-hidden">
              {(() => {
                // Use the actual test case counts from the submission result
                // submissionResult.totalTestCases includes ALL test cases (public + hidden) that were run
                const totalTests = submissionResult.totalTestCases ?? 0;
                const totalPassed = submissionResult.passedTestCases ?? 0;
                
                // Submission runs against hidden test cases only — totalTests/totalPassed are hidden counts
                const publicTestCount = Array.isArray(exercise?.testCases)
                  ? exercise.testCases.filter(tc => !tc.isHidden).length
                  : 0;
                const hiddenTotal = totalTests;
                            
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-6 flex-shrink-0">
                      <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 text-center flex flex-col items-center justify-center">
                        <div className="text-2xl font-black text-indigo-700">{submissionResult.score ?? 0}<span className="text-sm text-indigo-700/50">/{submissionResult.maxScore ?? 0}</span></div>
                        <div className="text-[10px] text-indigo-900/60 font-bold uppercase tracking-widest mt-1">Score</div>
                      </div>
                      <div className="bg-green-50/50 p-4 rounded-xl border border-green-100/50 text-center flex flex-col items-center justify-center">
                        <div className="text-2xl font-black text-emerald-600">{totalPassed}<span className="text-sm text-emerald-600/50">/{totalTests}</span></div>
                        <div className="text-[10px] text-emerald-900/60 font-bold uppercase tracking-widest mt-1">Tests Passed</div>
                      </div>
                    </div>
            
                    {/* Test Case Breakdown */}
                    {submissionResult.submissionDetails && submissionResult.submissionDetails.length > 0 && (
                      <div className="flex-1 overflow-y-auto min-h-0 border border-gray-100 rounded-xl mb-6">
                        <div className="sticky top-0 bg-gray-50 border-b border-gray-100 px-4 py-2 z-10">
                          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            Test Case Breakdown ({publicTestCount} public + {hiddenTotal} hidden)
                          </h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {/* Public test cases — not run during submission (grading uses hidden only) */}
                          {Array.isArray(exercise?.testCases) && exercise.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                            <div key={`public-${idx}`} className="flex items-center justify-between p-3 px-4 bg-gray-50/60 hover:bg-gray-100/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-800">Test Case {idx + 1}</div>
                                  <div className="text-[10px] font-medium text-gray-400">Sample • Not graded</div>
                                </div>
                              </div>
                            </div>
                          ))}
                                      
                          {/* Hidden test cases — results from submissionDetails (graded set only) */}
                          {submissionResult.submissionDetails
                            .map((tc, index) => {
                              const isPassed = tc.statusId === 3;
                              const globalIndex = publicTestCount + index + 1;
                              return (
                                <div key={`hidden-${index}`} className="flex items-center justify-between p-3 px-4 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isPassed ? 'bg-green-100' : 'bg-red-100'}`}>
                                      {isPassed ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-gray-800">Test Case {globalIndex}</div>
                                      <div className="text-[10px] font-medium text-gray-500">Hidden • {tc.statusDescription || (isPassed ? "Accepted" : "Failed")}</div>
                                    </div>
                                  </div>
                                  {!isPassed && tc.time && (
                                     <div className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{tc.time}s</div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
              
              <button
                onClick={() => router.back()}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold shadow hover:bg-gray-800 transition-all active:scale-[0.98] mt-auto"
              >
                Return to Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


