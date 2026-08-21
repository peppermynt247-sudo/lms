package courses.abc.atoms.features.analytics.model;

import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.features.course.model.Course;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Stores the summary of a user's progress in a single course.
 * This table is designed for fast reads on dashboards.
 */
@Entity
@Table(name = "user_course_summary",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "course_id"}))
@Data
@NoArgsConstructor
public class UserCourseSummary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long summaryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false)
    private Integer completedItems = 0;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

}
