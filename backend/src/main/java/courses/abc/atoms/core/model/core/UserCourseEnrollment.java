package courses.abc.atoms.core.model.core;


import courses.abc.atoms.features.course.model.Batches;
import courses.abc.atoms.features.course.model.Course;

import courses.abc.atoms.features.course.model.CourseBundles;
import courses.abc.atoms.features.payment.model.PaymentPlans;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "user_course_enrollments")
public class UserCourseEnrollment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long enrollmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bundle_id")
    private CourseBundles bundle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private Batches batches;

    private String paymentStatus;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id" )
    private PaymentPlans plan;
    private LocalDateTime enrolledAt;
    private LocalDateTime expiresAt;
    private BigDecimal progressPercentage;
    private String completionStatus;
    private String accessStatus;
    private LocalDateTime completedAt;
    private LocalDateTime lastActivityAt;
}
