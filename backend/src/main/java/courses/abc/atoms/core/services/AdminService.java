package courses.abc.atoms.core.services;

import courses.abc.atoms.core.dto.AdminDTO;
import courses.abc.atoms.core.dto.UserDTO;
import courses.abc.atoms.core.dto.UserDTO.UserResponse;
import courses.abc.atoms.core.exception.InvalidInputException;
import courses.abc.atoms.core.exception.ResourceAlreadyExistsException;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.dto.AdminDTO.UserAdminDTO;
import courses.abc.atoms.core.dto.ProfileDTO;
import courses.abc.atoms.core.model.core.Educations;
import courses.abc.atoms.core.model.core.Experiences;
import courses.abc.atoms.core.model.core.Languages;
import courses.abc.atoms.core.model.core.Profiles;
import courses.abc.atoms.core.model.core.Referrals;
import courses.abc.atoms.core.model.core.RoleType;
import courses.abc.atoms.core.model.core.Skills;
import courses.abc.atoms.core.model.core.UserRoles;
import courses.abc.atoms.core.model.core.UserRoles.UserRoleId;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.core.repositories.UserRoleRepository;
import courses.abc.atoms.features.course.dto.BatchDTO;
import courses.abc.atoms.features.course.model.Batches;
import courses.abc.atoms.features.course.model.Course;
import courses.abc.atoms.features.course.repositories.BatchCourseRepository;
import courses.abc.atoms.features.course.repositories.BatchRepository;
import org.springframework.transaction.annotation.Transactional;
import courses.abc.atoms.core.repositories.ProfileRepository;
import courses.abc.atoms.core.repositories.RoleRepository;
import courses.abc.atoms.core.repositories.SkillsRepository;
import courses.abc.atoms.core.repositories.UserCourseEnrollmentRepository;
import courses.abc.atoms.core.repositories.EducationRepository;
import courses.abc.atoms.core.repositories.ExperienceRepository;
import courses.abc.atoms.core.repositories.LanguagesRepository;
import courses.abc.atoms.core.model.lms.Role;
import courses.abc.atoms.core.repositories.ReferralRepository;
import courses.abc.atoms.features.course.repositories.CourseRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Collections;

@Service
public class AdminService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AdminService.class);

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProfileRepository profileRepository;
    @Autowired
    private EducationRepository educationRepository;
    @Autowired
    private UserRoleRepository userRoleRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private UserService userService;
    @Autowired
    private RoleService roleService;
    @Autowired
    private ProfileService profileService;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private ReferralRepository referralRepository;
    @Autowired
    private BatchRepository batchRepository;
    @Autowired
    private BatchCourseRepository batchCourseRepository;
    @Autowired
    private UserCourseEnrollmentRepository userCourseEnrollmentRepository;
    @Autowired
    private ExperienceRepository experienceRepository;
    @Autowired
    private SkillsRepository skillsRepository;
    @Autowired
    private LanguagesRepository languagesRepository;

    @Transactional(readOnly = true)
    public List<UserAdminDTO> getAllUsers() {
        List<Users> users = userRepository.findAll();
        Set<Long> userIds = users.stream().map(Users::getId).collect(Collectors.toSet());

        Map<Long, Profiles> profileMap = profileRepository.findAllByUserIdIn(userIds)
                .stream()
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p));

        return users.stream()
                .map(user -> mapUserToUserAdminDTO(user, profileMap.get(user.getId())))
                .collect(Collectors.toList());
    }

    @Transactional
    public BatchDTO getBatchesByInstructor(Long userId) {
        Integer userIdInt = userId != null ? userId.intValue() : null;
        if (userIdInt == null) {
            throw new IllegalArgumentException("Invalid user ID");
        }

        List<Batches> batches = batchRepository.findByBatchManagerId(userId);
        if (batches.isEmpty()) {
            throw new RuntimeException("No batches found for user ID: " + userId);
        }

        List<BatchDTO.BatchDetail> activeBatches = new ArrayList<>();
        List<BatchDTO.BatchDetail> completedBatches = new ArrayList<>();

        LocalDateTime currentDateTime = LocalDateTime.now(ZoneId.of("Asia/Kolkata")); // 03:04 PM IST on July 04, 2025

        for (Batches batch : batches) {
            Optional<courses.abc.atoms.features.course.model.BatchCourse> batchCourse = batchCourseRepository.findPrimaryCourseForBatch(batch.getBatchId());
            String courseName = batchCourse.map(bc -> {
                Long courseId = bc.getCourse() != null ? bc.getCourse().getCourseId() : null;
                Optional<Course> course = courseId != null ? courseRepository.findById(courseId) : Optional.empty();
                return course.map(Course::getTitle).orElse("Unknown Course");
            }).orElse("No Primary Course");

            BatchDTO.BatchDetail batchDetail = new BatchDTO.BatchDetail(
                batch.getBatchId(),
                batch.getBatchName(),
                courseName,
                batch.getStartDate() != null ? batch.getStartDate().toString() : null,
                batch.getEndDate() != null ? batch.getEndDate().toString() : null
            );

            if (batch.getEndDate() == null || batch.getEndDate().isAfter(currentDateTime.toLocalDate())) {
                activeBatches.add(batchDetail);
            } else {
                completedBatches.add(batchDetail);
            }
        }

        return new BatchDTO(activeBatches, completedBatches);
    }
    public void setUserAsAdmin(String email) {
        // Update the user role to admin
        Optional<Users> userOptional = userRepository.findByEmail(email);
        if (!userOptional.isPresent()) {
            throw new RuntimeException("The user with email " + email + " is not found in the system");
        }
        Users user = userOptional.get();
        if (userService.getUserRolesByUserID(user.getId()).contains(RoleType.ADMIN.getRole())) {
            throw new RuntimeException("The user with email " + email + " is already an admin");
        }
        userService.assignUserRole(user.getId(), RoleType.ADMIN.getRole());
    }

    public void setUserAsInstructor(String email) {
        // Update the user role to instructor
        Optional<Users> userOptional = userRepository.findByEmail(email);

        if (!userOptional.isPresent()) {
            throw new RuntimeException("The user with email " + email + " is not found in the system");
        }

        Users user = userOptional.get();

        if (userService.getUserRolesByUserID(user.getId()).contains(RoleType.INSTRUCTOR.getRole())) {
            throw new RuntimeException("The user with email " + email + " is already an instructor");
        }

        userService.assignUserRole(user.getId(), RoleType.INSTRUCTOR.getRole());
    }

    public List<UserAdminDTO> getAdminsAndInstructors() {
        try {
            // Fetch all users and filter for admins and instructors
            List<Users> users = roleService
                    .getUsersByRoles(Set.of(RoleType.ADMIN.getRole(), RoleType.INSTRUCTOR.getRole()));
            return users.stream()
                    .map(user -> {
                        Profiles userProfiles = profileService.getProfileByUserId(user.getId())
                                .orElse(null); // Profiles may not exist for all users
                        return mapUserToUserAdminDTO(user, userProfiles);
                    }).collect(Collectors.toList());
        } catch (Exception e) {
            LOGGER.error("Could not retrieve admins and instructors", e);
            throw new RuntimeException("Failed to retrieve admins and instructors", e);
        }
    }

    public Page<AdminDTO.UserAdminDTO> getStudents(Pageable pageable) {
        try {
            List<Users> allUsers = roleService.getUsersByRoles(Set.of(RoleType.STUDENT.getRole()));

            List<AdminDTO.UserAdminDTO> dtoList = allUsers.stream()
                    .map(user -> {
                        Profiles userProfiles = profileService.getProfileByUserId(user.getId())
                                .orElseThrow(() -> new RuntimeException("Profile not found for user ID: " + user.getId()));
                        return mapUserToUserAdminDTO(user, userProfiles);
                    }).collect(Collectors.toList());

            return toPage(dtoList, pageable);
        } catch (Exception e) {
            LOGGER.error("Could not retrieve students", e);
            throw new RuntimeException("Failed to retrieve students", e);
        }
    }

    public Page<AdminDTO.UserAdminDTO> getRegisteredStudents(Pageable pageable) {
        try {
            List<Users> allUsers = roleService.getUsersByRoles(Set.of(RoleType.STUDENT.getRole()))
                    .stream()
                    .filter(user -> "REGISTERED".equals(user.getStatus()) && user.getIsActive())
                    .collect(Collectors.toList());

            List<AdminDTO.UserAdminDTO> dtoList = allUsers.stream()
                    .map(user -> {
                        Profiles userProfiles = profileService.getProfileByUserId(user.getId())
                                .orElseThrow(() -> new RuntimeException("Profile not found for user ID: " + user.getId()));
                        return mapUserToUserAdminDTO(user, userProfiles);
                    }).collect(Collectors.toList());

            return toPage(dtoList, pageable);
        } catch (Exception e) {
            LOGGER.error("Could not retrieve registered students", e);
            throw new RuntimeException("Failed to retrieve registered students", e);
        }
    }

    public Page<AdminDTO.UserAdminDTO> getAdmittedStudents(Pageable pageable) {
        try {
            List<Users> allUsers = roleService.getUsersByRoles(Set.of(RoleType.STUDENT.getRole()))
                    .stream()
                    .filter(user -> "ADMITTED".equals(user.getStatus()) && user.getIsActive())
                    .collect(Collectors.toList());

            List<AdminDTO.UserAdminDTO> dtoList = allUsers.stream()
                    .map(user -> {
                        Profiles userProfiles = profileService.getProfileByUserId(user.getId())
                                .orElseThrow(() -> new RuntimeException("Profile not found for user ID: " + user.getId()));
                        return mapUserToUserAdminDTO(user, userProfiles);
                    }).collect(Collectors.toList());

            return toPage(dtoList, pageable);
        } catch (Exception e) {
            LOGGER.error("Could not retrieve admitted students", e);
            throw new RuntimeException("Failed to retrieve admitted students", e);
        }
    }

    public Page<AdminDTO.UserAdminDTO> getArchivedStudents(Pageable pageable) {
        try {
            List<Users> allUsers = roleService.getUsersByRoles(Set.of(RoleType.STUDENT.getRole()))
                    .stream()
                    .filter(user -> !user.getIsActive())
                    .collect(Collectors.toList());

            List<AdminDTO.UserAdminDTO> dtoList = allUsers.stream()
                    .map(user -> {
                        Profiles userProfiles = profileService.getProfileByUserId(user.getId())
                                .orElseThrow(() -> new RuntimeException("Profile not found for user ID: " + user.getId()));
                        return mapUserToUserAdminDTO(user, userProfiles);
                    }).collect(Collectors.toList());

            return toPage(dtoList, pageable);
        } catch (Exception e) {
            LOGGER.error("Could not retrieve archived students", e);
            throw new RuntimeException("Failed to retrieve archived students", e);
        }
    }

    // ─── Helper ──────────────────────────────────────────────────────────────────

    /**
     * Converts a List to a Page manually.
     * Used because filtering happens in memory (not at DB level).
     */
    private <T> Page<T> toPage(List<T> list, Pageable pageable) {
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), list.size());

        if (start > list.size()) {
            return new PageImpl<>(Collections.emptyList(), pageable, list.size());
        }

        return new PageImpl<>(list.subList(start, end), pageable, list.size());
    }

    public AdminDTO.UserAdminDTO getStudentById(Long id) {
        Users user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + id));

        // Check if user has STUDENT role using UserService
        List<String> userRoles = userService.getUserRolesByUserID(user.getId());
        boolean isStudent = userRoles.stream()
                .anyMatch(role -> RoleType.STUDENT.getRole().equals(role));

        if (!isStudent) {
            throw new ResourceNotFoundException("User with ID " + id + " is not a student.");
        }

        Profiles profile = profileRepository.findByUserId(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for student with ID: " + id));

        // Fetch the STUDENT role name
        String roleName = userRoles.stream()
                .filter(role -> RoleType.STUDENT.getRole().equals(role))
                .findFirst()
                .orElse(null);

        AdminDTO.UserAdminDTO dto = new AdminDTO.UserAdminDTO();
        dto.setId(user.getId());
        dto.setName(profile.getName());
        dto.setAbcId(profile.getAbcId());
        dto.setEmail(user.getEmail());
        dto.setPhone(profile.getPhoneNumber());
        dto.setRole(roleName);
        dto.setIsActive(user.getIsActive());
        dto.setGender(profile.getGender());
        dto.setProfileImage(profile.getProfileImageUrl());       
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());      

        return dto;
    }



    public void archiveUser(String email) {
        // Archive the user
        Optional<Users> userOptional = userRepository.findByEmail(email);
        if (!userOptional.isPresent()) {
            throw new RuntimeException("The user with email " + email + " is not found in the system");
        }
        Users user = userOptional.get();
        if (!user.getIsActive()) {
            throw new RuntimeException("The user with email " + email + " is already archived");
        }
        user.setIsActive(false);
        userRepository.save(user);
    }

    /**
     * Helper method to map Users and Profiles to UserAdminDTO.
     */
    private UserAdminDTO mapUserToUserAdminDTO(Users user, Profiles userProfiles) {
        UserAdminDTO dto = new UserAdminDTO();
        dto.setId(user.getId());
        if (userProfiles != null) {
            dto.setName(userProfiles.getName());
            dto.setAbcId(userProfiles.getAbcId());
            dto.setPhone(userProfiles.getPhoneNumber());
            dto.setGender(userProfiles.getGender());
            dto.setProfileImage(userProfiles.getProfileImageUrl());
        } else {
            dto.setName(null);
            dto.setPhone(null);
            dto.setGender(null);
            dto.setProfileImage(null);
        }
        dto.setEmail(user.getEmail());
        dto.setRole(userService.getUserRolesByUserID(user.getId()).get(0));
        dto.setIsActive(user.getIsActive());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setStatus(user.getStatus());
        return dto;
    }

@Transactional
    public void updateProfile(Long userId, ProfileDTO.ProfileUpdateDTO dto) {
        Optional<Users> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }
        Users user = userOptional.get();

        if (dto.getEmail() != null && !dto.getEmail().isBlank() && userRepository.existsByEmailAndIdNot(dto.getEmail(), userId)) {
            throw new ResourceAlreadyExistsException("User with email " + dto.getEmail() + " already exists");
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

        if (dto.getPhone() != null && !dto.getPhone().isBlank() && profileRepository.existsByPhoneNumberAndUserIdNot(dto.getPhone(), userId)) {
            throw new ResourceAlreadyExistsException("User with Mobile Number " + dto.getPhone() + " already exists");
        }

        if (dto.getName() != null) profile.setName(dto.getName());
        if (dto.getPhone() != null) profile.setPhoneNumber(dto.getPhone());
        if (dto.getParentName() != null) profile.setParentName(dto.getParentName());
        if (dto.getParentContact() != null) profile.setParentContact(dto.getParentContact());
        if (dto.getParentEmail() != null) profile.setParentEmail(dto.getParentEmail());
        if (dto.getGender() != null) profile.setGender(dto.getGender());
        if (dto.getDob() != null && !dto.getDob().isBlank()) profile.setDob(LocalDate.parse(dto.getDob()));
        if (dto.getWhatsappNumber() != null) profile.setWhatsappNumber(dto.getWhatsappNumber());
        if (dto.getAddress() != null) profile.setAddress(dto.getAddress());
        if (dto.getCity() != null) profile.setCity(dto.getCity());
        if (dto.getState() != null) profile.setState(dto.getState());
        if (dto.getCountry() != null) profile.setCountry(dto.getCountry());
        if (dto.getPincode() != null) profile.setPincode(dto.getPincode());
        if (dto.getQualification() != null) profile.setQualification(dto.getQualification());
        if (dto.getAadhar() != null) profile.setAadhar(dto.getAadhar());
        if (dto.getPan() != null) profile.setPan(dto.getPan());
        profile.setUpdatedAt(LocalDateTime.now());
        profileRepository.save(profile);

        if (dto.getEducations() != null) {
            List<Educations> existingEducations = educationRepository.findByProfileId(profile.getProfileId());

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
                if (educationDto.getPassOfYear() != null && !educationDto.getPassOfYear().isBlank())
                    education.setPassOfYear(LocalDate.parse(educationDto.getPassOfYear()));
                if (educationDto.getBranch() != null) education.setBranch(educationDto.getBranch());
                if (educationDto.getBoard() != null) education.setBoard(educationDto.getBoard());
                if (educationDto.getCourses() != null) education.setCourses(educationDto.getCourses());
                if (educationDto.getPercentage() != null) education.setPercentage(educationDto.getPercentage());
                if (educationDto.getRollNo() != null) education.setRollNo(educationDto.getRollNo());
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
    public UserDTO.UserProfileResponse getUserProfile(Long userId) {
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
    public void addExperience(Long userId, UserDTO.ExperienceDTO experienceDto) {
        Optional<Profiles> profileOptional = profileRepository.findByUserId(userId);
        Profiles profile = profileOptional.orElseThrow(() -> new IllegalArgumentException("Profile not found for user ID: " + userId));

        Experiences experience = new Experiences();
        experience.setProfile(profile);
        experience.setCompany(experienceDto.getCompany());
        experience.setTitle(experienceDto.getTitle());
        experience.setStartdate(experienceDto.getStartdate());
        experience.setEnddate(experienceDto.getEnddate());
        experience.setLocation(experienceDto.getLocation());
        experience.setDetails(experienceDto.getDetails());
        experience.setPositionType(experienceDto.getPositionType());
        experience.setDesignation(experienceDto.getDesignation());
        experience.setCompanySector(experienceDto.getCompanySector());
        experience.setExperienceCertificate(experienceDto.getExperienceCertificate());
        experienceRepository.save(experience);
    }

    @Transactional
    public void updateExperience(Long userId, Long experienceId, UserDTO.ExperienceDTO experienceDto) {
        Optional<Profiles> profileOptional = profileRepository.findByUserId(userId);
        Profiles profile = profileOptional.orElseThrow(() -> new IllegalArgumentException("Profile not found for user ID: " + userId));

        Experiences experience = experienceRepository.findById(experienceId)
            .orElseThrow(() -> new IllegalArgumentException("Experience not found with ID: " + experienceId));
        if (!experience.getProfile().getProfileId().equals(profile.getProfileId())) {
            throw new IllegalArgumentException("Experience does not belong to user ID: " + userId);
        }

        experience.setCompany(experienceDto.getCompany());
        experience.setTitle(experienceDto.getTitle());
        experience.setStartdate(experienceDto.getStartdate());
        experience.setEnddate(experienceDto.getEnddate());
        experience.setLocation(experienceDto.getLocation());
        experience.setDetails(experienceDto.getDetails());
        experience.setPositionType(experienceDto.getPositionType());
        experience.setDesignation(experienceDto.getDesignation());
        experience.setCompanySector(experienceDto.getCompanySector());
        experience.setExperienceCertificate(experienceDto.getExperienceCertificate());
        experienceRepository.save(experience);
    }

    @Transactional
    public void addSkill(Long userId, UserDTO.SkillDTO skillDto) {
        Optional<Profiles> profileOptional = profileRepository.findByUserId(userId);
        Profiles profile = profileOptional.orElseThrow(() -> new IllegalArgumentException("Profile not found for user ID: " + userId));

        Skills skill = new Skills();
        skill.setProfile(profile);
        skill.setSkillName(skillDto.getSkillName());
        skill.setProficiencyLevel(skillDto.getProficiencyLevel());
        skillsRepository.save(skill);
    }

    @Transactional
    public void updateSkill(Long userId, Long skillId, UserDTO.SkillDTO skillDto) {
        Optional<Profiles> profileOptional = profileRepository.findByUserId(userId);
        Profiles profile = profileOptional.orElseThrow(() -> new IllegalArgumentException("Profile not found for user ID: " + userId));

        Skills skill = skillsRepository.findById(skillId)
            .orElseThrow(() -> new IllegalArgumentException("Skill not found with ID: " + skillId));
        if (!skill.getProfile().getProfileId().equals(profile.getProfileId())) {
            throw new IllegalArgumentException("Skill does not belong to user ID: " + userId);
        }

        skill.setSkillName(skillDto.getSkillName());
        skill.setProficiencyLevel(skillDto.getProficiencyLevel());
        skillsRepository.save(skill);
    }

    @Transactional
    public void addLanguage(Long userId, UserDTO.LanguageDTO languageDto) {
        Optional<Profiles> profileOptional = profileRepository.findByUserId(userId);
        Profiles profile = profileOptional.orElseThrow(() -> new IllegalArgumentException("Profile not found for user ID: " + userId));

        Languages language = new Languages();
        language.setProfile(profile);
        language.setLanguageName(languageDto.getLanguageName());
        language.setProficiencyLevel(languageDto.getProficiencyLevel());
        languagesRepository.save(language);
    }

    @Transactional
    public void updateLanguage(Long userId, Long languageId, UserDTO.LanguageDTO languageDto) {
        Optional<Profiles> profileOptional = profileRepository.findByUserId(userId);
        Profiles profile = profileOptional.orElseThrow(() -> new IllegalArgumentException("Profile not found for user ID: " + userId));

        Languages language = languagesRepository.findById(languageId)
            .orElseThrow(() -> new IllegalArgumentException("Language not found with ID: " + languageId));
        if (!language.getProfile().getProfileId().equals(profile.getProfileId())) {
            throw new IllegalArgumentException("Language does not belong to user ID: " + userId);
        }

        language.setLanguageName(languageDto.getLanguageName());
        language.setProficiencyLevel(languageDto.getProficiencyLevel());
        languagesRepository.save(language);
    }
    @Transactional
    public List<UserResponse> bulkArchiveLearners(List<Long> userIds) {
        List<UserResponse> responses = new ArrayList<>();

        for (Long userId : userIds) {
            Users user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User with ID " + userId + " not found"));

            user.setIsActive(false);
            user.setStatus("ARCHIVED");
            user.setUpdatedAt(LocalDateTime.now());

            Users savedUser = userRepository.save(user);
            responses.add(convertToUserResponse(savedUser));
        }

        return responses;
    }

    @Transactional
    public List<UserResponse> bulkUnarchiveLearners(List<Long> userIds) {
        List<UserResponse> responses = new ArrayList<>();

        for (Long userId : userIds) {
            Users user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User with ID " + userId + " not found"));

            // Check if user has any course enrollments
            boolean hasEnrollment = userCourseEnrollmentRepository.existsByUserId(userId);

            // Set status based on enrollment
            user.setIsActive(true);
            user.setStatus(hasEnrollment ? "ADMITTED" : "REGISTERED");
            user.setUpdatedAt(LocalDateTime.now());

            Users savedUser = userRepository.save(user);
            responses.add(convertToUserResponse(savedUser));
        }

        return responses;
    }

    private UserResponse convertToUserResponse(Users user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        return response;
    }

    @Transactional
    public UserDTO.InstructorRegistrationResponse registerInstructor(UserDTO.InstructorRegistrationRequest request) {
        List<UserDTO.UserResponse> successfulRegistrations = new ArrayList<>();
        List<UserDTO.InstructorRegistrationResponse.ErrorDetail> errors = new ArrayList<>();

        for (UserDTO.InstructorRegistrationRequest.Instructor instructor : request.getInstructors()) {
            try {
                // Validate email
                if (userRepository.existsByEmail(instructor.getEmail())) {
                    throw new ResourceAlreadyExistsException("User with email " + instructor.getEmail() + " already exists");
                }

                // Validate phone
                String phoneNumber = instructor.getPhone() != null ? instructor.getPhone().toString() : null;
                if (phoneNumber != null && profileRepository.existsByPhoneNumber(phoneNumber)) {
                    throw new ResourceAlreadyExistsException("User with phone " + phoneNumber + " already exists");
                }

                // Validate password
                if (instructor.getPassword() == null || instructor.getPassword().isBlank()) {
                    throw new IllegalArgumentException("Password is required for user with email " + instructor.getEmail());
                }

                // Create user
                Users user = new Users();
                user.setEmail(instructor.getEmail());
                user.setPassword(passwordEncoder.encode(instructor.getPassword()));
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
                profile.setName(instructor.getName());
                profile.setPhoneNumber(phoneNumber);
                profile.setUpdatedAt(LocalDateTime.now());

                profileRepository.save(profile);

                // Assign role
                assignUserRole(savedUser.getId(), instructor.getRole() != null ? instructor.getRole() : "INSTRUCTOR");

                // Add to successful registrations
                successfulRegistrations.add(convertToUserResponse(savedUser));

            } catch (ResourceAlreadyExistsException | IllegalArgumentException e) {
                errors.add(new UserDTO.InstructorRegistrationResponse.ErrorDetail(
                    instructor.getEmail(),
                    instructor.getPhone(),
                    e.getMessage()
                ));
            } catch (Exception e) {
                errors.add(new UserDTO.InstructorRegistrationResponse.ErrorDetail(
                    instructor.getEmail(),
                    instructor.getPhone(),
                    "Unexpected error: " + e.getMessage()
                ));
            }
        }

        return new UserDTO.InstructorRegistrationResponse(successfulRegistrations, errors);
    }

    public void assignUserRole(Long userId, String roleName) {
    if (roleName == null || roleName.isEmpty()) {
        throw new InvalidInputException("Role must be provided");
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
    public List<UserDTO.ReferralResponse> getReferralsByUserId(Long userId) {
        List<Referrals> referrals = referralRepository.findByReferrerId(userId);
        if (referrals.isEmpty()) {
            throw new RuntimeException("No referrals found for user ID: " + userId);
        }

        List<UserDTO.ReferralResponse> referralResponses = new ArrayList<>();
        for (Referrals referral : referrals) {
            Optional<Users> referredUser = userRepository.findById(referral.getUserId());
            referredUser.ifPresent(user -> {
                UserDTO.ReferralResponse response = new UserDTO.ReferralResponse();
                response.setReferredUserId(user.getId());
                response.setReferredEmail(user.getEmail());
                response.setReferralId(referral.getReferralId());
                response.setWallet(referral.getWallet());
                referralResponses.add(response);
            });
        }
        return referralResponses;
    }

    @Transactional
    public void deleteExperience(Long experienceId, Long userId) {
        Optional<Profiles> profileOptional = profileRepository.findByUserId(userId);
        Profiles profile = profileOptional.orElseThrow(() -> new IllegalArgumentException("Profile not found for user ID: " + userId));

        Experiences experience = experienceRepository.findById(experienceId)
            .orElseThrow(() -> new IllegalArgumentException("Experience not found with ID: " + experienceId));
        if (!experience.getProfile().getProfileId().equals(profile.getProfileId())) {
            throw new IllegalArgumentException("Experience does not belong to user ID: " + userId);
        }
        experienceRepository.delete(experience);
    }

    @Transactional
    public void deleteSkill(Long skillId, Long userId) {
        Optional<Profiles> profileOptional = profileRepository.findByUserId(userId);
        Profiles profile = profileOptional.orElseThrow(() -> new IllegalArgumentException("Profile not found for user ID: " + userId));

        Skills skill = skillsRepository.findById(skillId)
            .orElseThrow(() -> new IllegalArgumentException("Skill not found with ID: " + skillId));
        if (!skill.getProfile().getProfileId().equals(profile.getProfileId())) {
            throw new IllegalArgumentException("Skill does not belong to user ID: " + userId);
        }
        skillsRepository.delete(skill);
    }

    @Transactional
    public void deleteLanguage(Long languageId, Long userId) {
        Optional<Profiles> profileOptional = profileRepository.findByUserId(userId);
        Profiles profile = profileOptional.orElseThrow(() -> new IllegalArgumentException("Profile not found for user ID: " + userId));

        Languages language = languagesRepository.findById(languageId)
            .orElseThrow(() -> new IllegalArgumentException("Language not found with ID: " + languageId));
        if (!language.getProfile().getProfileId().equals(profile.getProfileId())) {
            throw new IllegalArgumentException("Language does not belong to user ID: " + userId);
        }
        languagesRepository.delete(language);
    }

}
