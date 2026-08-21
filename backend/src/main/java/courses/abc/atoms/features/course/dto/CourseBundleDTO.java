package courses.abc.atoms.features.course.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import org.springframework.web.multipart.MultipartFile;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class CourseBundleDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseBundleRequestDTO {
        private String title;
        private String description;
        private Integer validityInDays;
        private MultipartFile thumbnailImage;
        private String price;
        private String enrollmentLimit;
        private String enrollmentStartDate;
        private String enrollmentEndDate;
        private String discountPercentage;
        private Boolean isFeatured;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateCourseBundleRequestDTO {
        private String title;
        private String description;
        private Integer validityInDays;
        private MultipartFile thumbnailImage;
        private String price;
        private String enrollmentLimit;
        private String enrollmentStartDate;
        private String enrollmentEndDate;
        private String discountPercentage;
        private Boolean isFeatured;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseBundleResponseDTO {
        private Long bundleId;
        private String title;
        private String description;
        private byte[] thumbnailImage;
        private BigDecimal price;
        private Integer enrollmentLimit;
        private LocalDateTime enrollmentStartDate;
        private LocalDateTime enrollmentEndDate;
        private BigDecimal discountPercentage;
        private Boolean isFeatured;
        private Boolean isArchived;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Boolean isPublished;
        private Integer validityInDays;
        private List<CourseDTO.CourseResponse>courses=new ArrayList<>(); {     
        };
    }

    @Data
    @NoArgsConstructor  
    @AllArgsConstructor
    public static class LinkCourseToBundleDTO {
        private Long courseId;
        private Long bundleId;
    }

    @Data
    public static class PlanRequest {
        @NotNull(message = "Plan ID is required.")
        private Long planId;
    }

    /**
     * DTO for updating pricing and validity for a bundle.
     */
    @Data
    public static class PricingRequest {
        private BigDecimal price;
        private Integer validityInDays;
    }

    /**
     * DTO for updating the publish status for a bundle.
     */
    @Data
    public static class PublishRequest {
        @NotNull
        private Boolean isPublished;
    }

    @Data
    @Builder
    public static class PricingAndPlansResponse {
        private BigDecimal price;
        private Integer validityInDays;
        private Boolean isPublished;
        private List<CourseDTO.PlanSummary> plans;
    }

}