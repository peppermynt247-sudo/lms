package courses.abc.atoms.features.enrollment.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import courses.abc.atoms.features.enrollment.model.Enrolment;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrolment, Integer> {
    // Add custom query methods if needed
    // Find enrolments by userId, courseId, etc.
    Optional<Enrolment> findByUserIdAndCourseId(Long userId, Long courseId);

    Optional<Enrolment> findByOrderNumber(String orderNumber);

    Optional<Enrolment> findByPaymentId(String paymentId);

    Optional<Enrolment> findByPaymentStatus(String paymentStatus);

    Optional<Enrolment> findByStatus(String status);

    Optional<Enrolment> findByUserId(Long userId);

    // Find courses by userId
    Optional<Enrolment> findByCourseId(Long userId);
}
