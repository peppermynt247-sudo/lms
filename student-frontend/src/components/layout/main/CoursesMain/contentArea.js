import { Play, FileText, BookOpenCheck, Code, BookOpen } from "lucide-react"
import VideoLayout          from "@/components/layout/main/CoursesMain/videoLayout"
import EbookLayout          from "@/components/layout/main/CoursesMain/eBookLayout"
import ExerciseLayout       from "@/components/layout/main/CoursesMain/AssignmentArea"
import ProgAssignmentLayout from "@/components/layout/main/CoursesMain/ProgAssignmentArea"

/* ─── Content-type config (matches admin SectionItem / MaterialItem exactly) ── */
const TYPE_META = {
  VIDEO:    { label: "Video",    Icon: Play,          bg: "bg-[#0c63e4]/10", text: "text-[#0c63e4]", border: "border-[#0c63e4]/20" },
  EBOOK:    { label: "eBook",    Icon: FileText,       bg: "bg-[#f2277e]/10", text: "text-[#f2277e]", border: "border-[#f2277e]/20" },
  EXERCISE: { label: "Exercise", Icon: BookOpenCheck,  bg: "bg-[#ff5b00]/10", text: "text-[#ff5b00]", border: "border-[#ff5b00]/20" },
  ELAB:     { label: "E-Lab",    Icon: Code,           bg: "bg-[#1a2b4e]/10", text: "text-[#1a2b4e]", border: "border-[#1a2b4e]/20" },
}

/* ─── Welcome / empty state ─────────────────────────────────────────────────── */
function WelcomeState() {
  const steps = [
    {
      Icon: BookOpen,
      bg: "bg-[#ff5b00]/10",
      color: "text-[#ff5b00]",
      label: "Browse sections",
      desc: "Open any section in the outline on the left",
    },
    {
      Icon: Play,
      bg: "bg-[#0c63e4]/10",
      color: "text-[#0c63e4]",
      label: "Pick a lesson",
      desc: "Select a video, eBook, exercise, or E-Lab",
    },
    {
      Icon: BookOpenCheck,
      bg: "bg-[#ff5b00]/10",
      color: "text-[#ff5b00]",
      label: "Track progress",
      desc: "Complete lessons and watch your progress grow",
    },
  ]

  return (
    <div className="flex-1 flex items-center justify-center min-h-full px-6 py-16">
      <div className="text-center max-w-xs">

        {/* Icon badge */}
        <div className="relative w-20 h-20 mx-auto mb-7">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#ff5b00]/10 to-[#0c63e4]/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-9 h-9 text-[#ff5b00]" strokeWidth={1.5} />
          </div>
        </div>

        <h2 className="text-lg font-bold text-[#1a2b4e] mb-1.5">
          Ready to learn?
        </h2>
        <p className="text-xs text-gray-400 mb-7 leading-relaxed">
          Select any lesson from the course outline on the left.
        </p>

        {/* Steps */}
        <div className="space-y-2.5 text-left">
          {steps.map(({ Icon, bg, color, label, desc }, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3.5"
              style={{ boxShadow: "0 1px 4px -1px rgba(26,43,78,0.06)" }}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1a2b4e] leading-none mb-0.5">{label}</p>
                <p className="text-[11px] text-gray-400 leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Content header ─────────────────────────────────────────────────────────── */
function ContentHeader({ title, contentType }) {
  const meta = TYPE_META[contentType?.toUpperCase()] || TYPE_META.VIDEO
  const { Icon, bg, text, border, label } = meta

  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="flex-1 min-w-0">
        {/* Type badge */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${bg} ${text} ${border}`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </span>
        </div>
        {/* Title */}
        <h1 className="text-xl font-bold text-[#1a2b4e] leading-snug line-clamp-2">
          {title}
        </h1>
      </div>
    </div>
  )
}

/* ─── Main export ────────────────────────────────────────────────────────────── */
export default function ContentArea({
  contentType        = "VIDEO",
  title              = null,
  contentReferenceId = null,
  contentItemId      = null,
  courseId           = null,
  batchId            = null,
  onCompleted        = null,
}) {
  const hasContent = title && contentReferenceId

  const renderContent = () => {
    // key=contentItemId forces a full unmount+remount on every content switch.
    // This guarantees all component state (viewUrl, markedComplete ref, etc.)
    // resets to initial values — no manual useEffect resets needed in child components.
    switch (contentType?.toUpperCase()) {
      case "VIDEO":
        return <VideoLayout    key={contentItemId} title={title} contentReferenceId={contentReferenceId} contentItemId={contentItemId} courseId={courseId} batchId={batchId} onCompleted={onCompleted} />
      case "EBOOK":
        return <EbookLayout    key={contentItemId} title={title} contentReferenceId={contentReferenceId} contentItemId={contentItemId} courseId={courseId} batchId={batchId} onCompleted={onCompleted} />
      case "ELAB":
        return <ProgAssignmentLayout key={contentItemId} title={title} contentReferenceId={contentReferenceId} />
      case "EXERCISE":
        return <ExerciseLayout key={contentItemId} title={title} contentReferenceId={contentReferenceId} contentItemId={contentItemId} courseId={courseId} batchId={batchId} />
      default:
        return (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-sm font-bold text-[#1a2b4e] mb-1">{title}</h3>
              <p className="text-xs text-gray-400">Content type not supported yet</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {!hasContent ? (
        <WelcomeState />
      ) : (
        <div className="p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <ContentHeader title={title} contentType={contentType} />
            {renderContent()}
          </div>
        </div>
      )}
    </div>
  )
}
