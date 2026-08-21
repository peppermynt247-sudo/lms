import React, { useState } from "react";

const learners = [];
const contentItems = [];
const progressData = {};

const AssessmentProgress = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("Art of Coding");

  const filteredLearners = learners.filter((l) =>
    l.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="overflow-x-auto">
      {/* Search & Filter */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search Learners By Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-md w-72 text-sm"
        />
        {/* <select
          className="border px-4 py-2 rounded-md text-sm"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option>Art of Coding</option>
          <option>Full Stack</option>
        </select> */}
      </div>

      {/* Table */}
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left px-4 py-3 sticky left-0 bg-gray-100 z-10">
              Learner name
            </th>
            {contentItems.map((item, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-center w-48 border-b"
              >
                <div className="transform -rotate-45 origin-bottom-left text-gray-500 text-xs whitespace-nowrap">
                  {item}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredLearners.length === 0 ? (
            <tr>
              <td colSpan={1 + contentItems.length} className="px-4 py-8 text-center text-gray-500">
                No learners found.
              </td>
            </tr>
          ) : (
            filteredLearners.map((learner) => (
              <tr key={learner.id} className="border-b">
                {/* Sticky Learner Column */}
                <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white z-10">
                  <div className="font-semibold text-gray-800">{learner.name}</div>
                  <div className="text-gray-500 text-xs"># {learner.id}</div>
                </td>
                {contentItems.map((_, idx) => {
                  const val = progressData[learner.id]?.[idx] || "-";
                  const isCompleted = val === 1;
                  return (
                    <td key={idx} className="text-center px-2 py-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs font-medium ${
                          isCompleted
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {val}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AssessmentProgress;

