import api from "@/services/api"

const sendEmail = (emailData) => {
    api.post("/api/user/help", {
        ...emailData
    });
}

const helpCenter = {
    sendEmail
};
export default helpCenter;