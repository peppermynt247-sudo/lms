import React from 'react';
import { 
  CheckCircleIcon, 
  AcademicCapIcon, 
  DocumentTextIcon,
  TrophyIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';

const RecentActivity = ({ recentActivities }) => {
  const getActivityIcon = (type) => {
    const iconMap = {
      lesson_completed: CheckCircleIcon,
      quiz_completed: AcademicCapIcon,
      assignment_submitted: DocumentTextIcon,
      course_completed: TrophyIcon
    };
    return iconMap[type] || CheckCircleIcon;
  };

  const getActivityColor = (type) => {
    const colorMap = {
      lesson_completed: 'text-success',
      quiz_completed: 'text-info',
      assignment_submitted: 'text-warning',
      course_completed: 'text-primary'
    };
    return colorMap[type] || 'text-content';
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border p-6">
      <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center space-x-2">
        <SparklesIcon className="h-5 w-5 text-primary" />
        <span>Recent Activity</span>
      </h3>
      <div className="space-y-3">
        {recentActivities.map((activity) => {
          const IconComponent = getActivityIcon(activity.type);
          const color = getActivityColor(activity.type);
          
          return (
            <div key={activity.id} className="flex items-start space-x-3 p-3 bg-body-bg-1 rounded-lg">
              <div className={`p-2 rounded-lg bg-white`}>
                <IconComponent className={`h-4 w-4 ${color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-secondary">{activity.title}</p>
                <p className="text-xs text-content">{activity.course}</p>
                <p className="text-xs text-light-grey">{formatDateTime(activity.timestamp)}</p>
                {activity.description && (
                  <p className="text-xs text-content mt-1">{activity.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;
