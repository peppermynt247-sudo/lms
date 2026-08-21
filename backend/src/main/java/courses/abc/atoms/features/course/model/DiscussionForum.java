package courses.abc.atoms.features.course.model;

import java.time.LocalDateTime;
import java.util.List;

import courses.abc.atoms.core.model.core.Users;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "discussion_forums")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionForum {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer forumId;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne
    @JoinColumn(name = "batch_id")
    private Batches batches;

    @ManyToOne
    @JoinColumn(name = "section_id")
    private CurriculumSection section;

    @ManyToOne
    @JoinColumn(name = "content_item_id")
    private ContentItem contentItem;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private Users users;

    private String content;

    private Integer viewCount;

    private Boolean isPinned;

    private Boolean isLocked;

    private Boolean isActive;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) {
            isActive = true;
        }
        if (isPinned == null) {
            isPinned = false;
        }
        if (isLocked == null) {
            isLocked = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @OneToMany(mappedBy = "discussionForum", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ForumReply> replies;

}