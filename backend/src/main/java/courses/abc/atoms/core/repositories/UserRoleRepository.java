package courses.abc.atoms.core.repositories;

import courses.abc.atoms.core.model.core.UserRoles;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.model.core.UserRoles.UserRoleId;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRoles, UserRoleId> {
    // This repository will handle UserRole entities, which are a many-to-many relationship
    // between User and Role entities. It can be extended with custom methods as needed.

    // Use this method for lookup by userId in the embedded id:
    List<UserRoles> findByIdUserId(Long userId);
    List<UserRoles> findByIdRoleId(Long roleId);
    Optional<UserRoles> findById_UserId(Long userId);
}
