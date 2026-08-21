package courses.abc.atoms.features.course.repositories; 

import courses.abc.atoms.features.course.model.CoursePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CoursePlanRepository extends JpaRepository<CoursePlan, Long> {
    boolean existsByCourse_CourseId(Long courseId);
    List<CoursePlan> findByCourse_CourseId(Long courseId);
    boolean existsByCourse_CourseIdAndPlan_PlanId(Long courseId, Long planId);

    // new methods for bundles
    boolean existsByBundle_BundleId(Long bundleId);
    List<CoursePlan> findByBundle_BundleId(Long bundleId);
    boolean existsByBundle_BundleIdAndPlan_PlanId(Long bundleId, Long planId);
}