package courses.abc.atoms.features.student.controller;

import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.core.services.UserService;
import courses.abc.atoms.features.enrollment.dto.EnrollmentDTO;
import courses.abc.atoms.features.student.DTO.StudentDTO;
import courses.abc.atoms.features.student.services.StudentService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentDashboardController {

    private static final Logger logger = LoggerFactory.getLogger(StudentDashboardController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private StudentService studentService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get student dashboard data including enrolled courses, bundles, and batch information
     * @return Dashboard data containing courses and bundles with batch details
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getStudentDashboard() {
        try {

            Long userId = getCurrentUserId();

            // Get enrolled courses and bundles with batch details and thumbnails
            List<StudentDTO.EnrolledCourseWithBatch> enrolledCourses = studentService.getEnrolledCoursesWithBatchDetails(userId);
            List<StudentDTO.EnrolledBundleWithBatch> enrolledBundles = studentService.getEnrolledBundlesWithBatchDetails(userId);
            
            // Create simple response
            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("courses", enrolledCourses);
            dashboard.put("bundles", enrolledBundles);
            dashboard.put("success", true);
            dashboard.put("message", "Dashboard data retrieved successfully");

            return ResponseEntity.status(HttpStatus.OK).body(dashboard);
        } catch (Exception e) {
            logger.error("Error fetching student dashboard data for user authentication: {}", 
                    SecurityContextHolder.getContext().getAuthentication().getName(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "An error occurred while fetching student dashboard data: " + e.getMessage(), e);
        }
    }

    /**
     * Get bundle metadata with linked courses for an enrolled user
     * @param bundleId the ID of the bundle to retrieve
     * @return Bundle metadata with array of linked courses metadata
     */
    @GetMapping("/bundle/{bundleId}")
    public ResponseEntity<Map<String, Object>> getBundleWithCourses(@PathVariable Long bundleId) {
        try {
            // Get current user ID
            Long userId = getCurrentUserId();
            
            // Get bundle with courses (service will check enrollment)
            StudentDTO.BundleWithCourses bundleData = studentService.getBundleWithCourses(userId, bundleId);
            
            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("bundle", bundleData);
            response.put("success", true);
            response.put("message", "Bundle data retrieved successfully");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            logger.error("Error fetching bundle {} data for user {}: {}", bundleId, getCurrentUserId(), e.getMessage());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error fetching bundle {} data for user {}: {}", bundleId, getCurrentUserId(), e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "An error occurred while fetching bundle data: " + e.getMessage(), e);
        }
    }
    
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalArgumentException("No authentication context found");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof String) {
            String email = (String) principal;
            Users user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
            return user.getId();
        } else if (principal instanceof Users) {
            return ((Users) principal).getId();
        } else if (principal instanceof org.springframework.security.core.userdetails.User) {
            String email = ((org.springframework.security.core.userdetails.User) principal).getUsername();
            Users user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
            return user.getId();
        }
        throw new IllegalArgumentException(
                "Unsupported authentication principal type: " + principal.getClass().getName());
    }
}
