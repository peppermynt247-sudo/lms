package courses.abc.atoms.core.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.constraints.NotEmpty;

public class AdminDTO {

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserAdminDTO {
        private Long id;
        private String name;
        private String abcId;
        private String email;
        private String phone;
        private String role;
        private Boolean isActive;
        private String gender;
        private String profileImage;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkLearnerArchiveRequest {
        @NotEmpty(message = "User IDs list cannot be empty")
        private List<Long> userIds;
    }
    }
