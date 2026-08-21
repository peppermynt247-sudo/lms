import React from 'react';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

const QuizPerformance = ({ recentQuizzes }) => {
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-success';
    if (score >= 80) return 'text-info';
    if (score >= 70) return 'text-warning';
    return 'text-error';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border p-6">
      <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center space-x-2">
        <AcademicCapIcon className="h-5 w-5 text-primary" />
        <span>Recent Quiz Performance</span>
      </h3>
      <div className="space-y-3">
        {recentQuizzes.map((quiz) => (
          <div key={quiz.id} className="border border-border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-secondary">{quiz.quiz_title}</h4>
                <p className="text-sm text-content">{quiz.course_name}</p>
                <p className="text-xs text-light-grey">Taken on {formatDate(quiz.attempt_date)}</p>
              </div>
              <div className="text-right">
                <p className={`text-xl font-bold ${getScoreColor(quiz.score)}`}>
                  {quiz.score}/{quiz.max_score}
                </p>
                <p className="text-xs text-content">{quiz.time_taken} minutes</p>
              </div>
            </div>
            <div className="w-full bg-body-bg-1 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  quiz.score >= 90 ? 'bg-success' :
                  quiz.score >= 80 ? 'bg-info' :
                  quiz.score >= 70 ? 'bg-warning' : 'bg-error'
                }`}
                style={{ width: `${(quiz.score / quiz.max_score) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizPerformance;
