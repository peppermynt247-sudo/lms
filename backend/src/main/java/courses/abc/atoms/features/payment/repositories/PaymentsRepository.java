package courses.abc.atoms.features.payment.repositories;

import courses.abc.atoms.features.payment.model.Payments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentsRepository extends JpaRepository<Payments,Long> {

    List<Payments> findByUser_IdAndPaymentStatus(Long id, String paymentStatus);
    Optional<Payments> findByPaymentId(Long id);

    @Query("SELECT p FROM Payments p WHERE p.razorpayPaymentId = :razorpayPaymentId")
    Optional<Payments> findByRazorpayPaymentId(@Param("razorpayPaymentId") String razorpayPaymentId);

    @Query("SELECT p FROM Payments p WHERE p.razorpayPaymentId = :razorpayOrderId")
    Optional<Payments> findByRazorpayOrderId(@Param("razorpayOrderId") String razorpayOrderId);


    @Query("SELECT p FROM Payments p WHERE p.user.id = :userId AND " +
            "p.paymentStatus = 'SUCCESS' AND " +
            "((:courseId IS NOT NULL AND p.course.courseId = :courseId) OR " +
            "(:bundleId IS NOT NULL AND p.bundle.bundleId = :bundleId))")
    List<Payments> findByUser_IdAndCourse_CourseIdOrBundle_BundleId(Long userId, Long courseId, Long bundleId);
}



