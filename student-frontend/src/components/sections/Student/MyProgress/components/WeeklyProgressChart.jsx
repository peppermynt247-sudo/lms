import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const WeeklyProgressChart = ({ weeklyProgress }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-border p-6">
      <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center space-x-2">
        <ChartBarIcon className="h-5 w-5 text-primary" />
        <span>This Week's Learning Activity</span>
      </h3>
      <div className="flex items-end space-x-4 h-40 mb-4">
        {weeklyProgress.map((day, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full bg-body-bg-1 rounded-t-lg relative" style={{ height: '120px' }}>
              <div 
                className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ${
                  day.isToday ? 'bg-primary bg-opacity-50 border-2 border-primary border-dashed' : 'bg-primary'
                }`}
                style={{ height: `${Math.max((day.lessons / 5) * 100, 5)}%` }}
              ></div>
            </div>
            <div className="mt-2 text-center">
              <p className="text-xs font-medium text-secondary">{day.day}</p>
              <p className="text-xs text-content">{day.lessons} lessons</p>
              <p className="text-xs text-light-grey">{day.quizzes} quizzes</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-body-bg-1 rounded-lg p-3">
          <p className="text-sm font-medium text-secondary">Total Lessons</p>
          <p className="text-lg font-bold text-primary">{weeklyProgress.reduce((sum, day) => sum + day.lessons, 0)}</p>
        </div>
        <div className="bg-body-bg-1 rounded-lg p-3">
          <p className="text-sm font-medium text-secondary">Quizzes Taken</p>
          <p className="text-lg font-bold text-info">{weeklyProgress.reduce((sum, day) => sum + day.quizzes, 0)}</p>
        </div>
        <div className="bg-body-bg-1 rounded-lg p-3">
          <p className="text-sm font-medium text-secondary">Study Hours</p>
          <p className="text-lg font-bold text-warning">{weeklyProgress.reduce((sum, day) => sum + day.hours, 0).toFixed(1)}h</p>
        </div>
      </div>
    </div>
  );
};

export default WeeklyProgressChart;
