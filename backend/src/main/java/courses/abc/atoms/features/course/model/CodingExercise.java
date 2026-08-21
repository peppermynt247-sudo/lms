package courses.abc.atoms.features.course.model;

import courses.abc.atoms.features.course.enums.DifficultyLevel;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "coding_exercises")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodingExercise {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer codingExerciseId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String codingQuestion;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(length = 50)
    private DifficultyLevel difficultyLevel;

    @Column(columnDefinition = "TEXT")
    private String starterCode;

    @Column(columnDefinition = "TEXT")
    private String solutionCode;

    private Integer timeLimitMinutes;

    private Integer maxAttempts;

    private String supportedLanguages;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
