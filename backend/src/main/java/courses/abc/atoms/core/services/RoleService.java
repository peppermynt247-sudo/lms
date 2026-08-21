package courses.abc.atoms.core.services;

import java.io.IOException;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.stream.Collectors;
import java.util.Optional;
import java.util.Set;

import javax.xml.parsers.ParserConfigurationException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xml.sax.SAXException;

import courses.abc.atoms.core.model.core.RoleType;
import courses.abc.atoms.core.model.core.UserRoles;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.model.lms.Role;
import courses.abc.atoms.core.repositories.RoleRepository;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.core.repositories.UserRoleRepository;
import lombok.extern.slf4j.Slf4j;

/*
* This service manages the creation and usage of LMS roles
*/
@Service
@Slf4j
public class RoleService {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private UserRepository userRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    /**
     * Create a role for a feature. 
     * 
     * If the role already exists, it returns the existing role.
     */
    public Role createRole(Role role) {
        // Check if the role already exists based on the name of role
        Optional<Role> existingRole = getAllRoles().stream()
            .filter(r -> r.getName().equalsIgnoreCase(role.getName()))
            .findFirst();

        if (!existingRole.isPresent()) {
            Role createdRole = roleRepository.save(role);

            log.info("Role \'" +role.getName()+ "\'created successfully" );

            return createdRole;
        }
        else {
            log.debug("Role \'" +role.getName()+ "\' already exists. - Doing nothing");
            return existingRole.get();
        }
    }

    // Future use case: Check if user has a role in a specific Feature
    // /**
    //  * Check the role for user
    //  * @param environmentName
    //  * @param userName
    //  * @param application
    //  * @param roleName
    //  * @return boolean
    //  */
    // public boolean hasRole(String userName, String roleName) {
        // boolean hasRole = false;
        // List<Role> userRoles = groupService.getAllLMSRolesForUserForEnvironmentName(userName, environmentName);
        // for (Role role :  userRoles) {
            // if(role.getApplication().equals(application) && role.getName().equalsIgnoreCase(roleName) && role.isActive()) {
                // hasRole = true;
            // }
        // }
        // return hasRole;
    // }

    // /**
    //  * Check if user is LMS or Utility admin
    //  * @param userid
    //  * @param utilityName
    //  * @return boolean
    //  */
    // public boolean isUserLMSOrUtilityAdmin(String environmentName, String userid, String utilityName) {
        // boolean isAdmin = false;
        // if(hasRole(environmentName, userid, "core", "Admin")) {
            // log.debug("User is LMSadmin");
            // isAdmin = true;
        // } else if(hasRole(environmentName, userid, utilityName, "Admin")) {
            // log.debug(String.format("User is %s admin", utilityName));
            // isAdmin = true;
        // }
        // return isAdmin;
    // }


    public List<Role> getAllRoles() {
        List<Role> repRoles = roleRepository.findAll();

        return repRoles;
    }

    public Role getRoleById(Long roleId) {
        // check to see if role already exists
        Optional<Role> role = roleRepository.findByRoleId(roleId);

        return role.get();
    }

    // public UserRoles getRoleByUserId(Long userId){
    //     Optional<UserRoles> role = roleRepository.findByUserId(userId);

    //     return role.get();
    // }

    public Role getRoleByName(String roleName) {
        // check to see if role already exists
        Optional<Role> role = roleRepository.findByRoleName(roleName);

        if (role.isPresent()) {
            return role.get();
        } else {
            log.error("Role with name " + roleName + " does not exist");
            return null;
        }
    }
    public List<Role> getRolesByIds(List<Long> roleIds) {
        List<Role> roles = new ArrayList<>();
        for (Long roleId : roleIds) {
            Optional<Role> role = roleRepository.findByRoleId(roleId);
            if (role.isPresent()) {
                roles.add(role.get());
            } else {
                log.error("Role with id " + roleId + " does not exist");
            }
        }
        return roles;
    }
    public List<Role> getRolesByNames(List<String> roleNames) {
        List<Role> roles = new ArrayList<>();
        for (String roleName : roleNames) {
            Optional<Role> role = roleRepository.findByRoleName(roleName);
            if (role.isPresent()) {
                roles.add(role.get());
            } else {
                log.error("Role with name " + roleName + " does not exist");
            }
        }
        return roles;
    }
    public void deleteRoleById(Long roleId) {
        // check to see if role already exists
        Optional<Role> role = roleRepository.findByRoleId(roleId);

        if (role.isPresent()) {
            roleRepository.delete(role.get());
            log.info("Role with id " + roleId + " deleted successfully");
        } else {
            log.error("Role with id " + roleId + " does not exist");
        }
    }
    public void deleteRoleByName(String roleName) {
        // check to see if role already exists
        Optional<Role> role = roleRepository.findByRoleName(roleName);

        if (role.isPresent()) {
            roleRepository.delete(role.get());
            log.info("Role with name " + roleName + " deleted successfully");
        } else {
            log.error("Role with name " + roleName + " does not exist");
        }
    }

    //Get role ID by name
    public Long getRoleIdByName(String roleName) {
        Optional<Role> role = roleRepository.findByRoleName(roleName);
        if (role.isPresent()) {
            return role.get().getRoleId();
        } else {
            log.error("Role with name " + roleName + " does not exist");
            return null;
        }
    }

    // Get all users who have any of the specified roles (e.g., ADMIN, INSTRUCTOR)
public List<Users> getUsersByRoles(Set<String> roleNames) {
    // Find all roles matching the given names
    List<Role> roles = roleRepository.findAll().stream()
            .filter(r -> roleNames.contains(r.getName()))
            .collect(Collectors.toList());
    if (roles.isEmpty()) {
        return new ArrayList<>();
    }
    // Get all user-role mappings for these roles
    List<Long> roleIds = roles.stream().map(Role::getRoleId).collect(Collectors.toList());
    List<UserRoles> userRoles = userRoleRepository.findAll().stream()
            .filter(ur -> roleIds.contains(ur.getId().getRoleId()))
            .collect(Collectors.toList());
    // Get user IDs
    Set<Long> userIds = userRoles.stream()
            .map(ur -> ur.getId().getUserId())
            .collect(Collectors.toSet());
    // Fetch users
    return userRepository.findAllById(userIds);
}
}