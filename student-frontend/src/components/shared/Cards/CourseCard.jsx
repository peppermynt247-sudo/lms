"use client"
import { BookOpen, Users, Play, Lock, Target, ArrowRight, Star, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function CourseCard({ item, isBundle = false }) {
  const router = useRouter()
  const {
    accessGranted,
    courseName,
    bundleName,
    courseId,
    bundleId,
    thumbnailUrl,
    price,
    progressPercentage,
    paymentStatus,
    completionStatus,
    batchManagerName,
    totalLessons,
    completedLessons,
    expiresAt,
  } = item

  const name = isBundle ? bundleName : courseName
  const progress = Number.isNaN(Number.parseFloat(progressPercentage)) ? 0 : Number.parseFloat(progressPercentage)
  const isPending = paymentStatus === "PENDING"
  const isCompleted = completionStatus === "COMPLETED"
  const hasAccess = accessGranted || paymentStatus === "PAID"

  const handleClick = () => {
    if (!hasAccess) {
      // Handle pending state - could redirect to payment page
      router.push(`/student/my-purchases`)
    } else {
      // Navigate to appropriate route based on whether it's a bundle or course
      if (isBundle && bundleId) {
        router.push(`/student/mycourses/bundles/${bundleId}`)
      } else if (!isBundle && courseId) {
        router.push(`/student/mycourses/courses/${courseId}`)
      }
    }
  }

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : ""

  return (
    <div className="group relative w-full max-w-[320px] bg-white rounded-2xl overflow-hidden border border-gray-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl" style={{ boxShadow: "0 1px 6px -1px rgba(26,43,78,0.10)" }}>
      {/* Thumbnail Section */}
      <div className="relative h-40 overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`${name} course thumbnail`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a2b4e]/10 via-[#FF5B00]/5 to-[#1a2b4e]/5 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent" />
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 text-[#1a2b4e]" />
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-20">
          {!hasAccess ? (
            <div className="bg-white/95 backdrop-blur-md border border-white/40 text-[#1a2b4e] px-2.5 py-1 rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-lg">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              Pending
            </div>
          ) : isCompleted ? (
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-2.5 py-1 rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-lg">
              <Target className="w-3 h-3" />
              Completed
            </div>
          ) : (
            <div className="bg-gradient-to-r from-[#FF5B00] to-[#FF5B00]/90 text-white px-2.5 py-1 rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Active
            </div>
          )}
        </div>

        {/* Progress Arc */}
        {progress >= 0 && (
          <div className="absolute bottom-4 right-4 z-20">
            <div className="relative w-16 h-16">
              <svg className="w-13 h-13 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#ff5b00"
                  strokeWidth="2.5"
                  strokeDasharray={`${progress}, 100`}
                  strokeLinecap="round"
                  className="drop-shadow-sm"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#1a2b4e]">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-[#1a2b4e] leading-tight line-clamp-2 group-hover:text-[#FF5B00] transition-colors duration-300">
              {name}
            </h3>
            {isBundle ? (
              <div className="flex-shrink-0 bg-[#ff5b00]/10 text-[#ff5b00] border border-[#ff5b00]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                Bundle
              </div>
            ) : (
              <div className="flex-shrink-0 bg-[#0c63e4]/10 text-[#0c63e4] border border-[#0c63e4]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                Course
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
         <div className="grid grid-cols-2 gap-3">
         {/* {batchManagerName && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Users className="w-3.5 h-3.5 text-[#FF5B00]" />
                <span className="text-[11px] font-medium">Instructor</span>
              </div>
              <p className="text-xs font-semibold text-[#1a2b4e] truncate">{batchManagerName}</p>
            </div>
          )}

          {totalLessons != null && completedLessons != null && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-gray-500">
                <BookOpen className="w-3.5 h-3.5 text-[#FF5B00]" />
                <span className="text-[11px] font-medium">Lessons</span>
              </div>
              <p className="text-xs font-semibold text-[#1a2b4e]">
                <span className="text-[#FF5B00]">{completedLessons}</span>/{totalLessons}
              </p>
            </div>
          )}  */}

          {expiresAt && (
            <div className="space-y-1 col-span-2">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Clock className="w-3.5 h-3.5 text-[#FF5B00]" />
                <span className="text-[11px] font-medium">Expires {formatDate(expiresAt)}</span>
              </div>
            </div>
          )}
        </div> 

        {/* Action Button */}
        <Button
          onClick={handleClick}
          // disabled={!accessGranted}
          aria-label={
            !hasAccess
              ? "Complete payment for the course"
              : "Continue learning the course"
          }
          className={`w-full h-10 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all duration-150 shadow-sm ${
            !hasAccess
              ? "bg-gray-200 text-gray-500 hover:bg-gray-300"
              : "text-white bg-[#ff5b00] hover:bg-[#e55200] active:scale-95"
          }`}
        >
          {!hasAccess ? (
            <>
              <Lock className="w-4 h-4" />
              Complete Payment
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Continue Learning
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}