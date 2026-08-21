package courses.abc.atoms.features.payment.repositories;

import courses.abc.atoms.features.payment.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon,Long> {


    Optional<Coupon> findByCouponId(Long CouponId);
}
