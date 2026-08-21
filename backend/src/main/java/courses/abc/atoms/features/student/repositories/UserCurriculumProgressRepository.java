package courses.abc.atoms.features.student.repositories;

import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.features.course.model.Curriculum;
import courses.abc.atoms.features.student.model.UserCurriculumProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserCurriculumProgressRepository extends JpaRepository<UserCurriculumProgress,Long> {
    Optional<UserCurriculumProgress> findByUserAndCurriculum(Users user, Curriculum curriculum);
}
