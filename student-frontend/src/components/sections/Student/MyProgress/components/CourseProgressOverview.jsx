import React from 'react';
import { BookOpenIcon, PlayIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid, AcademicCapIcon as AcademicCapIconSolid } from '@heroicons/react/24/solid';

const CourseProgressOverview = ({ enrolledCourses }) => {
  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-success';
    if (progress >= 60) return 'bg-info';
    if (progress >= 40) return 'bg-warning';
    return 'bg-error';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Advanced': return 'bg-error text-white';
      case 'Intermediate': return 'bg-warning text-white';
      case 'Beginner': return 'bg-success text-white';
      default: return 'bg-neutral text-white';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border p-6">
      <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center space-x-2">
        <BookOpenIcon className="h-5 w-5 text-primary" />
        <span>Course Progress</span>
      </h3>
      <div className="space-y-4">
        {enrolledCourses.map((course) => (
          <div key={course.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-start space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  course.status === 'completed' ? 'bg-success text-white' : 'bg-primary text-white'
                }`}>
                  {course.status === 'completed' ? (
                    <CheckCircleIconSolid className="h-5 w-5" />
                  ) : (
                    <PlayIcon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-secondary">{course.title}</h4>
                    {course.certificate_earned && (
                      <AcademicCapIconSolid className="h-4 w-4 text-warning" title="Certificate Earned" />
                    )}
                  </div>
                  <p className="text-sm text-content">by {course.instructor}</p>
                  <p className="text-xs text-light-grey">
                    {course.status === 'completed' 
                      ? `Completed on ${formatDate(course.completion_date)}`
                      : `Last accessed: ${formatDate(course.last_accessed)}`
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                  {course.difficulty}
                </span>
                <p className="text-xs text-content mt-1">{course.category}</p>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-content">Progress</span>
                <span className="font-medium text-secondary">
                  {course.completed_lessons}/{course.total_lessons} lessons ({course.progress_percentage}%)
                </span>
              </div>
              <div className="w-full bg-body-bg-1 rounded-full h-2">
                <div 
                  className={`${getProgressColor(course.progress_percentage)} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${course.progress_percentage}%` }}
                ></div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                {course.status === 'in_progress' ? (
                  <p className="text-sm font-medium text-secondary">Next: {course.next_lesson}</p>
                ) : (
                  <p className="text-sm font-medium text-success">Course Completed!</p>
                )}
                <p className="text-xs text-content">
                  Enrolled: {formatDate(course.enrollment_date)}
                </p>
              </div>
              {course.status === 'in_progress' && (
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
                  Continue
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseProgressOverview;
