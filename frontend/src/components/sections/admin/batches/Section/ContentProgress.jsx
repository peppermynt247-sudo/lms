import React, { useState } from "react";

const learners = [];
const questions = [];

const ContentProgress = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("HR Interview Prep");

  const filteredLearners = learners.filter((l) =>
    l.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="overflow-x-auto">
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search Learners By Name"
          className="px-4 py-2 border rounded-md w-72 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* <select
          className="border rounded-md px-4 py-2 text-sm"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option>HR Interview Prep</option>
          <option>Tech Interview Prep</option>
        </select> */}
      </div>

      {/* Table */}
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left px-4 py-3 border-b sticky left-0 bg-gray-100 z-10">
              Learner name
            </th>
            {questions.map((q, index) => (
              <th key={q.id} className="text-center px-2 py-3 border-b w-48">
                <div className="flex flex-col items-center justify-center transform -rotate-45 origin-bottom-left whitespace-nowrap text-gray-500 text-xs">
                  {index + 1}. {q.question}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredLearners.length === 0 ? (
            <tr>
              <td colSpan={1 + questions.length} className="px-4 py-8 text-center text-gray-500">
                No learners found.
              </td>
            </tr>
          ) : (
            filteredLearners.map((learner) => (
              <tr key={learner.id} className="border-b">
                {/* Sticky left column */}
                <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white z-10">
                  <div className="font-medium text-gray-900">{learner.name}</div>
                  <div className="text-gray-500 text-xs"># {learner.id}</div>
                </td>
                {questions.map((q) => (
                  <td
                    key={q.id}
                    className="text-center px-2 py-3 text-gray-600 bg-gray-50"
                  >
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                      -
                    </div>
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ContentProgress;
