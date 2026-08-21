package courses.abc.atoms.features.course.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

import java.util.List;

@Entity
@Table(name = "curriculum_sections") 
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CurriculumSection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer sectionId;
    @ManyToOne
    @JoinColumn(name = "curriculum_id", nullable = false)
    private Curriculum curriculumId;
    private String title;
    private String description;
    private Integer sectionOrder;
    private Boolean isPublished;
    private LocalDateTime releaseDate;
    private Integer dripDaysAfterEnrollment;
    private LocalDateTime dripSpecificDate;
    @ManyToOne
    @JoinColumn(name = "prerequisite_section_id")
    private CurriculumSection prerequisiteSection;
    private String prerequisiteCondition;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isPublished == null) {
            isPublished = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

     // Establishes the one-to-many link from a Section to its ContentItems.
    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("itemOrder ASC") // Ensures items are fetched in the correct order
    @JsonManagedReference
    private List<ContentItem> contentItems;
}