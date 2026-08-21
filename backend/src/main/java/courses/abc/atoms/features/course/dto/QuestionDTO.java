package courses.abc.atoms.features.course.dto;

import courses.abc.atoms.features.course.enums.DifficultyLevel;
import courses.abc.atoms.features.course.enums.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Data Transfer Object (DTO) container for Question-related requests and responses.
 */
public class QuestionDTO {

    /**
     * DTO for creating a new question.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionCreateRequest {
        @NotNull(message = "Question type is required")
        private QuestionType questionType;

        @NotBlank(message = "Question text is required")
        private String questionText;

        private String explanation;
        private Integer points;

        @NotNull(message = "Difficulty level is required")
        private DifficultyLevel difficultyLevel;

        private Integer questionOrder;
        private String mediaUrl;

        /**
         * Expected answer for ONE_WORD questions — used for auto-grading.
         * Leave null / blank to route to pending-manual-review instead.
         * Never exposed to students during an active attempt.
         * Must not exceed 500 characters (enforces the ONE_WORD intent).
         */
        @Size(max = 500, message = "correctAnswer must not exceed 500 characters")
        private String correctAnswer;

        private BigDecimal negativeMark;

        @Valid
        private List<QuestionOptionRequest> options;
    }

    /**
     * DTO for question options in create request.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionOptionRequest {
        private Long optionId;
        @NotBlank(message = "Option text is required")
        private String optionText;

        @NotNull(message = "Is correct flag is required")
        private Boolean isCorrect;

        private String explanation;
        private Integer optionOrder;
    }

    /**
     * Admin / instructor question view — extends the base response with
     * grading-sensitive fields that must never reach students.
     *
     * <p>Used exclusively by endpoints annotated with
     * {@code @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")} in
     * {@code QuestionController}. Reusing this DTO on a student-facing endpoint
     * would expose {@code correctAnswer} and must be avoided.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminQuestionResponse {
        private Long questionId;
        private QuestionType questionType;
        private String questionText;
        private String explanation;
        private Integer points;
        private DifficultyLevel difficultyLevel;
        private Integer questionOrder;
        private String mediaUrl;
        /**
         * Expected answer for ONE_WORD questions; null for all other types.
         * Must not be exposed through any student-facing endpoint.
         */
        private String correctAnswer;
        private BigDecimal negativeMark;
        private List<QuestionOptionResponse> options;
    }

    /**
     * DTO for question options in response.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionOptionResponse {
        private Long optionId;
        private String optionText;
        private Boolean isCorrect;
        private String explanation;
        private Integer optionOrder;
    }
}