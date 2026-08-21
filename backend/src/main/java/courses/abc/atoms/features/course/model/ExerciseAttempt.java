package courses.abc.atoms.features.course.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import courses.abc.atoms.core.model.core.Users;

@Entity
@Table(name = "exercise_attempts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long attemptId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_item_id", nullable = false)
    private ContentItem contentItem;
    @Column( precision = 5, scale = 2)
    private BigDecimal score;
    private Long maxScore;
    @Column( precision = 5, scale = 2)
    private BigDecimal percentage;
    private Boolean passed;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Long timeSpentSeconds;
    private Long attemptNumber;
}