package courses.abc.atoms.core.repositories;

import courses.abc.atoms.core.model.core.Experiences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExperienceRepository extends JpaRepository<Experiences, Long> {
    List<Experiences> findByProfileProfileId(Long profileId);
}
