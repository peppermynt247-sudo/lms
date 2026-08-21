package courses.abc.atoms.features.course.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import courses.abc.atoms.core.model.core.Users;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor

public class CourseBundles {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long bundleId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

     @Lob
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(columnDefinition = "bytea")
    private byte[] thumbnailImage;

    private BigDecimal price;
    private Integer validityInDays;

    private BigDecimal discountPercentage;


    private Boolean isFeatured;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Users createdBy;


    private Boolean isPublished;

    private Integer enrollmentLimit;


    private LocalDateTime enrollmentStartDate;


    private LocalDateTime enrollmentEndDate;

    private Boolean isArchived = false;
   
}
