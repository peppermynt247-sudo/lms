package courses.abc.atoms.features.course.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class ContentProgressDTO {
    
        /**
     * Enum representing the possible states of content progress.
     */
    public enum ContentProgressStatus {
        NOT_STARTED,
        IN_PROGRESS,
        COMPLETED
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ContentProgressRequest {
        private Long contentItemId;
        private Long progressPercentage;
        private Long timeSpentSeconds;
    }

}
