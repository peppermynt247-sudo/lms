import api from "./api";

const BundleService = {
  getBundleById: async (bundleId) => {
    try {
      const response = await api.get(`api/student/bundle/${bundleId}`);
      return response.data;
    } catch (error) {
      throw new Error("Error fetching bundle");
    }
  },
};

export default BundleService;
