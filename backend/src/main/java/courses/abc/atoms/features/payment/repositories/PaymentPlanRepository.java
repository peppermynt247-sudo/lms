package courses.abc.atoms.features.payment.repositories;

import courses.abc.atoms.features.payment.model.PaymentPlans;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentPlanRepository extends JpaRepository<PaymentPlans, Long> {

    Optional<PaymentPlans> findByPlanId(Long id);
    List<PaymentPlans> findByIsActive(Boolean isActive);
}
