package courses.abc.atoms.features.certificates.repositories;

import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.features.certificates.dto.CertificateDTO;
import courses.abc.atoms.features.certificates.dto.CertificateLearnerDTO;
import courses.abc.atoms.features.certificates.model.IssuedCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IssuedCertificateRepository extends JpaRepository<IssuedCertificate, Long> {

    @Query("""
        SELECT new courses.abc.atoms.features.certificates.dto.CertificateDTO$getCertificateIssued(
            CAST(ic.issuedAt AS string),
            ct.name,
            ic.courseName,
            ic.certificateUrl
        )
        FROM IssuedCertificate ic
        JOIN ic.template ct
        WHERE ic.user.id = :userId
        """)
    List<CertificateDTO.getCertificateIssued> fetchAllIssuedCertificates(@Param("userId") Long userId);

    Optional<IssuedCertificate> findByCertificateId(Long certificateId);

    @Query("SELECT DISTINCT ic.user FROM IssuedCertificate ic WHERE ic.template.templateId = :templateId")
    List<Users> findStudentsByCertificateTemplateId(@Param("templateId") Long templateId);

    @Query("SELECT NEW courses.abc.atoms.features.certificates.dto.CertificateLearnerDTO(u.id, p.name, u.email, p.phoneNumber, ic.courseName, ic.issuedAt, ic.isPublished) " +
           "FROM IssuedCertificate ic " +
           "JOIN ic.user u " +
           "JOIN Profiles p WITH p.user = u " +
           "WHERE ic.template.templateId = :templateId")
    List<CertificateLearnerDTO> findLearnersByCertificateTemplateId(@Param("templateId") Long templateId);
    Optional<IssuedCertificate> findByTemplate_TemplateIdAndUser_Id(Long templateId, Long userId);
    @Query("SELECT ic FROM IssuedCertificate ic WHERE ic.user.id = :userId")
    List<IssuedCertificate> findByUserId(Long userId);
    Optional<IssuedCertificate> findByCertificateIdAndUser_Id(Long certificateId, Long userId);
    @Query("SELECT ic FROM IssuedCertificate ic " +
           "JOIN ic.user u " +
           "WHERE ic.isPublished = false " +
           "AND (u.email = :email " +
           "OR EXISTS (SELECT 1 FROM Profiles p WHERE p.user = u AND p.phoneNumber = :phoneNumber))")
    Optional<IssuedCertificate> findByIsPublishedFalseAndUser_EmailOrUser_PhoneNumber(
            @Param("email") String email, 
            @Param("phoneNumber") String phoneNumber);
}