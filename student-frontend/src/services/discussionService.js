import api from "./api";

export const discussionService = {
  getAllDiscussions: async (contentItemId = null, batchId = null) => {
    const params = {};
    if (contentItemId) params.contentItemId = contentItemId;
    if (batchId) params.batchId = batchId;
    const response = await api.get("/api/discussion-forums", { params });
    return response.data;
  },

  createDiscussion: async (discussionData) => {
    const response = await api.post("/api/discussion-forums", discussionData);
    return response.data;
  },

  updateDiscussion: async (forumId, content) => {
    const response = await api.put(`/api/discussion-forums/${forumId}`, {
      content,
    });
    return response.data;
  },

  addReply: async (forumId, replyData) => {
    const response = await api.post(`/api/discussion-forums/${forumId}/reply`, replyData);
    return response.data;
  },

  updateReply: async (replyId, content) => {
    const response = await api.put(`/api/discussion-forums/replies/${replyId}`, {
      content,
    });
    return response.data;
  },

  upvoteReply: async (forumId, replyId) => {
    // Only send vote, not content
    const response = await api.post(`/api/discussion-forums/${forumId}/reply`, {
      content: "",
      vote: 1,
      isSolution: false,
    });
    return response.data;
  },
};
