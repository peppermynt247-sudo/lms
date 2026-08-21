"use client"
import { BookOpen, Play, ArrowRight, Clock, Trophy, Users, Star, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function LevelCard({ item, levelNumber }) {
  const router = useRouter()
  const {
    courseId,
    courseName,
    bundleName,
    thumbnailUrl,
    price,
    progressPercentage,
    completionStatus,
    batchManagerName,
    totalLessons,
    completedLessons,
    expiresAt,
    title,
  } = item

  const progress = Number.isNaN(Number.parseFloat(progressPercentage)) ? 0 : Number.parseFloat(progressPercentage)
  const isCompleted = completionStatus === "COMPLETED"

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : ""

  const handleStartCourse = () => {
    router.push(`/student/mycourses/courses/${courseId}`)
  }

  return (
    <div className="group relative w-full rounded-2xl overflow-hidden transition-all duration-500 bg-gradient-to-r from-white to-[#ff6917]/20 border-2 border-orange-200 shadow-lg hover:shadow-xl">
      {/* Mobile Layout */}
      <div className="flex flex-col sm:hidden p-4 space-y-4">
        {/* Mobile Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg bg-gradient-to-br from-[#1a2b4e] to-[#FF5B00]/80">
              {levelNumber}
            </div>
            <div>
              <div className="text-xs font-medium text-[#FF5B00] uppercase tracking-wide">Level {levelNumber}</div>
              <h3 className="text-lg font-bold text-[#1a2b4e] leading-tight">
                {title || courseName || `Level ${levelNumber}`}
              </h3>
            </div>
          </div>

          {/* Mobile Status Badge */}
          {isCompleted ? (
            <div className="bg-emerald-500 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
              <Star className="w-3 h-3" />
              Done
            </div>
          ) : (
            <div className="bg-[#FF5B00] text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Start
            </div>
          )}
        </div>

        {/* Mobile Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {totalLessons != null && completedLessons != null && (
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span className="font-semibold">
                <span className={isCompleted ? "text-emerald-600" : "text-[#FF5B00]"}>{completedLessons}</span>
                <span className="text-gray-400">/{totalLessons}</span>
              </span>
            </div>
          )}

          {batchManagerName && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-[#1a2b4e] truncate">{batchManagerName}</span>
            </div>
          )}
        </div>

        {/* Mobile Progress */}
        {progress >= 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Progress</span>
              <span className="text-sm font-bold text-[#1a2b4e]">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-[#FF5B00] to-[#FF5B00]/80"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Mobile Action Button */}
        {!isCompleted && (
          <Button
            className="w-full h-11 text-sm font-semibold flex items-center justify-center gap-2 rounded-xl transition-all duration-300 shadow-lg bg-gradient-to-r from-[#FF5B00] to-[#FF5B00]/90 hover:from-[#FF5B00]/90 hover:to-[#FF5B00]/80 text-white"
            onClick={handleStartCourse}
          >
            <Play className="w-4 h-4" />
            Start Course
          </Button>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center p-6 gap-6">
        {/* Level Number and Icon Section */}
        <div className="flex-shrink-0 flex items-center gap-4">
          {/* Level Number Badge */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg bg-gradient-to-br from-[#1a2b4e] to-[#FF5B00]/80">
            {levelNumber}
          </div>

          {/* Icon Section */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-md bg-white/90 backdrop-blur-sm">
            {isCompleted ? (
              <Trophy className="w-8 h-8 text-emerald-500" />
            ) : (
              <BookOpen className="w-8 h-8 text-[#FF5B00]" />
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-lg text-sm font-semibold bg-orange-100 text-[#FF5B00]">
                Level {levelNumber}
              </div>

              {/* Status Badge */}
              {isCompleted ? (
                <div className="bg-emerald-500 text-white px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <Star className="w-3 h-3" />
                  Completed
                </div>
              ) : (
                <div className="bg-[#FF5B00] text-white px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  Available
                </div>
              )}
            </div>

            <h3 className="text-2xl font-bold leading-tight transition-colors duration-300 text-[#1a2b4e] group-hover:text-[#FF5B00]">
              {title || courseName || `Level ${levelNumber}`}
            </h3>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-8">
            {totalLessons != null && completedLessons != null && (
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Lessons:</span>
                <span className="text-sm font-bold">
                  <span className={isCompleted ? "text-emerald-600" : "text-[#FF5B00]"}>{completedLessons}</span>
                  <span className="text-gray-400">/{totalLessons}</span>
                </span>
              </div>
            )}

            {batchManagerName && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Instructor:</span>
                <span className="text-sm font-semibold text-[#1a2b4e]">{batchManagerName}</span>
              </div>
            )}

            {expiresAt && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Expires:</span>
                <span className="text-sm font-semibold text-gray-700">{formatDate(expiresAt)}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {progress >= 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Progress</span>
                <span className="text-sm font-bold text-[#1a2b4e]">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-[#FF5B00] to-[#FF5B00]/80"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0">
          {!isCompleted && (
            <Button
              className="h-12 px-6 text-sm font-semibold flex items-center gap-3 rounded-xl transition-all duration-300 shadow-lg bg-gradient-to-r from-[#FF5B00] to-[#FF5B00]/90 hover:from-[#FF5B00]/90 hover:to-[#FF5B00]/80 text-white shadow-[#FF5B00]/20 hover:shadow-[#FF5B00]/30 hover:shadow-xl"
              onClick={handleStartCourse}
            >
              <Play className="w-4 h-4" />
              Start Course
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
