package courses.abc.atoms.features.student.model;

import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.features.course.model.Curriculum;
import courses.abc.atoms.features.student.enums.StatusType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "user_curriculum_progress")
@NoArgsConstructor
@AllArgsConstructor
public class UserCurriculumProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long progressId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id",nullable = false)
    private Users user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_id", nullable = false)
    private Curriculum curriculum;

    @Enumerated(EnumType.STRING)
    private StatusType status;
    private BigDecimal progressPercentage;
    private LocalDateTime lastUpdated;
}
