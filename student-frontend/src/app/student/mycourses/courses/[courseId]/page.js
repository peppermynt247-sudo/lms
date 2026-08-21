"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import CourseSidebar from "@/components/shared/SideBar/CourseSidebar"
import ContentArea   from "@/components/layout/main/CoursesMain/contentArea"

export default function CoursePage() {
  const { courseId } = useParams()
  const [contentType,        setContentType]        = useState("VIDEO")
  const [contentTitle,       setContentTitle]       = useState(null)
  const [contentReferenceId, setContentReferenceId] = useState(null)
  const [contentItemId,      setContentItemId]      = useState(null)
  const [batchId,            setBatchId]            = useState(null)
  const [refreshTrigger,     setRefreshTrigger]     = useState(0)

  const handleContentSelect = (type, title, contentId, itemId, bId) => {
    setContentType(type)
    setContentTitle(title)
    setContentReferenceId(contentId)
    setContentItemId(itemId)
    setBatchId(bId)
  }

  const handleItemCompleted = () => setRefreshTrigger((n) => n + 1)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <CourseSidebar onContentSelect={handleContentSelect} refreshTrigger={refreshTrigger} />
      <ContentArea
        contentType={contentType}
        title={contentTitle}
        contentReferenceId={contentReferenceId}
        contentItemId={contentItemId}
        courseId={courseId}
        batchId={batchId}
        onCompleted={handleItemCompleted}
      />
    </div>
  )
}
