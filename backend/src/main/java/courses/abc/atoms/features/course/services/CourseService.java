package courses.abc.atoms.features.course.services;

import courses.abc.atoms.core.model.core.UserCourseEnrollment;
import courses.abc.atoms.core.repositories.UserCourseEnrollmentRepository;
import courses.abc.atoms.features.course.repositories.*;
import courses.abc.atoms.features.payment.model.PaymentPlanRule;
import courses.abc.atoms.features.payment.model.PaymentPlans;
import courses.abc.atoms.features.payment.repositories.PaymentPlanRepository;
import courses.abc.atoms.features.payment.repositories.PaymentPlanRuleRepository;
import courses.abc.atoms.features.student.model.UserCurriculumProgress;
import courses.abc.atoms.features.student.repositories.UserCurriculumProgressRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.features.course.dto.CourseDTO;
import courses.abc.atoms.features.course.dto.BatchDTO;
import courses.abc.atoms.features.course.dto.CurriculumDTO;
import courses.abc.atoms.features.course.model.BundleCourses;
import courses.abc.atoms.features.course.model.Course;
import courses.abc.atoms.features.course.model.Curriculum;
import courses.abc.atoms.features.course.model.CoursePlan;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.dto.UserDTO;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.core.services.UserService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import courses.abc.atoms.core.services.SpacesService;
import java.io.IOException;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CourseService {

    private static final Logger logger = LoggerFactory.getLogger(CourseService.class);

    private static final String CACHE_NAME = "courses";

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CurriculumRepository curriculumRepository;

    @Autowired
    private CurriculumService curriculumService;

    @Autowired
    private PaymentPlanRepository paymentPlanRepository;
    @Autowired
    private CoursePlanRepository coursePlanRepository;
    @Autowired
    private BatchService batchService;
    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BundleCourseRepository bundleCourseRepository;
    @Autowired
    private CourseBundleRepository courseBundleRepository;
    @Autowired
    private UserCourseEnrollmentRepository userCourseEnrollmentRepository;
    @Autowired
    private PaymentPlanRuleRepository paymentPlanRuleRepository;
    @Autowired
    private UserCurriculumProgressRepository userCurriculumProgressRepository;
    @Autowired
    private BatchCourseRepository batchCourseRepository;

    @Autowired
    private SpacesService spacesService;

    /**
     * Creates a new course and a default curriculum associated with it.
     * The default curriculum cannot be unlinked from the course.
     * Image processing is optimized with compression and async handling.
     *
     * @param request      The DTO containing course details.
     * @param imageFile    The thumbnail image file.
     * @param instructorId The ID of the instructor creating the course.
     * @return The created CourseResponse DTO.
     * @throws IOException if there is an error processing the image file.
     */
    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public CourseDTO.CourseResponse createCourse(CourseDTO.CourseCreateRequest request, MultipartFile imageFile,
                                                 Long instructorId) throws IOException {

        Course course = new Course();
        course.setTitle(request.getTitle());
        course.setPrettyName(request.getPrettyName());
        course.setDescription(request.getDescription());
        course.setPrice(request.getPrice());
        course.setInstructorId(instructorId);
        course.setArchived(false);

        // Create and save the default curriculum first
        Curriculum newCurriculum = new Curriculum();
        newCurriculum.setTitle(course.getTitle());
        newCurriculum.setDescription("Default curriculum for " + course.getTitle());
        newCurriculum.setVersion("1.0");
        newCurriculum.setIsActive(true);

        Curriculum savedCurriculum = curriculumRepository.save(newCurriculum);

        // Set the default curriculum ID and add it to the course's curriculum list
        course.setDefaultCurriculumId(savedCurriculum.getCurriculumId());
        course.getCurriculums().add(savedCurriculum);

        Course savedCourse = courseRepository.save(course);

        // Upload thumbnail to Spaces after save (courseId is available now)
        if (imageFile != null && !imageFile.isEmpty()) {
            String thumbnailUrl = spacesService.uploadCourseThumbnail(imageFile);
            savedCourse.setThumbnailUrl(thumbnailUrl);
            savedCourse = courseRepository.save(savedCourse);
        }

        return convertToCourseResponse(savedCourse);
    }

    /**
     * Retrieves all courses with pagination, caching, and optimized sorting.
     * Uses database-level sorting for better performance.
     *
     * @param page Page number (0-based)
     * @param size Page size
     * @param isArchived Filter by archived status
     * @return A paginated list of CourseResponse DTOs.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, key = "'all-courses-' + #page + '-' + #size + '-' + #isArchived", unless = "#result.totalElements == 0")
    public Page<CourseDTO.CourseResponse> getAllCourses(int page, int size, boolean isArchived) {

        // Validate pagination parameters
        if (page < 0)
            page = 0;
        if (size <= 0 || size > 100)
            size = 10; // Limit max page size

        // Use sorting at database level for better performance
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by("title"));
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Course> coursePage = courseRepository.findByIsArchived(isArchived, pageable);

        return coursePage.map(this::convertToCourseResponse);
    }

    /**
     * Legacy method for backward compatibility - optimized with caching
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, key = "'legacy-all-courses'")
    public List<CourseDTO.CourseResponse> getAllCourses() {
        // For backward compatibility, return first 50 courses instead of 100
        Page<CourseDTO.CourseResponse> coursePage = getAllCourses(0, 50, false);
        return coursePage.getContent();
    }

    /**
     * Finds a single course by its ID with caching.
     *
     * @param id The ID of the course.
     * @return A CourseResponse DTO.
     */
    @Transactional(readOnly = true)
    // @Cacheable(value = CACHE_NAME, key = "'course-' + #id")
    public CourseDTO.CourseResponse getCourseById(Long id) {
        Course course = courseRepository.findByCourseId(id)
                .orElseThrow(() -> {
                    return new ResourceNotFoundException("Course not found with id: " + id);
                });
        return convertToCourseResponse(course);
    }

    /**
     * Retrieves courses by instructor with pagination.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, key = "'instructor-' + #instructorId + '-' + #page + '-' + #size")
    public Page<CourseDTO.CourseResponse> getCoursesByInstructor(Long instructorId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Course> coursePage = courseRepository.findByInstructorId(instructorId, pageable);
        return coursePage.map(this::convertToCourseResponse);
    }

    @Transactional(readOnly = true)
    public List<CourseDTO.CourseResponse> getCoursesByBundleId(Long bundleId) {

        if (!courseBundleRepository.existsById(bundleId)) {
            throw new ResourceNotFoundException("Bundle not found with id: " + bundleId);
        }

        // Fetch all BundleCourses entries for the given bundleId
        List<BundleCourses> bundleCourses = bundleCourseRepository.findAllByIdBundleId(bundleId);

        if (bundleCourses.isEmpty()) {
            return Collections.emptyList();
        }

        // Extract course IDs and map to CourseResponse using existing getCourseById method
        return bundleCourses.stream()
                .map(bc -> bc.getId().getCourseId())
                .map(this::getCourseById)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves featured courses with caching.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, key = "'featured-courses'")
    public List<CourseDTO.CourseResponse> getFeaturedCourses() {
        List<Course> featuredCourses = courseRepository.findFeaturedCourses();
        return featuredCourses.stream()
                .map(this::convertToCourseResponse)
                .collect(Collectors.toList());
    }

    /**
     * Updates an existing course with cache invalidation and optimized image
     * processing.
     *
     * @param id        The ID of the course to update.
     * @param request   The DTO with updated information.
     * @param imageFile The new optional thumbnail image.
     * @return The updated CourseResponse DTO.
     */
    @Transactional
    @CachePut(value = CACHE_NAME, key = "'course-' + #id")
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public CourseDTO.CourseResponse updateCourse(Long id, CourseDTO.CourseUpdateRequest request,
                                                 MultipartFile imageFile) throws IOException {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> {
                    return new ResourceNotFoundException("Course not found with id: " + id);
                });

        // Update basic fields only if changed to avoid unnecessary writes
        boolean hasChanges = false;

        if (!Objects.equals(course.getTitle(), request.getTitle())) {
            course.setTitle(request.getTitle());
            hasChanges = true;
        }

        if (!Objects.equals(course.getPrettyName(), request.getPrettyName())) {
            course.setPrettyName(request.getPrettyName());
            hasChanges = true;
        }

        if (!Objects.equals(course.getDescription(), request.getDescription())) {
            course.setDescription(request.getDescription());
            hasChanges = true;
        }

        if (!Objects.equals(course.getOverview(), request.getOverview())) {
            course.setOverview(request.getOverview());
            hasChanges = true;
        }

        // Handle thumbnail update — delete old from Spaces, upload new
        if (imageFile != null && !imageFile.isEmpty()) {
            spacesService.deleteFile(course.getThumbnailUrl());
            String newUrl = spacesService.uploadCourseThumbnail(imageFile);
            course.setThumbnailUrl(newUrl);
            hasChanges = true;
        }

        // Only save if there are actual changes
        Course updatedCourse = hasChanges ? courseRepository.save(course) : course;
        return convertToCourseResponse(updatedCourse);
    }

    /**
     * Bulk archive/unarchive courses for better performance.
     * Uses native query for optimal performance.
     */
    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public int bulkUpdateArchiveStatus(List<Long> courseIds, boolean isArchived) {

        // Validate input
        if (courseIds == null || courseIds.isEmpty()) {
            return 0;
        }

        // Process in batches to avoid memory issues
        int batchSize = 100;
        int totalUpdated = 0;

        for (int i = 0; i < courseIds.size(); i += batchSize) {
            int endIndex = Math.min(i + batchSize, courseIds.size());
            List<Long> batch = courseIds.subList(i, endIndex);
            int updatedCount = courseRepository.bulkUpdateArchiveStatus(batch, isArchived);
            totalUpdated += updatedCount;
        }

        return totalUpdated;
    }

    /**
     * Optimized batch course retrieval
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, key = "'batch-courses-' + #courseIds.hashCode()")
    public List<CourseDTO.CourseResponse> getCoursesByIds(List<Long> courseIds) {

        if (courseIds == null || courseIds.isEmpty()) {
            return List.of();
        }

        List<Course> courses = courseRepository.findByIdIn(courseIds);
        return courses.stream()
                .map(this::convertToCourseResponse)
                .collect(Collectors.toList());
    }

    /**
     * Updates the archival status of a course with cache eviction.
     */
    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public CourseDTO.CourseResponse setArchiveStatus(Long id, boolean isArchived) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> {
                    return new ResourceNotFoundException("Course not found with id: " + id);
                });

        course.setArchived(isArchived);
        Course updatedCourse = courseRepository.save(course);
        return convertToCourseResponse(updatedCourse);
    }

    /**
     * Gathers the context for the student's course view page header.
     *
     * @param courseId The ID of the course being viewed.
     * @param userId The ID of the currently logged-in student.
     * @return A DTO containing the course title, batch info, and available curriculums with progress.
     */
    // @Transactional(readOnly = true)
    // public CourseDTO.CourseContextResponse getCourseContextForStudent(Long courseId, Long userId) {
    //     Course course = courseRepository.findById(courseId)
    //             .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

    //     // This assumes a user is in only one batch per course.
    //     UserCourseEnrollment enrollment = userCourseEnrollmentRepository.findByUser_IdAndCourse_CourseId (userId, courseId)
    //             .orElseThrow(() -> new ResourceNotFoundException("User is not enrolled in this course."));

    //     Users user = userRepository.findById(userId)
    //             .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

    //     Long batchId = enrollment.getBatches().getBatchId();
    //     CourseDTO.BatchInfo batchInfo = new CourseDTO.BatchInfo(
    //             batchId,
    //             enrollment.getBatches().getBatchName()
    //     );

    //     // Fetch curriculums specifically assigned to this batch for this course.
    //     List<Curriculum> batchCurriculums = batchCourseRepository.findCurriculumsByBatchIdAndCourseId(batchId, courseId);


    //     // Temporary: log what's coming back
    //     logger.info("batchCurriculums size: {}, batchId: {}, courseId: {}", 
    //      batchCurriculums.size(), batchId, courseId);
    //     // Fallback: If no specific curriculums are assigned, use the course's default curriculum.
    //     if (batchCurriculums.isEmpty() && course.getDefaultCurriculum() != null) {
    //         batchCurriculums = List.of(course.getDefaultCurriculum());
    //     }

    //     List<CourseDTO.CurriculumInfo> availableCurriculums = batchCurriculums.stream()
    //             .map(curriculum -> {
    //                 // Find the specific progress record for this user and curriculum
    //                 Optional<UserCurriculumProgress> progressOpt = userCurriculumProgressRepository.findByUserAndCurriculum(user, curriculum);

    //                 // Use the stored percentage if it exists, otherwise default to 0
    //                 int progressPercentage = progressOpt
    //                         .map(UserCurriculumProgress::getProgressPercentage)
    //                         .map(BigDecimal::intValue)
    //                         .orElse(0);

    //                 return new CourseDTO.CurriculumInfo(
    //                         curriculum.getCurriculumId(),
    //                         curriculum.getTitle(),
    //                         progressPercentage
    //                 );
    //             })
    //             .collect(Collectors.toList());

    //     // Determine the default curriculum ID for this batch context.
    //     Integer defaultCurriculumId = availableCurriculums.stream()
    //             .map(CourseDTO.CurriculumInfo::getCurriculumId)
    //             .findFirst()
    //             .orElse(course.getDefaultCurriculumId()); // Fallback to course default if list is empty.

    //     return new CourseDTO.CourseContextResponse(
    //             course.getTitle(),
    //             batchInfo,
    //             defaultCurriculumId,
    //             availableCurriculums
    //     );
    // }  


    @Transactional(readOnly = true)
    public CourseDTO.CourseContextResponse getCourseContextForStudent(Long courseId, Long userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        UserCourseEnrollment enrollment = userCourseEnrollmentRepository.findByUser_IdAndCourse_CourseId(userId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("User is not enrolled in this course."));

        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Long batchId = enrollment.getBatches().getBatchId();
        CourseDTO.BatchInfo batchInfo = new CourseDTO.BatchInfo(
                batchId,
                enrollment.getBatches().getBatchName()
        );

        // Use the course's curriculum_courses mapping directly — source of truth for all curriculums.
        List<Curriculum> batchCurriculums = new ArrayList<>(course.getCurriculums());

        // Fallback: if the set is empty for any reason, fall back to the default curriculum.
        if (batchCurriculums.isEmpty() && course.getDefaultCurriculum() != null) {
            batchCurriculums = List.of(course.getDefaultCurriculum());
        }

        List<CourseDTO.CurriculumInfo> availableCurriculums = batchCurriculums.stream()
                .map(curriculum -> {
                    Optional<UserCurriculumProgress> progressOpt =
                            userCurriculumProgressRepository.findByUserAndCurriculum(user, curriculum);

                    int progressPercentage = progressOpt
                            .map(UserCurriculumProgress::getProgressPercentage)
                            .map(BigDecimal::intValue)
                            .orElse(0);

                    return new CourseDTO.CurriculumInfo(
                            curriculum.getCurriculumId(),
                            curriculum.getTitle(),
                            progressPercentage
                    );
                })
                .collect(Collectors.toList());

        Integer defaultCurriculumId = availableCurriculums.stream()
                .map(CourseDTO.CurriculumInfo::getCurriculumId)
                .findFirst()
                .orElse(course.getDefaultCurriculumId());

        return new CourseDTO.CourseContextResponse(
                course.getTitle(),
                batchInfo,
                defaultCurriculumId,
                availableCurriculums
        );
    }

    /**
     * Links a payment plan to a course.
     * If this is the first plan being attached, it triggers the creation of a
     * default batch for this course, managed by the current user.
     *
     * @param courseId The ID of the course.
     * @param planId   The ID of the payment plan to link.
     */
    @Transactional
    @CacheEvict(value = "courses", allEntries = true)
    public void addPlanToCourse(Long courseId, Long planId) {

        if (coursePlanRepository.existsByCourse_CourseIdAndPlan_PlanId(courseId, planId)) {
            throw new IllegalStateException("This payment plan is already attached to the course.");
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        PaymentPlans plan = paymentPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment Plan not found with id: " + planId));

        boolean isFirstPlan = !coursePlanRepository.existsByCourse_CourseId(courseId);

        CoursePlan coursePlan = new CoursePlan();
        coursePlan.setCourse(course);
        coursePlan.setPlan(plan);
        coursePlanRepository.save(coursePlan);

        // If it's the first plan, create the default batch.
        if (isFirstPlan) {
            try {
                // Get the DTO, then use the ID to fetch the User entity.
                UserDTO.UserResponse currentUserDto = userService.getCurrentUser();
                Users currentUser = userRepository.findById(currentUserDto.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Current user not found in database with id: " + currentUserDto.getId()));
                batchService.createDefaultBatchForNewPricedCourse(course, currentUser.getId());
            } catch (Exception e) {
                throw new RuntimeException("Failed to create default batch for course: " + courseId, e);
            }
        }
    }

    public List<PaymentPlans> getPlansForCourse(Long courseId) {
        List<CoursePlan> coursePlans = coursePlanRepository.findByCourse_CourseId(courseId);
        return coursePlans.stream()
                .map(CoursePlan::getPlan)
                .collect(Collectors.toList());
    }

    /**
     * Deletes a course by its ID with cache eviction.
     *
     * @param id The ID of the course to delete.
     */
    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));
        spacesService.deleteFile(course.getThumbnailUrl());
        courseRepository.deleteById(id);
    }

    /**
     * Links an existing curriculum to a course.
     *
     * @param courseId     The ID of the course.
     * @param curriculumId The ID of the curriculum to link.
     * @return The updated CourseResponse DTO.
     */
    @Transactional
    public CourseDTO.CourseResponse linkCurriculumToCourse(Long courseId, Integer curriculumId) {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        Curriculum curriculum = curriculumRepository.findById(curriculumId)
                .orElseThrow(() -> new ResourceNotFoundException("Curriculum not found with id: " + curriculumId));

        if (course.getCurriculums().contains(curriculum)) {
            // Returning the current state as no change is needed
            return convertToCourseResponse(course);
        }

        course.getCurriculums().add(curriculum);
        Course updatedCourse = courseRepository.save(course);

        return convertToCourseResponse(updatedCourse);
    }


    /**
     * Unlinks a curriculum from a course.
     * The current default curriculum cannot be unlinked directly; set another curriculum as default first.
     *
     * @param courseId     The ID of the course.
     * @param curriculumId The ID of the curriculum to unlink.
     * @return The updated CourseResponse DTO.
     */
    @Transactional
    public CourseDTO.CourseResponse unlinkCurriculumFromCourse(Long courseId, Integer curriculumId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        // Prevent unlinking if only one curriculum remains
        if (course.getCurriculums().size() <= 1) {
            throw new IllegalArgumentException("A course must have at least one curriculum.");
        }

        // Require explicit default switch before unlinking current default
        if (Objects.equals(course.getDefaultCurriculumId(), curriculumId)) {
            throw new IllegalArgumentException(
                    "Default curriculum cannot be unlinked. Please set another curriculum as default first.");
        }

        Curriculum curriculumToRemove = course.getCurriculums().stream()
                .filter(c -> Objects.equals(c.getCurriculumId(), curriculumId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Curriculum with id " + curriculumId + " is not associated with course id " + courseId));

        course.getCurriculums().remove(curriculumToRemove);
        Course updatedCourse = courseRepository.save(course);

        return convertToCourseResponse(updatedCourse);
    }

    /**
     * Sets the default curriculum for a course. Only one curriculum can be default at a time.
     * @param courseId The ID of the course.
     * @param curriculumId The ID of the curriculum to set as default.
     * @return The updated CourseResponse DTO.
     */
    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public CourseDTO.CourseResponse setDefaultCurriculum(Long courseId, Integer curriculumId) {
        logger.info("Setting default curriculum {} for course: {}", curriculumId, courseId);

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        boolean found = course.getCurriculums().stream()
                .anyMatch(c -> Objects.equals(c.getCurriculumId(), curriculumId));
        if (!found) {
            throw new IllegalArgumentException("Curriculum is not linked to this course.");
        }

        if (Objects.equals(course.getDefaultCurriculumId(), curriculumId)) {
            logger.info("Curriculum {} is already the default for course: {}", curriculumId, courseId);
            return convertToCourseResponse(course);
        }

        course.setDefaultCurriculumId(curriculumId);
        Course updatedCourse = courseRepository.save(course);
        logger.info("Default curriculum updated to {} for course: {}", curriculumId, courseId);
        return convertToCourseResponse(updatedCourse);
    }

    /**
     * Updates the pricing and validity period for a specific course.
     */
    @Transactional
    public void updateCoursePricing(Long courseId, CourseDTO.PricingRequest pricingRequest) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        if (pricingRequest.getPrice() != null) {
            course.setPrice(pricingRequest.getPrice());
        }
        if (pricingRequest.getValidityInDays() != null) {
            course.setValidityInDays(pricingRequest.getValidityInDays());
        }

        courseRepository.save(course);
    }

    /**
     * Updates the publish status for a specific course.
     */
    @Transactional
    public void setPublishStatus(Long courseId, boolean isPublished) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        course.setPublished(isPublished);
        courseRepository.save(course);
    }

    @Transactional(readOnly = true)
    public CourseDTO.PricingAndPlansResponses getCoursePricingAndPlans(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        // Reuse the existing logic to get plans
        List<PaymentPlans> attachedPlans = getPlansForCourse(courseId);

        List<CourseDTO.DetailedPlanSummary> planSummaries = attachedPlans.stream().map(plan -> {
            List<PaymentPlanRule> rules = paymentPlanRuleRepository.findByPaymentPlan_PlanId(plan.getPlanId());

            List<CourseDTO.PlanRule> ruleDTOs = rules.stream().map(rule ->
                    new CourseDTO.PlanRule(
                            rule.getPaymentPlanRulesId(),
                            rule.getInstallment(),
                            rule.getWeightage(),
                            rule.getInterval()
                    )
            ).collect(Collectors.toList());

            return new CourseDTO.DetailedPlanSummary(
                    plan.getPlanId(),
                    plan.getName(),
                    ruleDTOs
            );
        }).collect(Collectors.toList());

        BatchDTO.DefaultBatchInfo defaultBatchInfo = null;
        try {
            defaultBatchInfo = batchService.getDefaultBatchForCourse(courseId);
        } catch (ResourceNotFoundException e) {
            logger.info("No default batch found for courseId {} while fetching pricing details.", courseId);
        }

        return CourseDTO.PricingAndPlansResponses.builder()
                .courseName(course.getTitle())
                .thumbnailUrl(course.getThumbnailUrl())
                .price(course.getPrice())
                .validityInDays(course.getValidityInDays())
                .isPublished(course.isPublished())
                .plans(planSummaries)
                .defaultBatch(defaultBatchInfo)
                .build();
    }

    /**
     * Helper method to convert a Course entity to a CourseResponse DTO.
     *
     * @param course The entity to convert.
     * @return The resulting DTO.
     */
    private CourseDTO.CourseResponse convertToCourseResponse(Course course) {
        List<CurriculumDTO.CurriculumResponse> curriculumResponses = course.getCurriculums()
                .stream()
                .map(curriculumService::convertToCurriculumResponse)
                .collect(Collectors.toList());

        return new CourseDTO.CourseResponse(
                course.getCourseId(),
                course.getTitle(),
                course.getPrettyName(),
                course.getDescription(),
                course.getOverview(),
                course.isArchived(),
                course.getThumbnailUrl(),
                course.getCreatedAt(),
                course.getUpdatedAt(),
                course.getDefaultCurriculumId(),
                course.getPrice(),
                curriculumResponses);
    }

    public List<CourseDTO.AllLearners> getAllLearners(Long courseId, Long batchId) {
        try{
            Optional<Course> course =courseRepository.findByCourseId(courseId);

            if(course.isEmpty()){
                throw new ResourceNotFoundException("Course not found");
            }

            List<Object[]> rows = userCourseEnrollmentRepository.findLearnersByCourseAndOptionalBatch(courseId, batchId);
            List<CourseDTO.AllLearners> learners = new ArrayList<>();

           for (Object[] row : rows) {
               CourseDTO.AllLearners dto = new CourseDTO.AllLearners();
               dto.setUserId(((Number) row[0]).longValue());
               dto.setEmail((String) row[1]);
               dto.setName((String) row[2]);
               dto.setPhoneNumber((String) row[3]);
               dto.setProgressPercentage((BigDecimal) row[4]);
               dto.setEnrolled(((Timestamp) row[5]).toLocalDateTime());
               learners.add(dto);
           }


            return learners;
        }catch (Exception e){
            throw e;
        }
    }
}
