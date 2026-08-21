package courses.abc.atoms.core.services;

import courses.abc.atoms.core.util.EmailService;
import courses.abc.atoms.core.util.JwtUtil;
import courses.abc.atoms.core.util.OtpStorage;
import courses.abc.atoms.features.course.model.CourseAccessControl;
import courses.abc.atoms.features.enrollment.dto.EnrollmentDTO;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Paths;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

import courses.abc.atoms.core.dto.UserDTO;
import courses.abc.atoms.core.services.SpacesService;
import courses.abc.atoms.core.dto.UserDTO.RegistrationRequest;
import courses.abc.atoms.core.dto.JwtAuthDTO.JwtAuthenticationResponse;
import courses.abc.atoms.core.dto.ProfileDTO;
import courses.abc.atoms.core.exception.InvalidInputException;
import courses.abc.atoms.core.exception.ResourceAlreadyExistsException;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.model.core.Educations;
import courses.abc.atoms.core.model.core.Experiences;
import courses.abc.atoms.core.model.core.Languages;
import courses.abc.atoms.core.model.core.Profiles;
import courses.abc.atoms.core.model.core.RoleType;
import courses.abc.atoms.core.model.core.Skills;
import courses.abc.atoms.core.model.core.UserRoles;
import courses.abc.atoms.core.model.core.Referrals;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.model.core.UserRoles.UserRoleId;
import courses.abc.atoms.core.model.lms.Role;
import courses.abc.atoms.core.repositories.RoleRepository;
import courses.abc.atoms.core.repositories.SkillsRepository;
import courses.abc.atoms.core.repositories.UserCourseEnrollmentRepository;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.core.repositories.UserRoleRepository;
import courses.abc.atoms.core.repositories.EducationRepository;
import courses.abc.atoms.core.repositories.ExperienceRepository;
import courses.abc.atoms.core.repositories.LanguagesRepository;
import courses.abc.atoms.core.repositories.ProfileRepository;
import courses.abc.atoms.core.repositories.ReferralRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.nio.file.Files;
import java.nio.file.Path;


@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private UserCourseEnrollmentRepository userCourseEnrollmentRepository;

    @Autowired
    private SpacesService spacesService;

    @Autowired

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    private final EmailService emailService;
    private final OtpStorage otpStorage = new OtpStorage();

    @Autowired
    private ProfileRepository profileRepository;
    @Autowired
    private ReferralRepository referralRepository;
    @Autowired
    private EducationRepository educationRepository;
    @Autowired
    private FileStorageService fileStorageService;
    @Autowired
    private ExperienceRepository experienceRepository;
    @Autowired
    private SkillsRepository skillsRepository;
    @Autowired
    private LanguagesRepository languagesRepository;
    @Autowired
    private ReferralRepository referralsRepository;

    public UserService(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    @Transactional
    public UserDTO.UserResponse registerUser(UserDTO.RegistrationRequest registrationRequest) {
        if (userRepository.existsByEmail(registrationRequest.getEmail())) {
            throw new ResourceAlreadyExistsException("User with email " + registrationRequest.getEmail() + " already exists");
        }
        if (registrationRequest.getPhoneNumber() != null && profileRepository.existsByPhoneNumber(registrationRequest.getPhoneNumber())) {
            throw new ResourceAlreadyExistsException("User with phone number " + registrationRequest.getPhoneNumber() + " already exists");
        }

        MultipartFile profileImage = registrationRequest.getProfileImage();
        String profileImageUrl = null;

        if (profileImage != null && !profileImage.isEmpty()) {
            try {
                profileImageUrl = spacesService.uploadProfilePhoto(profileImage);
            } catch (IOException e) {
                throw new InvalidInputException("Failed to process profile image: " + e.getMessage(), e);
            }
        }

        Users user = new Users();
        user.setEmail(registrationRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registrationRequest.getPassword()));
        user.setIsActive(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        Users savedUser = userRepository.save(user);

        assignUserRole(savedUser.getId(), registrationRequest.getRole());

        createUserProfile(savedUser.getId(), registrationRequest, profileImageUrl);

        // Generate referral ID and create referral entry
        String referralId = generateReferralId();
        Referrals referral = new Referrals();
        referral.setReferralId(referralId);
        referral.setUserId(savedUser.getId());
        referral.setWallet(BigDecimal.ZERO);
        // Initial wallet for new user
        referral.setReferrerId(null); // Will be updated if referrer exists

        // Handle referrer if provided
        String referrerReferralId = registrationRequest.getReferralId();
        if (referrerReferralId != null && !referrerReferralId.isEmpty()) {
            Optional<Referrals> referrerReferral = referralRepository.findByReferralId(referrerReferralId);
            if (referrerReferral.isEmpty()) {
                throw new InvalidInputException("Invalid referral ID: " + referrerReferralId);
            }
            Long referrerId = referrerReferral.get().getUserId();
            referral.setReferrerId(referrerId);

            // Update wallets
            referralRepository.findByUserId(referrerId).ifPresent(referrer -> {
                referrer.setWallet(referrer.getWallet().add(BigDecimal.valueOf(100)));
                referralRepository.save(referrer);
            });
            referral.setWallet(BigDecimal.valueOf(25)); // New user gets 25 Rs
        }

        referralRepository.save(referral);

        // Send welcome credentials email (non-blocking — failure should not roll back registration)
        try {
            String displayName = registrationRequest.getName() != null ? registrationRequest.getName() : registrationRequest.getEmail();
            emailService.sendWelcomeCredentials(registrationRequest.getEmail(), displayName, registrationRequest.getPassword());
        } catch (Exception e) {
            logger.warn("Failed to send welcome credentials email to {}: {}", registrationRequest.getEmail(), e.getMessage());
        }

        return convertToUserResponse(savedUser);
    }

    private String generateReferralId() {
    // Use ThreadLocalRandom for better performance in concurrent scenarios
    ThreadLocalRandom random = ThreadLocalRandom.current();
    String letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // Generate a base ID with 4 letter-digit pairs (8 characters)
    StringBuilder referralId = new StringBuilder(8);
    for (int i = 0; i < 4; i++) {
        referralId.append(letters.charAt(random.nextInt(letters.length()))); // Letter
        referralId.append(random.nextInt(10)); // Digit
    }

    // Add a short unique suffix (e.g., last 4 chars of UUID) to reduce collisions
    String uniqueSuffix = UUID.randomUUID().toString().replaceAll("[^0-9]", "").substring(0, 4);
    referralId.append(uniqueSuffix.substring(0, 2)); // Use first 2 digits for brevity

    // Final ID is 10 characters (8 from pattern + 2 from suffix)
    String candidateId = referralId.toString().substring(0, 8); // Trim to 8 characters

    // Check and regenerate only if necessary (single attempt optimization)
    if (referralRepository.findByReferralId(candidateId).isPresent()) {
        // Fallback to a new random generation with a different seed
        referralId = new StringBuilder(8);
        for (int i = 0; i < 4; i++) {
            referralId.append(letters.charAt(random.nextInt(letters.length())));
            referralId.append(random.nextInt(10));
        }
        candidateId = referralId.toString();
    }

    return candidateId;
    }

    public void assignUserRole(Long userId, String roleName) {
        if (roleName == null || roleName.isEmpty()) {
            roleName="STUDENT";

           // throw new InvalidInputException("Role must be provided");
        }

        Optional<Role> existingRole = roleRepository.findByRoleName(roleName);
        if (existingRole.isEmpty()) {
            throw new ResourceNotFoundException("Role not found: " + roleName);
        }

        Role role = existingRole.get();

        // Check if userId already exists in UserRoles table
        Optional<UserRoles> existingUserRole = userRoleRepository.findById_UserId(userId);
        existingUserRole.ifPresent(userRole -> userRoleRepository.deleteById(userRole.getId()));

        // Add new userId and roleId pair
        UserRoleId userRoleId = new UserRoleId();
        userRoleId.setUserId(userId);
        userRoleId.setRoleId(role.getRoleId());
        UserRoles userRole = new UserRoles();
        userRole.setId(userRoleId);
        userRoleRepository.save(userRole);
    }

    @Transactional
    private void createUserProfile(Long userId, UserDTO.RegistrationRequest request, String profileImageUrl) {
        Optional<Users> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }
        Users user = userOptional.get();

        Profiles profile = new Profiles();
        String abcId = "ABC" + LocalDate.now().getYear() + userId;

        profile.setUser(user);
        profile.setAbcId(abcId);
        profile.setName(request.getName());
        profile.setGender(request.getGender());
        profile.setProfileImageUrl(profileImageUrl);
        profile.setPhoneNumber(request.getPhoneNumber().toString());
        profile.setUpdatedAt(LocalDateTime.now());

        profileRepository.save(profile);
        logger.info("Successfully created profile for user ID: {}", userId);
    }

    @Transactional
    public List<String> getUserRolesByEmail(String email) {
        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        // Change: Use id.userId for query derivation
        List<UserRoles> userRoles = userRoleRepository.findByIdUserId(user.getId());
        if (userRoles.isEmpty()) {
            throw new ResourceNotFoundException("No roles found for user with email: " + email);
        }

        List<String> roles = new ArrayList<>();
        for (UserRoles userRole : userRoles) {
            Role role = roleRepository.findByRoleId(userRole.getId().getRoleId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Role not found with id: " + userRole.getId().getRoleId()));
            roles.add(role.getName());
        }
        return roles;
    }

    @Transactional
    public List<String> getUserRolesByUserID(Long userId) {
        List<UserRoles> userRoles = userRoleRepository.findByIdUserId(userId);

        if (userRoles.isEmpty()) {
            throw new ResourceNotFoundException("No roles found for user with id: " + userId);
        }
        List<String> roles = new ArrayList<>();
        for (UserRoles userRole : userRoles) {
            Role role = roleRepository.findByRoleId(userRole.getId().getRoleId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Role not found with id: " + userRole.getId().getRoleId()));
            roles.add(role.getName());
        }
        return roles;
    }

    @Transactional
    public UserDTO.BulkRegistrationResponse registerBulkLearners(UserDTO.BulkRegistrationRequest request) {
        List<UserDTO.UserResponse> successfulRegistrations = new ArrayList<>();
        List<UserDTO.BulkRegistrationResponse.ErrorDetail> errors = new ArrayList<>();

        for (UserDTO.BulkRegistrationRequest.Learner learner : request.getLearners()) {
            try {
                // Validate email
                if (userRepository.existsByEmail(learner.getEmail())) {
                    throw new ResourceAlreadyExistsException("User with email " + learner.getEmail() + " already exists");
                }

                // Validate phone
                String phoneNumber = learner.getPhone() != null ? learner.getPhone().toString() : null;
                if (phoneNumber != null && profileRepository.existsByPhoneNumber(phoneNumber)) {
                    throw new ResourceAlreadyExistsException("User with phone " + phoneNumber + " already exists");
                }

                // Validate password
                if (learner.getPassword() == null || learner.getPassword().isBlank()) {
                    throw new IllegalArgumentException("Password is required for user with email " + learner.getEmail());
                }

                // Create user
                Users user = new Users();
                user.setEmail(learner.getEmail());
                user.setPassword(passwordEncoder.encode(learner.getPassword()));
                user.setIsActive(true);
                user.setCreatedAt(LocalDateTime.now());
                user.setUpdatedAt(LocalDateTime.now());
                user.setStatus("REGISTERED");

                Users savedUser = userRepository.save(user);

                // Create profile
                Profiles profile = new Profiles();
                String abcId = "ABC" + LocalDate.now().getYear() + savedUser.getId();
                profile.setUser(savedUser);
                profile.setAbcId(abcId);
                profile.setName(learner.getName());
                profile.setPhoneNumber(phoneNumber);
                profile.setUpdatedAt(LocalDateTime.now());

                profileRepository.save(profile);

                // Assign role
                assignUserRole(savedUser.getId(), learner.getRole() != null ? learner.getRole() : "LEARNER");

                // Generate referral ID and create referral entry
                String referralId = generateReferralId();
                Referrals referral = new Referrals();
                referral.setReferralId(referralId);
                referral.setUserId(savedUser.getId());
                referral.setWallet(BigDecimal.valueOf(25)); // Initial wallet for new user
                referral.setReferrerId(null); // Will be updated if referrer exists

                // Handle referrer if provided
                String referrerReferralId = learner.getReferralId();
                if (referrerReferralId != null && !referrerReferralId.isEmpty()) {
                    Optional<Referrals> referrerReferral = referralRepository.findByReferralId(referrerReferralId);
                    if (referrerReferral.isEmpty()) {
                        throw new InvalidInputException("Invalid referral ID: " + referrerReferralId);
                    }
                    Long referrerId = referrerReferral.get().getUserId();
                    referral.setReferrerId(referrerId);

                    // Update wallets
                    referralRepository.findByUserId(referrerId).ifPresent(referrer -> {
                        referrer.setWallet(referrer.getWallet().add(BigDecimal.valueOf(75)));
                        referralRepository.save(referrer);
                    });
                    referral.setWallet(BigDecimal.valueOf(25)); // New user gets 25 Rs
                }

                referralRepository.save(referral);

                // Add to successful registrations with referral ID
                successfulRegistrations.add(new UserDTO.UserResponse(savedUser.getId(), savedUser.getEmail(), learner.getName()));

                // Send welcome credentials email (non-blocking — failure should not stop bulk registration)
                try {
                    String displayName = learner.getName() != null ? learner.getName() : learner.getEmail();
                    emailService.sendWelcomeCredentials(learner.getEmail(), displayName, learner.getPassword());
                } catch (Exception emailEx) {
                    logger.warn("Failed to send welcome credentials email to {}: {}", learner.getEmail(), emailEx.getMessage());
                }

            } catch (ResourceAlreadyExistsException | IllegalArgumentException e) {
                errors.add(new UserDTO.BulkRegistrationResponse.ErrorDetail(
                    learner.getEmail(),
                    learner.getPhone(),
                    e.getMessage()
                ));
            } catch (Exception e) {
                errors.add(new UserDTO.BulkRegistrationResponse.ErrorDetail(
                    learner.getEmail(),
                    learner.getPhone(),
                    "Unexpected error: " + e.getMessage()
                ));
            }
        }

        return new UserDTO.BulkRegistrationResponse(successfulRegistrations, errors);
    }

    public JwtAuthenticationResponse authenticateUser(UserDTO.LoginRequest loginRequest) {
        logger.info("Authenticating user with email: {}", loginRequest.getEmail());
        try {
            Users user = userRepository.findByEmail(loginRequest.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found with email: " + loginRequest.getEmail()));

            if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                throw new ResourceNotFoundException("Invalid Password");
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String jwt = jwtUtil.generateToken(userDetails);

            logger.info("Authentication successful for email: {}", loginRequest.getEmail());
            return new JwtAuthenticationResponse(
                    jwt,
                    "Bearer",
                    user.getId(),
                    // user.getName(),
                    user.getEmail(),
                    getUserRolesByUserID(user.getId()),
                    "");
        } catch (BadCredentialsException e) {
            logger.warn("Bad credentials for email: {}", loginRequest.getEmail());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during authentication for email: {}", loginRequest.getEmail(), e);
            throw e;
        }
    }

    public UserDTO.UserResponse getUserById(Long id) {
        Users user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        return convertToUserResponse(user);
    }

    public Users getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    public UserDTO.UserProfileInfo getUserProfileInfoByEmail(String email) {
        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Fetch Profile
        Optional<Profiles> profileOpt = profileRepository.findByUserId(user.getId());
        String userName = null;
        String phoneNumber = null;
        if (profileOpt.isPresent()) {
            Profiles profile = profileOpt.get();
            userName = profile.getName();
            phoneNumber = profile.getPhoneNumber();
        }

        // Fetch Roles
        List<UserRoles> userRoles = userRoleRepository.findByIdUserId(user.getId());
        List<String> roles = userRoles.stream()
                .map(ur -> roleRepository.findByRoleId(ur.getId().getRoleId())
                        .map(Role::getName)
                        .orElse(null))
                .filter(r -> r != null)
                .collect(Collectors.toList());

        return new UserDTO.UserProfileInfo(
                user.getId(),
                userName,
                user.getEmail(),
                phoneNumber,
                roles,
                user.getIsActive(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }

    public Profiles getUserByPhone(String number) {
        return profileRepository.findByPhoneNumber(number)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with number: " + number));
    }

    public UserDTO.UserResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("No authenticated user found");
        }

        String email = authentication.getName();
        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        return convertToUserResponse(user);
    }

    private UserDTO.UserResponse convertToUserResponse(Users user) {
        return new UserDTO.UserResponse(
                user.getId(),
                user.getEmail(),
                getUserRolesByUserID(user.getId()).isEmpty() ? RoleType.STUDENT.getRole()
                        : getUserRolesByUserID(user.getId()).get(0) // Default to USER if no roles found. Currently
                                                                    // taking the first role, This may change in the
                                                                    // future
        );
    }

    // request Otp
    public String requestOtp(String email) {

        if (!userRepository.existsByEmail(email)) {
            throw new ResourceNotFoundException("User with this email not found");
        }

        try {
            String otp = String.format("%06d", new SecureRandom().nextInt(999999));
            otpStorage.storeOpt(email, otp);
            emailService.sendOtp(email, otp);
            return "OTP sent";
        } catch (Exception e) {
            logger.error("Error in sending the otp", e);
            throw new ResourceNotFoundException("Could able to send the mail");
        }
    }

    // Verify Otp
    public String verifyOtp(String email, String otp) {
        if (otpStorage.verifyOtp(email, otp)) {
            otpStorage.clearOtp(email);
            return "OTP verified";
        }
        throw new ResourceNotFoundException("Invalid or expired OTP");
    }

    // reset the password
    public String resetPassword(String email, String newPassword) {
        try {
            Users user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with email"));

            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            // Send confirmation email with new credentials (non-blocking)
            try {
                String displayName = profileRepository.findByUserId(user.getId())
                        .map(p -> p.getName() != null ? p.getName() : email)
                        .orElse(email);
                emailService.sendPasswordResetConfirmation(email, displayName, newPassword);
            } catch (Exception emailEx) {
                logger.warn("Failed to send password reset confirmation email to {}: {}", email, emailEx.getMessage());
            }

            return "reset password";
        } catch (Exception e) {
            logger.error("Unable to reset the password");
            throw e;
        }
    }

    public String updatePassword(UserDTO.UpdateUserPassword updateUserPassword) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication != null && authentication.isAuthenticated()) {
                UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                String email = userDetails.getUsername();

                Users user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                if (!passwordEncoder.matches(updateUserPassword.getPassword(), user.getPassword())) {
                    throw new ResourceNotFoundException("Old password is incorrect");
                }

                user.setPassword(passwordEncoder.encode(updateUserPassword.getNewpassword()));
                userRepository.save(user);

                return "Password updated successfully";
            } else {
                throw new RuntimeException("User not authenticated");
            }

        } catch (Exception e) {
            logger.error("Error updating the password", e);
            throw new RuntimeException("Error updating password: " + e.getMessage());
        }
    }

@Transactional
public void updateMyProfile(ProfileDTO.ProfileUpdateDTO dto) {
    Long userId = getCurrentUserId();
    Optional<Users> userOptional = userRepository.findById(userId);
    if (userOptional.isEmpty()) {
        throw new IllegalArgumentException("User not found with ID: " + userId);
    }
    Users user = userOptional.get();

    if (dto.getEmail() != null && !dto.getEmail().isBlank() && userRepository.existsByEmailAndIdNot(dto.getEmail(), userId)) {
        throw new IllegalArgumentException("User with email " + dto.getEmail() + " already exists");
    }

    if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
        user.setEmail(dto.getEmail());
    }
    user.setUpdatedAt(LocalDateTime.now());
    userRepository.save(user);

    Optional<Profiles> profileOptional = profileRepository.findByUserId(userId);
    Profiles profile = profileOptional.orElseGet(() -> {
        Profiles newProfile = new Profiles();
        newProfile.setUser(user);
        return newProfile;
    });

    if (dto.getPhone() != null && !dto.getPhone().isBlank()) {
        profile.setPhoneNumber(dto.getPhone());
    }
        if (dto.getName() != null) profile.setName(dto.getName());
        if (dto.getParentName() != null) profile.setParentName(dto.getParentName());
        if (dto.getParentContact() != null) profile.setParentContact(dto.getParentContact());
        if (dto.getParentEmail() != null) profile.setParentEmail(dto.getParentEmail());
        if (dto.getGender() != null) profile.setGender(dto.getGender());
        if (dto.getDob() != null && !dto.getDob().isBlank()) {
            profile.setDob(LocalDate.parse(dto.getDob(), DateTimeFormatter.ISO_LOCAL_DATE));
        }
        if (dto.getBio() != null) profile.setBio(dto.getBio());
        if (dto.getWhatsappNumber() != null) profile.setWhatsappNumber(dto.getWhatsappNumber());
        if (dto.getAddress() != null) profile.setAddress(dto.getAddress());
        if (dto.getQualification() != null) profile.setQualification(dto.getQualification());
        if (dto.getAadhar() != null) profile.setAadhar(dto.getAadhar());
        if (dto.getPan() != null) profile.setPan(dto.getPan());
        if (dto.getCity() != null) profile.setCity(dto.getCity());
        if (dto.getState() != null) profile.setState(dto.getState());
        if (dto.getCountry() != null) profile.setCountry(dto.getCountry());
        if (dto.getPincode() != null) profile.setPincode(dto.getPincode());
        profile.setUpdatedAt(LocalDateTime.now());
        profileRepository.save(profile);

        if (dto.getEducations() != null) {
            List<Educations> existingEducations = educationRepository.findByProfileId(profile.getProfileId());
            List<String> existingLevels = existingEducations.stream()
                    .map(Educations::getLevel)
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toList());

            for (ProfileDTO.ProfileUpdateDTO.EducationDTO educationDto : dto.getEducations()) {
                Optional<Educations> educationOptional = existingEducations.stream()
                        .filter(e -> e.getLevel() != null && e.getLevel().equals(educationDto.getLevel()))
                        .findFirst();
                Educations education;
                if (educationOptional.isPresent()) {
                    education = educationOptional.get();
                } else {
                    education = new Educations();
                    education.setProfile(profile);
                }

                if (educationDto.getLevel() != null) education.setLevel(educationDto.getLevel());
                if (educationDto.getInstitutionName() != null) education.setInstitutionName(educationDto.getInstitutionName());
                if (educationDto.getPassOfYear() != null && !educationDto.getPassOfYear().isBlank()) {
                    education.setPassOfYear(LocalDate.parse(educationDto.getPassOfYear(), DateTimeFormatter.ISO_LOCAL_DATE));
                }
                if (educationDto.getStartDate() != null && !educationDto.getStartDate().isBlank()) {
                    education.setStartDate(LocalDate.parse(educationDto.getStartDate(), DateTimeFormatter.ISO_LOCAL_DATE));
                }
                if (educationDto.getEndDate() != null && !educationDto.getEndDate().isBlank()) {
                    education.setEndDate(LocalDate.parse(educationDto.getEndDate(), DateTimeFormatter.ISO_LOCAL_DATE));
                }
                if (educationDto.getBranch() != null) education.setBranch(educationDto.getBranch());
                if (educationDto.getBoard() != null) education.setBoard(educationDto.getBoard());
                if (educationDto.getCourses() != null) education.setCourses(educationDto.getCourses());
                if (educationDto.getPercentage() != null) education.setPercentage(educationDto.getPercentage());
                if (educationDto.getRollNo() != null) education.setRollNo(educationDto.getRollNo());
                if (educationDto.getEducationType() != null) education.setEducationType(educationDto.getEducationType());
                educationRepository.save(education);
            }

            existingEducations.forEach(existingEdu -> {
                if (!dto.getEducations().stream().anyMatch(e -> e.getLevel() != null && e.getLevel().equals(existingEdu.getLevel()))) {
                    educationRepository.delete(existingEdu);
                }
            });
        }
    }

    @Transactional
    public UserDTO.UserProfileResponse getMyProfile(Long userId) {
        Optional<Users> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }
        Users user = userOptional.get();

        Optional<Profiles> profileOptional = profileRepository.findByUserId(userId);
        Profiles profile = profileOptional.orElseThrow(() -> new IllegalArgumentException("Profile not found for user ID: " + userId));

        List<Educations> educations = educationRepository.findByProfileId(profile.getProfileId());
        if (educations == null) {
            educations = new ArrayList<>();
        }

        List<Experiences> experiences = experienceRepository.findByProfileProfileId(profile.getProfileId());
        List<Skills> skills = skillsRepository.findByProfileProfileId(profile.getProfileId());
        List<Languages> languages = languagesRepository.findByProfileProfileId(profile.getProfileId());

        List<UserDTO.EducationDTO> educationDtos = educations.stream()
            .map(edu -> new UserDTO.EducationDTO(
                edu.getEducationId(),
                edu.getLevel(),
                edu.getInstitutionName(),
                edu.getPassOfYear(),
                edu.getStartDate(),
                edu.getEndDate(),
                edu.getBranch(),
                edu.getBoard(),
                edu.getCourses(),
                edu.getPercentage(),
                edu.getRollNo(),
                edu.getEducationType(),
                edu.getMarksheet()
            ))
            .collect(Collectors.toList());

        List<UserDTO.ExperienceDTO> experienceDtos = experiences.stream()
            .map(exp -> new UserDTO.ExperienceDTO(
                exp.getExperienceId(),
                exp.getCompany(),
                exp.getTitle(),
                exp.getStartdate(),
                exp.getEnddate(),
                exp.getLocation(),
                exp.getDetails(),
                exp.getPositionType(),
                exp.getDesignation(),
                exp.getCompanySector(),
                exp.getExperienceCertificate()
            ))
            .collect(Collectors.toList());

        List<UserDTO.SkillDTO> skillDtos = skills.stream()
            .map(skl -> new UserDTO.SkillDTO(
                skl.getSkillId(),
                skl.getSkillName(),
                skl.getProficiencyLevel()
            ))
            .collect(Collectors.toList());

        List<UserDTO.LanguageDTO> languageDtos = languages.stream()
            .map(lang -> new UserDTO.LanguageDTO(
                lang.getLanguageId(),
                lang.getLanguageName(),
                lang.getProficiencyLevel()
            ))
            .collect(Collectors.toList());

        return new UserDTO.UserProfileResponse(
            user.getId(),
            user.getEmail(),
            profile.getName(),
            profile.getPhoneNumber(),
            profile.getParentName(),
            profile.getParentContact(),
            profile.getParentEmail(),
            profile.getGender(),
            profile.getDob() != null ? profile.getDob().toString() : null,
            profile.getBio(),
            profile.getWhatsappNumber(),
            profile.getAddress(),
            profile.getQualification(),
            profile.getAadhar(),
            profile.getPan(),
            profile.getCity(),
            profile.getState(),
            profile.getCountry(),
            profile.getPincode(),
            profile.getResume(),
            profile.getProfileImageUrl(),
            educationDtos,
            experienceDtos,
            skillDtos,
            languageDtos
        );
    }

    @Transactional
    public void updateMyProfileImage(MultipartFile profileImage) {
        Long userId = getCurrentUserId();
        Optional<Profiles> profileOptional = profileRepository.findById(userId);
        Profiles profile = profileOptional.orElseGet(() -> {
            Profiles newProfile = new Profiles();
            newProfile.setProfileId(userId);
            return newProfile;
        });

        if (profileImage != null && !profileImage.isEmpty()) {
            try {
                // Delete the old photo from Spaces before uploading the new one
                spacesService.deleteFile(profile.getProfileImageUrl());
                String newUrl = spacesService.uploadProfilePhoto(profileImage);
                profile.setProfileImageUrl(newUrl);
            } catch (IOException e) {
                throw new IllegalArgumentException("Failed to process profile image: " + e.getMessage(), e);
            }
        }
        profile.setUpdatedAt(LocalDateTime.now());
        profileRepository.save(profile);
    }

    public Long getCurrentUserId() {
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
        } else if (principal instanceof org.springframework.security.core.userdetails.User) {
            String email = ((org.springframework.security.core.userdetails.User) principal).getUsername();
            Users user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
            return user.getId();
        } else if (principal instanceof Users) {
            return ((Users) principal).getId();
        }
        throw new IllegalArgumentException(
                "Unsupported authentication principal type: " + principal.getClass().getName());
    }

    public UserDTO.ReferralDetails getReferralDetails(Long id){
        try {

            Optional<Users> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                throw new ResourceNotFoundException("User not found");
            }

            UserDTO.ReferralDetails referralDetails = new UserDTO.ReferralDetails();
            List<UserDTO.ReferralDetails.Referred> referredList = new ArrayList<>();


            Optional<Referrals> referrals =referralRepository.findByUserId(id);

            Referrals referral =referrals.get();



            referralDetails.setCode(referral.getReferralId());
            referralDetails.setWallet(referral.getWallet());


            List<Object[]> results = referralRepository.findReferralDetailsByUserId(id);



            for (Object[] row : results) {


                LocalDateTime enrolled = row[2] != null ? ((Timestamp) row[2]).toLocalDateTime() : null;
                String name = (String) row[3];
                String email =(String) row[4];


                if (enrolled != null && name != null) {
                    UserDTO.ReferralDetails.Referred referred =new UserDTO.ReferralDetails.Referred();
                    referred.setEnrolled(enrolled);
                    referred.setName(name);
                    referred.setEmail(email);
                    referredList.add(referred);
                }
            }

            referralDetails.setReferreds(referredList);
            return referralDetails;
        }catch (Exception e){
            throw e;
        }
    }

    public void resetPassword(Long userId, String oldPassword, String newPassword) {
        Users user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));
        if (!passwordEncoder().matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("Incorrect old password");
        }
        user.setPassword(passwordEncoder().encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    private PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }


    public UserDTO.UserWallet getUserWalletAmount(Long id){
        try{
            Optional<Referrals>  referrals=  referralRepository.findByUserId(id);

            if(referrals.isEmpty()){
                throw new ResourceNotFoundException("User not Found");
            }

            Referrals referral =referrals.get();


            UserDTO.UserWallet wallet =new UserDTO.UserWallet();
            wallet.setCode(referral.getReferralId());
            wallet.setUserId(referral.getUserId());
            wallet.setWallet(referral.getWallet());


            return wallet;
        }catch (Exception e){
            throw e;
        }
    }

    public List<EnrollmentDTO.GetCoursesWithDetails> getEnrolledCourses(Long userId) {
        return userCourseEnrollmentRepository.findEnrolledCoursesWithAccessControl(userId);
    }

    public List<EnrollmentDTO.GetBundlesWithDetails> getEnrolledBundles(Long userId) {
        return userCourseEnrollmentRepository.findEnrolledBundlesWithAccessControl(userId);
    }

    public Users updateUserStatus(Long userId, String newStatus) {
        Optional<Users> userOptional = userRepository.findById(userId);
        if (userOptional.isPresent()) {
            Users user = userOptional.get();
            user.setStatus(newStatus);
            user.setUpdatedAt(LocalDateTime.now());
            return userRepository.save(user);
        } else {
            throw new IllegalArgumentException("User with ID " + userId + " not found");
        }
    }


    /**
     * Creates a new user account for admin-initiated bulk enrollment.
     * Registers the user, creates profile, assigns STUDENT role, and creates referral entry.
     */
    @Transactional
    public Users createUserForEnrollment(String email, String name, String phone, String password) {
        Users user = new Users();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setIsActive(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setStatus("REGISTERED");
        Users savedUser = userRepository.save(user);

        Profiles profile = new Profiles();
        profile.setUser(savedUser);
        profile.setAbcId("ABC" + LocalDate.now().getYear() + savedUser.getId());
        profile.setName(name != null ? name : email);
        if (phone != null && !phone.isBlank()) {
            profile.setPhoneNumber(phone);
        }
        profile.setUpdatedAt(LocalDateTime.now());
        profileRepository.save(profile);

        assignUserRole(savedUser.getId(), "STUDENT");

        String referralId = generateReferralId();
        Referrals referral = new Referrals();
        referral.setReferralId(referralId);
        referral.setUserId(savedUser.getId());
        referral.setWallet(BigDecimal.ZERO);
        referralRepository.save(referral);

        return savedUser;
    }

    public void SendHelpRequest(UserDTO.HelpDTO helpDTO){
        try{
            emailService.sendHelpRequestToAdmin(helpDTO.getEmail(),helpDTO.getContext());
        } catch (Exception e) {
            throw  e;
        }
    }
    
    @Transactional
    public void addResume(Long userId, MultipartFile file) {
        Profiles profile = profileRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Profile not found with ID: " + userId));

        // Delete existing resume if it exists
        if (profile.getResume() != null) {
            deleteFileIfExists(Paths.get("../uploads", profile.getResume()).toAbsolutePath().normalize());
            profile.setResume(null); // Clear the old path temporarily
        }

        // Store new resume
        String filePath = fileStorageService.storeFile(file, "resumes");
        profile.setResume(filePath);
        profileRepository.save(profile);
    }

    @Transactional
    public void addExperienceCertificate(Long experienceId, MultipartFile file) {
        Experiences experience = experienceRepository.findById(experienceId)
            .orElseThrow(() -> new IllegalArgumentException("Experience not found with ID: " + experienceId));
        if (!experience.getProfile().getProfileId().equals(getCurrentUserId())) {
            throw new IllegalArgumentException("Experience does not belong to the authenticated user");
        }

        // Delete existing certificate if it exists
        if (experience.getExperienceCertificate() != null) {
            deleteFileIfExists(Paths.get("../uploads", experience.getExperienceCertificate()).toAbsolutePath().normalize());
            experience.setExperienceCertificate(null); // Clear the old path temporarily
        }

        // Store new certificate
        String filePath = fileStorageService.storeFile(file, "experience_certificates");
        experience.setExperienceCertificate(filePath);
        experienceRepository.save(experience);
    }

    @Transactional
    public void addMarksheet(Long educationId, MultipartFile file) {
        Educations education = educationRepository.findById(educationId)
            .orElseThrow(() -> new IllegalArgumentException("Education not found with ID: " + educationId));
        if (!education.getProfile().getProfileId().equals(getCurrentUserId())) {
            throw new IllegalArgumentException("Education does not belong to the authenticated user");
        }

        // Delete existing marksheet if it exists
        if (education.getMarksheet() != null) {
            deleteFileIfExists(Paths.get("../uploads", education.getMarksheet()).toAbsolutePath().normalize());
            education.setMarksheet(null); // Clear the old path temporarily
        }

        // Store new marksheet
        String filePath = fileStorageService.storeFile(file, "marksheets");
        education.setMarksheet(filePath);
        educationRepository.save(education);
    }

    private void deleteFileIfExists(Path filePath) {
        try {
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not delete the existing file: " + e.getMessage(), e);
        }
    }

    @Transactional
    public BigDecimal redeemWalletForCourse(Long userId, BigDecimal coursePrice) {
        Referrals referral = referralsRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Wallet not found for user ID: " + userId));

        BigDecimal currentWallet = referral.getWallet();
        BigDecimal amountToRedeem;

        if (currentWallet.compareTo(coursePrice) < 0) {
            // Wallet is less than course price, redeem full wallet
            amountToRedeem = currentWallet;
            referral.setWallet(BigDecimal.ZERO); // Set wallet to 0.00 as BigDecimal
        } else {
            // Wallet is greater than or equal to course price, redeem only course price
            amountToRedeem = coursePrice;
            referral.setWallet(currentWallet.subtract(coursePrice)); // Subtract as BigDecimal
        }

        referralsRepository.save(referral);
        return amountToRedeem;
    }
}