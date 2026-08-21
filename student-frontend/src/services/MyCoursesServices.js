import api from "./api";

const StudentMyCoursesServices = {
  getCourses: async () => {
    const response = await api.get("api/student/dashboard");
    return response.data;
  },
};

export default StudentMyCoursesServices;
