package courses.abc.atoms.features.course.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import courses.abc.atoms.features.course.enums.QuestionType;
import courses.abc.atoms.features.course.enums.DifficultyLevel;

public class QuestionResponseDTO {

    /**
     * Submitted by the student for a single question, either during progressive
     * save ({@code POST .../answer}) or bulk submit ({@code POST .../complete}).
     *
     * <ul>
     *   <li>MCQ / TRUE_FALSE  → populate {@code selectedOptionId}</li>
     *   <li>MULTIPLE_CORRECT  → populate {@code selectedOptionIds}</li>
     *   <li>ONE_WORD          → populate {@code textResponse}</li>
     * </ul>
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompleteAttemptRequest {

        @NotNull(message = "questionId is required")
        private Long questionId;

        /** For MCQ / TRUE_FALSE — the single selected option. */
        private Long selectedOptionId;

        /** For MULTIPLE_CORRECT — all selected option IDs. */
        private List<Long> selectedOptionIds;

        /** For ONE_WORD / fill-in-the-blank questions. */
        private String textResponse;

        /** Time spent on this individual question, in seconds. */
        private Long responseTimeSeconds;

        /** When true the student flagged this question for later review. */
        private Boolean markedForReview;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailedQuestionResponse {
        private Long questionId;
        private String questionText;
        private String questionExplanation;
        private QuestionType questionType;
        private Integer points;
        private DifficultyLevel difficultyLevel;
        private String mediaUrl;
        private List<QuestionOptionDetail> options;
        private Long selectedOptionId;
        private String textResponse;
        private Boolean isCorrect;
        private BigDecimal pointsAwarded;
        private Long responseTimeSeconds;

        /**
         * The correct option ID for MCQ / TRUE_FALSE questions.
         * For MULTIPLE_CORRECT questions use {@link #correctOptionIds} instead —
         * this field returns only the first correct option and is kept for
         * single-answer backwards compatibility.
         */
        private Long correctOptionId;

        /** Explanation sourced from the first correct option. */
        private String correctExplanation;

        /**
         * All correct option IDs — populated for MULTIPLE_CORRECT questions.
         * For MCQ / TRUE_FALSE this list contains exactly one element (same as {@link #correctOptionId}).
         */
        private List<Long> correctOptionIds;

        /**
         * The configured correct answer for ONE_WORD questions, shown after submission
         * so the student can compare against what they typed.
         * Null for MCQ / TRUE_FALSE / MULTIPLE_CORRECT questions.
         * Never present in the question-fetch response during an active attempt
         * ({@code StudentTestDTO.StudentQuestion} is used for that instead).
         */
        private String correctAnswer;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionOptionDetail {
        private Long optionId;
        private String optionText;
        private Boolean isCorrect;
        private String explanation;
        private Integer optionOrder;
    }
}