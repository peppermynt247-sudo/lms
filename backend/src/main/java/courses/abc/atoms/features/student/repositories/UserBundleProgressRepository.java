package courses.abc.atoms.features.student.repositories;

import courses.abc.atoms.features.student.model.UserBundleProgress;
import java.util.Optional;
import courses.abc.atoms.core.model.core.Users;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserBundleProgressRepository extends JpaRepository<UserBundleProgress,Long> {
	Optional<UserBundleProgress> findByUserAndBundle(Users user, courses.abc.atoms.features.course.model.CourseBundles bundle);

}
