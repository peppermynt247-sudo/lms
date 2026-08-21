package courses.abc.atoms.features.course.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Stores a single student answer for one question within an {@link ExerciseAttempt}.
 *
 * <p>The named entity graph {@code QuestionResponse.withQuestionAndOptions} eagerly
 * fetches the associated {@link Question} and its {@link QuestionOptions} list, plus
 * the {@link #selectedOption} in a single JOIN query. Repositories that need to
 * evaluate or display responses should reference this graph to avoid N+1 issues.
 */
@NamedEntityGraph(
        name = "QuestionResponse.withQuestionAndOptions",
        attributeNodes = {
                @NamedAttributeNode(value = "question", subgraph = "question-options"),
                @NamedAttributeNode("selectedOption")
        },
        subgraphs = {
                @NamedSubgraph(
                        name = "question-options",
                        attributeNodes = @NamedAttributeNode("options")
                )
        }
)
@Entity
@Table(name = "user_question_responses")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class QuestionResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long responseId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private ExerciseAttempt attempt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_option_id")
    private QuestionOptions selectedOption;
    private String textResponse;
    private Boolean isCorrect;
    private BigDecimal pointsAwarded;
    private Long responseTimeSeconds;

    /**
     * Comma-separated selected option IDs for MULTIPLE_CORRECT questions.
     * Example: "12,15,18". Unused for MCQ / TRUE_FALSE / ONE_WORD.
     */
    @Column(name = "selected_option_ids", columnDefinition = "TEXT")
    private String selectedOptionIds;

    /**
     * True when the student explicitly flagged this question for re-review
     * before final submission. Uses primitive to guarantee non-null at the
     * Java layer and match the DB NOT NULL constraint.
     */
    @Column(name = "marked_for_review", nullable = false)
    private boolean markedForReview = false;
}