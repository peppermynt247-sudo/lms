'use client';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { X, Menu, Clock, LogOut } from 'lucide-react';

const Sidebar = ({ batches, onBatchSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState('');
  const router = useRouter();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleCourseChange = (e) => {
    setSelectedCourseIndex(e.target.value);
  };

  const handleBatchClick = (batch, courseIndex, batchIndex) => {
    onBatchSelect({ batch: batches[courseIndex], courseIndex, batchIndex });
    setIsOpen(false); // Close sidebar on mobile after selection
  };

  const isActive = (path) => router.pathname === path;

  // Prevent body scrolling when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <div>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 md:hidden bg-white p-2 rounded-md shadow-md text-gray-700"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen bg-white text-gray-700 transition-all duration-300 ease-in-out shadow-lg
          ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0 md:w-64'}
          flex flex-col
        `}
      >
        <div className="p-5 flex items-center justify-between border-b border-gray-100">
          <h1 className="font-bold text-xl text-blue-600">Analytics</h1>
          {isOpen && (
            <button
              onClick={toggleSidebar}
              className="md:hidden text-gray-500 hover:text-gray-700"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div>
            <h2 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Courses
            </h2>
            <div className="mt-2 px-3">
              <select
                className="w-full border text-black border-gray-300 rounded-lg px-4 py-2"
                onChange={handleCourseChange}
                value={selectedCourseIndex}
              >
                <option value="" disabled>
                  Select a course
                </option>
                {batches.map((course, index) => (
                  <option key={index} value={index}>
                    {course.bundle_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCourseIndex !== '' && (
              <div className="mt-2">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Batches
                </h3>
                <ul className="mt-2 space-y-1 pl-3">
                  {batches[selectedCourseIndex].batch.map((batch, batchIndex) => (
                    <li key={batch.class_id}>
                      <button
                        onClick={() =>
                          handleBatchClick(batch, selectedCourseIndex, batchIndex)
                        }
                        className={`flex items-center py-2 px-3 rounded-md text-sm transition-colors w-full text-left ${
                          isActive(`/home/Dashboard/${batch.class_id}`)
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Clock size={14} className="mr-2 text-gray-400" />
                        <span>{batch.class_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button className="flex items-center p-3 rounded-md text-gray-700 hover:bg-gray-100 w-full">
            <LogOut size={18} className="mr-3 text-gray-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
export default Sidebar;
