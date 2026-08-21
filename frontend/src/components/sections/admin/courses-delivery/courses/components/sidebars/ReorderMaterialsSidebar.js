import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FaGripVertical, FaArrowsUpDown, FaCirclePlay, FaBookOpen, FaCode, FaClipboardList, FaFilePdf, FaLayerGroup } from 'react-icons/fa6';

const TYPE_CONFIG = {
  video:       { icon: FaCirclePlay,    bg: 'bg-[#0c63e4]/10', text: 'text-[#0c63e4]' },
  exercise:    { icon: FaClipboardList, bg: 'bg-[#ff5b00]/10', text: 'text-[#ff5b00]' },
  elab:        { icon: FaCode,          bg: 'bg-[#1a2b4e]/10', text: 'text-[#1a2b4e]' },
  programming: { icon: FaCode,          bg: 'bg-[#1a2b4e]/10', text: 'text-[#1a2b4e]' },
  ebook:       { icon: FaBookOpen,      bg: 'bg-[#f2277e]/10', text: 'text-[#f2277e]' },
  pdf:         { icon: FaFilePdf,       bg: 'bg-[#f2277e]/10', text: 'text-[#f2277e]' },
};

const ReorderMaterialsSidebar = ({ sectionData, onSave, onClose }) => {
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    if (Array.isArray(sectionData?.items)) {
      setMaterials(sectionData.items.map((item) => ({ ...item, id: String(item.id) })));
    }
  }, [sectionData]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = [...materials];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setMaterials(reordered);
  };

  const handleSubmit = () => {
    onSave(materials);
    onClose();
  };

  if (!Array.isArray(materials)) {
    return <div className="p-5 text-sm text-red-500">Error: Invalid materials data</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 px-5 py-5 space-y-4 overflow-y-auto">

        {/* Info chip */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#ff5b00]/5 border border-[#ff5b00]/10">
          <div className="w-8 h-8 rounded-full bg-[#ff5b00]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FaArrowsUpDown className="w-3.5 h-3.5 text-[#ff5b00]" />
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Drag materials up or down to reorder them within this section. Click <span className="font-semibold text-gray-600">Save Order</span> to confirm.
          </p>
        </div>

        {/* Drag list */}
        {materials.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No materials to reorder</p>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="materials" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-2 rounded-2xl transition-colors ${snapshot.isDraggingOver ? 'bg-[#ff5b00]/3' : ''}`}
                >
                  {materials.map((item, index) => {
                    const typeKey = (item.type || item.contentType || '').toLowerCase();
                    const cfg = TYPE_CONFIG[typeKey] || { icon: FaLayerGroup, bg: 'bg-gray-100', text: 'text-gray-400' };
                    const Icon = cfg.icon;

                    return (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl border transition-all duration-150 ${
                              snapshot.isDragging
                                ? 'bg-[#ff5b00]/5 border-[#ff5b00]/30 shadow-md'
                                : 'bg-white border-gray-100 shadow-sm hover:border-gray-200'
                            }`}
                          >
                            {/* Drag handle */}
                            <div {...provided.dragHandleProps} className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors">
                              <FaGripVertical className="w-3.5 h-3.5 text-gray-300" />
                            </div>

                            {/* Type icon */}
                            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${cfg.bg}`}>
                              <Icon className={`w-3 h-3 ${cfg.text}`} />
                            </div>

                            {/* Title */}
                            <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                              {item.title || item.type || 'Untitled'}
                            </span>

                            {/* Index */}
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-semibold text-gray-500 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#ff5b00] rounded-full hover:bg-[#e55200] transition-colors shadow-sm"
        >
          <FaArrowsUpDown className="w-3 h-3" />
          Save Order
        </button>
      </div>
    </div>
  );
};

export default ReorderMaterialsSidebar;
