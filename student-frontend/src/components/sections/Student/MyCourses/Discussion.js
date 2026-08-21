"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { MessageSquare, Plus, X, Send, Pencil } from "lucide-react"
import { discussionService } from "@/services/discussionService"

export default function Discussion({ contentItemId, batchId }) {
  const { courseId } = useParams()
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState("")
  const [discussions, setDiscussions] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [replyText, setReplyText] = useState({})
  const [replyingTo, setReplyingTo] = useState(null)
  const [editingReplyId, setEditingReplyId] = useState(null)
  const [editContent, setEditContent] = useState("")
  const [editingForumId, setEditingForumId] = useState(null)
  const [editForumContent, setEditForumContent] = useState("")
  const [expandedReplies, setExpandedReplies] = useState({})
  const [showAllDiscussions, setShowAllDiscussions] = useState(false)
  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const fetchDiscussions = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await discussionService.getAllDiscussions(contentItemId, batchId)
      setDiscussions(res.data || res || [])
    } catch (err) {
      setError("Unable to load discussions. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiscussions()
  }, [contentItemId])

  const handlePost = async (e) => {
    e?.preventDefault?.()
    const content = text.trim()
    if (!content) return

    setSaving(true)
    setError("")

    try {
      const newDiscussion = {
        content,
        contentItemId,
        courseId: courseId ? parseInt(courseId, 10) : null,
        batchId: batchId ? parseInt(batchId, 10) : null,
        viewCount: 0,
        isPinned: false,
        isLocked: false,
        isActive: true,
      }

      const createdDiscussion = await discussionService.createDiscussion(newDiscussion)
      setDiscussions((prev) => [createdDiscussion, ...prev])
      setText("")
      setIsOpen(false)
      fetchDiscussions() // Refresh to get proper metadata/names
    } catch (err) {
      setError("Unable to post discussion. Please make sure you are logged in.")
    } finally {
      setSaving(false)
    }
  }

  const handleReply = async (forumId) => {
    const content = replyText[forumId]?.trim()
    if (!content) return

    setSaving(true)
    setError("")

    try {
      await discussionService.addReply(forumId, { content, vote: 0, isSolution: false })
      setReplyText((prev) => ({ ...prev, [forumId]: "" }))
      setReplyingTo(null)
      fetchDiscussions() // Refresh to get proper metadata/names
    } catch (err) {
      setError("Unable to post reply.")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateReply = async (replyId) => {
    const content = editContent.trim()
    if (!content) return

    setSaving(true)
    try {
      await discussionService.updateReply(replyId, content)
      setEditingReplyId(null)
      setEditContent("")
      fetchDiscussions()
    } catch (err) {
      setError("Unable to update reply.")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateForum = async (forumId) => {
    const content = editForumContent.trim()
    if (!content) return

    setSaving(true)
    try {
      await discussionService.updateDiscussion(forumId, content)
      setEditingForumId(null)
      setEditForumContent("")
      fetchDiscussions()
    } catch (err) {
      setError("Unable to update discussion.")
    } finally {
      setSaving(false)
    }
  }

  const toggleExpandReplies = (forumId) => {
    setExpandedReplies(prev => ({ ...prev, [forumId]: !prev[forumId] }))
  }

  const cardShadow = { boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" }

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
      style={cardShadow}
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#0c63e4]/[0.08] flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-[#0c63e4]" />
          </div>
          <span className="text-xs font-bold text-[#1a2b4e] uppercase tracking-wide">
            Discussions
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
            style={{
              background: "rgba(12,99,228,0.08)",
              color: "#0c63e4",
              borderColor: "rgba(12,99,228,0.15)",
            }}
          >
            {discussions.length}
          </span>
        </div>

        <button
          onClick={() => setIsOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white
                     px-3.5 py-1.5 rounded-xl bg-[#ff5b00] hover:bg-[#e55200]
                     shadow-sm transition-all duration-150 active:scale-95"
        >
          {isOpen ? (
            <>
              <X className="w-3 h-3" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-3 h-3" />
              New Post
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share a question, insight, or note with your batch…"
            rows={3}
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl
                       bg-white text-[#1a2b4e] placeholder-gray-400 resize-none
                       focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20
                       focus:border-[#ff5b00] transition-colors"
          />
          <div className="flex items-center justify-end gap-2 mt-2.5">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-500 bg-white
                         border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePost}
              disabled={!text.trim() || saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold
                         text-white rounded-xl bg-[#ff5b00] hover:bg-[#e55200]
                         shadow-sm transition-all duration-150 active:scale-95
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-3 h-3" />
              {saving ? "Posting…" : "Post"}
            </button>
          </div>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>
      )}

      <div className="px-5 py-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading discussions…</p>
        ) : discussions.length > 0 ? (
          <div className="space-y-3">
            {discussions.slice(0, showAllDiscussions ? discussions.length : 3).map((discussion) => (
              <div key={discussion.forumId} className="rounded-2xl border border-gray-100 p-3 bg-gray-50">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {discussion.userName || "Discussion"}
                  </p>
                  {currentUserId && parseInt(currentUserId) === discussion.userId && !editingForumId && (
                    <button
                      onClick={() => {
                        setEditingForumId(discussion.forumId)
                        setEditForumContent(discussion.content)
                      }}
                      className="text-gray-400 hover:text-[#ff5b00] transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
                
                {editingForumId === discussion.forumId ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editForumContent}
                      onChange={(e) => setEditForumContent(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-[#ff5b00] outline-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateForum(discussion.forumId)}
                        disabled={saving || !editForumContent.trim()}
                        className="bg-[#ff5b00] text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-50"
                      >
                        {saving ? "..." : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingForumId(null)
                          setEditForumContent("")
                        }}
                        className="text-gray-500 text-xs font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-gray-800 line-clamp-2">{discussion.content}</p>
                    {discussion.updatedAt && new Date(discussion.updatedAt) - new Date(discussion.createdAt) > 1000 && (
                      <span className="text-[9px] text-gray-400 italic">(edited)</span>
                    )}
                  </>
                )}
                
                {/* Show replies inline based on expanded state */}
                {discussion.replies?.slice(0, expandedReplies[discussion.forumId] ? discussion.replies.length : 2).map((r) => {
                  const isEditing = editingReplyId === r.replyId;
                  const isOwner = parseInt(currentUserId) === r.userId;

                  return (
                    <div key={r.replyId} className="mt-2 pl-3 border-l-2 border-gray-200 group">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                          {isOwner
                            ? "Me"
                            : r.userRole && r.userRole !== "STUDENT"
                              ? r.userRole.charAt(0) + r.userRole.slice(1).toLowerCase()
                              : r.userName || "Participant"}
                        </p>
                        {r.userRole && r.userRole !== "STUDENT" && !isOwner && (
                          <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0 rounded font-bold uppercase">
                            {r.userRole}
                          </span>
                        )}
                        {isOwner && !isEditing && (
                          <button
                            onClick={() => {
                              setEditingReplyId(r.replyId);
                              setEditContent(r.content);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[#ff5b00] transition-all"
                          >
                            <Pencil size={10} />
                          </button>
                        )}
                        {r.isSolution && (
                          <span className="text-success font-bold text-[10px]">
                            [Solution]
                          </span>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="mt-1.5">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:border-[#ff5b00] outline-none resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => handleUpdateReply(r.replyId)}
                              disabled={saving || !editContent.trim()}
                              className="text-[10px] font-bold text-white bg-[#ff5b00] px-2 py-0.5 rounded shadow-sm hover:bg-[#e55200] transition-colors disabled:opacity-50"
                            >
                              {saving ? "..." : "Save"}
                            </button>
                            <button
                              onClick={() => {
                                setEditingReplyId(null);
                                setEditContent("");
                              }}
                              className="text-[10px] font-bold text-gray-400 hover:text-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-gray-700 line-clamp-2">{r.content}</p>
                          {r.updatedAt && new Date(r.updatedAt) - new Date(r.createdAt) > 1000 && (
                            <span className="text-[9px] text-gray-400 italic">(edited)</span>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}

                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                  <div className="flex items-center gap-3">
                    <span>{discussion.replies?.length || 0} replies</span>
                    <button
                      onClick={() => setReplyingTo(replyingTo === discussion.forumId ? null : discussion.forumId)}
                      className="font-semibold text-gray-600 hover:text-[#0c63e4]"
                    >
                      Reply
                    </button>
                  </div>
                  {discussion.replies?.length > 2 && (
                    <button
                      onClick={() => toggleExpandReplies(discussion.forumId)}
                      className="font-semibold text-[#0c63e4] hover:underline"
                    >
                      {expandedReplies[discussion.forumId] ? "View less" : "View all"}
                    </button>
                  )}
                </div>
                
                {replyingTo === discussion.forumId && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                    <textarea
                      value={replyText[discussion.forumId] || ""}
                      onChange={(e) => setReplyText(prev => ({ ...prev, [discussion.forumId]: e.target.value }))}
                      placeholder="Write a reply..."
                      rows={2}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:border-[#0c63e4] focus:ring-1 focus:ring-[#0c63e4]/20 resize-none outline-none"
                    />
                    <div className="flex justify-end mt-2 h-7">
                       <button
                         onClick={() => handleReply(discussion.forumId)}
                         disabled={!replyText[discussion.forumId]?.trim() || saving}
                         className="px-3 py-1 bg-[#0c63e4] text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                       >
                         {saving ? "Posting..." : "Post Reply"}
                       </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {discussions.length > 3 && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setShowAllDiscussions(!showAllDiscussions)}
                  className="px-4 py-1.5 text-xs font-semibold text-[#0c63e4] bg-[#0c63e4]/10 rounded-full hover:bg-[#0c63e4]/20 transition-colors"
                >
                  {showAllDiscussions ? "Show less discussions" : `View all ${discussions.length} discussions`}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center px-6">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
              style={{ background: "rgba(12,99,228,0.06)" }}
            >
              <MessageSquare className="w-5 h-5 text-[#0c63e4]/40" />
            </div>
            <p className="text-xs font-semibold text-gray-400">No discussions yet</p>
            <p className="text-[11px] text-gray-300 mt-0.5">
              Be the first to start a conversation about this lesson.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
