import api from "@/services/api";

const certificateService = {
  getMyCertificates: async () => {
    try {
      const res = await api.get("/api/certificates/getmycertificates" );

      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data.map((cert) => ({
          issuedAt: cert.issuedAt,
          certificateName: cert.certificateName,
          courseName: cert.courseName,
          certificateUrl: "", 
          collegeName: cert.collegeName,
          startDate: cert.startDate,
          endDate: cert.endDate,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch certificates", err);
    }
  },
};

export default certificateService;
