package courses.abc.atoms.core.repositories;
import courses.abc.atoms.core.model.core.Referrals;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface ReferralRepository extends JpaRepository<Referrals, String> {
    List<Referrals> findByReferrerId(Long referrerId);
    Optional<Referrals> findByReferralId(String referralId);
    Optional<Referrals> findByUserId(Long userId);


    @Query(value = "SELECT r.referral_id AS code, r.wallet AS wallet, u.created_at AS enrolled, p.name AS name, u.email AS email " +
            "FROM referrals r " +
            "LEFT JOIN users u ON  r.user_id = u.user_id " +
            "LEFT JOIN profiles p ON u.user_id = p.user_id " +
            "WHERE r.referrer_id = :userId", nativeQuery = true)
    List<Object[]> findReferralDetailsByUserId(@Param("userId") Long userId);



}
