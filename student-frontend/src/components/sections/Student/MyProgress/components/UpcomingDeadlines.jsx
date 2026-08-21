import React from 'react';
import { CalendarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const UpcomingDeadlines = ({ upcomingDeadlines }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-error border-error bg-error bg-opacity-10';
      case 'medium': return 'text-warning border-warning bg-warning bg-opacity-10';
      case 'low': return 'text-success border-success bg-success bg-opacity-10';
      default: return 'text-neutral border-neutral bg-neutral bg-opacity-10';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'assignment' ? '📝' : '📊';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilDue = (dateString) => {
    const due = new Date(dateString);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due Today';
    if (diffDays === 1) return 'Due Tomorrow';
    return `${diffDays} days left`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border p-6">
      <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center space-x-2">
        <CalendarIcon className="h-5 w-5 text-primary" />
        <span>Upcoming Deadlines</span>
      </h3>
      <div className="space-y-3">
        {upcomingDeadlines.map((deadline) => (
          <div key={deadline.id} className={`p-3 border-l-4 rounded-r-lg ${getPriorityColor(deadline.priority)}`}>
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-2">
                <span className="text-lg">{getTypeIcon(deadline.type)}</span>
                <div>
                  <h4 className="font-semibold text-secondary text-sm">{deadline.title}</h4>
                  <p className="text-xs text-content">{deadline.course}</p>
                  <p className="text-xs text-light-grey">Due: {formatDate(deadline.due_date)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs font-medium ${
                  deadline.priority === 'high' ? 'text-error' :
                  deadline.priority === 'medium' ? 'text-warning' :
                  'text-success'
                }`}>
                  {getDaysUntilDue(deadline.due_date)}
                </p>
                {deadline.priority === 'high' && getDaysUntilDue(deadline.due_date).includes('Today') && (
                  <ExclamationTriangleIcon className="h-4 w-4 text-error mt-1" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingDeadlines;
