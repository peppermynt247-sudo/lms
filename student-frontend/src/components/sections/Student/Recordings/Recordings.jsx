"use client";
import React, { useState, useEffect } from 'react';
import { getDashboardSessions } from '@/services/sessionService';
import { VideoCameraIcon, PlayCircleIcon, ClockIcon, CalendarIcon, VideoCameraSlashIcon, BookOpenIcon } from '@heroicons/react/24/outline';

const Recordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        setLoading(true);
        const res = await getDashboardSessions();
        if (res.success && res.data) {
          // Flatten all recordings from COMPLETED sessions into a single array
          const allRecordings = [];
          res.data.forEach(session => {
            if (session.status === 'COMPLETED' && session.recordings && session.recordings.length > 0) {
              session.recordings.forEach(rec => {
                allRecordings.push({
                  ...rec,
                  sessionTitle: session.title,
                  courseTitle: session.courseTitle,
                  batchName: session.batchName
                });
              });
            }
          });
          
          // Sort by recordedAt descending
          allRecordings.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
          
          setRecordings(allRecordings);
        } else {
          setRecordings([]);
        }
      } catch (err) {
        console.error("Failed to load recordings", err);
        setError("Unable to load recordings at this time. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecordings();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600 font-medium">Loading your recordings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">



      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl flex items-center gap-3">
          <VideoCameraIcon className="w-8 h-8 text-primary shrink-0" /> 
          My Recordings
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Watch recordings from your completed live sessions across all enrolled courses.
        </p>
      </div>

      {recordings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recordings.map((rec) => (
            <div key={rec.recordingId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col relative">
                {/* Duration Badge directly on the card upper right */}
                {rec.durationSeconds > 0 && (
                  <div className="absolute top-4 right-4 bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1 rounded flex items-center gap-1 border border-gray-200">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {Math.round(rec.durationSeconds / 60)} min
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-3 pr-20">
                  <VideoCameraIcon className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {rec.title || 'Session Recording'}
                  </h3>
                </div>

                <div className="space-y-3 mt-auto pt-2">
                  {/* Context Info */}
                  <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-md">
                     <BookOpenIcon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                     <span className="line-clamp-2">
                       <span className="font-semibold text-gray-700">{rec.courseTitle}</span>
                       <span className="text-gray-400 mx-1.5">•</span>
                       <span className="text-gray-500">{rec.sessionTitle}</span>
                     </span>
                  </div>

                  {/* Date & Password Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      {new Date(rec.recordedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    {rec.recordingPassword && (
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold tracking-wide uppercase flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Protected
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Card Footer */}
              <div className="p-4 pt-0 mt-auto bg-white border-t border-gray-50">
                 <a 
                   href={rec.recordingUrl} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="w-full mt-3 inline-flex justify-center items-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-primary hover:bg-opacity-90 transition-all group-hover:shadow-md"
                 >
                   <PlayCircleIcon className="w-5 h-5 mr-1.5" /> View Recording
                 </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-16 px-6 text-center max-w-2xl mx-auto mt-8">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-100">
            <VideoCameraSlashIcon className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No recordings found</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            You don't have any recordings available yet. Once your live sessions are completed and the instructors upload the recordings, they will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default Recordings;
