package courses.abc.atoms.features.course.model;

import courses.abc.atoms.core.model.core.Users;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Represents a single code submission by a user for a coding exercise.
 */
@Entity
@Table(name = "code_submissions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long submissionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coding_exercise_id", nullable = false)
    private CodingExercise codingExercise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_item_id", nullable = false)
    private ContentItem contentItem;

    @Column(name = "language", nullable = false)
    private String language;

    @Column(name = "code", columnDefinition = "TEXT", nullable = false)
    private String code;

    private Integer totalTestCases;

    private Integer passedTestCases;

    private Integer failedTestCases;

    private String status;

    private BigDecimal score;

    private Integer maxScore;

    private Integer executionTimeMs;

    private Integer memoryUsedKb;

    @CreationTimestamp
    @Column(name = "submitted_at", updatable = false)
    private LocalDateTime submittedAt;

    private Integer attemptNumber;
}