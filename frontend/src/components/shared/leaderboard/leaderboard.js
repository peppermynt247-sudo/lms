"use client"

import { useState } from "react"

export function CustomLeaderboard({
  entries,
  title = "Leaderboard",
  maxEntries = 10,
  showRank = true,
  showAvatar = true,
  highlightTop = 3,
}) {
  const [displayEntries, setDisplayEntries] = useState(() => {
    return entries
      .map((entry, index) => ({
        id: index,
        name: entry.student_name,
        rank: parseInt(entry.rank) || index + 1,
        score: entry.best_grade,
        avatar: entry.avatar || null,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxEntries)
  })

  const getMedal = (rank) => {
    if (rank === 1) return "🥇"
    if (rank === 2) return "🥈"
    if (rank === 3) return "🥉"
    return null
  }

  const getRowClass = (rank) => {
    if (rank === 1) return "bg-yellow-100"
    if (rank === 2) return "bg-gray-100"
    if (rank === 3) return "bg-orange-100"
    return "bg-white"
  }

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              {showRank && (
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Rank</th>
              )}
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayEntries.map((entry) => (
              <tr key={entry.id} className={`${getRowClass(entry.rank)} hover:bg-gray-50 transition-colors`}>
                {showRank && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {entry.rank <= highlightTop ? (
                        <span className="text-lg">{getMedal(entry.rank)}</span>
                      ) : (
                        <span className="text-sm font-medium text-gray-600">{entry.rank}</span>
                      )}
                    </div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {showAvatar && (
                      <div className="flex-shrink-0 h-8 w-8 mr-3">
                        {entry.avatar ? (
                          <img
                            className="h-8 w-8 rounded-full object-cover"
                            src={entry.avatar}
                            alt={entry.name}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{entry.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-semibold text-gray-900">{entry.score}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
