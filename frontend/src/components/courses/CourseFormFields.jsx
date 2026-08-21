// components/courses/CourseFormFields.jsx
"use client";

export default function CourseFormFields({ formData, onInputChange }) {
  const inputClass =
    "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00] transition-colors placeholder-gray-400 text-[#1a2b4e] bg-white";
  const labelClass =
    "block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5";
  const countClass =
    "text-[10px] text-gray-400 text-right mt-1";

  return (
    <div className="space-y-5">
      {/* Course Name */}
      <div>
        <label className={labelClass}>
          Course Name <span className="text-[#ff5b00]">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter course name"
          value={formData.courseName}
          onChange={(e) => onInputChange("courseName", e.target.value.slice(0, 100))}
          className={inputClass}
          required
        />
        <div className={countClass}>{formData.courseName.length} / 100</div>
      </div>

      {/* Pretty Name */}
      <div>
        <label className={labelClass}>
          Pretty Name <span className="text-[#ff5b00]">*</span>
        </label>
        <input
          type="text"
          placeholder="Short display name (e.g. react-basics)"
          value={formData.prettyName}
          onChange={(e) => onInputChange("prettyName", e.target.value.slice(0, 50))}
          className={inputClass}
        />
        <div className={countClass}>{formData.prettyName.length} / 50</div>
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>
          Description{" "}
          <span className="text-gray-400 font-normal normal-case">(optional)</span>
        </label>
        <textarea
          placeholder="A short description of your course"
          value={formData.description}
          onChange={(e) => onInputChange("description", e.target.value.slice(0, 400))}
          rows={4}
          className={`${inputClass} resize-none`}
        />
        <div className={countClass}>{formData.description.length} / 400</div>
      </div>
    </div>
  );
}
