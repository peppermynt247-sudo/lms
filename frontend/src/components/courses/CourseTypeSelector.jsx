// components/courses/CourseTypeSelector.jsx
"use client";

export default function CourseTypeSelector({ courseType, onCourseTypeChange }) {
  const courseTypes = [
    {
      id: "online",
      title: "Online only",
      description: "Select this if this package is intended only for online coaching."
    },
    {
      id: "classroom",
      title: "Classroom Program",
      description: "Select this if the learners can enroll in this package for classroom program at your institution."
    }
  ];

  return (
    <div>
      <label className="block text-sm font-semibold text-headingColor dark:text-headingColor-dark mb-2">
        Course Type 
      </label>
      <div className="grid grid-cols-1 gap-3">
        {courseTypes.map((type) => (
          <div
            key={type.id}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
              courseType === type.id
                ? "border-primaryColor bg-primaryColor/10"
                : "border-borderColor dark:border-borderColor-dark hover:border-primaryColor"
            }`}
            onClick={() => onCourseTypeChange(type.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-headingColor dark:text-headingColor-dark">
                  {type.title}
                </h3>
                <p className="text-sm text-contentColor dark:text-contentColor-dark mt-1">
                  {type.description}
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 ${
                  courseType === type.id
                    ? "border-primaryColor bg-primaryColor"
                    : "border-borderColor dark:border-borderColor-dark"
                }`}
              >
                {courseType === type.id && (
                  <div className="w-2 h-2 bg-whiteColor rounded-full mx-auto mt-0.5"></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}