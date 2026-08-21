package courses.abc.atoms.features.certificates.model;

import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.features.course.model.Course;
import courses.abc.atoms.features.course.model.CourseBundles;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.aspectj.apache.bcel.classfile.Module;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "certificate_issued")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IssuedCertificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long certificateId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private Certificate template;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;
    private String courseName;
    private String collegeName;
    private Boolean isPublished;
    private String certificateUrl;
    @Column(nullable = false, unique = true)
    private String serialNumber;
    private OffsetDateTime issuedAt;
    private OffsetDateTime startDate;
    private OffsetDateTime endDate;
}
