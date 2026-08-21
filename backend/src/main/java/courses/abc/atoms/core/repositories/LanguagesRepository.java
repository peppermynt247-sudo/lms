package courses.abc.atoms.core.repositories;

import courses.abc.atoms.core.model.core.Languages;
import courses.abc.atoms.core.model.core.Skills;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LanguagesRepository extends JpaRepository<Languages, Long> {
    List<Languages> findByProfileProfileId(Long profileId);
}
