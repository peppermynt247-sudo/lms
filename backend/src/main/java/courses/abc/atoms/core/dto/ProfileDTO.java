package courses.abc.atoms.core.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProfileDTO {
    private Integer profileId;
    private Integer userId;
    private String userName;
    private byte[] image;
    private String gender;
    private String bio;
    private String phoneNumber;
    private String country;
    private String languagePreference;
    private String socialLinks;
    private LocalDateTime updatedAt;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ShortProfileDTO {
        private Integer profileId;
        private String userName;
        private byte[] image;
        private String gender;
        private String phoneNumber;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ProfileUpdateDTO {
        private String email;
        private String name;
        private String phone;
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
        private List<EducationDTO> educations;

        @Data
        public static class EducationDTO {
            private String level;
            private String institutionName;
            private String passOfYear;
            private String startDate;
            private String endDate;
            private String branch;
            private String board;
            private String courses;
            private String percentage;
            private String rollNo;
            private String educationType;
        }
    }
}
