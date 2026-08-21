"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { getCurriculumSections } from '@utils/api';
import VideoPlayer from '@/components/sections/admin/courses-delivery/courses/components/VideoPlayer.jsx';

export default function VideoPage() {
  const params = useParams();
  const router = useRouter();
  const { curriculumId, sectionId, videoId } = params;
  const [sections, setSections] = useState([]);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch all sections and their items
        const sectionData = await getCurriculumSections(curriculumId);
        setSections(Array.isArray(sectionData) ? sectionData : sectionData.data || []);
        // Fetch video details
        const res = await api.get(`/api/video/${videoId}`);
        setVideo(res.data.data || res.data);
      } catch (err) {
        setVideo(null);
      } finally {
        setLoading(false);
      }
    }
    if (curriculumId && videoId) fetchData();
  }, [curriculumId, videoId]);

  const handleNavigate = (item) => {
    if (item.type === 'video') {
      router.push(`/app/admin/curriculum/${curriculumId}/section/${item.sectionId}/video/${item.contentReferenceId || item.id}`);
    } else if (item.type === 'exercise') {
      router.push(`/admin/curriculum/${curriculumId}/section/${item.sectionId}/exercise/${item.contentReferenceId || item.id}`);
    } // Add more types as needed
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: 320, background: '#f8f9fa', borderRight: '1px solid #e5e7eb', padding: 24, overflowY: 'auto' }}>
        <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Curriculum Sections</h2>
        {sections.map(section => (
          <div key={section.id} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{section.title}</div>
            <ul style={{ marginLeft: 12, marginTop: 4 }}>
              {(section.items || []).map(item => (
                <li key={item.id} style={{ margin: '6px 0', cursor: 'pointer', color: item.type === 'video' ? '#2563eb' : '#111' }}
                  onClick={() => handleNavigate({ ...item, sectionId: section.id })}>
                  {item.type === 'video' ? '▶️ ' : ''}{item.title}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
      {/* Main Video Content */}
      <main style={{ flex: 1, padding: 32 }}>
        {loading ? (
          <div>Loading video...</div>
        ) : video ? (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{video.title || 'Video'}</h1>
            {/* Use the actual VideoPlayer component for playback */}
            <VideoPlayer contentId={videoId} />
            <div style={{ marginTop: 24 }}>{video.description}</div>
          </div>
        ) : (
          <div>Video not found.</div>
        )}
      </main>
    </div>
  );
} 