package courses.abc.atoms.features.course.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public class CurriculumDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CurriculumCreateRequest {

        @NotBlank(message = "Curriculum title is required.")
        @Size(max = 255, message = "Title cannot exceed 255 characters.")
        private String title;

        @Size(max = 1000, message = "Description cannot exceed 1000 characters.")
        private String description;

        @Size(max = 255, message = "Version cannot exceed 255 characters.")
        private String version;

        private Boolean isActive;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CurriculumResponse {

        private Integer curriculumId;
        private String title;
        private String description;
        private String version;
        private Boolean isActive;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Long numberOfSections;
    }

    @Data
    @AllArgsConstructor
    public static class CurriculumViewResponse {
        private String curriculumTitle;
        private List<CurriculumSectionWithProgress> sections;
    }

    @Data
    @AllArgsConstructor
    public static class CurriculumSectionWithProgress  {
        private Integer sectionId;
        private String sectionTitle;
        private Long totalItems;
        private Long completedItems;
        private List<ContentItemSummary> contentItems; // Null if not loaded
    }

    @Data
    @AllArgsConstructor
    public static class ContentItemSummary {
        private Long contentItemId;
        private Long itemId;
        private String title;
        private boolean isCompleted;
        private String contentType;
    }
}
