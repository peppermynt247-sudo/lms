package courses.abc.atoms.features.payment.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Table(name = "paymentplan_rules")
@NoArgsConstructor
@AllArgsConstructor
public class PaymentPlanRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentPlanRulesId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private PaymentPlans paymentPlan;

    @Column(nullable = false)
    private Long installment;

    @Column(nullable = false)
    private Long weightage;

    @Column(nullable = false)
    private Long interval;
}
