import api from './api';

// MyPurchases API service
export const myPurchasesService = {
  // Get user admissions/admissions
  getAdmissions: async (userId) => {
    const response = await api.get(`/api/admission/getadmission?userid=${userId}`);
    return response.data;
  },

  // Get payments for a specific admission
  getPaymentsForAdmission: async (userId, admission) => {
    const courseId = admission.courseId || admission.id;
    const params = { userid: userId };
    if (courseId) {
      params.courseid = courseId;
    }
    const response = await api.get('/api/payment/search', { params });
    return response.data;
  },

  // Get all payments for user
  getAllPayments: async (userId) => {
    const response = await api.get(`/api/payment/getpayments?userid=${userId}`);
    return response.data;
  },

  // Get all payments for all admissions of a user
  getAllPaymentsForUser: async (userId, admissions) => {
    const paymentsResult = {};
    
    for (const admission of admissions) {
      const key = admission.courseId || admission.id;
      try {
        const response = await myPurchasesService.getPaymentsForAdmission(userId, admission);
        paymentsResult[key] = response?.Data || [];
      } catch (error) {
        console.error(`Error fetching payments for admission ${key}:`, error);
        paymentsResult[key] = [];
      }
    }
    
    return paymentsResult;
  },

  // Get admission details with payments
  getAdmissionsWithPayments: async (userId) => {
    try {
      // Get admissions
      const admissionsResponse = await myPurchasesService.getAdmissions(userId);
      const admissions = admissionsResponse.Data || [];

      // Get payments for all admissions
      const paymentsMap = await myPurchasesService.getAllPaymentsForUser(userId, admissions);

      return {
        admissions,
        paymentsMap
      };
    } catch (error) {
      throw error;
    }
  }
};

export default myPurchasesService;
