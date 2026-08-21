package courses.abc.atoms.features.course.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class CurriculumSectionsDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CurriculumSectionCreateRequest {
        @NotBlank(message = "Section title is required.")
        @Size(max = 255, message = "Title cannot exceed 255 characters.")
        private String title;

        @Size(max = 1000, message = "Description cannot exceed 1000 characters.")
        private String description;

        private Integer sectionOrder;
        private Boolean isPublished;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode(callSuper = false)
    public static class CurriculumSectionCreateRequestExtended extends CurriculumSectionCreateRequest {
        private Integer prerequisiteSectionId;
        private String prerequisiteCondition;
        private LocalDateTime releaseDate;
        private Integer dripDaysAfterEnrollment;
        private LocalDateTime dripSpecificDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CurriculumSectionUpdateRequest {
        @Size(max = 255, message = "Title cannot exceed 255 characters.")
        private String title;

        @Size(max = 1000, message = "Description cannot exceed 1000 characters.")
        private String description;

        private Integer sectionOrder;
        private Boolean isPublished;
        private LocalDateTime releaseDate;
        private Integer dripDaysAfterEnrollment;
        private LocalDateTime dripSpecificDate;
        private Integer prerequisiteSectionId;
        private String prerequisiteCondition;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CurriculumSectionResponse {
        private Integer sectionId;
        private Integer curriculumId;
        private String title;
        private String description;
        private Integer sectionOrder;
        private Boolean isPublished;
        private LocalDateTime releaseDate;
        private Integer dripDaysAfterEnrollment;
        private LocalDateTime dripSpecificDate;
        private Integer prerequisiteSectionId;
        private String prerequisiteCondition;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}