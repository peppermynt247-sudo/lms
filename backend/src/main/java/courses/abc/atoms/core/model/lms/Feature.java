package courses.abc.atoms.core.model.lms;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;

@Data
@RequiredArgsConstructor
@Entity(name = "Feature")
@Table(name = "features")
public class Feature {
    @Id
    @Column(length=200)
    @Size(max = 200)
    private String id;

    private String scope;

    private String name;

    private String description;

    @Column(name = "installedversion")
    private String installedVersion;

    @Column(name = "availableversion")
    private String availableVersion;

    @Column(name = "additionalinfo")
    private String additionalInfo;

    @Column(name = "supportedversions")
    private String supportedVersions;

    @Column(name = "enablemanagerrole")
    private boolean enableManagerRole = false;
}
