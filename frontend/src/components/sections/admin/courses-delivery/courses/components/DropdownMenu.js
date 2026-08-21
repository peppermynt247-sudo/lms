import React from 'react';

const DropdownMenu = ({ id, onAction, data, options, position = "right", dropdownRef }) => {
  return (
    <div
      ref={dropdownRef} 
      className={`absolute top-full mt-2 w-48 bg-white rounded  border border-gray-200 py-1 z-50 ${position === "left" ? "right-0" : "left-0"}`}
    >
      {options.map((option) => {
        const IconComponent = option.icon;
        return (
          <button
            key={option.id}
            onClick={() => onAction(option.id, data)}
            className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2.5 ${option.id === 'delete' ? 'hover:bg-red-50' : ''}`}
          >
            {IconComponent && <IconComponent className={`w-4 h-4 ${option.color || 'text-gray-600'}`} />}
            <span className={`text-sm ${option.id === 'delete' ? 'text-red-600' : 'text-gray-700'}`}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default DropdownMenu;