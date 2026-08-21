package courses.abc.atoms.features.course.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import courses.abc.atoms.features.course.enums.ContentType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "content_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long itemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    @JsonBackReference
    private CurriculumSection section;

    @Enumerated(EnumType.STRING)
    private ContentType contentType;

    private Integer contentReferenceId;

    private Integer itemOrder;

    private Boolean isPublished = false;

    private Boolean isRequired = false;

    private Integer estimatedMinutes;

    private Integer xpPoints;

    private LocalDateTime releaseDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prerequisite_item_id")
    private ContentItem prerequisiteItem;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
