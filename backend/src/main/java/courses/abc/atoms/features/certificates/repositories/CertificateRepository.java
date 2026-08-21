package courses.abc.atoms.features.certificates.repositories;



import courses.abc.atoms.features.certificates.model.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate,Long> {

    Optional<Certificate> findByTemplateId(Long Id);
    Optional<Certificate> findBySerialPrefix(String serialPrefix);
}
