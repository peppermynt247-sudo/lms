import api from './api';

// Auth API service
export const authService = {
  // Login user
  login: async (formData) => {
    const response = await api.post('/api/user/login', formData);
    return response.data;
  },

  // Register user
  register: async (formData) => {
    // Create FormData object for registration
    const form = new FormData();
    form.append('name', formData.name);
    form.append('email', formData.email);
    form.append('password', formData.password);
    form.append('phoneNumber', formData.phoneNumber);
    form.append('gender', formData.gender);
    form.append('role', formData.role);

    const response = await api.post('/api/user/register', form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get current user
  getCurrentUser: async (email) => {
    const response = await api.get(`/api/user/currentuser?email=${email}`);
    return response.data;
  },

  // Logout (you can add server-side logout logic here if needed)
  logout: async () => {
    // If you have a server-side logout endpoint, call it here
    // const response = await api.post('/api/user/logout');
    // return response.data;
    
    // For now, just return a resolved promise
    return Promise.resolve();
  },
};

export default authService;
