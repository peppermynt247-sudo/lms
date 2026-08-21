package courses.abc.atoms.features.certificates.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "certificates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long templateId;
    @Column(nullable = false)
    private String name;
    private String description;
    private String templateUrl;
    @Column(nullable = false, unique = true)
    private String serialPrefix;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
