"use client"

import { useEffect, useMemo, useState } from "react"
import { courseData, curriculumData, contentItems } from "@/services/courseService"
import {
  ChevronLeft, CheckCircle2, BookOpenCheck, Circle,
  Code, Play, FileText, Video, ChevronDown
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"

/* ─── Design tokens ─────────────────────────────────────────────────────────── */
const PRIMARY = "#ff5b00"
const NAVY    = "#1a2b4e"

/* ─── Content-type config (matches admin SectionItem / MaterialItem exactly) ── */
const TYPE_CFG = {
  video:    { Icon: Video,         iconBg: "bg-[#0c63e4]/10", iconText: "text-[#0c63e4]", chip: "bg-[#0c63e4]/10 text-[#0c63e4] border-[#0c63e4]/20" },
  ebook:    { Icon: FileText,      iconBg: "bg-[#f2277e]/10", iconText: "text-[#f2277e]", chip: "bg-[#f2277e]/10 text-[#f2277e] border-[#f2277e]/20" },
  exercise: { Icon: BookOpenCheck, iconBg: "bg-[#ff5b00]/10", iconText: "text-[#ff5b00]", chip: "bg-[#ff5b00]/10 text-[#ff5b00] border-[#ff5b00]/20" },
  elab:     { Icon: Code,          iconBg: "bg-[#1a2b4e]/10", iconText: "text-[#1a2b4e]", chip: "bg-[#1a2b4e]/10 text-[#1a2b4e] border-[#1a2b4e]/20" },
}

function TypeIcon({ type, active }) {
  const cfg = TYPE_CFG[type?.toLowerCase()] || TYPE_CFG.video
  const { Icon, iconBg, iconText } = cfg
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity ${iconBg} ${active ? "opacity-100" : "opacity-70 group-hover/item:opacity-100"}`}>
      <Icon className={`w-3.5 h-3.5 ${iconText}`} />
    </div>
  )
}

function TypeChip({ type }) {
  const cfg = TYPE_CFG[type?.toLowerCase()] || TYPE_CFG.video
  return (
    <span
      className={`inline-flex items-center mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wide ${cfg.chip}`}
    >
      {type}
    </span>
  )
}

/* ─── Skeleton ──────────────────────────────────────────────────────────────── */
function CourseSidebarSkeleton() {
  return (
    <aside className="w-80 bg-white border-r border-gray-100 h-screen flex flex-col shadow-sm flex-shrink-0">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 space-y-4">
        <div className="sk h-3.5 w-28 rounded" />
        <div className="space-y-1.5">
          <div className="sk h-5 rounded" style={{ width: "72%" }} />
          <div className="sk h-3.5 rounded" style={{ width: "48%" }} />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <div className="sk h-3 w-24 rounded" />
            <div className="sk h-3 w-8 rounded" />
          </div>
          <div className="sk h-1.5 w-full rounded-full" />
        </div>
        <div className="sk h-10 w-full rounded-xl" />
      </div>

      {/* Section label */}
      <div className="px-5 pt-4 pb-2">
        <div className="sk h-3 w-28 rounded" />
      </div>

      {/* Section rows */}
      <div className="flex-1 px-4 space-y-2 overflow-hidden">
        {[80, 65, 75, 55].map((w, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-3.5 bg-gray-50/80 flex items-center gap-3">
              <div className="sk w-7 h-7 rounded-lg flex-shrink-0" />
              <div className="sk h-4 rounded flex-1" style={{ width: `${w}%` }} />
              <div className="sk h-5 w-10 rounded-full flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

/* ─── Main sidebar ──────────────────────────────────────────────────────────── */
export default function CourseSidebar({ onContentSelect, refreshTrigger }) {
  const { courseId } = useParams()
  const router = useRouter()

  const [course,           setCourse]           = useState(null)
  const [courseError,      setCourseError]      = useState(false)
  const [loading,          setLoading]          = useState(true)
  const [retryCount,       setRetryCount]       = useState(0)
  const [selectedSubject,  setSelectedSubject]  = useState(null)
  const [expandedSections, setExpandedSections] = useState([])
  const [selectedItem,     setSelectedItem]     = useState(null)
  const [curriculum,         setCurriculum]         = useState(null)
  const [curriculumLoading,  setCurriculumLoading]  = useState(false)
  const [sectionContents,    setSectionContents]    = useState({})

  /* helpers */
  const fetchSectionContent = async (sectionId) => {
    try {
      const res  = await contentItems(sectionId)
      const items = res?.data || []
      setSectionContents((prev) => ({ ...prev, [sectionId]: items }))
    } catch (err) {
      console.error("Failed to load section contents:", err)
    }
  }

  useEffect(() => {
    if (!courseId) return
    setCourseError(false)
    setLoading(true)
    ;(async () => {
      try {
        const res  = await courseData(courseId)
        const data = res?.data
        setCourse(data)
        const defaultCur   = data?.defaultCurriculumId
        const defaultTitle = data?.availableCurriculums?.find(
          (c) => c.curriculumId === defaultCur
        )?.title
        setSelectedSubject(defaultTitle || data?.availableCurriculums?.[0]?.title || "")
      } catch (err) {
        console.error("Failed to load course:", err)
        setCourseError(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [courseId, retryCount])

  const selectedCurriculumId = useMemo(() => {
    if (!course || !selectedSubject) return null;
    const sel = course.availableCurriculums.find((c) => c.title === selectedSubject);
    return sel ? sel.curriculumId : null;
  }, [course, selectedSubject]);

  useEffect(() => {
    if (!selectedCurriculumId) return
    setCurriculumLoading(true)
    ;(async () => {
      try {
        const res = await curriculumData(courseId, selectedCurriculumId)
        setCurriculum(res.data)
      } catch (err) {
        console.error("Failed to load curriculum:", err)
      } finally {
        setCurriculumLoading(false)
      }
    })()
  }, [selectedCurriculumId, courseId])

  useEffect(() => {
    if (!curriculum) return
    const first = curriculum?.sections?.[0]

    // Reset content and open the first section immediately (sync) so there is
    // no visible open→close→open flicker. The items panel shows its inline
    // skeleton until the async fetch completes.
    setSectionContents({})
    setExpandedSections(first?.sectionId ? [0] : [])

    if (!first?.sectionId) return

    let cancelled = false
    ;(async () => {
      try {
        const res   = await contentItems(first.sectionId)
        if (cancelled) return
        const items = res?.data || []
        setSectionContents({ [first.sectionId]: items })
      } catch (err) {
        if (!cancelled) console.error("Failed to load first section:", err)
      }
    })()

    return () => { cancelled = true }
  }, [curriculum])

  // Re-fetch expanded section contents + silently refresh course data for server-side progress
  useEffect(() => {
    if (!refreshTrigger || !curriculum?.sections) return

    // Re-fetch expanded sections (updates tick marks)
    expandedSections.forEach((idx) => {
      const section = curriculum.sections[idx]
      if (section?.sectionId) fetchSectionContent(section.sectionId)
    })

    // Silent background course re-fetch — keeps server progress in sync
    if (courseId) {
      courseData(courseId)
        .then((res) => { if (res?.data) setCourse(res.data) })
        .catch(() => {}) // non-critical — local progress already reflects the change
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  const toggleSection = async (index, sectionId) => {
    if (expandedSections.includes(index)) {
      setExpandedSections(expandedSections.filter((i) => i !== index))
    } else {
      setExpandedSections([...expandedSections, index])
      if (!sectionContents[sectionId]) fetchSectionContent(sectionId)
    }
  }

  const handleItemClick = (item, sectionIdx, itemIdx) => {
    const id = `${sectionIdx}-${itemIdx}`
    setSelectedItem(id)
    onContentSelect?.(
      item.contentType?.toUpperCase() || "VIDEO",
      item.title,
      item.contentReferenceId || item.id || item.itemId,
      item.contentItemId || item.itemId || item.id,
      course?.batch?.batchId
    )
  }

  // Compute progress from loaded section items for instant post-completion updates.
  // Falls back to server-side curriculum aggregates for sections not yet expanded.
  const progress = useMemo(() => {
    const sections = curriculum?.sections || []
    if (sections.length > 0) {
      let total = 0, completed = 0
      sections.forEach((sec) => {
        const loaded = sectionContents[sec.sectionId]
        if (loaded?.length > 0) {
          total     += loaded.length
          completed += loaded.filter((i) => i.completed).length
        } else {
          total     += sec.totalItems     || 0
          completed += sec.completedItems ?? 0
        }
      })
      if (total > 0) return Math.round((completed / total) * 100)
    }
    // Multi-curriculum fallback: average progressPercentage across all curricula
    if (!course?.availableCurriculums?.length) return 0
    const sum = course.availableCurriculums.reduce((acc, c) => acc + (c.progressPercentage || 0), 0)
    return Math.round(sum / course.availableCurriculums.length)
  }, [curriculum, sectionContents, course])

  if (loading) return <CourseSidebarSkeleton />

  if (courseError) {
    return (
      <aside className="w-80 bg-white border-r border-gray-100 h-screen flex flex-col shadow-sm flex-shrink-0">
        <div className="p-5 border-b border-gray-100">
          <button
            onClick={() => router.push("/student/mycourses")}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#ff5b00] transition-colors duration-150 mb-4 group"
          >
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-150" />
            Back to My Courses
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-red-400 rotate-90" />
          </div>
          <p className="text-xs font-semibold text-gray-600">Failed to load course</p>
          <p className="text-[11px] text-gray-400">Check your connection and try again.</p>
          <button
            onClick={() => setRetryCount((n) => n + 1)}
            className="mt-1 px-4 py-2 text-xs font-bold text-white rounded-xl transition-colors"
            style={{ background: "#ff5b00" }}
          >
            Retry
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-80 bg-white border-r border-gray-100 h-screen flex flex-col shadow-sm flex-shrink-0">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="p-5 border-b border-gray-100">

        {/* Back */}
        <button
          onClick={() => router.push("/student/mycourses")}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#ff5b00] transition-colors duration-150 mb-4 group"
        >
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-150" />
          Back to My Courses
        </button>

        {/* Course title */}
        <h2 className="text-sm font-bold text-[#1a2b4e] leading-snug mb-0.5 line-clamp-2">
          {course?.courseTitle}
        </h2>
        {course?.batch?.batchName && (
          <p className="text-[11px] text-gray-400 font-medium mb-4">
            {course.batch.batchName}
          </p>
        )}

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Progress</span>
            <span
              className="text-[11px] font-bold"
              style={{ color: PRIMARY }}
            >
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${PRIMARY}, #0c63e4)`,
              }}
            />
          </div>
        </div>

        {/* Subject dropdown */}
        {course?.availableCurriculums?.length > 1 && (
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Subject
            </label>
            <div className="relative">
              <select
                className="w-full pl-3.5 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
                           text-[#1a2b4e] font-medium focus:outline-none focus:ring-2
                           focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors
                           appearance-none cursor-pointer"
                value={selectedSubject || ""}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                {course.availableCurriculums.map((cur) => (
                  <option key={cur.curriculumId} value={cur.title}>
                    {cur.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* ── Course contents ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-4 pt-4 pb-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-0.5">
            Course Contents
          </p>

          <div className="space-y-2">
            {curriculumLoading && (
              [80, 65, 75, 55].map((w, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-3.5 bg-gray-50/80 flex items-center gap-3">
                    <div className="sk w-7 h-7 rounded-full flex-shrink-0" />
                    <div className="sk h-4 rounded flex-1" style={{ width: `${w}%` }} />
                    <div className="sk h-5 w-10 rounded-full flex-shrink-0" />
                  </div>
                </div>
              ))
            )}
            {!curriculumLoading && curriculum?.sections?.map((section, idx) => {
              const isExpanded     = expandedSections.includes(idx)
              const items          = sectionContents[section.sectionId] || section.contentItems || []
              const completedCount = items.length > 0
                ? items.filter((item) => item.completed).length
                : (section.completedItems ?? 0)

              return (
                <div
                  key={section.sectionId}
                  className={`rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-sm ${
                    isExpanded ? "border-[#ff5b00]/25 shadow-sm" : "border-gray-100"
                  }`}
                >
                  {/* Section header — same bg for both states; card border signals active */}
                  <button
                    onClick={() => toggleSection(idx, section.sectionId)}
                    className="w-full p-3.5 bg-gray-50/80 hover:bg-[#ff5b00]/[0.025] transition-colors duration-150 flex items-center gap-3 text-left"
                  >
                    {/* Number badge — matches admin SectionItem exactly */}
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-100">
                      <span className="text-[10px] font-bold text-slate-500">{idx + 1}</span>
                    </div>

                    {/* Title — always navy, bold when expanded */}
                    <span className={`flex-1 text-xs leading-snug text-left line-clamp-2 text-[#1a2b4e] ${
                      isExpanded ? "font-bold" : "font-semibold"
                    }`}>
                      {section.sectionTitle}
                    </span>

                    {/* Progress pill + chevron — primary orange throughout */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{
                          background:  "rgba(255,91,0,0.08)",
                          color:       PRIMARY,
                          borderColor: "rgba(255,91,0,0.15)",
                        }}
                      >
                        {completedCount}/{section.totalItems}
                      </span>
                      <ChevronDown
                        className="w-3.5 h-3.5 transition-transform duration-200"
                        style={{
                          color:     PRIMARY,
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      />
                    </div>
                  </button>

                  {/* Section items */}
                  {isExpanded && (
                    <div className="bg-white divide-y divide-gray-50">
                      {items.length === 0 ? (
                        /* Inner loading skeleton */
                        <div className="px-4 py-4 space-y-2.5">
                          {[70, 55, 65].map((w, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="sk w-7 h-7 rounded-lg flex-shrink-0" />
                              <div className="sk h-3.5 rounded flex-1" style={{ width: `${w}%` }} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        items.map((item, i) => {
                          const itemId   = `${idx}-${i}`
                          const isActive = selectedItem === itemId
                          const typeLower = item.contentType?.toLowerCase() || "video"

                          return (
                            <button
                              key={`${section.sectionId}-${i}`}
                              onClick={() => handleItemClick(item, idx, i)}
                              className={`group/item w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 border-l-2 ${
                                isActive
                                  ? "border-[#ff5b00] bg-[#ff5b00]/[0.04]"
                                  : "border-transparent hover:bg-[#ff5b00]/[0.025] hover:border-[#ff5b00]/30"
                              }`}
                            >
                              <TypeIcon type={typeLower} active={isActive} />

                              <div className="flex-1 min-w-0 text-left">
                                <p className={`text-xs font-semibold truncate leading-snug ${
                                  isActive ? "text-[#ff5b00]" : "text-[#1a2b4e]"
                                }`}>
                                  {item.title}
                                </p>
                                <TypeChip type={item.contentType} />
                              </div>

                              <div className="flex-shrink-0 ml-1">
                                {item.completed
                                  ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  : <Circle      className="w-4 h-4 text-gray-200" />
                                }
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
