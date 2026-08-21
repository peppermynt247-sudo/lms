package courses.abc.atoms.core.model.lms;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class ApplicationConfiguration {

    @Id
    private Long id;

    private boolean firstApplicationStart = true;

    private boolean setupComplete = false;

    private String installedVersion;

    private String availableVersion;
}