package courses.abc.atoms.features.course.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ebooks")
public class Ebook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ebookId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Permanent Spaces URL stored in DB.
     * e.g. https://abc-courses-media.nyc3.digitaloceanspaces.com/atoms-lms/ebooks/Java-Programming/uuid.pptx
     * Object ACL is private — access always via presigned URLs generated at request time.
     */
    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    /**
     * Permanent Spaces URL for cover image.
     * e.g. https://abc-courses-media.nyc3.digitaloceanspaces.com/atoms-lms/ebooks/cover-images/Java-Programming/uuid.jpg
     */
    @Column(name = "cover_image_url")
    private String coverImageUrl;

    @Column(name = "page_count")
    private Integer pageCount;

    @Column(name = "file_size_kb")
    private Long fileSizeKb;

    /** Always false — PPTs are protected; access only via presigned URLs */
    @Column(name = "allow_download")
    private Boolean allowDownload = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}