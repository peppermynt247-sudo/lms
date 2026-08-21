const   TabButtonPrimary = ({
  name,
  handleTabClick,
  idx,
  currentIdx,
  button,
}) => {
  return (
    <button
    onClick={() => handleTabClick(idx)}
    className={`tab-link   text-darkblue p-3px  dark:text-blackColor-dark hover:text-primaryColor  dark:hover:text-primaryColor  dark:hover:bg-whiteColor-dark hover:bg-white relative group/btn  hover:shadow-bottom dark:shadow-standard-dark disabled:cursor-pointer rounded-standard ${
      button === "lg" ? "py-6px lg:py-3 " : "py-10px  "
    } ${
      idx === currentIdx
        ? "bg-white  dark:bg-whiteColor-dark shadow-bottom text-orange"
        : "bg-white dark:bg-lightGrey7-dark"
    } `}
    disabled={idx === currentIdx ? true : false}
  >
    <span
      className={`absolute  h-1 bg-primaryColor top-0 left-0 group-hover/btn:w-full ${
        idx === currentIdx ? "w-full" : "w-0"
      }`}
    ></span>

    {name}
  </button>
  );
};

export default TabButtonPrimary;
