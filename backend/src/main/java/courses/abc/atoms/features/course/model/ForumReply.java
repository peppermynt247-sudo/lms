package courses.abc.atoms.features.course.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

import courses.abc.atoms.core.model.core.Users;



@Entity
@Table(name = "forum_replies")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForumReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer replyId;

    @ManyToOne
    @JoinColumn(name = "forum_id", nullable = false)
    private DiscussionForum discussionForum;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private Users users;

    private Integer vote;

    private String content;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Column(name = "is_solution")
    private Boolean isSolution;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isSolution == null) {
            isSolution = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}