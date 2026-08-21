package courses.abc.atoms.core.model.core;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "educations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Educations {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long educationId;

    @ManyToOne
    @JoinColumn(name = "profile_id", nullable = false)
    private Profiles profile;

    private String level;
    private String institutionName;
    private LocalDate passOfYear;
    private LocalDate startDate;
    private LocalDate endDate;
    private String branch;
    private String board;
    private String courses;
    private String percentage;
    private String rollNo;
    private String educationType;
    private String marksheet;
}