package courses.abc.atoms.core.controller;
import courses.abc.atoms.core.dto.UserDTO;
import courses.abc.atoms.core.dto.JwtAuthDTO.JwtAuthenticationResponse;
import courses.abc.atoms.core.dto.ProfileDTO;
import courses.abc.atoms.core.exception.ResourceAlreadyExistsException;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.model.core.Referrals;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.repositories.ReferralRepository;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.core.services.AdminService;
import courses.abc.atoms.core.services.UserService;
import courses.abc.atoms.features.enrollment.dto.EnrollmentDTO;
import jakarta.validation.Valid;
import org.springframework.security.core.userdetails.User;
import jakarta.servlet.http.HttpSession;
import courses.abc.atoms.core.dto.UserDTO.PasswordResetDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/user")
public class UserController {
    private final UserRepository userRepository;
    private final AdminService adminService;
    @Autowired
    private ReferralRepository referralsRepository;
    @Autowired
    public UserController(UserService userService, UserRepository userRepository, AdminService adminService) {
        this.userService = userService;
        this.adminService = adminService;
        this.userRepository = userRepository;
    }

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);


    // Map to track user email to session ID
    private final ConcurrentHashMap<String, HttpSession> userSessions = new ConcurrentHashMap<>();
    private final UserService userService;

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserDTO.UserResponse> registerUser(
            @Valid @ModelAttribute UserDTO.RegistrationRequest registrationRequest) {
        UserDTO.UserResponse response = userService.registerUser(registrationRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<JwtAuthenticationResponse> loginUser(
            @Valid @RequestBody UserDTO.LoginRequest loginRequest, HttpSession session) {
        logger.info("Login attempt for email: {}", loginRequest.getEmail());
        try {
            JwtAuthenticationResponse response = userService.authenticateUser(loginRequest);
            logger.info("Login successful for email: {}", loginRequest.getEmail());

            // Retrieve the authenticated User object and store it in the session
            Users user = userService.getUserByEmail(loginRequest.getEmail());
            if (user == null) {
                logger.error("User not found for email: {}", loginRequest.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
            }
            session.setAttribute("user", user);
            userSessions.put(user.getEmail(), session);
            logger.info("Session created for user: {}", user.getEmail());
            logger.info("Session ID: {}", session.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Login failed for email: {}", loginRequest.getEmail(), e);
            throw e;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logoutUser(HttpSession session) {
        if (session != null) {
            session.invalidate();
            logger.info("User session invalidated successfully.");
            return ResponseEntity.ok("User logged out successfully.");
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("No active session found.");
    }

    @GetMapping("/session")
    public ResponseEntity<Object> getSessionDetails(@RequestParam String email, HttpSession session) {
        if (session != null) {
            String sessionId = session.getId();
            logger.info("Session ID: {}", sessionId);

            HttpSession existingSession = userSessions.get(email);
            if (existingSession != null) {
                try {
                    // Attempt to access a session attribute to check validity
                    existingSession.getAttribute("user");
                    logger.info("Session is valid for email: {}", email);
                    return ResponseEntity.ok(new SessionResponse(existingSession.getId(),
                            (UserDTO.UserProfileInfo) existingSession.getAttribute("user")));
                } catch (IllegalStateException e) {
                    logger.warn("Session for email {} is invalid. Removing from map.", email);
                    userSessions.remove(email); // Remove invalid session from the map
                }
            }
            Object userObject = session.getAttribute("user");
            if (userObject instanceof UserDTO.UserProfileInfo user) { // Ensure proper type casting
                logger.info("Session ID: {}, User: {}", sessionId, user.getEmail());
                return ResponseEntity.ok(new SessionResponse(sessionId, user));
            }
            logger.error("Invalid user object in session: {}", userObject);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("No valid user found in session.");
        }
        logger.error("No active session found.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("No active session found.");
    }

    // Inner class to structure the session response
    public static class SessionResponse {
        private String sessionId;
        private UserDTO.UserProfileInfo user;

        public SessionResponse(String sessionId, UserDTO.UserProfileInfo user) {
            this.sessionId = sessionId;
            this.user = user;
        }

        public String getSessionId() {
            return sessionId;
        }

        public UserDTO.UserProfileInfo getUser() {
            return user;
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO.UserResponse> getUserById(@PathVariable Long id) {
        UserDTO.UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/currentuser")
    public ResponseEntity<Object> getCurrentUser(@RequestParam String email) {
        logger.info("Fetching user details for email: {}", email);
        try {
            UserDTO.UserProfileInfo response = userService.getUserProfileInfoByEmail(email);
            if (response == null) {
                logger.error("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }
            return ResponseEntity.ok(new SessionResponse("124", response));
        } catch (Exception e) {
            logger.error("Error fetching user details for email: {}", email, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/checkuserexist")
    public ResponseEntity<String> validateEmail(@RequestParam String email) {
        logger.info("Validating email: {}", email);
        try {
            Users user = userService.getUserByEmail(email);
            if (user != null) {
                logger.info("User exists for email: {}", email);
                return ResponseEntity.ok("Success: User exists.");
            } else {
                logger.warn("User does not exist for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: User does not exist.");
            }
        } catch (Exception e) {
            logger.error("Error validating email: {}", email, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: Unable to validate email.");
        }
    }



    @PostMapping("/forgotpassword")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> requestOtp(@RequestParam String email) {

        try {
            String message = userService.requestOtp(email);
            return ResponseEntity.status(HttpStatus.OK).body(message);
        } catch (ResourceAlreadyExistsException e) {
            logger.warn("Envalid Email", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error Couldn't send the otp: {}", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: Unable to send the email.");
        }
    }

    @PostMapping("/verifyotp")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> verifyOtp(@RequestParam String email, @RequestParam String otp) {
        try {
            userService.verifyOtp(email, otp);
            return ResponseEntity.status(HttpStatus.OK).body("OTP verified");
        } catch (ResourceNotFoundException e) {
            logger.warn("OTP verification failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage()); // or HttpStatus.BAD_REQUEST
        } catch (Exception e) {
            logger.error("Unexpected error during OTP verification: {}", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: Unable to verify. Please try again.");
        }
    }

    @PostMapping("/resetpassword")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> resetPassword(@RequestParam String email, @RequestParam String newPassword) {
        try {
            userService.resetPassword(email, newPassword);
            return ResponseEntity.status(HttpStatus.OK).body("Password reset successful");
        } catch (Exception e) {
            logger.error("Error Couldn't able to reset the password: {}", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: Unable to reset the password.Please try again");
        }
    }

    @PostMapping("/updatepassword")
    public ResponseEntity<String> updatePassword(@RequestBody UserDTO.UpdateUserPassword updateUserPassword) {

        try {
            userService.updatePassword(updateUserPassword);
            return ResponseEntity.status(HttpStatus.OK).body("Password updated successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Not able update the password");
        }
    }

    // Controller to reset password
    @PutMapping("path/{id}")
    public String putMethodName(@PathVariable String id, @RequestBody String entity) {
        return entity;
    }

    @GetMapping("/myprofile")
    public ResponseEntity<Map<String, Object>> getMyProfile() {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = getCurrentUserId();
            UserDTO.UserProfileResponse profile = userService.getMyProfile(userId);
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

    @PutMapping(value = "/myprofile/update", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> updateMyProfile(@RequestBody ProfileDTO.ProfileUpdateDTO dto) {
        try {
            userService.updateMyProfile(dto);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", null);
            result.put("message", "Profile updated successfully");
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("data", null);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("data", null);
            error.put("message", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping(value = "/myprofileimage/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> updateMyProfileImage(@RequestParam("profileImage") MultipartFile profileImage) {
        try {
            userService.updateMyProfileImage(profileImage);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", null);
            result.put("message", "Profile image updated successfully");
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("data", null);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("data", null);
            error.put("message", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
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
        } else if (principal instanceof User) {
            String email = ((User) principal).getUsername();
            Users user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
            return user.getId();
        }
        throw new IllegalArgumentException(
                "Unsupported authentication principal type: " + principal.getClass().getName());
    }

    @PutMapping("/resetpassword")
    public ResponseEntity<String> resetPassword(@RequestBody PasswordResetDTO resetDTO) {
        Long userId = getCurrentUserId();
        try {
            userService.resetPassword(userId, resetDTO.getOldPassword(), resetDTO.getNewPassword());
            return ResponseEntity.ok("Password reset successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to reset password due to an internal error");
        }
    }
    @GetMapping("/referral")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STUDENT')")
    public ResponseEntity<Map<String, Object>> getReferralDetailsById(@RequestParam Long userid) {
        try {

            UserDTO.ReferralDetails referralDetails = userService.getReferralDetails(userid);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "successfully able  to get the referral details");
            response.put("Data", referralDetails);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (ResourceNotFoundException e) {
            logger.error("User Not found" + e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Referral details not found for the given user ID.");
            return new ResponseEntity<>(response, HttpStatus.CONFLICT);
        } catch (Exception e) {
            logger.error("Could able to get the referral details" + e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "unable to get the referral details");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);

        }
    }

    @GetMapping("/getwallet")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> get(@RequestParam Long userid) {

        try {
            UserDTO.UserWallet userWallet = userService.getUserWalletAmount(userid);
            logger.error("successfully able to get the user wallet details");
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("Data", userWallet);
            response.put("message", "successfully able to get the user wallet details");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (ResourceNotFoundException e) {
            logger.error("unable to get the user wallet details" + e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);

            response.put("message", "User not found");
            return new ResponseEntity<>(response, HttpStatus.CONFLICT);
        } catch (Exception e) {
            logger.error("unable to get the user wallet details" + e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);

            response.put("message", "unable to get the user wallet details");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/getmycourseswithdetails")
    public ResponseEntity<List<EnrollmentDTO.GetCoursesWithDetails>> getEnrolledCourses() {
        try {
            Long userId = getCurrentUserId();
            List<EnrollmentDTO.GetCoursesWithDetails> enrolledCourses = userService.getEnrolledCourses(userId);
            return ResponseEntity.ok(enrolledCourses);
        }  catch (Exception e) {
             throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "An error occurred while fetching enrolled Courses", e);
        }
    }

    @GetMapping("/getmybundleswithdetails")
    public ResponseEntity<List<EnrollmentDTO.GetBundlesWithDetails>> getEnrolledBundles() {
        try {
            Long userId = getCurrentUserId();
            List<EnrollmentDTO.GetBundlesWithDetails> enrolledBundles = userService.getEnrolledBundles(userId);
            return ResponseEntity.ok(enrolledBundles);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "An error occurred while fetching enrolled bundles", e);
        }
    }

    @PostMapping("/help")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Map<String,Object>> sendHelpRequestToAdmin(@RequestBody UserDTO.HelpDTO helpDTO){
        try{
              userService.SendHelpRequest(helpDTO);
            logger.info("Successfully able to send the email");
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "successfully able to send the details");
            return new ResponseEntity<>(response,HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Unable to send the email "+e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to send help request. Please try again later."+e.getMessage());
            return new ResponseEntity<>(response,HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/addmyexperience")
    public ResponseEntity<Map<String, Object>> addMyExperience(@RequestBody UserDTO.ExperienceDTO experienceDto) {
    Map<String, Object> response = new HashMap<>();
    try {
    Long userId = getCurrentUserId();
    adminService.addExperience(userId, experienceDto);
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
    @PutMapping("/updatemyexperience/{experienceId}")
    public ResponseEntity<Map<String, Object>> updateMyExperience(@PathVariable Long experienceId, @RequestBody UserDTO.ExperienceDTO experienceDto) {
    Map<String, Object> response = new HashMap<>();
    try {
    Long userId = getCurrentUserId();
    adminService.updateExperience(userId, experienceId, experienceDto);
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
    @DeleteMapping("/deletemyexperience/{experienceId}")
    public ResponseEntity<Map<String, Object>> deleteMyExperience(@PathVariable Long experienceId) {
    Map<String, Object> response = new HashMap<>();
    try {
    Long userId = getCurrentUserId();
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
    @PutMapping("/addmyskill")
    public ResponseEntity<Map<String, Object>> addMySkill(@RequestBody UserDTO.SkillDTO skillDto) {
    Map<String, Object> response = new HashMap<>();
    try {
    Long userId = getCurrentUserId();
    adminService.addSkill(userId, skillDto);
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
    @PutMapping("/updatemyskill/{skillId}")
    public ResponseEntity<Map<String, Object>> updateMySkill(@PathVariable Long skillId, @RequestBody UserDTO.SkillDTO skillDto) {
    Map<String, Object> response = new HashMap<>();
    try {
    Long userId = getCurrentUserId();
    adminService.updateSkill(userId, skillId, skillDto);
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
    @DeleteMapping("/deletemyskill/{skillId}")
    public ResponseEntity<Map<String, Object>> deleteMySkill(@PathVariable Long skillId) {
    Map<String, Object> response = new HashMap<>();
    try {
    Long userId = getCurrentUserId();
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
    @PutMapping("/addmylanguage")
    public ResponseEntity<Map<String, Object>> addMyLanguage(@RequestBody UserDTO.LanguageDTO languageDto) {
    Map<String, Object> response = new HashMap<>();
    try {
    Long userId = getCurrentUserId();
    adminService.addLanguage(userId, languageDto);
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
    @PutMapping("/updatemylanguage/{languageId}")
    public ResponseEntity<Map<String, Object>> updateMyLanguage(@PathVariable Long languageId, @RequestBody UserDTO.LanguageDTO languageDto) {
    Map<String, Object> response = new HashMap<>();
    try {
    Long userId = getCurrentUserId();
    adminService.updateLanguage(userId, languageId, languageDto);
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
    @DeleteMapping("/deletemylanguage/{languageId}")
    public ResponseEntity<Map<String, Object>> deleteMyLanguage(@PathVariable Long languageId) {
    Map<String, Object> response = new HashMap<>();
    try {
    Long userId = getCurrentUserId();
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

    @PostMapping("/uploadmyresume")
    public ResponseEntity<Map<String, Object>> addMyResume(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = getCurrentUserId();
            userService.addResume(userId, file);
            response.put("success", true);
            response.put("data", null);
            response.put("message", "Resume added successfully");
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

    @PostMapping("/uploadmyinterncertificate/{experienceId}")
    public ResponseEntity<Map<String, Object>> addExperienceCertificate(@PathVariable Long experienceId, @RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        try {
            userService.addExperienceCertificate(experienceId, file);
            response.put("success", true);
            response.put("data", null);
            response.put("message", "Experience certificate added successfully");
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

    @PostMapping("/uploadmymarksheet/{educationId}")
    public ResponseEntity<Map<String, Object>> addMarksheet(@PathVariable Long educationId, @RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        try {
            userService.addMarksheet(educationId, file);
            response.put("success", true);
            response.put("data", null);
            response.put("message", "Marksheet added successfully");
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

    @GetMapping("/getmywalletbalance")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getMyWalletBalance() {
        try {
            Long userId = getCurrentUserId();
            UserDTO.UserWallet userWallet = userService.getUserWalletAmount(userId);
            logger.error("successfully able to get the user wallet details");
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("Data", userWallet);
            response.put("message", "successfully able to get the user wallet details");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (ResourceNotFoundException e) {
            logger.error("unable to get the user wallet details" + e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);

            response.put("message", "User not found");
            return new ResponseEntity<>(response, HttpStatus.CONFLICT);
        } catch (Exception e) {
            logger.error("unable to get the user wallet details" + e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);

            response.put("message", "unable to get the user wallet details");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/redeemwallet")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> redeemWalletForCourse(@RequestParam("coursePrice") BigDecimal coursePrice) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = userService.getCurrentUserId();
            BigDecimal amountRedeemed = userService.redeemWalletForCourse(userId, coursePrice);
            response.put("success", true);
            response.put("data", Map.of("amountRedeemed", amountRedeemed));
            response.put("message", "Wallet redeemed successfully for course purchase");
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