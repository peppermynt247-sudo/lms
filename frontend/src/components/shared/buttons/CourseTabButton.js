const CourseTabButton = ({ children, idx, currentIdx, handleTabClick }) => {
  return (
    <button
      onClick={() => handleTabClick(idx)}
      className={`relative flex-1 min-w-[120px] p-2 text-blackColor bg-whiteColor hover:bg-primaryColor hover:text-whiteColor shadow-overview-button dark:bg-whiteColor-dark dark:text-blackColor-dark dark:hover:bg-primaryColor dark:hover:text-whiteColor flex items-center justify-center ${
        idx === currentIdx
          ? "bg-orange-500 text-orange dark:bg-orange-600 dark:text-orange" // Active tab styles
          : ""
      }`}
    >
      {children}
    </button>
  );
};

export default CourseTabButton;
