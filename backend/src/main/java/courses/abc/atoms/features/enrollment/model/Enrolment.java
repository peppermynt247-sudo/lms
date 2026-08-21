package courses.abc.atoms.features.enrollment.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_course_enrollment") // Use a more descriptive table name
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Enrolment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "enrollment_id")
    private Integer id;
    private Integer userId;
    private Integer courseId;
    @Column(nullable = false, unique = true, length = 191)
    private String orderNumber;
    private Integer price;
    private String paymentId;
    private String paymentStatus = "PENDING";
    private String status = "PENDING";
    private String paymentVia;
    private LocalDateTime createdAt = LocalDateTime.now();
}
