package courses.abc.atoms.core.controller;
import courses.abc.atoms.core.dto.AdminDTO;
import courses.abc.atoms.core.dto.AdminDTO.BulkLearnerArchiveRequest;
import courses.abc.atoms.core.dto.ProfileDTO;
import courses.abc.atoms.core.dto.UserDTO;
import courses.abc.atoms.core.dto.UserDTO.UserResponse;
import courses.abc.atoms.core.exception.ResourceAlreadyExistsException;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.services.AdminService;
import courses.abc.atoms.core.services.UserService;
import courses.abc.atoms.features.course.dto.BatchDTO;
import jakarta.validation.Valid;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


@RestController
@PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;

    public AdminController(UserService userService, AdminService adminService) {
        this.adminService=adminService;
        this.userService = userService;
    }

    @GetMapping("/getallusers")
    public ResponseEntity<List<AdminDTO.UserAdminDTO>> getAllUsers() {
        try {
            List<AdminDTO.UserAdminDTO> users = adminService.getAllUsers();
            return ResponseEntity.status(HttpStatus.OK).body(users);

        }catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    //API to set the user as instructor
    @PutMapping("/setuserasinstructor")
    public ResponseEntity<String> setUserAsInstructor(@RequestParam String email) {
        try {
            adminService.setUserAsInstructor(email);
            return ResponseEntity.status(HttpStatus.OK).body("User set as instructor successfully");
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You do not have permission to perform this action");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    //API to set the user as admin
    @PutMapping("/setuserasadmin")
    public ResponseEntity<String> setUserAsAdmin(@RequestParam String email) {
        try {
            adminService.setUserAsAdmin(email);
            return ResponseEntity.status(HttpStatus.OK).body("User set as admin successfully");
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You do not have permission to perform this action");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    //API to get only Admins and Instructors infromation
    @GetMapping("/getadminsandinstructors")
    public ResponseEntity<List<AdminDTO.UserAdminDTO>> getAdminsAndInstructors() {
        try {
            List<AdminDTO.UserAdminDTO> users = adminService.getAdminsAndInstructors();
            return ResponseEntity.status(HttpStatus.OK).body(users);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/getstudents")
    public ResponseEntity<Page<AdminDTO.UserAdminDTO>> getStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<AdminDTO.UserAdminDTO> users = adminService.getStudents(pageable);
            return ResponseEntity.status(HttpStatus.OK).body(users);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/getregisteredstudents")
    public ResponseEntity<Page<AdminDTO.UserAdminDTO>> getRegisteredStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<AdminDTO.UserAdminDTO> users = adminService.getRegisteredStudents(pageable);
            return ResponseEntity.status(HttpStatus.OK).body(users);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/getadmittedstudents")
    public ResponseEntity<Page<AdminDTO.UserAdminDTO>> getAdmittedStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<AdminDTO.UserAdminDTO> users = adminService.getAdmittedStudents(pageable);
            return ResponseEntity.status(HttpStatus.OK).body(users);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/getarchivedstudents")
    public ResponseEntity<Page<AdminDTO.UserAdminDTO>> getArchivedStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<AdminDTO.UserAdminDTO> users = adminService.getArchivedStudents(pageable);
            return ResponseEntity.status(HttpStatus.OK).body(users);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    //API to archive a user
    @PutMapping("/archiveuser")
    public ResponseEntity<String> archiveUser(@RequestParam String email) {
        try {
            adminService.archiveUser(email);
            return ResponseEntity.status(HttpStatus.OK).body("User archived successfully");
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You do not have permission to perform this action");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/getstudent/{id}")
    public ResponseEntity<AdminDTO.UserAdminDTO> getStudentById(@PathVariable Long id) {
        try {
            AdminDTO.UserAdminDTO user = adminService.getStudentById(id);
            return ResponseEntity.status(HttpStatus.OK).body(user);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/updateprofile/{userId}")
    public ResponseEntity<Map<String, Object>> updateProfile(@PathVariable Long userId,@RequestBody @Valid ProfileDTO.ProfileUpdateDTO dto, BindingResult result) {
        Map<String, Object> response = new HashMap<>();
        if (result.hasErrors()) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", result.getAllErrors().get(0).getDefaultMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        try {
            adminService.updateProfile(userId, dto);
            response.put("success", true);
            response.put("data", null);
            response.put("message", "Profile updated successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | ResourceAlreadyExistsException e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<Map<String, Object>> getUserProfile(@PathVariable Long userId) {
        Map<String, Object> response = new HashMap<>();
        try {
            UserDTO.UserProfileResponse profile = adminService.getUserProfile(userId);
            response.put("success", true);
            response.put("data", profile);
            response.put("message", "Profile retrieved successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", "Internal server error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/experience/add")
    public ResponseEntity<Map<String, Object>> addExperience(@RequestBody UserDTO.ExperienceDTO experienceDto) {
        Map<String, Object> response = new HashMap<>();
        try {
            adminService.addExperience(experienceDto.getId(), experienceDto); // Adjust if userId is in DTO
            response.put("success", true);
            response.put("data", null);
            response.put("message", "Experience added successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/experience/update/{experienceId}")
    public ResponseEntity<Map<String, Object>> updateExperience(@PathVariable Long experienceId, @RequestBody UserDTO.ExperienceDTO experienceDto) {
        Map<String, Object> response = new HashMap<>();
        try {
            adminService.updateExperience(experienceDto.getId(), experienceId, experienceDto); // Adjust if userId is in DTO
            response.put("success", true);
            response.put("data", null);
            response.put("message", "Experience updated successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/skill/add")
    public ResponseEntity<Map<String, Object>> addSkill(@RequestBody UserDTO.SkillDTO skillDto) {
        Map<String, Object> response = new HashMap<>();
        try {
            adminService.addSkill(skillDto.getId(), skillDto); // Adjust if userId is in DTO
            response.put("success", true);
            response.put("data", null);
            response.put("message", "Skill added successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/skill/update/{skillId}")
    public ResponseEntity<Map<String, Object>> updateSkill(@PathVariable Long skillId, @RequestBody UserDTO.SkillDTO skillDto) {
        Map<String, Object> response = new HashMap<>();
        try {
            adminService.updateSkill(skillDto.getId(), skillId, skillDto); // Adjust if userId is in DTO
            response.put("success", true);
            response.put("data", null);
            response.put("message", "Skill updated successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/language/add")
    public ResponseEntity<Map<String, Object>> addLanguage(@RequestBody UserDTO.LanguageDTO languageDto) {
        Map<String, Object> response = new HashMap<>();
        try {
            adminService.addLanguage(languageDto.getId(), languageDto); // Adjust if userId is in DTO
            response.put("success", true);
            response.put("data", null);
            response.put("message", "Language added successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/language/update/{languageId}")
    public ResponseEntity<Map<String, Object>> updateLanguage(@PathVariable Long languageId, @RequestBody UserDTO.LanguageDTO languageDto) {
        Map<String, Object> response = new HashMap<>();
        try {
            adminService.updateLanguage(languageDto.getId(), languageId, languageDto); // Adjust if userId is in DTO
            response.put("success", true);
            response.put("data", null);
            response.put("message", "Language updated successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/bulkarchive")
    public ResponseEntity<List<UserResponse>> bulkArchiveLearners(
            @Valid @RequestBody BulkLearnerArchiveRequest request) {
        List<UserResponse> responses = adminService.bulkArchiveLearners(request.getUserIds());
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/bulkunarchive")
    public ResponseEntity<List<UserResponse>> bulkUnarchiveLearners(
            @Valid @RequestBody BulkLearnerArchiveRequest request) {
        List<UserResponse> responses = adminService.bulkUnarchiveLearners(request.getUserIds());
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/instructorregistration")
    public ResponseEntity<UserDTO.InstructorRegistrationResponse> registerInstructor(
            @Valid @RequestBody UserDTO.InstructorRegistrationRequest request) {
        UserDTO.InstructorRegistrationResponse response = adminService.registerInstructor(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/referrals/user/{userId}")
    public ResponseEntity<Map<String, Object>> getReferralsByUser(@PathVariable Long userId) {
        try {
            List<UserDTO.ReferralResponse> referrals = adminService.getReferralsByUserId(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", referrals);
            response.put("message", "Referrals retrieved successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("data", null);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("data", null);
            response.put("message", "Invalid user ID");
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/batches/instructor/{userId}")
    public ResponseEntity<Map<String, Object>> getBatchesByInstructor(@PathVariable Long userId) {
        try {
            BatchDTO batches = adminService.getBatchesByInstructor(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", batches);
            response.put("message", "Batches retrieved successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("data", null);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("data", null);
            response.put("message", "Invalid user ID");
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/users/status/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Users> updateUserStatus(
            @PathVariable Long userId,
            @RequestParam String newStatus) {
        try {
            if (userId == null || userId <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid user ID");
            }
            if (newStatus == null || newStatus.trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New status cannot be empty");
            }
            if (!newStatus.matches("REGISTERED|ADMITTED")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value");
            }

            Users updatedUser = userService.updateUserStatus(userId, newStatus);
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "An error occurred while updating user status", e);
        }
    }

    @DeleteMapping("/experience/delete/{experienceId}/{userId}")
    public ResponseEntity<Map<String, Object>> deleteExperience(@PathVariable Long experienceId, @PathVariable Long userId) {
        Map<String, Object> response = new HashMap<>();
        try {
            adminService.deleteExperience(experienceId, userId);
            response.put("success", true);
            response.put("data", null);
            response.put("message", "Experience deleted successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/skill/delete/{skillId}/{userId}")
    public ResponseEntity<Map<String, Object>> deleteSkill(@PathVariable Long skillId, @PathVariable Long userId) {
        Map<String, Object> response = new HashMap<>();
        try {
            adminService.deleteSkill(skillId, userId);
            response.put("success", true);
            response.put("data", null);
            response.put("message", "Skill deleted successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/language/delete/{languageId}/{userId}")
    public ResponseEntity<Map<String, Object>> deleteLanguage(@PathVariable Long languageId, @PathVariable Long userId) {
        Map<String, Object> response = new HashMap<>();
        try {
            adminService.deleteLanguage(languageId, userId);
            response.put("success", true);
            response.put("data", null);
            response.put("message", "Language deleted successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("data", null);
            response.put("message", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
}
