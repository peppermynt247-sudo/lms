package courses.abc.atoms.core.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import courses.abc.atoms.core.dto.ProfileDTO.ProfileUpdateDTO.EducationDTO;
import courses.abc.atoms.core.model.lms.Role;
import jakarta.persistence.Column;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
// import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UserDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegistrationRequest {
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Email should be valid")
        private String email;

        @NotNull(message = "Phone number is required")
        private String phoneNumber;
        private String password = "Password@1234";
        private String role;
        private String gender;
        private MultipartFile profileImage;
        private String referralId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkRegistrationRequest {

        @NotEmpty(message = "Learner list cannot be empty")
        private List<@Valid Learner> learners;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Learner {
            @NotBlank(message = "Name is required")
            @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
            private String name;

            @NotBlank(message = "Email is required")
            @Email(message = "Email should be valid")
            private String email;

            @NotNull(message = "Phone number is required")
            private String phone;
            private String password = "Password@1234";
            private String role = "STUDENT"; // Default is STUDENT
            private String referralId;

        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Email should be valid")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserResponse {
        private Long id;
        private String email;
        private String role;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateUserPassword {

        private String password;
        private String newpassword;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserProfileInfo {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private List<String> roles;
        private Boolean isActive;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkRegistrationResponse {
        private List<UserResponse> successfulRegistrations;
        private List<ErrorDetail> errors;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class ErrorDetail {
            private String email;
            private String phone;
            private String message;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstructorRegistrationResponse {
        private List<UserResponse> successfulRegistrations;
        private List<ErrorDetail> errors;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class ErrorDetail {
            private String email;
            private String phone;
            private String message;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstructorRegistrationRequest {

        @NotEmpty(message = "Learner list cannot be empty")
        private List<@Valid Instructor> instructors;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Instructor {
            @NotBlank(message = "Name is required")
            @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
            private String name;

            @NotBlank(message = "Email is required")
            @Email(message = "Email should be valid")
            private String email;

            @NotNull(message = "Phone number is required")
            private String phone;

            @NotBlank(message = "Password is required")
            @Size(min = 8, message = "Password must be at least 8 characters")
            private String password = "Abc@1234";

            private String role = "INSTRUCTOR"; 
        }
    }

    @Data
    public static class ReferralResponse {
        private Long referredUserId;
        private String referredEmail;
        private String referralId;
        private BigDecimal wallet;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExperienceDTO {
        private Long id;
        private String company;
        private String title;
        private LocalDate startdate;
        private LocalDate enddate;
        private String location;
        private String details;
        private String positionType;
        private String designation;
        private String companySector;
        private String experienceCertificate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkillDTO {
        private Long id;
        private String skillName;
        private String proficiencyLevel;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LanguageDTO {
        private Long id;
        private String languageName;
        private String proficiencyLevel;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EducationDTO {
        private Long educationId;
        private String level;
        private String institutionName;
        private LocalDate passOfYear;
        private LocalDate startDate;
        private LocalDate endDate;
        private String branch;
        private String board;
        private String courses;
        private String percentage;
        private String rollNo;
        private String educationType;
        private String marksheet; 
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserProfileResponse {
        private Long userId;
        private String email;
        private String name;
        private String phoneNumber;
        private String parentName;
        private String parentContact;
        private String parentEmail;
        private String gender;
        private String dob;
        private String bio;
        private String whatsappNumber;
        private String address;
        private String qualification;
        private String aadhar;
        private String pan;
        private String city;
        private String state;
        private String country;
        private String pincode;
        private String resume;
        private String profileImageUrl;
        private List<EducationDTO> educations;
        private List<ExperienceDTO> experiences;
        private List<SkillDTO> skills;
        private List<LanguageDTO> languages;
    }


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReferralDetails{
        private String code;
        private BigDecimal wallet;

        private List<Referred> referreds =new ArrayList<>();

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Referred{
            private LocalDateTime enrolled;
            private String name;
            private String email;
        }

    }

    @Data
    @NoArgsConstructor
    public static class PasswordResetDTO {
        private String oldPassword;
        private String newPassword;
        private String confirmPassword;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserWallet{
        private String code;
        private Long userId;
        private BigDecimal wallet;
    }


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HelpDTO {
        private String email;
        private String context;
    }


}