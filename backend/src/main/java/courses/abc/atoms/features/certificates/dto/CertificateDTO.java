package courses.abc.atoms.features.certificates.dto;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

public class CertificateDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class getCertificateIssuedDetails {
        private String userName;
        private String courseName;
        private String collegeName;
        private String issuedAt;
        private String startDate;
        private String endDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class getMyCertificates {
        private String certificateName;
        private String courseName;
        private String collegeName;
        private String issuedAt;
        private String startDate;
        private String endDate;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class getCertificateIssued {
        private String issuedAt;
        private String certificateName;
        private String courseName;
        private String certificateUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Publish {
        private Long userId;
        private Boolean isPublished;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Certificates {
        private Long templateId;
        private String name;
        private String description;
        private String templateUrl;
        private String serialPrefix;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Certificate {
        private String name;
        private String description;
        private String templateUrl;
        private String serialPrefix;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class updateCertificate {
        private Long templateId;
        private String name;
        private String description;
        private String templateUrl;
        private String serialPrefix;
    }

    @Data
    public static class BulkIssueRequest { // Changed to static
        private Long templateId;
        private List<StudentRequest> students;
    }

    @Data
    public static class StudentRequest { // Changed to static
        private String email;
        private String name;
        private String courseName;
        private String collegeName;
        private String issuedAt;
        private String startDate;
        private String endDate;

        public String getName() {
        return name;
    }
    }

    @Data
    public static class BulkIssueResponse {
        private Long certificateId;
        private String email;
        private String serialNumber;
        private String issuedAt;
        private String filePath; // Add this field

        // Getters and setters
        public String getFilePath() { return filePath; }
        public void setFilePath(String filePath) { this.filePath = filePath; }

        public BulkIssueResponse(Long certificateId, String email, String serialNumber, String issuedAt) {
            this.certificateId = certificateId;
            this.email = email;
            this.serialNumber = serialNumber;
            this.issuedAt = issuedAt;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IssuedCertificateUpdateRequest {
        private String courseName;
        private String collegeName;
        private String certificateUrl;
        private Boolean isPublished;
        private OffsetDateTime issuedAt;
        private OffsetDateTime startDate;
        private OffsetDateTime endDate;
    }

}