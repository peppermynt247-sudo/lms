package courses.abc.atoms.features.course.repositories;



import courses.abc.atoms.features.course.model.CourseBundles;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CourseBundleRepository extends JpaRepository<CourseBundles, Long> {

    Optional<CourseBundles> findByBundleId(Long id);
}
