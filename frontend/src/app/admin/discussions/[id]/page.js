'use client';
  
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@utils/api';
import { Button } from '@/components/ui/button';
import { useRouter } from "next/navigation";

const DiscussionDetail = () => {
  const router = useRouter();
  const { id } = useParams();
  const [discussion, setDiscussion] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSolution, setIsSolution] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDiscussion = async () => {
    try {
      const { data } = await api.get(`/api/discussion-forums/${id}`);
      setDiscussion(data);
    } catch (err) {
      console.error('Error fetching discussion:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    try {
      await api.post(`/api/discussion-forums/${discussion.forumId}/reply`, {
        content: replyContent,
        vote: 0,
        isSolution,
      });
      setReplyContent('');
      setIsSolution(false);
      fetchDiscussion();
    } catch (err) {
      console.error('Reply failed', err);
    }
  };

  const handleDelete = async (replyId) => {
    try {
      await api.delete(`/api/discussion-forums/replies/${replyId}`);
      fetchDiscussion();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  useEffect(() => {
    fetchDiscussion();
  }, [id]);

  if (loading) return <p className="text-center p-6">Loading...</p>;

  if (!discussion) return <p className="text-center p-6 text-red-500">Discussion not found</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm font-medium rounded"
        onClick={() => router.back()}
      >
        ← Back
      </button>
      <h2 className="text-xl font-bold mb-2">{discussion.content}</h2>
      <p className="text-sm text-gray-500 mb-4">
        Posted by <strong>{discussion.userName}</strong> on{' '}
        {new Date(discussion.createdAt).toLocaleString()}
      </p>

      <hr className="my-4" />

      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-2">Post a Reply</h3>
        <textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          className="w-full border rounded-md p-2 mb-2"
          rows={4}
          placeholder="Write your reply..."
        />
        <div className="flex items-center gap-4 mb-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={isSolution}
              onChange={() => setIsSolution(true)}
            />
            Mark as Solution
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={!isSolution}
              onChange={() => setIsSolution(false)}
            />
            Not a Solution
          </label>
        </div>
        <Button onClick={handleReply}>Submit Reply</Button>
      </div>

      <hr className="my-4" />

      <div>
        <h3 className="font-semibold text-lg mb-4">Replies</h3>
        {discussion.replies.length === 0 ? (
          <p className="text-gray-500">No replies yet.</p>
        ) : (
          <ul className="space-y-4">
            {discussion.replies.map((reply) => (
              <li key={reply.replyId} className="border rounded p-4 bg-gray-50 relative">
                <p>{reply.content}</p>
                <div className="text-sm text-gray-500 mt-1">
                  <span>By Admin</span> •{' '}
                  <span>{new Date(reply.createdAt).toLocaleString()}</span> •{' '}
                  {reply.isSolution && <span className="text-green-600 font-bold">[Solution]</span>}
                </div>
                <Button
                  variant="destructive"
                  className="absolute top-2 right-2 background-red-500 hover:bg-red-600"
                  onClick={() => handleDelete(reply.replyId)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DiscussionDetail;
