package courses.abc.atoms.features.course.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "courses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long courseId; 

    private Long instructorId;
    @Column(nullable = false)
    private String title;
    @Column(nullable = false, unique = true)
    private String prettyName;
    private String subtitle;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(columnDefinition = "TEXT")
    private String overview;
    @Column(name = "thumbnail_url", length = 512)
    private String thumbnailUrl;
    private String version;
    private String difficultyLevel;
    private Integer estimatedHours;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private String completionCriteria = "{}";
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private String prerequisites = "{}";
    private String syllabusUrl;
    private Integer featuredRank;
    private BigDecimal price;
    private Integer validityInDays;
    private Integer enrollmentLimit;
    private LocalDateTime enrollmentStartDate;
    private LocalDateTime enrollmentEndDate;
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    private boolean isPublished;
    private boolean isFeatured;
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean isArchived = false;

    private Integer defaultCurriculumId;
  
    @ManyToMany(fetch = FetchType.LAZY, cascade = { CascadeType.PERSIST, CascadeType.MERGE })
    @JoinTable(name = "curriculum_courses",
            joinColumns = @JoinColumn(name = "course_id"),
            inverseJoinColumns = @JoinColumn(name = "curriculum_id"))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Curriculum> curriculums = new HashSet<>();

    /**
     * Helper method to retrieve the default Curriculum object.
     * This was missing and caused compilation errors.
     * @return The default Curriculum, or null if not found.
     */
    @Transient
    public Curriculum getDefaultCurriculum() {
        if (defaultCurriculumId == null || curriculums == null || curriculums.isEmpty()) {
            return null;
        }
        return curriculums.stream()
                .filter(c -> defaultCurriculumId.equals(c.getCurriculumId()))
                .findFirst()
                .orElse(null);
    }

}