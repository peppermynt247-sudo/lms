package courses.abc.atoms.features.course.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class CourseDTO {

    // --- CourseCreateRequest and CourseUpdateRequest are unchanged ---
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseCreateRequest {
        @NotBlank(message = "Course title is required.")
        @Size(max = 255)
        private String title;
        @NotBlank(message = "Pretty name for the URL is required.")
        @Size(max = 255)
        private String prettyName;
        private String description;
        private BigDecimal price;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseUpdateRequest {
        @NotBlank(message = "Course title is required.")
        @Size(max = 255)
        private String title;
        @NotBlank(message = "Pretty name for the URL is required.")
        @Size(max = 255)
        private String prettyName;
        private String description;
        private String overview;
    }


    /**
     * DTO for sending course information back to the client.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseResponse {
        private Long courseId;
        private String title;
        private String prettyName;
        private String description;
        private String overview;

        // This one is also corrected for consistency
        @JsonProperty("isArchived")
        private boolean archived;

        private String thumbnailUrl;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Integer defaultCurriculumId;
        private java.math.BigDecimal price;

         private List<CurriculumDTO.CurriculumResponse> curriculums;
    }

    /**
     * DTO for updating the archival status of a course.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArchiveStatusRequest {
        // THE FIX: Rename the field to remove the "is" prefix.
        // Keep @JsonProperty to match the API contract.
        @JsonProperty("isArchived")
        private boolean archived;
    }

    /**
     * DTO For receiving a planId in the request body.
     */
    @Data
    public static class PlanRequest {
        @NotNull(message = "Plan ID is required.")
        private Long planId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanSummary {
        private Long planId;
        private String name;

    }

    /**
     * DTO for updating the price and validity of a course.
     */
    @Data
    public static class PricingRequest {
        private java.math.BigDecimal price;
        private Integer validityInDays;
    }

    /**
     * DTO for updating the publish status of a course.
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
        private List<PlanSummary> plans;
    }


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllLearners{
        private Long userId;
        private String name;
        private String email;
        private String phoneNumber;
        private LocalDateTime enrolled;
        private BigDecimal ProgressPercentage;

    }


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanRule {
        private Long ruleId;
        private Long installment;
        private Long weightage;
        private Long interval;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailedPlanSummary {
        private Long planId;
        private String name;
        private List<PlanRule> rules;
    }

    @Data
    @Builder
    public static class PricingAndPlansResponses {
        private String courseName;
        private String thumbnailUrl;
        private BigDecimal price;
        private Integer validityInDays;
        private Boolean isPublished;
        private List<DetailedPlanSummary> plans;
        private BatchDTO.DefaultBatchInfo defaultBatch;
    }

    @Data
    @AllArgsConstructor
    public static class CourseContextResponse {
        private String courseTitle;
        private BatchInfo batch;
        private Integer defaultCurriculumId;
        private List<CurriculumInfo> availableCurriculums;
    }

    @Data
    @AllArgsConstructor
    public static class BatchInfo {
        private Long batchId;
        private String batchName;
    }

    @Data
    @AllArgsConstructor
    public static class CurriculumInfo {
        private Integer curriculumId;
        private String title;
        private int progressPercentage;
    }

}