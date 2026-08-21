const HeadingPrimary = ({ children, text }) => {
  return (
    <h3
      className={`text-xs md:text-[35px] lg:text-size-35  text-blueDark dark:text-blueDark-dark  ${
        text === "center" ? "text-center" : ""
      }`}
      data-aos="fade-up"
    >
      <span className="inline-block text-xl md:text-[35px] lg:text-size-35 leading-10  md:leading-45px 2xl:leading-13.5 ">
        {children}
      </span>
    </h3>
  );
};

export default HeadingPrimary;
