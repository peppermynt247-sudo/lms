import React from "react"

export const Label = React.forwardRef(({ className = "", ...props }, ref) => (
  <label
    ref={ref}
    className={`block text-sm font-medium text-gray-700 ${className}`}
    {...props}
  />
))

Label.displayName = "Label" 