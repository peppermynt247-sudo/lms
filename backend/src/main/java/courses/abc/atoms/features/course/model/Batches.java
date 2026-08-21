package courses.abc.atoms.features.course.model;


import courses.abc.atoms.core.model.core.Users;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "batches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Batches {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long batchId;
    private String batchName;
    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;
    @ManyToOne
    @JoinColumn(name = "bundle_id")
    private CourseBundles courseBundle;
//    @JoinColumn(name = "user_id", nullable = false)
//    private Users batchManager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_manager_id")
    private Users batchManager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "additional_batch_manager_id")
    private Users additionalBatchManager;

    private Boolean accommodation;
    private boolean isDefault = false;

    private LocalDate startDate;
    private LocalDate endDate;

    @Column(nullable = false, length = 50)
    private String status = "ACTIVE";

    // private Boolean isActive;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "batch", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<BatchCourse> batchCourses = new HashSet<>();
}
