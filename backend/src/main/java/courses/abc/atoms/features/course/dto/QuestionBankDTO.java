package courses.abc.atoms.features.course.dto;

import courses.abc.atoms.features.course.enums.DifficultyLevel;
import courses.abc.atoms.features.course.enums.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
// import java.util.List; // Uncomment later

@Data
public class QuestionBankDTO {

    private Long questionBankId;

    @NotBlank(message = "Question bank name cannot be blank")
    private String name;

    private String description;

    @NotNull(message = "Question type cannot be null")
    private QuestionType questionsType;

    private DifficultyLevel difficultyLevel;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Integer totalQuestions;

    // Uncomment this when QuestionDTO is ready
    // private List<QuestionDTO> questions;
}