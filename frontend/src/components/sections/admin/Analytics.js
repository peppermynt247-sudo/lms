'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@utils/api';
import { 
  Calendar,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedDate, setSelectedDate] = useState('28-07-2025');
  const [activeTab, setActiveTab] = useState('enrollments');

  const [analyticsData, setAnalyticsData] = useState(null);
  // Use fetched analyticsData for charts
  const courseData = analyticsData?.courseGraphData || [];
  const enrollmentData = analyticsData?.enrollmentGraphData || [];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Make fetchAnalytics reusable
  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/analytics/overview');
      if (res.data && res.data.success) {
        setAnalyticsData(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Example: Call fetchAnalytics after a successful action
  // async function handleUpdateAction() {
  //   await api.put('/api/analytics/update', payload);
  //   await fetchAnalytics(); // Refresh UI
  // }


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        </div>
        <p className="text-gray-600 ml-12">Track your platform performance and user engagement</p>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : analyticsData?.numberOfStudents ?? 0}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        {/* Total Courses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : analyticsData?.numberOfCourses ?? 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        {/* Total Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${loading ? '...' : analyticsData?.totalRevenue ?? 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        {/* Total Bundles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bundles</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : analyticsData?.numberOfBundles ?? 0}</p>
            </div>
            <BookOpen className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        {/* Total Batches */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Batches</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : analyticsData?.numberOfBatches ?? 0}</p>
            </div>
            <CalendarIcon className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>


      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-white shadow-lg rounded-xl p-6 border border-gray-100 overflow-hidden">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Courses</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={courseData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  wrapperStyle={{
                    paddingTop: '5px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="course" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
                  name="Course" 
                />
                <Line 
                  type="monotone" 
                  dataKey="bundle" 
                  stroke="#ef4444" 
                  strokeWidth={2.5}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: '#ef4444', strokeWidth: 2 }}
                  name="Bundle Course" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="h-80 bg-white shadow-lg rounded-xl p-6 border border-gray-100 overflow-hidden">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Enrollments</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={enrollmentData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="enrollments" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


    </div>
  );
} 