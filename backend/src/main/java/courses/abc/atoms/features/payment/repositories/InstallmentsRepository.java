package courses.abc.atoms.features.payment.repositories;

import courses.abc.atoms.features.payment.model.Installments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InstallmentsRepository extends JpaRepository<Installments,Long> {


    Optional<Installments> findByInstallmentId(Long id);

    Optional<Installments> findFirstByUser_IdAndCourse_CourseIdAndStatusNotOrderByDueDateAsc(
            Long userId, Long courseId, String status);

    List<Installments> findAllByUser_IdAndCourse_CourseId(Long UserId, Long CourseId);
    List<Installments> findByUser_IdAndBundle_BundleId(Long UserId, Long BundleId);

    Optional<Installments> findByInstallmentIdAndUser_IdAndCourse_CourseId(Long installmentId, Long userId, Long courseId);
    Optional<Installments> findByInstallmentIdAndUser_IdAndBundle_BundleId(Long installmentId, Long userId, Long BundleId);

}

