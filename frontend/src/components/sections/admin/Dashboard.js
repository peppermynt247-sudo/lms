'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  Award, 
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Play,
  FileText,
  MessageSquare,
  Star,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    totalViews: 0,
    userGrowth: 0,
    courseGrowth: 0,
    revenueGrowth: 0,
    viewGrowth: 0
  });

  const [recentActivities, setRecentActivities] = useState([]); // Placeholder for real data

  const [topCourses, setTopCourses] = useState([]); // Placeholder for real data

  const [quickStats, setQuickStats] = useState([]); // Placeholder for real data

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 text-blue-600',
      green: 'bg-green-500 text-green-600',
      purple: 'bg-purple-500 text-purple-600',
      orange: 'bg-orange-500 text-orange-600',
      yellow: 'bg-yellow-500 text-yellow-600'
    };
    return colors[color] || colors.blue;
  };

  const handleViewAllActivities = () => {
    router.push('/admin/activities');
  };

  const handleViewAllCourses = () => {
    router.push('/admin/courses');
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'addCourse':
        router.push('/admin/courses');
        break;
      case 'manageUsers':
        router.push('/admin/users/learners');
        break;
      case 'certificates':
        router.push('/admin/certificates');
        break;
      case 'analytics':
        router.push('/admin/analytics');
        break;
      default:
        break;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your platform today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.changeType === 'positive' ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${getColorClasses(stat.color)} bg-opacity-10`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

     {/*
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
            <button 
              onClick={handleViewAllActivities}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              View all
            </button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`p-2 rounded-lg ${getColorClasses(activity.color)} bg-opacity-10 flex-shrink-0`}>
                  <activity.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    by {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

       
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Top Courses</h2>
            <button 
              onClick={handleViewAllCourses}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              View all
            </button>
          </div>
          <div className="space-y-4">
            {topCourses.map((course) => (
              <div key={course.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {course.students} students • {course.rating} ⭐
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">${course.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>*/}

      {/* Additional Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleQuickAction('addCourse')}
              className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Add Course</span>
            </button>
            <button 
              onClick={() => handleQuickAction('manageUsers')}
              className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer"
            >
              <Users className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Manage Users</span>
            </button>
            <button 
              onClick={() => handleQuickAction('certificates')}
              className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors cursor-pointer"
            >
              <Award className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Certificates</span>
            </button>
            <button 
              onClick={() => handleQuickAction('analytics')}
              className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors cursor-pointer"
            >
              <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Analytics</span>
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-900">Server Status</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-900">Database</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-900">Video Service</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900">Storage</span>
              </div>
              <span className="text-sm text-yellow-600 font-medium">75% Used</span>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations Usage Section */}
      <div className="mb-12 mt-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Integrations Usage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {[
            { name: 'Mailgun', icon: '📧' },
            { name: 'Judge0', icon: '💻' },
            { name: 'VdoCipher', icon: '🎬' },
            { name: 'Google Drive', icon: '☁️' }
          ].map(service => (
            <div key={service.name} className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center min-h-[160px]">
              <div className="text-4xl text-gray-300 mb-2">{service.icon}</div>
              <div className="font-semibold text-gray-700 mb-1">{service.name}</div>
              <div className="text-gray-400 text-sm">No data yet</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}