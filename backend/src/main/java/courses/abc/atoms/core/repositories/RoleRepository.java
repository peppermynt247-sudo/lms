package courses.abc.atoms.core.repositories;

import java.util.List;
import java.util.Optional;


import org.springframework.data.jpa.repository.JpaRepository;

import courses.abc.atoms.core.model.lms.Role;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByRoleName(String roleName);
    Optional<Role> findByRoleId(Long roleId);
    List<Role> findAll();
}