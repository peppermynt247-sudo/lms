package courses.abc.atoms.features.course.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class CodeSubmissionDTO {

    /**
     * DTO for handling an incoming code submission request from a user.
     * The exercise ID and content ID would typically be provided as URL path variables.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CodeSubmissionRequest {
        @NotBlank(message = "The programming language must be specified.")
        private String language;

        @NotBlank(message = "The submitted code cannot be empty.")
        private String code;
    }

    /**
     * DTO for returning a concise result to the student after a final submission.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmissionResultResponse {
        private Long submissionId;
        private String status;
        private BigDecimal score;
        private Integer maxScore;
        private Integer totalTestCases;
        private Integer passedTestCases;
        private Integer failedTestCases;
        private Integer remainingAttempts;
        private List<CodingExerciseDTO.RunCodeResponseDTO> submissionDetails;
    }

    /**
     * summary of a past attempt for list views.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AttemptSummaryResponse {
        private Long submissionId;
        private Integer attemptNumber;
        private String status;
        private BigDecimal score;
        private Integer maxScore;
        private LocalDateTime submittedAt;
    }

    /**
     * details of a specific attempt, including the submitted code.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AttemptDetailResponse {
        private Long submissionId;
        private Integer attemptNumber;
        private String status;
        private BigDecimal score;
        private Integer maxScore;
        private LocalDateTime submittedAt;
        private String language;
        private String code;
        private Integer totalTestCases;
        private Integer passedTestCases;
        private Integer failedTestCases;
    }
}
