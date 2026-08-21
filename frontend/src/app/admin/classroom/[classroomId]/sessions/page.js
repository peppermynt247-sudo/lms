"use client";
import React, { useState } from 'react';
import { ChevronDown, Clock, X, Check, AlertTriangle, Info, Calendar, Folder } from 'lucide-react';

const SessionsPage = () => {
  const [selectedCourse, setSelectedCourse] = useState('Java');
  const [startDate, setStartDate] = useState('28/05/2025');
  const [endDate, setEndDate] = useState('30/05/2025');

  // Sample sessions data (empty for "No data" state)
  const sessions = [];

  // Statistics
  const stats = {
    scheduled: 0,
    cancelled: 0,
    inTimeSignIns: 0,
    notSignedIn: 0,
    avgAttendance: '0%'
  };

  const StatCard = ({ icon: Icon, title, value, color, bgColor }) => (
    <div className="bg-white rounded border border-gray-200 p-2 flex items-center space-x-3">
      <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <div className="text-lg font-semibold text-gray-900">{value}</div>
      </div>
    </div>
  );

  const NoDataState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Folder className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No data</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm">
        No sessions found for the selected date range and course.
      </p>
    </div>
  );

  return (
    <div className="  min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl  ">Sessions</h1>
          
          <div className="flex items-center space-x-4">
            {/* Course Filter */}
            <div className="relative">
              <select 
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white min-w-[120px]"
              >
                <option value="Java">Java</option>
                <option value="Python">Python</option>
                <option value="React">React</option>
                <option value="JavaScript">JavaScript</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Date Range Picker */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <input
                  type="text"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-32"
                  placeholder="Start date"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <span className="text-gray-400">→</span>
              <div className="relative">
                <input
                  type="text"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-32"
                  placeholder="End date"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6  p-4 rounded">
          <StatCard
            icon={Clock}
            title="Scheduled"
            value={stats.scheduled}
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
          <StatCard
            icon={X}
            title="Cancelled"
            value={stats.cancelled}
            color="text-red-600"
            bgColor="bg-red-100"
          />
          <StatCard
            icon={Check}
            title="In-time sign-ins"
            value={stats.inTimeSignIns}
            color="text-green-600"
            bgColor="bg-green-100"
          />
          <StatCard
            icon={AlertTriangle}
            title="Not signed-in"
            value={stats.notSignedIn}
            color="text-orange-600"
            bgColor="bg-orange-100"
          />
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-900 mb-1">Avg. Attendance</div>
            <div className="text-2xl font-bold text-gray-900">{stats.avgAttendance}</div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Sr</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Sessions</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      <div className="flex items-center space-x-1">
                        <span>Attendance</span>
                        <Info className="w-4 h-4 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Topics</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Sessions would be mapped here */}
                </tbody>
              </table>
            </div>
          ) : (
            <NoDataState />
          )}
        </div>

        {/* Pagination - Hidden when no data */}
        {sessions.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              0-0 of 0 items
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  disabled
                  className="p-2 hover:bg-gray-100 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <div className="flex items-center gap-1">
                  <button className="px-3 py-2 bg-blue-600 text-white rounded transition-colors duration-200">
                    1
                  </button>
                </div>
                <button
                  disabled
                  className="p-2 hover:bg-gray-100 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">/ page</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsPage;