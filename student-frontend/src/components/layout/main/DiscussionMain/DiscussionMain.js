"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  MessageSquare,
  ArrowLeft,
  Pencil,
  BookOpen,
  MessageCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import { discussionService } from "@/services/discussionService";
import "react-toastify/dist/ReactToastify.css";

export default function DiscussionFormPage() {
  const [discussions, setDiscussions] = useState([]);
  const [replyInputs, setReplyInputs] = useState({});
  const [expandedDiscussionIds, setExpandedDiscussionIds] = useState([]);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editingForumId, setEditingForumId] = useState(null);
  const [editForumContent, setEditForumContent] = useState("");
  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const router = useRouter();

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const fetchDiscussions = async () => {
    try {
      const response = await discussionService.getAllDiscussions();
      setDiscussions(response || []);
    } catch (error) {
      toast.error("Failed to fetch discussions");
    }
  };

  const toggleReplies = (forumId) => {
    setExpandedDiscussionIds((prev) =>
      prev.includes(forumId)
        ? prev.filter((id) => id !== forumId)
        : [...prev, forumId]
    );
  };

  const handleReplyChange = (forumId, value) => {
    setReplyInputs((prev) => ({ ...prev, [forumId]: value }));
  };

  const handleAddReply = async (forumId) => {
    const content = replyInputs[forumId]?.trim();
    if (!content) return;

    const replyPayload = {
      forumId,
      content,
      vote: 0,
      isSolution: false,
    };

    // Optimistic update (including UI-only fields)
    const optimisticReply = {
      ...replyPayload,
      replyId: Date.now(),
      userId: parseInt(currentUserId),
      createdAt: new Date().toISOString(),
    };

    const updatedDiscussions = discussions.map((d) =>
      d.forumId === forumId ? { ...d, replies: [...(d.replies || []), optimisticReply] } : d
    );
    setDiscussions(updatedDiscussions);
    setReplyInputs((prev) => ({ ...prev, [forumId]: "" }));

    try {
      await discussionService.addReply(forumId, replyPayload);
      toast.success("Reply posted");
      fetchDiscussions();
    } catch {
      toast.error("Failed to post reply");
      fetchDiscussions(); // Rollback optimistic update
    }
  };

  const handleUpdateForum = async (forumId) => {
    const content = editForumContent.trim();
    if (!content) return;

    try {
      await discussionService.updateDiscussion(forumId, content);
      toast.success("Discussion updated");
      setEditingForumId(null);
      setEditForumContent("");
      fetchDiscussions();
    } catch {
      toast.error("Failed to update discussion");
    }
  };

  if (discussions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="text-center p-6 max-w-md space-y-4">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="text-2xl font-bold text-foreground">No Discussions Found</h2>
          <p className="text-muted-foreground">
            It looks like there are no discussions available at the moment. Start a new topic or check back later!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <ToastContainer position="top-right" autoClose={2000} />
      <h1 className="text-3xl font-bold text-center text-secondary mb-2">My Discussions</h1>
      <div className="flex justify-center mb-6">
        <span className="block w-24 h-1 rounded-full bg-orange shadow-md"></span>
      </div>
      {discussions.map((discussion) => {
        const isExpanded = expandedDiscussionIds.includes(discussion.forumId);
        return (
          <div
            key={discussion.forumId}
            className="mb-10 border rounded-lg p-5 bg-white shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold capitalize">
                {discussion.userName?.[0] || "U"}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className="font-semibold capitalize text-lg">
                    {discussion.userName}
                  </p>
                  <span className="text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-600 flex items-center gap-1">
                    {format(new Date(discussion.createdAt), "do MMM yyyy, h:mm a")}
                    {discussion.updatedAt && new Date(discussion.updatedAt) - new Date(discussion.createdAt) > 1000 && (
                      <span className="text-xs text-gray-400 italic">(edited)</span>
                    )}
                  </span>
                </div>
                
                {editingForumId === discussion.forumId ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editForumContent}
                      onChange={(e) => setEditForumContent(e.target.value)}
                      className="w-full border rounded-lg p-3 text-sm focus:ring-1 focus:ring-orange focus:border-orange outline-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateForum(discussion.forumId)}
                        className="bg-orange text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#e55200] transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setEditingForumId(null);
                          setEditForumContent("");
                        }}
                        className="text-gray-500 text-sm hover:text-gray-700 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-800 mt-2">{discussion.content}</p>
                )}

                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                  {currentUserId && parseInt(currentUserId) === discussion.userId && editingForumId !== discussion.forumId && (
                    <button
                      onClick={() => {
                        setEditingForumId(discussion.forumId);
                        setEditForumContent(discussion.content);
                      }}
                      className="hover:text-blue-600 flex items-center gap-1 transition-colors"
                    >
                      <Pencil size={15} /> Edit Post
                    </button>
                  )}
                  <button
                    onClick={() => toggleReplies(discussion.forumId)}
                    className="hover:text-black flex items-center gap-1"
                  >
                    <MessageSquare size={16} /> Reply
                  </button>
                  <button
                    onClick={() => toggleReplies(discussion.forumId)}
                    className="ml-auto bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                  >
                    {discussion.replies?.length || 0} Comment{discussion.replies?.length !== 1 ? 's' : ''}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-6 ml-10">
                {discussion.replies?.map((reply) => {
                  const isOwner = currentUserId && parseInt(currentUserId) === reply.userId;
                  const isEditing = editingReplyId === reply.replyId;

                  return (
                    <div key={reply.replyId} className="mb-4 flex gap-4">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        <Image
                          src="/default-avatar.png"
                          alt="User"
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                          onError={(e) => (e.target.style.display = "none")}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold capitalize">
                            {parseInt(currentUserId) === reply.userId
                              ? "Me"
                              : reply.userRole && reply.userRole !== "STUDENT"
                                ? reply.userRole.charAt(0) + reply.userRole.slice(1).toLowerCase()
                                : reply.userName || "Participant"}
                          </p>
                          {reply.userRole && reply.userRole !== "STUDENT" && parseInt(currentUserId) !== reply.userId && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              {reply.userRole}
                            </span>
                          )}
                          {reply.isSolution && (
                            <span className="text-success font-bold">[Solution]</span>
                          )}
                        </div>

                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="border rounded px-2 py-1 text-sm w-full mt-1"
                            />
                            <div className="mt-2 flex gap-2">
                              <button
                                className="bg-green text-white px-3 py-1 rounded text-sm"
                                onClick={async () => {
                                  try {
                                    await discussionService.updateReply(reply.replyId, editContent);
                                    toast.success("Reply updated");
                                    setEditingReplyId(null);
                                    setEditContent("");
                                    fetchDiscussions();
                                  } catch {
                                    toast.error("Only the owner can update the replies");
                                  }
                                }}
                              >
                                Save
                              </button>
                              <button
                                className="text-gray-500 text-sm"
                                onClick={() => {
                                  setEditingReplyId(null);
                                  setEditContent("");
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-gray-700 mt-1">{reply.content}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              {format(new Date(reply.createdAt), "do MMM yyyy, h:mm a")}
                              {reply.updatedAt && new Date(reply.updatedAt) - new Date(reply.createdAt) > 1000 && (
                                <span className="text-gray-400 italic">(edited)</span>
                              )}
                            </p>
                          </>
                        )}

                        {isOwner && !isEditing && (
                          <button
                            className="text-sm text-blue-600 flex items-center gap-1 mt-1"
                            onClick={() => {
                              setEditingReplyId(reply.replyId);
                              setEditContent(reply.content);
                            }}
                          >
                            <Pencil size={14} /> Edit
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Comment Input */}
                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="flex-1 border rounded px-3 py-2 text-sm"
                    value={replyInputs[discussion.forumId] || ""}
                    onChange={(e) =>
                      handleReplyChange(discussion.forumId, e.target.value)
                    }
                  />
                  <button
                    className="bg-blue-600 text-white px-4 py-2 text-sm rounded"
                    onClick={() => handleAddReply(discussion.forumId)}
                  >
                    Comment
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
