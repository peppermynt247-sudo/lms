package courses.abc.atoms.features.course.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ExerciseAttemptDTO {

    /**
     * Sent by the student to start a new exercise attempt.
     *
     * <p>{@code userId} is kept for backwards compatibility with older clients but is
     * <strong>ignored</strong> server-side. The authenticated user's ID is always
     * derived from the security context in the controller.
     *
     * <p>{@code attemptNumber} has been removed. It is always computed server-side
     * to prevent clients from bypassing the {@code maxAttempts} constraint.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExerciseAttemptRequest {

        /**
         * @deprecated No longer read server-side. The authenticated user's ID is always
         *             derived from the JWT security context. This field is retained only
         *             for backwards compatibility with older clients and will be removed
         *             in a future API version.
         */
        @Deprecated
        private Long userId;

        @NotNull
        private Long contentItemId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExerciseAttemptResponse {
        private Long attemptId;
        private Long userId;
        private Long exerciseId;
        private Long contentItemId;
        private BigDecimal score;
        private Long maxScore;
        private BigDecimal percentage;
        private Boolean passed;
        private LocalDateTime startedAt;
        private LocalDateTime completedAt;
        private Long timeSpentSeconds;
        private Integer attemptNumber;
        private List<QuestionResponseDTO.DetailedQuestionResponse> questionsResponse;
        private String username;
        private Integer totalAttemptedQuestions;
        private Integer correctAnswers;
        private Integer incorrectAnswers;
        private Integer unansweredQuestions;
        /** ONE_WORD questions awaiting instructor manual review. */
        private Integer pendingReviewCount;
        /** Ordered list of question IDs exactly as they were served to the student (post-shuffle, post-slice). */
        private List<Long> servedQuestionIds;
    }
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExerciseAttemptSummaryResponse {
        private Long attemptId;
        private Long userId;
        private Long exerciseId;
        private Long contentItemId;
        private BigDecimal score;
        private Long maxScore;
        private BigDecimal percentage;
        private Boolean passed;
        private LocalDateTime startedAt;
        private LocalDateTime completedAt;
        private Long timeSpentSeconds;
        private Integer attemptNumber;
    }
}