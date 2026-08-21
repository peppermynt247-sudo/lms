package courses.abc.atoms.core.repositories;

import courses.abc.atoms.core.model.core.Educations;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EducationRepository extends JpaRepository<Educations, Long> {
    @Query("SELECT e FROM Educations e WHERE e.profile.profileId = :profileId")
    List<Educations> findByProfileId(@Param("profileId") Long profileId);
}
