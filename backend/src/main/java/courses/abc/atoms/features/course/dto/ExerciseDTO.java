package courses.abc.atoms.features.course.dto;

import courses.abc.atoms.features.course.enums.DifficultyLevel;
import courses.abc.atoms.features.course.enums.QuestionType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for all Exercise-related operations.
 * Contains nested classes for create, update, and response models.
 */
@Data
@NoArgsConstructor
public class ExerciseDTO {

    /**
     * DTO for creating a new Exercise. Sent as the request body.
     */
    @Data
    public static class CreateRequest {
        @NotNull(message = "Title cannot be null")
        private String title;
        private String description;
        private String instructions;
        @NotNull(message = "Question Bank ID cannot be null")
        private Long questionBankId;
        private String exerciseType;
        private Integer timeLimitMinutes;
        private Integer passingPercentage;
        private Integer maxAttempts;
        private Boolean randomizeQuestions;
        private Integer numQuestions;
    }

    /**
     * DTO for updating an existing Exercise.
     *
     * <p>{@code questionBankId} is intentionally excluded. Changing the question bank
     * on an exercise that may already have student attempt records would corrupt
     * historical scores (the attempts were evaluated against the original bank's questions).
     * Re-linking requires creating a new exercise.
     */
    @Data
    public static class UpdateRequest {
        @NotNull(message = "Title cannot be null")
        private String title;
        private String description;
        private String instructions;
        private String exerciseType;
        private Integer timeLimitMinutes;
        private Integer passingPercentage;
        private Integer maxAttempts;
        private Boolean randomizeQuestions;
        private Integer numQuestions;
    }

    /**
     * A minimal DTO for representing the Question Bank linked to an exercise.
     * Used within the main Response DTO.
     */
    @Data
    public static class QuestionBankInfo {
        private Long questionBankId;
        private String name;
        private QuestionType questionsType;
        private DifficultyLevel difficultyLevel;
    }

    /**
     * A comprehensive DTO for API responses containing full exercise details.
     */
    @Data
    public static class Response {
        private Integer exerciseId;
        private String title;
        private String description;
        private String instructions;
        private String exerciseType;
        private Integer timeLimitMinutes;
        private Integer passingPercentage;
        private Integer maxAttempts;
        private Boolean randomizeQuestions;
        private Integer numQuestions;
        private QuestionBankInfo questionBank;
    }

    /**
     * A summary DTO for listing multiple exercises, e.g., within a course section.
     */
    @Data
    public static class SummaryResponse {
        private Integer exerciseId;
        private String title;
        private String description;
        private String exerciseType;
    }
}