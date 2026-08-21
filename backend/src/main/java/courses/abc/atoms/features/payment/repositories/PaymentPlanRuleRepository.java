package courses.abc.atoms.features.payment.repositories;

import courses.abc.atoms.features.payment.model.PaymentPlanRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;


public interface PaymentPlanRuleRepository extends JpaRepository<PaymentPlanRule,Long> {

    Optional<PaymentPlanRule> findByPaymentPlanRulesId(Long id);
    List<PaymentPlanRule> findByPaymentPlan_PlanId(Long id);
}
