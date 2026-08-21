package courses.abc.atoms.features.course.dto;

import courses.abc.atoms.features.course.enums.DifficultyLevel;
import courses.abc.atoms.features.course.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTOs used exclusively during the test-taking session.
 *
 * <p>These types intentionally omit or mask sensitive fields (e.g. {@code isCorrect})
 * that must not be exposed to students while an attempt is in progress.
 */
public final class StudentTestDTO {

    private StudentTestDTO() {}

    // -----------------------------------------------------------------------
    // Question & Option views served to the student
    // -----------------------------------------------------------------------

    /**
     * A single answer option as presented to the student.
     * The {@code isCorrect} flag from {@code QuestionOptions} is deliberately omitted.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentOption {
        private Long optionId;
        private String optionText;
        private Integer optionOrder;
    }

    /**
     * A question as presented to the student during an active attempt.
     * Options are returned without correctness information.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentQuestion {
        private Long questionId;
        private String questionText;
        private QuestionType questionType;
        private Integer points;
        private DifficultyLevel difficultyLevel;
        private String mediaUrl;
        private Integer questionOrder;
        private List<StudentOption> options;
    }

    // -----------------------------------------------------------------------
    // Navigation / progress panel
    // -----------------------------------------------------------------------

    /**
     * Per-question status used to render the navigation panel on the right side
     * of the test UI.
     */
    public enum QuestionStatusType {
        /** Student has not visited or answered this question. */
        NOT_ATTEMPTED,
        /** Student has provided an answer (and NOT flagged for review). */
        ANSWERED,
        /** Student flagged the question for review, with or without an answer. */
        MARKED_FOR_REVIEW,
        /** Student answered AND flagged for review. */
        ANSWERED_AND_MARKED
    }

    /**
     * Status of a single question for the navigation panel.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionStatus {
        private Long questionId;
        private Integer questionOrder;
        private QuestionStatusType status;
    }

    /**
     * Full progress snapshot for an in-progress attempt.
     * Drives the right-side navigation panel in the test UI.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttemptProgressResponse {
        private Long attemptId;
        private Integer totalQuestions;
        private Integer answeredCount;
        private Integer markedForReviewCount;
        private Integer answeredAndMarkedCount;
        private Integer notAttemptedCount;
        private List<QuestionStatus> questionStatuses;
    }
}
