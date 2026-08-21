const HeadingLg = ({ children, color }) => {
  return (
    <div>
      <h1
        className={`text-2xl ${
          color === "white"
            ? "text-whiteColor"
            : "text-blackColor dark:text-blackColor-dark"
        } md:text-xl lg:text-size-50 md:tracking-half lg:tracking-normal 2xl:tracking-half font-bold mb-15px`}
      >
        {children}
      </h1>
    </div>
  );
};

export default HeadingLg;
