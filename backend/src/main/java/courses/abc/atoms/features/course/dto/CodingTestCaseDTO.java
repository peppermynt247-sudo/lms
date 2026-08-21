package courses.abc.atoms.features.course.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;

public class CodingTestCaseDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "Input is required.")
        private String input;
        @NotBlank(message = "Expected output is required.")
        private String expectedOutput;
        private String explanation;
        private Boolean isHidden;
        private Integer testOrder;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Integer testCaseId;
        private Integer codingExerciseId;
        private String input;
        private String expectedOutput;
        private String explanation;
        private Boolean isHidden;
        private Integer testOrder;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private Integer testCaseId;
        @NotBlank(message = "Input is required.")
        private String input;
        @NotBlank(message = "Expected output is required.")
        private String expectedOutput;
        private String explanation;
        private Boolean isHidden;
        private Integer testOrder;
    }
}