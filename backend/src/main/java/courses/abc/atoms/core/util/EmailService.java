package courses.abc.atoms.core.util;

import com.mailgun.api.v3.MailgunMessagesApi;
import com.mailgun.client.MailgunClient;
import com.mailgun.model.message.Message;
import com.mailgun.model.message.MessageResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final MailgunMessagesApi mailgunMessagesApi;
    private final String domain;
    private final String fromEmail;
    private final String fromName;

    public EmailService(
            MailgunMessagesApi mailgunMessagesApi,
            @Value("${mailgun.domain}") String mailgunDomain,
            @Value("${mailgun.from.email}") String fromEmail,
            @Value("${mailgun.from.name}") String fromName) {
        this.mailgunMessagesApi = mailgunMessagesApi;
        this.domain = mailgunDomain;
        this.fromEmail = fromEmail;
        this.fromName = fromName;
    }

    public void sendOtp(String email, String otp) {
        String subject = "🔐 Password Reset Request - OTP Inside";
        String text = String.format(
                "Hi there,\n\n" +
                        "We received a request to reset your password. Please use the OTP below to proceed:\n\n" +
                        "🔑 Your OTP: %s\n\n" +
                        "This OTP is valid for the next 5 minutes. If you did not request a password reset, please ignore this email.\n\n" +
                        "Regards,\n" +
                        "ABC Courses Support Team\n" +
                        "https://abc.courses", otp
        );

        String fromAddress = String.format("%s <%s>", fromName, fromEmail);

        Message message = Message.builder()
                .from(fromAddress)
                .to(email)
                .subject(subject)
                .text(text)
                .build();

        try {
            MessageResponse response = mailgunMessagesApi.sendMessage(domain, message);
        } catch (Exception e) {
            logger.error("Failed to send email: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }



    public void sendHelpRequestToAdmin(String userEmail, String userMessage) {
        String subject = "Help Request from User";



        String text = String.format(
                "Hi Admin,\n\n" +
                        "A user has requested help via the platform.\n\n" +
                        " User Email: %s\n" +
                        "Message:\n%s\n\n" +
                        "Please respond to the user as soon as possible.\n\n" +
                        "Regards,\n" +
                        "ABC Courses System\n" +
                        "https://abc.courses", userEmail, userMessage
        );


        String fromAddress = String.format("%s <%s>", fromName, fromEmail);

        Message message = Message.builder()
                .from(fromAddress)
                .to(userEmail)
                .subject(subject)
                .text(text)
                .build();

        try {
            MessageResponse response = mailgunMessagesApi.sendMessage(domain, message);
        } catch (Exception e) {
            logger.error("Failed to send help request: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send help request", e);
        }
    }



    public void sendWelcomeCredentials(String email, String name, String password) {
        String subject = "Welcome to ABC Courses - Your Login Credentials";
        String text = String.format(
                "Hello %s,\n\n" +
                        "Welcome to ABC Courses! Your account has been created successfully.\n\n" +
                        "Here are your login credentials:\n\n" +
                        "Login ID (Email): %s\n" +
                        "Password: %s\n\n" +
                        "You can login at: https://app.abc.courses\n\n" +
                        "We recommend changing your password after your first login.\n\n" +
                        "If you have any questions, feel free to reach out to our support team.\n\n" +
                        "Best regards,\n" +
                        "ABC Courses Team\n" +
                        "https://abc.courses", name, email, password
        );

        String fromAddress = String.format("%s <%s>", fromName, fromEmail);

        Message message = Message.builder()
                .from(fromAddress)
                .to(email)
                .subject(subject)
                .text(text)
                .build();

        try {
            mailgunMessagesApi.sendMessage(domain, message);
        } catch (Exception e) {
            logger.error("Failed to send welcome credentials email: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send welcome credentials email: " + e.getMessage(), e);
        }
    }



    public void sendPasswordResetConfirmation(String email, String name, String newPassword) {
        String subject = "Your ABC Courses Password Has Been Reset";
        String text = String.format(
                "Hello %s,\n\n" +
                        "Your password for ABC Courses has been successfully reset.\n\n" +
                        "Your updated login credentials:\n\n" +
                        "Login ID (Email): %s\n" +
                        "New Password: %s\n\n" +
                        "You can login at: https://abc.courses\n\n" +
                        "If you did not request this change, please contact our support team immediately.\n\n" +
                        "Best regards,\n" +
                        "ABC Courses Team\n" +
                        "https://abc.courses", name, email, newPassword
        );

        String fromAddress = String.format("%s <%s>", fromName, fromEmail);

        Message message = Message.builder()
                .from(fromAddress)
                .to(email)
                .subject(subject)
                .text(text)
                .build();

        try {
            mailgunMessagesApi.sendMessage(domain, message);
        } catch (Exception e) {
            logger.error("Failed to send password reset confirmation email: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send password reset confirmation email: " + e.getMessage(), e);
        }
    }



    public void sendCourseEnrollmentConfirmation(String userEmail, String userName, String courseName) {
        String subject = "Course Enrollment Confirmation: " + courseName;


        String text = String.format(
                "Hello %s,\n\n" +
                        "Congratulations!\n\n" +
                        "You have been successfully enrolled in the following course:\n\n" +
                        "Course Name: %s\n\n" +
                        "Your Login ID (Email): %s\n\n" +
                        "You can access your course by logging into your dashboard at: https://abc.courses\n\n" +
                        "If you have any questions, feel free to reach out to our support team.\n\n" +
                        "Best regards,\n" +
                        "ABC Courses Team\n" +
                        "https://abc.courses", userName, courseName, userEmail
        );

        String fromAddress = String.format("%s <%s>", fromName, fromEmail);

        Message message = Message.builder()
                .from(fromAddress)
                .to(userEmail)
                .subject(subject)
                .text(text)
                .build();

        try {
            MessageResponse response = mailgunMessagesApi.sendMessage(domain, message);
        } catch (Exception e) {
            logger.error("Failed to send course enrollment email: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send course enrollment email", e);
        }
    }



}
