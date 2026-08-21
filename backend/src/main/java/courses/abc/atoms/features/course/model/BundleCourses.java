package courses.abc.atoms.features.course.model;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "bundle_courses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BundleCourses {

    @EmbeddedId
    private BundleCoursesId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("bundleId")
    @JoinColumn(name = "bundle_id", nullable = false)
    private CourseBundles bundle;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("courseId")
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "sequence_order", nullable = false)
    private Integer sequenceOrder;

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BundleCoursesId implements Serializable {
        @Column(name = "bundle_id")
        private Long bundleId;

        @Column(name = "course_id")
        private Long courseId;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof BundleCoursesId that)) return false;
            return bundleId != null && bundleId.equals(that.bundleId) &&
                   courseId != null && courseId.equals(that.courseId);
        }

        @Override
        public int hashCode() {
            int result = bundleId != null ? bundleId.hashCode() : 0;
            result = 31 * result + (courseId != null ? courseId.hashCode() : 0);
            return result;
        }
    }
}
