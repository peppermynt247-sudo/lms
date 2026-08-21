package courses.abc.atoms.features.course.model;

import java.time.LocalDateTime;

import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.features.course.dto.ContentProgressDTO.ContentProgressStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_content_progress")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContentProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long progressId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @ManyToOne
    @JoinColumn(name = "content_item_id", nullable = false)
    private ContentItem contentItem;
    
    @Enumerated(EnumType.STRING)
    private ContentProgressStatus status = ContentProgressStatus.NOT_STARTED;
    
    private Long progressPercentage = 0L;
    private Long timeSpentSeconds = 0L;
    private LocalDateTime firstAccessedAt;
    private LocalDateTime lastAccessedAt;
    private LocalDateTime completedAt;

}
