// Example: How to create additional API services using the centralized axios instance

import api from './api';

// Example: User Service
export const userService = {
  // Get user profile
  getProfile: async (userId) => {
    const response = await api.get(`/api/user/profile/${userId}`);
    return response.data;
  },

  // Update user profile
  updateProfile: async (userId, profileData) => {
    const response = await api.put(`/api/user/profile/${userId}`, profileData);
    return response.data;
  },

  // Get all users (admin only)
  getAllUsers: async (params = {}) => {
    const response = await api.get('/api/user/all', { params });
    return response.data;
  },
};

// Example: Course Service
export const courseService = {
  // Get all courses
  getCourses: async (params = {}) => {
    const response = await api.get('/api/courses', { params });
    return response.data;
  },

  // Get course by ID
  getCourseById: async (courseId) => {
    const response = await api.get(`/api/courses/${courseId}`);
    return response.data;
  },

  // Create new course
  createCourse: async (courseData) => {
    const response = await api.post('/api/courses', courseData);
    return response.data;
  },

  // Update course
  updateCourse: async (courseId, courseData) => {
    const response = await api.put(`/api/courses/${courseId}`, courseData);
    return response.data;
  },

  // Delete course
  deleteCourse: async (courseId) => {
    const response = await api.delete(`/api/courses/${courseId}`);
    return response.data;
  },
};

// Export services
const exampleServices = {
  userService,
  courseService,
};

export default exampleServices;
