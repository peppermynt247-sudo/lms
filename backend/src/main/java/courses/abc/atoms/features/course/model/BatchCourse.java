package courses.abc.atoms.features.course.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "batch_courses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Batches batch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bundle_id")
    private CourseBundles bundle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_id")
    private Curriculum curriculum;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_section_id", nullable = true)
    private CurriculumSection curriculumSection;

    @Column(name = "primary_for_course", nullable = false)
    @Builder.Default
    private boolean primaryForCourse = false;

    private boolean isPublished;

    private LocalDateTime publishedAt;

    private LocalDateTime unpublishedAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;


}