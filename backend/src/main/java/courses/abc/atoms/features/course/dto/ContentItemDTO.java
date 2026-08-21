package courses.abc.atoms.features.course.dto;

import courses.abc.atoms.features.course.enums.ContentType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Defines the shape of data for creating and retrieving ContentItems.
 * The nested design keeps the API clean and scalable for future content types.
 */
@Data
@NoArgsConstructor
public class ContentItemDTO {

    @Data
    public static class CreateRequest {
        @NotNull
        private String title;
        @NotNull
        private ContentType contentType;
        private String description;
        private Boolean isPublished;
        private Boolean isRequired;
        private Integer estimatedMinutes;
        private Integer xpPoints;

        @Valid // Ensure nested object is validated
        private ExerciseCreateDetails exerciseDetails;
    }

    @Data
    public static class UpdateRequest {
        @NotNull
        private String title;
        private String description;
        private Boolean isPublished;
        private Boolean isRequired;

        // You could also update the exercise details
        @Valid 
        private ExerciseUpdateDetails exerciseDetails;
    }

    @Data
    public static class ExerciseCreateDetails {
        @NotNull
        private Long questionBankId;
        @NotNull
        private String title;
        private String description;
        private String instructions;
        private String exerciseType;
        private Integer timeLimitMinutes;
        private Integer passingPercentage;
        private Integer maxAttempts;
        private Boolean randomizeQuestions;
    }

    @Data
    public static class ExerciseUpdateDetails {
        @NotNull
        private String title;
        private String description;
        private String instructions;
        // Note: You typically wouldn't change the question bank on an update,
        // but you could add the field here if needed.
    }

    /**
     * DTO for updating the metadata of a ContentItem wrapper itself.
     * Use this for changing things like published status or item order.
     */
    @Data
    public static class MetadataUpdateRequest {
        private Boolean isPublished;
        private Boolean isRequired;
        
        // Note: For complex reordering, a dedicated service endpoint is often better.
        // This field allows for direct updates to an item's order position.
        private Integer itemOrder;
    }

    @Data
    public static class Response {
        private Long itemId;
        private Integer sectionId;
        private String title;
        private String description;
        private ContentType contentType;
        private Integer itemOrder;
        private Boolean isPublished;
        private Boolean isRequired;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Object contentDetails;
    }

    @Data
    public static class ExerciseDetailsResponse {
        private Integer exerciseId;
        private String title;
        private String description;
        private String instructions;
        private QuestionBankDTO questionBank; 
    }
}