package courses.abc.atoms.features.payment.model;


import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.features.course.model.Course;
import courses.abc.atoms.features.course.model.CourseBundles;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "installments")
@NoArgsConstructor
@AllArgsConstructor
public class Installments {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long installmentId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne
    @JoinColumn(name = "bundle_id")
    private CourseBundles bundle;

    @ManyToOne
    @JoinColumn(name = "payment_id")
    private Payments payment;

    private BigDecimal amount;

    private String status;

    private LocalDateTime dueDate;

}
