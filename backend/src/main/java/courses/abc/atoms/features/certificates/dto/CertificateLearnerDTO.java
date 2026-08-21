package courses.abc.atoms.features.certificates.dto;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
public class CertificateLearnerDTO {
    private Long userId;
    private String learnerName;
    private String email;
    private String phoneNumber;
    private String courseName;
    private OffsetDateTime issuedDate;
    private Boolean isPublished;

    public CertificateLearnerDTO(Long userId, String learnerName, String email, String phoneNumber, String courseName, OffsetDateTime issuedDate, Boolean isPublished) {
        this.userId = userId;
        this.learnerName = learnerName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.courseName = courseName;
        this.issuedDate = issuedDate;
        this.isPublished = isPublished;
    }
}
