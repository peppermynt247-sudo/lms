package courses.abc.atoms.features.course.model;

import courses.abc.atoms.features.course.enums.DifficultyLevel;
import courses.abc.atoms.features.course.enums.QuestionType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long questionId;

    @ManyToOne
    @JoinColumn(name = "question_bank_id", nullable = false)
    private QuestionBank questionBank;

    private QuestionType questionType;
    private String questionText;
    private String explanation;
    private Integer points;
    private DifficultyLevel difficultyLevel;
    private Integer questionOrder;
    private String mediaUrl;

    /**
     * Expected answer for ONE_WORD / fill-in-the-blank questions.
     *
     * <p>When set, the grader performs a case-insensitive, whitespace-trimmed
     * comparison at submission time and auto-scores the response as correct or
     * incorrect — no instructor review needed.
     *
     * <p>When null or blank, the system falls back to {@code pendingReview}
     * behaviour (backwards compatible with pre-existing questions).
     *
     * <p>This field is intentionally excluded from {@code StudentTestDTO.StudentQuestion}
     * so the answer is never leaked to the student during an active attempt.
     */
    @Column(name = "correct_answer", length = 500)
    private String correctAnswer;

    /**
     * Penalty deducted for a wrong answer (e.g. -0.25).
     * Null means no negative marking applies for this question.
     */
    @Column(name = "negative_mark", precision = 5, scale = 2)
    private BigDecimal negativeMark;

    @OneToMany(mappedBy = "questionId", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuestionOptions> options;
}