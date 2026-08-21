"use client";

import { useCourseWithThumbnail } from "@hooks/useCourseWithThumbnail";

export default function CourseCard({ course }) {
  const { courseData, thumbnail, loading, error } = useCourseWithThumbnail(course.courseId);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="w-full h-48 bg-gray-200 rounded-t-2xl"></div>
        <div className="mt-4">
          <div className="h-6 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 rounded-t-2xl p-4">
        <div className="text-red-600 text-sm">Error loading course</div>
      </div>
    );
  }

  const displayData = courseData || course;

  return (
    <div>
      {thumbnail ? (
        <img src={thumbnail} alt={displayData.title} className="w-full h-48 object-cover rounded-t-2xl" />
      ) : (
        <div className="w-full h-48 bg-gray-200 rounded-t-2xl flex items-center justify-center">
          <span>No Thumbnail</span>
        </div>
      )}
      <h3 className="text-lg font-semibold mt-4">{displayData.title}</h3>
      <p className="text-sm text-gray-600">{displayData.description}</p>
      
      {/* Display additional course details if available */}
      {courseData && (
        <div className="mt-2 space-y-1">
          {courseData.subtitle && (
            <p className="text-xs text-gray-500">{courseData.subtitle}</p>
          )}
          {courseData.difficultyLevel && (
            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
              {courseData.difficultyLevel}
            </span>
          )}
          {courseData.estimatedHours && (
            <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded ml-2">
              {courseData.estimatedHours}h
            </span>
          )}
          {courseData.price && (
            <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded ml-2">
              ${courseData.price}
            </span>
          )}
        </div>
      )}
    </div>
  );
}