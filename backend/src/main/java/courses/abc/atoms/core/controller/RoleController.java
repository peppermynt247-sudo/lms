package courses.abc.atoms.core.controller;

import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.services.AdminService;
import courses.abc.atoms.core.services.RoleService;
import courses.abc.atoms.core.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    @Autowired
    private RoleService roleService;
}
