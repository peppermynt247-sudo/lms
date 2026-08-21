export const filterCourses = (courses = [], searchQuery = "") => {
  const lowerQuery = searchQuery.toLowerCase().trim();

  return courses.filter((course) => {
    const title = course.title?.toLowerCase() || "";
    const description = course.description?.toLowerCase() || "";
    return title.includes(lowerQuery) || description.includes(lowerQuery);
  });
};


export const paginateCourses = (courses, currentPage, coursesPerPage) => {
  const totalPages = Math.ceil(courses.length / coursesPerPage);
  const startIndex = (currentPage - 1) * coursesPerPage;
  const paginatedCourses = courses.slice(startIndex, startIndex + coursesPerPage);
  return {
    paginatedCourses,
    totalPages,
    startIndex
  };
};

export const createInitialFormData = () => ({
  courseName: "",
  description: "",
  prettyName: "",
  courseType: "online",
  thumbnail: null,
});