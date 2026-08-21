import api from './api';
import axios from 'axios';
import Cookies from 'js-cookie';

// Create a custom axios instance for profile service that uses cookies
const profileApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include cookie-based auth
profileApi.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = Cookies.get('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Profile API service
export const profileService = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await profileApi.get('/api/user/myprofile');
      return response.data;
    } catch (error) {
      console.error('Profile API Error:', error);
      console.error('Error Response:', error.response);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (formData) => {
    const response = await profileApi.put('/api/user/myprofile/update', formData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  // Upload profile image only
  uploadProfileImage: async (imageFile) => {
    const form = new FormData();
    form.append('profileImage', imageFile);

    const response = await profileApi.put('/api/user/myprofileimage/update', form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload resume file
  uploadResume: async (resumeFile) => {
    const form = new FormData();
    form.append('file', resumeFile);

    const response = await profileApi.post('/api/user/uploadmyresume', form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Experience CRUD
  addExperience: async (experience) => {
    const response = await profileApi.put('/api/user/addmyexperience', experience, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  updateExperience: async (experienceId, experience) => {
    const response = await profileApi.put(`/api/user/updatemyexperience/${experienceId}`, experience, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  deleteMyExperience: async (experienceId) => {
    const response = await profileApi.delete(`/api/user/deletemyexperience/${experienceId}`);
    return response.data;
  },

  // Skills
  addMySkill: async (skill) => {
    const response = await profileApi.put('/api/user/addmyskill', skill);
    return response.data;
  },

  updateMySkill: async (skillId, skill) => {
    const response = await profileApi.put(`/api/user/updatemyskill/${skillId}`, skill);
    return response.data;
  },

  deleteMySkill: async (skillId) => {
    const response = await profileApi.delete(`/api/user/deletemyskill/${skillId}`);
    return response.data;
  },

  // Languages
  addMyLanguage: async (language) => {
    const response = await profileApi.put('/api/user/addmylanguage', language);
    return response.data;
  },

  updateMyLanguage: async (languageId, language) => {
    const response = await profileApi.put(`/api/user/updatemylanguage/${languageId}`, language);
    return response.data;
  },

  deleteMyLanguage: async (languageId) => {
    const response = await profileApi.delete(`/api/user/deletemylanguage/${languageId}`);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await profileApi.put('/api/user/change-password', passwordData);
    return response.data;
  },

  // Delete account
  deleteAccount: async () => {
    const response = await profileApi.delete('/api/user/delete-account');
    return response.data;
  },

  // Get profile statistics (if available)
  getProfileStats: async () => {
    const response = await profileApi.get('/api/user/profile-stats');
    return response.data;
  },

  // Update notification preferences
  updateNotificationPreferences: async (preferences) => {
    const response = await profileApi.put('/api/user/notification-preferences', preferences);
    return response.data;
  },

  // Get notification preferences
  getNotificationPreferences: async () => {
    const response = await profileApi.get('/api/user/notification-preferences');
    return response.data;
  },
};

export default profileService; 