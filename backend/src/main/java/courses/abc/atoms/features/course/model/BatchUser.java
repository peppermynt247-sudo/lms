package courses.abc.atoms.features.course.model;
import courses.abc.atoms.core.model.core.Users;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.time.LocalDateTime;

@Entity
@Table(name = "batch_users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long batchUserId;

    @ManyToOne
    @JoinColumn(name = "batch_id", nullable = false)
    private Batches batch;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;
}
