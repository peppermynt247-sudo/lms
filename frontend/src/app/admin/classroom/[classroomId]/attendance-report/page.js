'use client';

import { useState } from 'react';
import { Calendar, Search, Download, Filter, Users, Clock, TrendingUp } from 'lucide-react';

export default function AttendancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('Java');
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Mock data for demonstration
  const mockAttendanceData = [
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', totalClasses: 20, attended: 18, percentage: 90 },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', totalClasses: 20, attended: 16, percentage: 80 },
    { id: 3, name: 'Mike Johnson', email: 'mike.johnson@example.com', totalClasses: 20, attended: 19, percentage: 95 },
    { id: 4, name: 'Sarah Wilson', email: 'sarah.wilson@example.com', totalClasses: 20, attended: 15, percentage: 75 },
    { id: 5, name: 'David Brown', email: 'david.brown@example.com', totalClasses: 20, attended: 17, percentage: 85 },
  ];

  const handleViewAttendance = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAttendanceData(mockAttendanceData);
      setShowResults(true);
      setLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    // Export functionality would be implemented here
    alert('Export functionality would be implemented here');
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const filteredData = attendanceData.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className=" ">
      

      <div className="max-w-7xl mx-auto">
        {/* Filters Section */}
        <div className="mb-10 ">
        

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search Learners By Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Start Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                placeholder="Start date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* End Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                placeholder="End date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Course Selection */}
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
            >
              <option value="Java">Java</option>
              <option value="Python">Python</option>
              <option value="JavaScript">JavaScript</option>
              <option value="React">React</option>
              <option value="Node.js">Node.js</option>
            </select>
          </div>

          {/* <div className="flex gap-3 mt-6">
            <button
              onClick={handleViewAttendance}
              disabled={loading}
              className="bg-blue hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  View Attendance
                </>
              )}
            </button>
            
            {showResults && (
              <button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>
            )}
          </div> */}
        </div>

        {/* Results Section */}
        {showResults ? (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Summary Stats */}
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{filteredData.length}</div>
                  <div className="text-sm text-gray-600">Total Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(filteredData.reduce((acc, s) => acc + s.percentage, 0) / filteredData.length)}%
                  </div>
                  <div className="text-sm text-gray-600">Average Attendance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {filteredData.filter(s => s.percentage >= 90).length}
                  </div>
                  <div className="text-sm text-gray-600">Excellent (≥90%)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {filteredData.filter(s => s.percentage < 75).length}
                  </div>
                  <div className="text-sm text-gray-600">Below Average (&lt;75%)</div>
                </div>
              </div>
            </div>

            {/* Table Header */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                Attendance Report
                <span className="text-sm font-normal text-gray-500">
                  ({startDate} to {endDate})
                </span>
              </h3>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Student</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Email</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Classes Attended</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Total Classes</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Attendance %</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((student, index) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                            {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div className="font-medium text-gray-900">{student.name}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{student.email}</td>
                      <td className="py-4 px-6 text-center font-semibold">{student.attended}</td>
                      <td className="py-4 px-6 text-center">{student.totalClasses}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getAttendanceColor(student.percentage)}`}>
                          {student.percentage}%
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          student.percentage >= 90 ? 'text-green-700 bg-green-100' :
                          student.percentage >= 75 ? 'text-yellow-700 bg-yellow-100' :
                          'text-red-700 bg-red-100'
                        }`}>
                          {student.percentage >= 90 ? 'Excellent' :
                           student.percentage >= 75 ? 'Good' : 'Poor'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No students found matching your search criteria.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center">
              <Calendar className="w-12 h-12 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to View Attendance</h3>
            <p className="text-gray-500 mb-6">Please select a date range to view the attendance records</p>
           
          </div>
        )}
      </div>
    </div>
  );
}