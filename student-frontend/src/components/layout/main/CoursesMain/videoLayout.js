"use client"

import VideoPlayer from "./VideoPlayer"
import Discussion  from "@/components/sections/Student/MyCourses/Discussion"

export default function VideoLayout({ title, contentReferenceId, contentItemId, courseId, batchId, onCompleted }) {
  return (
    <div className="space-y-5">
      {/* Video player card */}
      <div
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
        style={{ boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" }}
      >
        <div className="p-4">
          <VideoPlayer
            contentReferenceId={contentReferenceId}
            title={title}
            contentItemId={contentItemId}
            onCompleted={onCompleted}
          />
        </div>
      </div>

      {/* Discussion (only when a lesson is loaded) */}
      {title && <Discussion contentItemId={contentItemId} courseId={courseId} batchId={batchId} />}
    </div>
  )
}
