package courses.abc.atoms.features.course.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "test_cases")  // matches Liquibase table
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodingTestCase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer testCaseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coding_exercise_id", nullable = false)
    private CodingExercise codingExercise;

    @Column(columnDefinition = "TEXT")
    private String input;
    @Column(columnDefinition = "TEXT")
    private String expectedOutput;
    @Column(columnDefinition = "TEXT")
    private String explanation;
    private Boolean isHidden;
    private Integer testOrder;
}
