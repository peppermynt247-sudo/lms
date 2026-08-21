package courses.abc.atoms.features.analytics.repositories;

import courses.abc.atoms.features.course.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface AnalyticsRepository extends JpaRepository<Course, Long> {

    @Query("SELECT count(c.courseId) FROM Course c")
    long countCourses();

    @Query("SELECT count(cb.bundleId) FROM CourseBundles cb")
    long countBundles();

    @Query("SELECT count(b.batchId) FROM Batches b")
    long countBatches();

    @Query(value = "SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON ur.role_id = r.role_id WHERE r.role_name = 'STUDENT'", nativeQuery = true)
    long countStudents();


    @Query("SELECT count(uce.enrollmentId) FROM UserCourseEnrollment uce")
    long countEnrollments();

    @Query(value = "SELECT SUM(p.amount) FROM payments p WHERE p.payment_status = 'COMPLETED'", nativeQuery = true)
    BigDecimal sumTotalRevenue();
}