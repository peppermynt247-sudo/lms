"use client";
import React, { useState } from 'react';
import { Search, ChevronDown, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';

const LearnersTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Admitted');
  const [selectedCourse, setSelectedCourse] = useState('Java');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedLearners, setSelectedLearners] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Sample learner data
  const learners = [
    {
      id: 16,
      name: 'Narendra Kumar Sharma',
      initial: 'N',
      email: 'sharmarendra417@gmail.com',
      phone: '+91 9685907435',
      enrolledOn: '25 May 2025',
      attendance: 0,
      attendanceRatio: '0/0/0',
      progress: 0
    },
    {
      id: 16,
      name: 'Sane Babul Reddy',
      initial: 'S',
      email: 'babulreddy369@gmail.com',
      phone: '+91 6360874692',
      enrolledOn: '25 May 2025',
      attendance: 0,
      attendanceRatio: '0/0/0',
      progress: 0
    },
    {
      id: 15,
      name: 'Prajwal S',
      initial: 'P',
      email: 'prajwalkkp03@gmail.com',
      phone: '+91 7204264430',
      enrolledOn: '20 May 2025',
      attendance: 0,
      attendanceRatio: '0/0/0',
      progress: 5
    },
    {
      id: 'AE',
      name: 'MOHITH BN',
      initial: 'M',
      email: 'mohithbn8888@gmail.com',
      phone: '+91 9731371397',
      enrolledOn: '13 May 2025',
      attendance: 0,
      attendanceRatio: '0/0/0',
      progress: 0
    },
    {
      id: 12,
      name: 'Nandhini H S',
      initial: 'N',
      email: 'nandhinihs143@gmail.com',
      phone: '+91 6366881103',
      enrolledOn: '28 Nov 2024',
      attendance: 0,
      attendanceRatio: '0/0/0',
      progress: 0
    },
    {
      id: 12,
      name: 'Amrita Roy',
      initial: 'A',
      email: 'royamrita211@gmail.com',
      phone: '+91 8697401493',
      enrolledOn: '26 Nov 2024',
      attendance: 0,
      attendanceRatio: '0/0/0',
      progress: 25
    },
    {
      id: 15,
      name: 'TPO SRIT',
      initial: 'R',
      email: 'tpo@srit.ac.in',
      phone: '+91 9515711111',
      enrolledOn: '08 Nov 2024',
      attendance: 0,
      attendanceRatio: '0/1/1',
      progress: 0
    }
  ];

  const totalItems = 40;

  const handleSelectLearner = (learnerId) => {
    setSelectedLearners(prev => 
      prev.includes(learnerId) 
        ? prev.filter(id => id !== learnerId)
        : [...prev, learnerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLearners.length === learners.length) {
      setSelectedLearners([]);
    } else {
      setSelectedLearners(learners.map((_, index) => index));
    }
  };

  const handleDropdownToggle = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const ProgressBar = ({ progress }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-200"
        style={{ width: `${progress}%` }}
      />
    </div>
  );

  const AttendanceIndicator = ({ detail, percentage }) => {
    const hasAttendance = detail !== "0/0/0";
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-900">{percentage}%</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{detail}</span>
          {hasAttendance && (
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Top Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200">
                <span className="font-medium text-gray-900">{selectedStatus}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                {totalItems}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="search by Name, Email, Mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Course Filter */}
            <div className="relative">
              <select 
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              >
                <option value="Java">Java</option>
                <option value="Python">Python</option>
                <option value="React">React</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Actions Button */}
            <button className="flex items-center space-x-2 px-4 py-2 border text-black rounded hover:bg-blue-700 transition-colors duration-200">
              <span>Actions</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-12 px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedLearners.length === learners.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-white border border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 min-w-[200px]">
                    Learner name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                    Contact Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                    <div className="flex items-center space-x-1">
                      <span>Enrolled On</span>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                    Attendance
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {learners.map((learner, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedLearners.includes(index)}
                        onChange={() => handleSelectLearner(index)}
                        className="w-4 h-4 text-blue-600 bg-white border border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        
                        <div>
                          <div className="text-sm font-medium text-gray-900">{learner.name}</div>
                          <div className="text-sm text-gray-500">#{learner.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-gray-900">{learner.email}</span>
                        <span className="text-sm text-gray-500">{learner.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{learner.enrolledOn}</span>
                    </td>
                    <td className="px-6 py-4">
                      <AttendanceIndicator detail={learner.attendanceRatio} percentage={learner.attendance} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-[80px]">
                          <ProgressBar progress={learner.progress} />
                        </div>
                        <span className="text-sm font-medium text-gray-900 min-w-[3rem]">
                          {learner.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => handleDropdownToggle(learner.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>
                        {activeDropdown === learner.id && (
                          <div className="absolute right-0 top-8 z-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                              Reset Password
                            </button>
                            <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 transition-colors duration-200">
                              Archive
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            1-{Math.min(itemsPerPage, totalItems)} of {totalItems} items
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                className="p-2 hover:bg-gray-100 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <div className="flex items-center gap-1">
                <button className="px-3 py-3 bg-blue text-white rounded transition-colors duration-200">
                  1
                </button>
              </div>
              <button
                disabled={currentPage * itemsPerPage >= totalItems}
                className="p-2 hover:bg-gray-100 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
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
      </div>
    </div>
  );
};

export default LearnersTable;