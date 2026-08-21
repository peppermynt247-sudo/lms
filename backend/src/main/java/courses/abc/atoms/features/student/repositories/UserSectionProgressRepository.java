package courses.abc.atoms.features.student.repositories;

import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.features.course.model.CurriculumSection;
import courses.abc.atoms.features.student.model.UserSectionProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserSectionProgressRepository extends JpaRepository<UserSectionProgress,Long> {
    Optional<UserSectionProgress> findByUserAndSection(Users user, CurriculumSection section);
}
