import React from "react";
import MaterialList from "./MaterialList";
import { FaChevronDown, FaChevronRight, FaPlus, FaEllipsisVertical, FaPencil, FaTrash, FaCirclePlay, FaBookOpen, FaCode, FaClipboardList, FaLayerGroup, FaFilePdf } from "react-icons/fa6";

const TYPE_CONFIG = {
  video:       { icon: FaCirclePlay,    bg: "bg-[#0c63e4]/10",  text: "text-[#0c63e4]",  label: "Video"    },
  exercise:    { icon: FaClipboardList, bg: "bg-[#ff5b00]/10",  text: "text-[#ff5b00]",  label: "Exercise" },
  elab:        { icon: FaCode,          bg: "bg-[#1a2b4e]/10",  text: "text-[#1a2b4e]",  label: "eLab"     },
  programming: { icon: FaCode,          bg: "bg-[#1a2b4e]/10",  text: "text-[#1a2b4e]",  label: "Code"     },
  ebook:       { icon: FaBookOpen,      bg: "bg-[#f2277e]/10",  text: "text-[#f2277e]",  label: "eBook"    },
  pdf:         { icon: FaFilePdf,       bg: "bg-[#f2277e]/10",  text: "text-[#f2277e]",  label: "PDF"      },
};

function getTypeSummary(items = []) {
  const counts = {};
  (items || []).forEach((item) => {
    const t = (item.type || item.contentType || "").toLowerCase();
    const cfg = TYPE_CONFIG[t];
    const label = cfg ? cfg.label : "Other";
    counts[label] = (counts[label] || 0) + 1;
  });
  return Object.entries(counts);
}

const SectionItem = ({
  section,
  index,
  isExpanded,
  isLoadingContent,
  activeDropdown,
  onToggleSection,
  onToggleDropdown,
  onOpenSidebar,
  onHandleDropdownAction,
  DropdownMenuComponent,
  dropdownRefs,
}) => {
  const sectionOptions = [
    { id: "editSection", label: "Edit Details", icon: FaPencil, color: "text-[#0c63e4]" },
    { id: "delete",      label: "Delete",        icon: FaTrash,  color: "text-red-500"   },
  ];

  const materialCount = section.items?.length || 0;
  const typeSummary   = getTypeSummary(section.items);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible hover:shadow-md transition-all duration-200">

      {/* Section Header Row */}
      <div
        className="px-4 py-3.5 cursor-pointer select-none"
        onClick={() => onToggleSection(section.id)}
      >
        <div className="flex items-center justify-between gap-3">

          {/* Left: chevron + number badge + title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 text-gray-400">
              {isExpanded
                ? <FaChevronDown className="w-3 h-3" />
                : <FaChevronRight className="w-3 h-3" />
              }
            </div>
            <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold bg-slate-100 text-slate-500">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h5 className="text-sm font-semibold text-gray-900 leading-snug truncate">
                {section.title}
              </h5>
              {/* Content type chips — shown while collapsed */}
              {!isExpanded && typeSummary.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {typeSummary.map(([label, count]) => {
                    const cfg = Object.values(TYPE_CONFIG).find(c => c.label === label);
                    const Icon = cfg?.icon || FaLayerGroup;
                    return (
                      <span
                        key={label}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg?.bg || "bg-gray-100"} ${cfg?.text || "text-gray-500"}`}
                      >
                        <Icon className="w-2.5 h-2.5" />
                        {count} {label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: item count + actions */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {materialCount > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">
                <FaLayerGroup className="w-2.5 h-2.5" />
                {materialCount}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenSidebar("addMaterialOptions", section, "default");
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#ff5b00] border border-[#ff5b00]/40 rounded-full hover:bg-[#ff5b00]/10 transition-colors duration-150"
            >
              <FaPlus className="w-2.5 h-2.5" />
              Add
            </button>
            <div className="relative overflow-visible">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDropdown(`section-${section.id}`);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaEllipsisVertical className="w-3.5 h-3.5" />
              </button>
              {activeDropdown === `section-${section.id}` && (
                <DropdownMenuComponent
                  id={`section-${section.id}`}
                  onAction={onHandleDropdownAction}
                  data={section}
                  options={sectionOptions}
                  position="left"
                  dropdownRef={(el) =>
                    (dropdownRefs.current[`section-${section.id}`] = el)
                  }
                />
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Expanded: loading skeleton */}
      {isExpanded && isLoadingContent && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
              <div className="w-5 h-3 bg-gray-100 rounded-full flex-shrink-0" />
              <div className="w-8 h-8 bg-gray-100 rounded-full flex-shrink-0" />
              <div className="flex-1 flex items-center gap-2">
                <div className="h-3.5 bg-gray-200 rounded-full w-2/5" />
                <div className="h-4 bg-gray-100 rounded-full w-14" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded: material list */}
      {isExpanded && !isLoadingContent && section.items && section.items.length > 0 && (
        <div className="border-t border-gray-100">
          <MaterialList
            items={section.items}
            sectionId={section.id}
            activeDropdown={activeDropdown}
            onToggleDropdown={onToggleDropdown}
            onHandleDropdownAction={onHandleDropdownAction}
            DropdownMenuComponent={DropdownMenuComponent}
            dropdownRefs={dropdownRefs}
            curriculumId={section.curriculumId}
            allSectionsData={section.allSectionsData || section.parentSections}
          />
        </div>
      )}

      {/* Expanded: empty state */}
      {isExpanded && !isLoadingContent && (!section.items || section.items.length === 0) && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-8 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-[#ff5b00]/10 flex items-center justify-center mb-2.5">
            <FaLayerGroup className="w-4 h-4 text-[#ff5b00]" />
          </div>
          <p className="text-sm font-semibold text-gray-600">No materials yet</p>
          <p className="text-xs text-gray-400 mt-0.5 mb-4">Add your first material to this section</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSidebar("addMaterialOptions", section, "default");
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#ff5b00] rounded-full hover:bg-[#e55200] transition-colors shadow-sm"
          >
            <FaPlus className="w-2.5 h-2.5" />
            Add Material
          </button>
        </div>
      )}
    </div>
  );
};

export default SectionItem;
