"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FiMoreVertical } from "react-icons/fi";
import { useRouter } from "next/navigation";
import CourseCard from "@/components/courses/CourseCard";

export const HoverEffect = ({ items, className, viewMode }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const router = useRouter();

  const handleCardClick = (courseId) => {
    router.push(`/admin/courses/${courseId}/details`);
  };

  return (
    <div
      className={cn(
        "grid gap-6",
        viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1",
        className
      )}
    >
      {items.map((item, idx) => (
        <motion.div
          key={item?.courseId}
          className="relative group block p-2 h-full w-full"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => {
            setHoveredIndex(null);
            setMenuOpenIndex(null);
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: idx * 0.1 }}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-blue-light2 dark:bg-darkdeep2 block rounded-3xl"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.15 } }}
                exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.2 } }}
              />
            )}
          </AnimatePresence>
          {viewMode === "grid" ? (
            <Card onClick={() => handleCardClick(item.courseId)}>
              <CourseCard course={item} />
              <AnimatePresence>
                {hoveredIndex === idx && (
                  <motion.div
                    className="absolute top-4 right-4 flex items-center gap-2 z-50"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
                    exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                  >
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setMenuOpenIndex(menuOpenIndex === idx ? null : idx);
                        }}
                        className="p-2 bg-whitegrey2/80 dark:bg-darkdeep1/80 backdrop-blur-xl text-contentColor dark:text-contentColor-dark rounded-full hover:bg-blue-light2 dark:hover:bg-darkdeep2 transition-all duration-300"
                        aria-label="More options"
                      >
                        <FiMoreVertical size={20} />
                      </button>
                      {menuOpenIndex === idx && (
                        <motion.div
                          className="absolute right-0 mt-2 w-40 bg-whitegrey2/80 dark:bg-darkdeep1/80 backdrop-blur-xl rounded-md shadow-dropdown-card dark:shadow-dropdown-card-dark border border-borderColor dark:border-borderColor-dark z-50"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1, transition: { duration: 0.15 } }}
                          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(`Edit course: ${item.title}`);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-contentColor dark:text-contentColor-dark hover:bg-blue-light2 dark:hover:bg-darkdeep2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(`Reorder course: ${item.title}`);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-contentColor dark:text-contentColor-dark hover:bg-blue-light2 dark:hover:bg-darkdeep2"
                          >
                            Reorder
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(`Delete course: ${item.title}`);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-deepred dark:text-deepred hover:bg-blue-light2 dark:hover:bg-darkdeep2"
                          >
                            Delete
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ) : (
            <CardListView onClick={() => handleCardClick(item.courseId)}>
              <div className="flex gap-4">
                <div className="w-32">
                  <CourseCard course={item} />
                </div>
                <div className="flex-1">
                  <div className="mt-4 flex items-center gap-2">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setMenuOpenIndex(menuOpenIndex === idx ? null : idx);
                        }}
                        className="p-2 bg-whitegrey2/80 dark:bg-darkdeep1/80 backdrop-blur-xl text-contentColor dark:text-contentColor-dark rounded-full hover:bg-blue-light2 dark:hover:bg-darkdeep2 transition-all duration-300"
                        aria-label="More options"
                      >
                        <FiMoreVertical size={20} />
                      </button>
                      {menuOpenIndex === idx && (
                        <motion.div
                          className="absolute left-0 mt-2 w-40 bg-whitegrey2/80 dark:bg-darkdeep1/80 backdrop-blur-xl rounded-md shadow-dropdown-card dark:shadow-dropdown-card-dark border border-borderColor dark:border-borderColor-dark z-50"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1, transition: { duration: 0.15 } }}
                          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(`Edit course: ${item.title}`);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-contentColor dark:text-contentColor-dark hover:bg-blue-light2 dark:hover:bg-darkdeep2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(`Reorder course: ${item.title}`);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-contentColor dark:text-contentColor-dark hover:bg-blue-light2 dark:hover:bg-darkdeep2"
                          >
                            Reorder
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(`Delete course: ${item.title}`);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-deepred dark:text-deepred hover:bg-blue-light2 dark:hover:bg-darkdeep2"
                          >
                            Delete
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardListView>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export const Card = ({ className, children, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl h-full w-full overflow-hidden dark:bg-darkdeep1 border border-borderColor dark:border-borderColor-dark group-hover:border-primaryColor relative z-20 shadow-dropdown-card dark:shadow-dropdown-card-dark cursor-pointer",
        className
      )}
    >
      <div className="relative z-50">
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export const CardListView = ({ className, children, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl w-full overflow-hidden bg-whitegrey2 dark:bg-darkdeep1 border border-borderColor dark:border-borderColor-dark group-hover:border-primaryColor relative z-20 shadow-dropdown-card dark:shadow-dropdown-card-dark p-4 cursor-pointer",
        className
      )}
    >
      <div className="relative z-50">{children}</div>
    </div>
  );
};