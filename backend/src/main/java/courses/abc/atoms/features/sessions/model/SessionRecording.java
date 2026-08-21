package courses.abc.atoms.features.sessions.model;

import courses.abc.atoms.features.course.model.ContentItem;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "session_recordings", indexes = {
        @Index(name = "idx_session_recordings_session_id", columnList = "session_id")
})
@Data
@NoArgsConstructor
@ToString(exclude = {"session", "contentItem"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class SessionRecording {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long recordingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private LiveSession session;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_item_id", unique = true)
    private ContentItem contentItem;

    @Column(length = 255)
    private String title;

    @Column(nullable = false, length = 1024)
    private String recordingUrl;

    @Column(length = 100)
    private String recordingPassword;

    private Integer durationSeconds;

    private LocalDateTime recordedAt;

    @Column(length = 200)
    private String vdoCipherId;

    @Column(name = "is_visible", nullable = false)
    private boolean visible = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
