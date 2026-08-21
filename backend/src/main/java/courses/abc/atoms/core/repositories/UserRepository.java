package courses.abc.atoms.core.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import courses.abc.atoms.core.model.core.Users;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<Users, Long> {
    Optional<Users> findById(Long id);

    Optional<Users> findByEmail(String email);

    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);

    List<Users> findByStatusInAndIsActiveTrue(List<String> statuses);
    List<Users> findByStatusAndIsActiveTrue(String status);
    List<Users> findByIsActiveFalse();
}
