"use client";

import { useState } from "react";
import { cn } from "../../../../utils/pricing-toggle/cn";

export default function ToggleButton({
  options = ["360° Five Levels Tech Skilling", "Full Stack Web Development"],
  onChange,
}) {
  const [activeOption, setActiveOption] = useState(options[0]);

  const handleClick = (option, index) => {
    setActiveOption(option);
    onChange?.(index);
  };

  return (
    <div className="flex rounded-lg bg-white p-1 gap-2">
      {options.map((option, index) => (
        <button
          key={option}
          onClick={() => handleClick(option, index)}
          className={cn(
            "flex-1 px-8 py-3 active:bg-orange text-sm font-medium text-white rounded-md transition-all duration-200",
            activeOption === option ? "bg-orange" : "bg-darkblue"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}