import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FaGripVertical, FaArrowsUpDown } from 'react-icons/fa6';

const RearrangeSectionsSidebar = ({ currentSections, onSave, onClose }) => {
  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (Array.isArray(currentSections)) {
      setSections(currentSections.map((s) => ({ ...s, id: String(s.id) })));
    }
  }, [currentSections]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setSections(reordered);
  };

  const handleSubmit = () => {
    onSave(sections);
    onClose();
  };

  if (!Array.isArray(sections)) {
    return <div className="p-5 text-sm text-red-500">Error: Invalid sections data</div>;
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
            Drag sections up or down to rearrange their order. Click <span className="font-semibold text-gray-600">Save Order</span> to confirm.
          </p>
        </div>

        {/* Drag list */}
        {sections.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No sections to rearrange</p>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="sections" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-2 rounded-2xl transition-colors ${snapshot.isDraggingOver ? 'bg-[#ff5b00]/3' : ''}`}
                >
                  {sections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
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

                          {/* Number */}
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {String(index + 1).padStart(2, '0')}
                          </span>

                          {/* Title */}
                          <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                            {section.title}
                          </span>
                        </div>
                      )}
                    </Draggable>
                  ))}
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

export default RearrangeSectionsSidebar;
