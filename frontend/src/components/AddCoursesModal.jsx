import React, { useEffect, useState } from 'react';
import api from "@utils/api";
import { toast } from 'react-toastify';

export default function AddCoursesModal({ open, onClose, bundleId, onSuccess, linkedCourseIds = [] }) {
  const [allCourses, setAllCourses] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]); // courseIds being processed
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (open) {
      setFetching(true);
      api.get('/api/courses')
        .then(response => setAllCourses(response.data.data?.content || []))
        .catch(() => setAllCourses([]))
        .finally(() => setFetching(false));
    }
  }, [open]);

  const handleLink = async (courseId) => {
    setLoadingIds(ids => [...ids, courseId]);
    try {
      console.log('Linking course:', courseId, 'to bundle:', bundleId);
      const response = await api.post('/api/course-bundles/link', { bundleId, courseId });
      console.log('Link response:', response);
      
      // Update is handled by parent component through onSuccess callback
      toast.success('Course linked successfully!', {
        toastId: `link-${courseId}-${Date.now()}`,
        position: "top-right",
        autoClose: 3000,
      });
      
      if (onSuccess) {
        console.log('Calling onSuccess callback');
        onSuccess();
      }
    } catch (err) {
      console.error('Link error:', err);
      toast.error('Failed to link course: ' + (err?.response?.data?.message || err.message), {
        toastId: `link-error-${courseId}-${Date.now()}`,
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoadingIds(ids => ids.filter(id => id !== courseId));
    }
  };

  const handleUnlink = async (courseId) => {
    setLoadingIds(ids => [...ids, courseId]);
    try {
      console.log('Unlinking course:', courseId, 'from bundle:', bundleId);
      const response = await api.post('/api/course-bundles/unlink', { bundleId, courseId });
      console.log('Unlink response:', response);
      
      // Update is handled by parent component through onSuccess callback
      toast.success('Course unlinked successfully!', {
        toastId: `unlink-${courseId}-${Date.now()}`,
        position: "top-right",
        autoClose: 3000,
      });
      
      if (onSuccess) {
        console.log('Calling onSuccess callback');
        onSuccess();
      }
    } catch (err) {
      console.error('Unlink error:', err);
      toast.error('Failed to unlink course: ' + (err?.response?.data?.message || err.message), {
        toastId: `unlink-error-${courseId}-${Date.now()}`,
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoadingIds(ids => ids.filter(id => id !== courseId));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl h-[80vh] flex flex-col">
        <h2 className="text-xl font-bold mb-4 p-6 pb-0">Link Courses to Bundle</h2>
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {fetching ? (
            <div className="text-gray-500">Loading...</div>
          ) : Array.isArray(allCourses) && allCourses.length === 0 ? (
            <div className="text-gray-500">No courses found.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {allCourses.map(course => {
                const linked = (linkedCourseIds || []).map(String).includes(String(course.courseId));
                const loading = loadingIds.includes(course.courseId);
                return (
                  <li key={course.courseId} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-semibold text-base text-gray-800">{course.title}</div>
                      {course.description && <div className="text-sm text-gray-500 mt-1">{course.description}</div>}
                    </div>
                    <button
                      disabled={loading}
                      onClick={() => linked ? handleUnlink(course.courseId) : handleLink(course.courseId)}
                      style={{
                        background: linked ? '#e5e7eb' : '#2563eb',
                        color: linked ? '#374151' : '#fff',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontWeight: 600,
                        padding: '0.5rem 1.5rem',
                        minWidth: 90,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1,
                        transition: 'background 0.2s, color 0.2s',
                        boxShadow: linked ? 'none' : '0 1px 2px rgba(37,99,235,0.08)'
                      }}
                    >
                      {loading ? (
                        <span className="inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin align-middle"></span>
                      ) : linked ? 'Unlink' : 'Link'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="p-6 pt-0 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 text-gray-800 border border-gray-300 rounded px-4 py-2 font-semibold hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 