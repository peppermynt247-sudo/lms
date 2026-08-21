package courses.abc.atoms.core.model.core;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "experiences")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Experiences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long experienceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private Profiles profile;

    private String company;
    private String title;
    private LocalDate startdate;
    private LocalDate enddate;
    private String location;
    private String details;
    private String positionType;
    private String designation;
    private String companySector;
    private String experienceCertificate;
}
