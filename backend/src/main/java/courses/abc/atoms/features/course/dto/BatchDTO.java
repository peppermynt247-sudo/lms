package courses.abc.atoms.features.course.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL) // Exclude null fields from JSON
@Data
@NoArgsConstructor
public class BatchDTO {

    private List<BatchDetail> activeBatches;
    private List<BatchDetail> completedBatches;

    public BatchDTO(List<BatchDetail> activeBatches, List<BatchDetail> completedBatches) {
        this.activeBatches = activeBatches;
        this.completedBatches = completedBatches;
    }

    @Data
    public static class BatchDetail {
        private Long batchId;
        private String batchName;
        private String courseName;
        private String startDate;
        private String endDate;

        public BatchDetail(Long batchId, String batchName, String courseName, String startDate, String endDate) {
            this.batchId = batchId;
            this.batchName = batchName;
            this.courseName = courseName;
            this.startDate = startDate;
            this.endDate = endDate;
        }
    }

    /**
     * Represents a course and its selected curriculums for a batch request.
     */
    @Data
    public static class CourseDetailRequest {
        @NotNull(message = "Course ID is required.")
        private Long courseId;

        // A course can be associated with a batch without a specific curriculum
        private List<Integer> curriculumIds;

        private boolean isPrimary = false;
    }

    /**
     * DTO for creating a new batch with multiple courses.
     */
    @Data
    public static class BatchCreateRequest {
        @NotBlank(message = "Batch name is required.")
        private String batchName;

        private Long bundleId;

        @Valid
        private List<CourseDetailRequest> courses;

        // @NotNull(message = "Start date is required.")
        @FutureOrPresent(message = "Start date must be in the present or future.")
        private LocalDate startDate;
        
        // @NotNull(message = "End date is required.")
        private LocalDate endDate;

        @NotNull(message = "Batch Manager ID is required.")
        private Long batchManagerId;

        private Long additionalBatchManagerId;
        
        private Boolean accommodation; 
    }
    
    /**
     * DTO for updating the status of a batch (e.g., ACTIVE, COMPLETED, ARCHIVED).
     */
    @Data
    public static class BatchStatusUpdateRequest {
        @NotBlank(message = "Status is required.")
        @Pattern(regexp = "ACTIVE|COMPLETED|ARCHIVED", message = "Status must be one of: ACTIVE, COMPLETED, ARCHIVED")
        private String status;
    }

    /**
     * DTO for updating batch details.
     */
    @Data
    public static class BatchUpdateRequest {
        @NotBlank(message = "Batch name is required.")
        private String batchName;

        @Valid
        private List<CourseDetailRequest> courses;

        private Long bundleId;

        // @NotNull(message = "Start date is required.")
        private LocalDate startDate;
        
        // @NotNull(message = "End date is required.")
        private LocalDate endDate;

        @NotNull(message = "Batch Manager ID is required.")
        private Long batchManagerId;

        private Long additionalBatchManagerId;
        
        private Boolean accommodation; 
    }

    /**
     * Represents a course and its associated curriculums in a batch response.
     */
    @Data
    @Builder
    public static class CourseDetailResponse {
        private Long courseId;
        private String courseName;
        private boolean isPrimary;
        private List<CurriculumDTO.CurriculumResponse> curriculums;
    }

    /**
     * Represents a bundle's basic information in a response.
     */
    @Data
    @Builder
    public static class BundleResponse {
        private Long bundleId;
        private String bundleName;
    }

    /**
     * DTO for sending batch information back to the client.
     */
    @Data
    @Builder
    public static class BatchResponse {
        private Long batchId;
        private String batchName;
        private LocalDate startDate;
        private LocalDate endDate;
        private String status;
        private Boolean accommodation;
        private boolean isDefault;
        private Long learnersCount;
        private ManagerResponse batchManager;
        private ManagerResponse additionalBatchManager;
        private List<CourseDetailResponse> courses;

        private BundleResponse bundle;
    }
    
    /**
     * DTO for representing a batch manager's basic information.
     */
    @Data
    @Builder
    public static class ManagerResponse {
        private Long id;
        private String name;
    }

    /**
     * DTO for getting batch learners details.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchUserDTO {
        private Long userId;
        private String name;
        private String phoneNumber;
        private String email;
        private String Title;
        private LocalDateTime enrolled;
        private BigDecimal progress;
    }

    /**
     * DTO for the default batch's basic information for public endpoint.
     */
    @Data
    @Builder
    public static class DefaultBatchInfo {
        private Long batchId;
        private String batchTitle;
    }
}