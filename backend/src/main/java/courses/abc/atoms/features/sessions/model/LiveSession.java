package courses.abc.atoms.features.sessions.model;

import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.features.course.model.Batches;
import courses.abc.atoms.features.course.model.ContentItem;
import courses.abc.atoms.features.course.model.Course;
import courses.abc.atoms.features.sessions.enums.SessionStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "live_sessions", indexes = {
        @Index(name = "idx_live_sessions_batch_scheduled", columnList = "batch_id, scheduled_at"),
        @Index(name = "idx_live_sessions_status", columnList = "status")
})
@NamedEntityGraph(
        name = "LiveSession.withBatchAndCourse",
        attributeNodes = {
                @NamedAttributeNode("batch"),
                @NamedAttributeNode("course"),
                @NamedAttributeNode("instructor")
        }
)
@Data
@NoArgsConstructor
@ToString(exclude = {"recordings", "batch", "course", "instructor", "createdBy", "contentItem"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class LiveSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private Batches batch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id")
    private Users instructor;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_item_id", unique = true)
    private ContentItem contentItem;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 512)
    private String zoomJoinUrl;

    @Column(length = 100)
    private String zoomMeetingId;

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    @Column(nullable = false)
    private int durationMinutes = 60;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private SessionStatus status = SessionStatus.SCHEDULED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Users createdBy;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<SessionRecording> recordings = new ArrayList<>();
}
