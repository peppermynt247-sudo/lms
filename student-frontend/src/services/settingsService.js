import api from './api';

// Settings API service
export const settingsService = {
  // Update password
  updatePassword: async (passwordData) => {
    const response = await api.put('/api/user/resetpassword', {
      oldPassword: passwordData.oldPassword,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword
    });
    return response.data;
  },
};

export default settingsService;
