package courses.abc.atoms.features.course.repositories;



import java.util.Optional;
import courses.abc.atoms.features.course.model.BundleCourses;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;


public interface BundleCourseRepository extends JpaRepository<BundleCourses, BundleCourses.BundleCoursesId> {
    Optional<BundleCourses> findByIdBundleIdAndIdCourseId(Long bundleId, Long courseId);
    List<BundleCourses> findAllByIdBundleId(Long bundleId);

    boolean existsById_BundleId(Long bundleId);
}