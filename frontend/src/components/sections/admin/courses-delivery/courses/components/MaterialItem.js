import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  FaCirclePlay,
  FaBookOpen,
  FaCode,
  FaClipboardList,
  FaFilePdf,
  FaLayerGroup,
  FaEllipsisVertical,
  FaPencil,
  FaTrash,
} from "react-icons/fa6";
import EbookViewerModal from "./EbookViewerModal";

const TYPE_CONFIG = {
  video:       { icon: FaCirclePlay,    bg: "bg-[#0c63e4]/10",  text: "text-[#0c63e4]",  label: "Video",    badge: "bg-[#0c63e4]/10 text-[#0c63e4]"  },
  exercise:    { icon: FaClipboardList, bg: "bg-[#ff5b00]/10",  text: "text-[#ff5b00]",  label: "Exercise", badge: "bg-[#ff5b00]/10 text-[#ff5b00]"  },
  elab:        { icon: FaCode,          bg: "bg-[#1a2b4e]/10",  text: "text-[#1a2b4e]",  label: "eLab",     badge: "bg-[#1a2b4e]/10 text-[#1a2b4e]"  },
  programming: { icon: FaCode,          bg: "bg-[#1a2b4e]/10",  text: "text-[#1a2b4e]",  label: "Code",     badge: "bg-[#1a2b4e]/10 text-[#1a2b4e]"  },
  ebook:       { icon: FaBookOpen,      bg: "bg-[#f2277e]/10",  text: "text-[#f2277e]",  label: "eBook",    badge: "bg-[#f2277e]/10 text-[#f2277e]"  },
  pdf:         { icon: FaFilePdf,       bg: "bg-[#f2277e]/10",  text: "text-[#f2277e]",  label: "PDF",      badge: "bg-[#f2277e]/10 text-[#f2277e]"  },
};

const DEFAULT_CONFIG = {
  icon: FaLayerGroup, bg: "bg-gray-100", text: "text-gray-500",
  label: "Material",  badge: "bg-gray-100 text-gray-500",
};

const MaterialItem = ({
  item,
  index,
  activeDropdown,
  onToggleDropdown,
  onHandleDropdownAction,
  DropdownMenuComponent,
  dropdownRefs,
}) => {
  const router = useRouter();
  const [ebookViewerId, setEbookViewerId] = useState(null);

  const materialOptions = [
    { id: "edit",   label: "Edit Details",    icon: FaPencil, color: "text-[#0c63e4]" },
    { id: "delete", label: "Delete Material", icon: FaTrash,  color: "text-red-500"   },
  ];

  const typeKey = (item.type || item.contentType || "").toLowerCase();
  const cfg  = TYPE_CONFIG[typeKey] || DEFAULT_CONFIG;
  const Icon = cfg.icon;

  const isClickable = ["video", "pdf", "ebook"].includes(typeKey);

  const handleRowClick = (e) => {
    if (e.target.closest("button") || e.target.closest(".material-dropdown-menu")) return;
    if (!isClickable) return;

    if (typeKey === "video") {
      onHandleDropdownAction("edit", item);
    } else if (typeKey === "pdf" || typeKey === "ebook") {
      setEbookViewerId(item.contentReferenceId);
    }
  };

  return (
    <>
      <div
        className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 bg-white hover:bg-gray-50/80 transition-colors duration-150 group${isClickable ? " cursor-pointer" : ""}`}
        onClick={handleRowClick}
      >
        {/* Index */}
        <span className="flex-shrink-0 w-5 text-center text-[11px] font-medium text-gray-400">
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Type icon — circular with tinted background */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg}`}>
          <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
        </div>

        {/* Title + type badge */}
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-medium text-gray-800 truncate group-hover:text-[#ff5b00] transition-colors">
            {item.title || item.type || "Untitled"}
          </h4>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>

        {/* Action menu */}
        <div className="flex-shrink-0">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleDropdown(`item-${item.id}`);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaEllipsisVertical className="w-3.5 h-3.5" />
            </button>
            {activeDropdown === `item-${item.id}` && (
              <div className="material-dropdown-menu">
                <DropdownMenuComponent
                  id={`item-${item.id}`}
                  onAction={onHandleDropdownAction}
                  data={item}
                  options={materialOptions}
                  position="left"
                  dropdownRef={(el) => (dropdownRefs.current[`item-${item.id}`] = el)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {ebookViewerId && (
        <EbookViewerModal
          ebookId={ebookViewerId}
          onClose={() => setEbookViewerId(null)}
        />
      )}
    </>
  );
};

export default MaterialItem;
