package courses.abc.atoms.features.course.model;

import courses.abc.atoms.features.payment.model.PaymentPlans;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "course_plans")
@Data
public class CoursePlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private PaymentPlans plan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id") // Nullable
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bundle_id") // Nullable
    private CourseBundles bundle;
}