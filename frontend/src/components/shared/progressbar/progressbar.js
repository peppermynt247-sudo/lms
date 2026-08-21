"use client"

import { useEffect, useState } from "react"


export function CustomProgressBar({
  value,
  maxValue = 100,
  showPercentage = true,
  height = "md",
  color = "blue",
  label,
  animate = true,
}) {
  const [animatedValue, setAnimatedValue] = useState(0)

 
  const percentage = Math.min(Math.max(0, (value / maxValue) * 100), 100)


  const heightMap = {
    sm: "h-2",
    md: "h-4",
    lg: "h-6",
  }

  
  const colorMap = {
    blue: "bg-blue",
    green: "bg-emerald",
    purple: "bg-purple",
    orange: "bg-orange",
    red: "bg-red",
  }


  useEffect(() => {
    if (animate) {
      setAnimatedValue(0)
      const timeout = setTimeout(() => {
        setAnimatedValue(percentage)
      }, 100)
      return () => clearTimeout(timeout)
    } else {
      setAnimatedValue(percentage)
    }
  }, [percentage, animate])

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && <span className="text-sm font-medium text-gray-700">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightMap[height]}`}>
        <div
          className={`${colorMap[color]} rounded-full transition-all duration-1000 ease-out ${heightMap[height]}`}
          style={{ width: `${animatedValue}%` }}
        >
          {height === "lg" && showPercentage && (
            <div className="h-full flex items-center justify-center">
              <span className="text-xs font-medium text-white px-2">{Math.round(percentage)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
