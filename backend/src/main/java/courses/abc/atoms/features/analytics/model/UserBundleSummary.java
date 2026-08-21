package courses.abc.atoms.features.analytics.model;

import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.features.course.model.CourseBundles;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Stores the summary of a user's progress in a  bundle.
 * This table is designed for fast reads on dashboards.
 */
@Entity
@Table(name = "user_bundle_summary",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "bundle_id"}))
@Data
@NoArgsConstructor
public class UserBundleSummary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long summaryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bundle_id", nullable = false)
    private CourseBundles bundle;

    @Column(nullable = false)
    private Integer completedItems = 0;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

}
