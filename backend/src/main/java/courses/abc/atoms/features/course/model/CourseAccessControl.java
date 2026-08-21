package courses.abc.atoms.features.course.model;


import courses.abc.atoms.features.payment.model.Installments;
import courses.abc.atoms.core.model.core.Users;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "course_access_controls")
@NoArgsConstructor
@AllArgsConstructor
public class CourseAccessControl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long accessControlId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = true)
    private Course course;

    @ManyToOne
    @JoinColumn(name = "bundle_id", nullable = true)
    private CourseBundles bundle;

    @ManyToOne
    @JoinColumn(name = "installment_id", nullable = false)
    private Installments installment;

    @Column(nullable = false)
    private Boolean accessGranted;

    private LocalDateTime activeBy;
}
