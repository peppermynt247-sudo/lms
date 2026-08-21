"use client";

import React from "react";

export default function KebabMenu({ children, menuItems, openUpwards = false }) {
  const [open, setOpen] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 });
  const buttonRef = React.useRef(null);

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      let top, left;
      left = rect.left;
      if (openUpwards) {
        top = rect.top - 8 - 180;
      } else {
        top = rect.bottom + 8;
      }
      setMenuPosition({ top, left });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        !e.target.closest(".kebab-menu-dropdown")
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function handleEscape(e) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={open ? handleClose : handleOpen}
        className="p-1 rounded-full hover:bg-gray-100 focus:outline-none relative z-10"
        aria-label="Open menu"
      >
        {children}
      </button>
      {open && (
        <div
          className="kebab-menu-dropdown fixed w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[9999]"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            minWidth: "160px",
          }}
        >
          <div className="py-1">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                onClick={() => {
                  item.onClick();
                  handleClose();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}


