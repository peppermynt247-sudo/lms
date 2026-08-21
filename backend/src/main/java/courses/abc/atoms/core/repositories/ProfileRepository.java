package courses.abc.atoms.core.repositories;

import courses.abc.atoms.core.model.core.Profiles;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<Profiles, Long> {

    @Query("SELECT p FROM Profiles p WHERE p.user.id = :userId")
    Optional<Profiles> findByUserId(@Param("userId") Long userId);

    /**
     * Batch-loads profiles for a collection of user IDs in a single query.
     * Used to avoid N+1 queries when resolving instructor names on paginated session lists.
     */
    @Query("SELECT p FROM Profiles p WHERE p.user.id IN :userIds")
    List<Profiles> findAllByUserIdIn(@Param("userIds") Collection<Long> userIds);

    Optional<Profiles> findByPhoneNumber(String phoneNumber);

    boolean existsByPhoneNumber(String phoneNumber);

    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Profiles p WHERE p.phoneNumber = :phoneNumber AND p.user.id != :userId")
    boolean existsByPhoneNumberAndUserIdNot(@Param("phoneNumber") String phoneNumber, @Param("userId") Long userId);

    
}
