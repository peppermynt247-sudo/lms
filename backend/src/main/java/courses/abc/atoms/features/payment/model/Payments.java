package courses.abc.atoms.features.payment.model;

import java.math.BigDecimal;
import java.security.PrivateKey;
import java.time.LocalDateTime;

import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.features.course.model.Course;

import courses.abc.atoms.features.course.model.CourseBundles;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payments {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @Column(nullable = false)
    private BigDecimal amount;

    private String currency;
    private String paymentStatus;
    private String paymentMethod;
    private String transactionId;
    private String paymentGateway;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bundle_id")
    private CourseBundles bundle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private PaymentPlans plan;


    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon couponId;
    private BigDecimal discountAmount;
    private String  referralCode;
    private LocalDateTime updateAt;
    private LocalDateTime createdAt;


}
