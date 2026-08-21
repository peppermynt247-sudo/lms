const TabButtonSecondary = ({
  name,
  handleTabClick,
  idx,
  currentIdx,
  button,
}) => {
  return (
    <button
      onClick={() => handleTabClick(idx)}
      className={`${
        button === "icon"
          ? `inline-block hover:text-primaryColor ${idx === currentIdx ? "text-primaryColor" : ""}`
          : `relative py-2 px-5 md:py-3 lg:px-10 text-sm lg:text-base font-semibold  text-blackColor bg-whiteColor shadow-overview-button dark:bg-whiteColor-dark dark:text-blackColor-dark w-full`
      } ${idx === currentIdx ? "before:w-full" : "before:w-0"} before:h-0.5 before:absolute before:-bottom-0.5 lg:before:bottom-0 before:left-0 before:bg-primaryColor hover:before:w-full before:transition-all before:duration-300`}
    >
      {name}
    </button>
  );
};

export default TabButtonSecondary;
