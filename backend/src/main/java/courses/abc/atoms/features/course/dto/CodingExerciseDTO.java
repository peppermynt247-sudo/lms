package courses.abc.atoms.features.course.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

import courses.abc.atoms.features.course.enums.DifficultyLevel;

public class CodingExerciseDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {

        @NotBlank(message = "Title is required.")
        private String title;

        @NotBlank(message = "codingQuestion is required.")
        @Size(max = 255, message = "codingQuestion cannot exceed 255 characters.")
        private String codingQuestion;
        private String description;
        private String instructions;
        private DifficultyLevel difficultyLevel;

        private String starterCode;
        private String solutionCode;

        private Integer timeLimitMinutes;
        private Integer maxAttempts;
        private String supportedLanguages;

        private List<CodingTestCaseDTO.CreateRequest> testCases;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {

        private Integer codingExerciseId;
        private String title;
        private String codingQuestion;
        private String description;
        private String instructions;
        private DifficultyLevel difficultyLevel;
        private String starterCode;
        private String solutionCode;
        private Integer timeLimitMinutes;
        private Integer maxAttempts;
        private String supportedLanguages;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<CodingTestCaseDTO.Response> testCases;
        private Integer attemptsMade;
        private Integer remainingAttempts;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @NotBlank(message = "Title is required.")
        private String title;

        @NotBlank(message = "codingQuestion is required.")
        @Size(max = 255, message = "codingQuestion cannot exceed 255 characters.")
        private String codingQuestion;
        private String description;
        private String instructions;
        private DifficultyLevel difficultyLevel;
        private String starterCode;
        private String solutionCode;
        private Integer timeLimitMinutes;
        private Integer maxAttempts;
        private String supportedLanguages;
        private List<CodingTestCaseDTO.UpdateRequest> testCases;
    }


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RunCodeRequestDTO {
        @NotBlank(message = "Source code is required.")
        private String sourceCode;

        @NotBlank(message = "Language ID is required.")
        private String languageId;

        @NotBlank(message = "Coding exercise ID is required.")
        private Integer codingExerciseId;

        private Long timeSpentSeconds;
    }


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RunCodeResponseDTO {
        private Integer testCaseId;
        private String stdout;
        private String stderr;
        private String compileOutput;
        private String message;
        private String time;
        private Integer memory;
        private Integer statusId;
        private String statusDescription;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryResponse {
        private Integer codingExerciseId;
        private String title;
        private String description;
        private DifficultyLevel difficultyLevel;
    }
}