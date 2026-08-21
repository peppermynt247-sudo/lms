"use client";
import React, { useState, useEffect } from 'react';
import {
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  VideoCameraIcon,
  XCircleIcon,
  PlayCircleIcon,
  CalendarIcon,
  VideoCameraSlashIcon
} from '@heroicons/react/24/outline';
import StatCard from './components/StatCard';
import CourseCard from '@/components/shared/Cards/CourseCard';
import { getDashboardSessions } from '@/services/sessionService';

const MyProgress = () => {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [filterRange, setFilterRange] = useState('all'); // 'all', 'today', 'tomorrow', 'thisWeek', 'lastWeek', 'month'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);


  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const data = await getDashboardSessions();
        if (data && data.success) {
          setSessions(Array.isArray(data.data) ? data.data : []);
          setCourses(Array.isArray(data.courses) ? data.courses : []);
          setBundles(Array.isArray(data.bundles) ? data.bundles : []);
        } else {
          setSessions([]);
          setCourses([]);
          setBundles([]);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard sessions", err);
        setError("Failed to load live sessions data.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const totalSessions = sessions.length;
  const scheduledCount = sessions.filter(s => s.status === 'SCHEDULED').length;
  const liveCount = sessions.filter(s => s.status === 'LIVE').length;
  const completedCount = sessions.filter(s => s.status === 'COMPLETED').length;
  const cancelledCount = sessions.filter(s => s.status === 'CANCELLED').length;

  // Filtering Logic
  const getFilteredSessions = () => {
    let result = [...sessions];

    // 1. Search Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(session =>
        (session.title?.toLowerCase().includes(term)) ||
        (session.courseTitle?.toLowerCase().includes(term)) ||
        (session.batchName?.toLowerCase().includes(term))
      );
    }

    // 2. Status Filter
    if (filterStatus !== 'all') {
      result = result.filter(session => session.status === filterStatus);
    }

    // 3. Date Range Filter
    if (filterRange !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const tomorrowStart = todayStart + (24 * 60 * 60 * 1000);
      const dayAfterTomorrow = tomorrowStart + (24 * 60 * 60 * 1000);
      const lastWeek = todayStart - (7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const endOfWeek = todayStart + (7 * 24 * 60 * 60 * 1000);

      result = result.filter(session => {
        const sessionDate = new Date(session.scheduledAt).getTime();

        if (filterRange === 'today') {
          return sessionDate >= todayStart && sessionDate < tomorrowStart;
        }
        if (filterRange === 'tomorrow') {
          return sessionDate >= tomorrowStart && sessionDate < dayAfterTomorrow;
        }
        if (filterRange === 'thisWeek') {
          return sessionDate >= todayStart && sessionDate < endOfWeek;
        }
        if (filterRange === 'lastWeek') {
          return sessionDate >= lastWeek && sessionDate < todayStart;
        }
        if (filterRange === 'month') {
          return sessionDate >= startOfMonth;
        }
        return true;
      });
    }

    return result;
  };


  const filteredSessions = getFilteredSessions();
  const displayedSessions = showAll ? filteredSessions : filteredSessions.slice(0, 5);


  const StatusBadge = ({ status, className = "" }) => (
    <span
      className={`px-2 py-0.5 inline-flex text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-full ${
        status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
          status === 'LIVE' ? 'bg-green-50 text-green-700 border border-green-100' :
            status === 'COMPLETED' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
              status === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-100' :
                'bg-gray-100 text-gray-700'
        } ${className}`}
    >
      {status}
    </span>
  );

  const getActionButtons = (session, isMobile = false) => {
    const btnClass = `inline-flex items-center justify-center px-4 py-2 sm:px-3 sm:py-1.5 border border-transparent text-xs font-bold rounded-xl shadow-sm text-white transition-all duration-150 hover:opacity-90 active:scale-95 w-full sm:w-auto`;

    if (session.status === 'SCHEDULED') {
      try {
        const startTime = new Date(session.scheduledAt);
        const endTime = new Date(startTime.getTime() + (session.durationMinutes * 60000));
        const formatTime = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');

        const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(session.title)}&dates=${formatTime(startTime)}/${formatTime(endTime)}&details=${encodeURIComponent('Live Session: ' + session.courseTitle + ' (' + session.batchName + ')')}&location=Online`;

        return (
          <a
            href={googleCalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btnClass} bg-[#0c63e4]`}
          >
            <CalendarIcon className="w-4 h-4 mr-1.5" /> Add to Calendar
          </a>
        );
      } catch (e) {
        return <span className="text-gray-400 text-xs text-center w-full block">Invalid Date</span>;
      }
    } else if (session.status === 'LIVE') {
      if (session.joinUrlAvailable && session.zoomJoinUrl) {
        return (
          <a
            href={session.zoomJoinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btnClass} bg-green-600`}
          >
            <PlayCircleIcon className="w-4 h-4 mr-1.5 animate-pulse" /> Join Live
          </a>
        );
      } else {
        return (
          <button
            disabled
            className={`${btnClass} bg-gray-400 opacity-60 cursor-not-allowed`}
          >
            <PlayCircleIcon className="w-4 h-4 mr-1.5" /> Not Started
          </button>
        );
      }
    } else if (session.status === 'COMPLETED') {
      return (
        <button
          onClick={() => setSelectedSession(session)}
          className={`${btnClass} bg-[#1a2b4e]`}
        >
          <VideoCameraIcon className="w-4 h-4 mr-1.5" /> View Recording
        </button>
      );
    } else if (session.status === 'CANCELLED') {
      return (
        <div className="flex items-center justify-center text-[11px] font-bold text-red-500 uppercase tracking-wide gap-1 w-full sm:w-auto py-1.5">
          <VideoCameraSlashIcon className="w-4 h-4" /> Cancelled
        </div>
      );
    }
    return <span className="text-gray-400 text-xs">No Action</span>;
  };


  if (loading) {
    const cardShadow = { boxShadow: "0 1px 6px -1px rgba(26,43,78,0.07)" };
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gray-50">
        {/* Header */}
        <div className="mb-6 border-b border-gray-100 pb-4 space-y-2">
          <div className="sk h-6 rounded-lg w-36" />
          <div className="sk h-3.5 rounded w-96 max-w-full" />
        </div>

        {/* Quick info bar */}
        <div className="mb-5 rounded-2xl bg-white border border-gray-100 p-4" style={cardShadow}>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="sk h-3.5 rounded w-52" />
            <div className="sk h-3.5 rounded w-44" />
            <div className="sk h-3.5 rounded w-24" />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2" style={cardShadow}>
              <div className="sk h-4 w-4 rounded" />
              <div className="sk h-3 rounded w-3/4" />
              <div className="sk h-6 rounded w-10" />
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={cardShadow}>
          {/* Filter header */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="sk h-4 rounded w-32" />
              <div className="flex gap-3">
                <div className="sk h-8 rounded-xl w-52" />
                <div className="sk h-8 rounded-xl w-28" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="sk h-7 rounded-lg w-16" />
              ))}
            </div>
          </div>

          {/* Table rows — desktop */}
          <div className="hidden md:block">
            <div className="flex gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
              {['w-6', 'flex-1', 'w-32', 'w-24', 'w-14', 'w-20', 'w-28'].map((w, i) => (
                <div key={i} className={`sk h-3 rounded ${w}`} />
              ))}
            </div>
            <div className="divide-y divide-gray-50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 px-5 py-4 items-center">
                  <div className="sk h-3.5 rounded w-5 flex-shrink-0" />
                  <div className="sk h-3.5 rounded flex-1" />
                  <div className="sk h-3.5 rounded w-32" />
                  <div className="sk h-3.5 rounded w-24" />
                  <div className="sk h-3.5 rounded w-10" />
                  <div className="sk h-5 rounded-full w-20" />
                  <div className="sk h-8 rounded-xl w-28" />
                </div>
              ))}
            </div>
          </div>

          {/* Mobile rows */}
          <div className="md:hidden divide-y divide-gray-100">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="flex justify-between">
                  <div className="sk h-4 rounded w-3/5" />
                  <div className="sk h-5 rounded-full w-20" />
                </div>
                <div className="sk h-3 rounded w-2/5" />
                <div className="sk h-9 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 flex justify-center items-center">
        <div className="text-xl text-red-500 font-semibold">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gray-50/50">
      <div className="w-full">

        {/* Header */}
        <div className="mb-6 border-b border-gray-100 pb-4">
          <h1 className="text-xl font-bold text-[#1a2b4e] mb-1">Live Sessions</h1>
          <p className="text-xs text-gray-400">Scheduled, live, and completed sessions across all your batches.</p>
        </div>


        {/* Stats Grid - Responsive columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">

          <StatCard
            icon={BookOpenIcon}
            title="Total"
            value={totalSessions}
            color="text-primary"
          />
          <StatCard
            icon={ClockIcon}
            title="Scheduled"
            value={scheduledCount}
            color="text-blue-500"
          />
          <StatCard
            icon={VideoCameraIcon}
            title="Live"
            value={liveCount}
            color="text-green-500"
          />
          <StatCard
            icon={CheckCircleIcon}
            title="Completed"
            value={completedCount}
            color="text-gray-500"
          />
          <StatCard
            icon={XCircleIcon}
            title="Cancelled"
            value={cancelledCount}
            color="text-red-500"
          />
        </div>

        {/* Sessions Table Area */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mt-5 pb-2"
          style={{ boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" }}>
          {/* Enhanced Filter Header */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-800">Your Sessions</h2>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[200px] lg:flex-none lg:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search sessions..."
                    className="block w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-primary focus:border-primary transition bg-white"
                  />
                </div>

                {/* Status Dropdown */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-primary focus:border-primary transition bg-white text-gray-700"
                >
                  <option value="all">All Status</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="LIVE">Live Now</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Date Range Controls - Horizontal scroll on mobile */}
            <div className="mt-4 -mx-1 overflow-x-auto no-scrollbar pb-1">
              <div className="flex items-center bg-gray-100/60 p-1 rounded-lg w-max sm:w-fit whitespace-nowrap min-w-full sm:min-w-0">
                {[
                  { id: 'all', label: 'All Dates' },
                  { id: 'today', label: 'Today' },
                  { id: 'tomorrow', label: 'Tomorrow' },
                  { id: 'thisWeek', label: 'This Week' },
                  { id: 'lastWeek', label: 'Last Week' },
                  { id: 'month', label: 'This Month' }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      setFilterRange(filter.id);
                      setShowAll(false);
                    }}
                    className={`px-3 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${
                      filterRange === filter.id 
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Table - Hidden on Mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="text-left text-xs font-semibold tracking-wide text-gray-500 uppercase border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Session Title</th>
                  <th className="px-5 py-3">Course / Batch</th>
                  <th className="px-5 py-3">Scheduled At</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayedSessions.length > 0 ? (
                  displayedSessions.map((session, index) => (
                    <tr key={session.sessionId || index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-sm font-semibold text-gray-800">{session.title}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-sm text-gray-800">{session.courseTitle}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{session.batchName}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-sm text-gray-800">
                          {new Date(session.scheduledAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {session.durationMinutes}m
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={session.status} />
                      </td>
                      <td className="px-5 py-3 text-center align-middle">
                        <div className="flex justify-center">
                          {getActionButtons(session)}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-5 py-8 text-center text-sm text-gray-500">
                      No sessions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List - Shown only on small screens */}
          <div className="md:hidden divide-y divide-gray-100">
            {displayedSessions.length > 0 ? (
              displayedSessions.map((session, index) => (
                <div key={session.sessionId || index} className="p-4 bg-white active:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 pr-2">
                      <h3 className="text-sm font-bold text-gray-800 leading-tight mb-1">{session.title}</h3>
                      <div className="text-[11px] text-gray-500 uppercase tracking-tight font-medium">
                        {session.courseTitle} • {session.batchName}
                      </div>
                    </div>
                    <StatusBadge status={session.status} className="shrink-0" />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-4 bg-gray-50 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 flex-1 break-all">
                      <CalendarIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">
                        {new Date(session.scheduledAt).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                      <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span>{session.durationMinutes}m</span>
                    </div>
                  </div>

                  <div className="flex justify-stretch">
                    <div className="w-full">
                      {getActionButtons(session, true)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 px-4 text-center">
                <p className="text-sm text-gray-500 mt-2">No sessions found for the selected filters.</p>
              </div>
            )}
          </div>


          {/* View More Button */}
          {filteredSessions.length > 5 && (
            <div className="px-5 py-4 border-t border-gray-50 bg-gray-50/30 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center text-sm font-semibold text-primary hover:text-orange-600 transition-colors"
              >
                {showAll ? (
                  <>Show Less Sessions</>
                ) : (
                  <>View More ({filteredSessions.length - 5} more sessions)</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enrolled course cards when sessions unavailable */}
      {sessions.length === 0 && (courses.length > 0 || bundles.length > 0) && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Your Enrolled Courses</h2>
            <span className="text-sm text-gray-500">{courses.length + bundles.length} items</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <CourseCard key={`course-${course.courseId}`} item={course} isBundle={false} />
            ))}
            {bundles.map((bundle) => (
              <CourseCard key={`bundle-${bundle.bundleId}`} item={bundle} isBundle={true} />
            ))}
          </div>
        </div>
      )}

      {/* Recordings Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-800 truncate pr-4">
                Recordings: {selectedSession.title}
              </h3>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-white flex-1 min-h-[200px]">
              {selectedSession.recordings && selectedSession.recordings.length > 0 ? (
                <div className="space-y-4">
                  {selectedSession.recordings.map((rec) => (
                    <div
                      key={rec.recordingId}
                      className="group border border-gray-200 rounded-lg p-4 bg-white hover:border-primary/50 hover:shadow-sm transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <VideoCameraIcon className="w-5 h-5 text-primary" />
                          <h4 className="font-medium text-gray-800 text-sm line-clamp-1">
                            {rec.title || 'Session Recording'}
                          </h4>
                        </div>
                        <div className="text-xs text-gray-500 mt-2 flex gap-4 ml-7">
                          {rec.durationSeconds > 0 && (
                            <span className="flex items-center gap-1">
                              <ClockIcon className="w-3.5 h-3.5" />
                              {Math.round(rec.durationSeconds / 60)} min
                            </span>
                          )}
                          {rec.recordedAt && (
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              {new Date(rec.recordedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                          {rec.recordingPassword && (
                            <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded text-[10px] font-medium tracking-wide string">
                              Protected
                            </span>
                          )}
                        </div>
                      </div>

                      <a
                        href={rec.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md text-white bg-primary hover:bg-orange-600 transition-colors"
                      >
                        <PlayCircleIcon className="w-4 h-4 mr-1.5" /> Watch
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-8">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <VideoCameraSlashIcon className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">No recordings available</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-[200px]">The instructor hasn't uploaded any recordings for this session yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProgress;
