package courses.abc.atoms.features.course.services;

import courses.abc.atoms.core.dto.UserDTO;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.core.services.UserService;
import courses.abc.atoms.features.course.controllers.CourseBundleController;
import courses.abc.atoms.features.course.dto.BatchDTO;
import courses.abc.atoms.features.course.dto.CourseDTO;
import courses.abc.atoms.features.course.model.CoursePlan;
import courses.abc.atoms.features.course.repositories.CoursePlanRepository;
import courses.abc.atoms.features.payment.model.PaymentPlanRule;
import courses.abc.atoms.features.payment.model.PaymentPlans;
import courses.abc.atoms.features.payment.repositories.PaymentPlanRepository;
import courses.abc.atoms.features.payment.repositories.PaymentPlanRuleRepository;
import org.slf4j.ILoggerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import courses.abc.atoms.features.course.dto.CourseDTO;
import courses.abc.atoms.features.course.repositories.CourseBundleRepository;
import courses.abc.atoms.features.course.repositories.BundleCourseRepository;
import courses.abc.atoms.features.course.repositories.CourseRepository;
import courses.abc.atoms.features.course.model.BundleCourses;
import org.springframework.transaction.annotation.Transactional;
import courses.abc.atoms.features.course.dto.CourseBundleDTO;

import courses.abc.atoms.features.course.model.CourseBundles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.List;

import courses.abc.atoms.features.course.model.Course;

@Service
public class CourseBundleService {

    private static final Logger logger = LoggerFactory.getLogger(CourseBundleService.class);

    @Autowired
    private CourseBundleRepository courseBundleRepository;

    @Autowired
    private BundleCourseRepository bundleCourseRepository;

    @Autowired
    private CourseRepository courseRepository;

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
    private CourseService courseService;

    @Autowired
    private PaymentPlanRuleRepository paymentPlanRuleRepository;

    public CourseBundleDTO.CourseBundleResponseDTO createCourseBundle(CourseBundleDTO.CourseBundleRequestDTO request) {
        try {
            // Create new CourseBundles entity
            CourseBundles courseBundle = new CourseBundles();
            courseBundle.setTitle(request.getTitle());
            courseBundle.setDescription(request.getDescription());
            courseBundle.setValidityInDays(request.getValidityInDays());
            // Convert String to BigDecimal for price
            courseBundle.setPrice(request.getPrice() != null ? new BigDecimal(request.getPrice()) : null);
            courseBundle.setDiscountPercentage(request.getDiscountPercentage() != null ? new BigDecimal(request.getDiscountPercentage()) : null);
            courseBundle.setIsFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : false);
            courseBundle.setIsArchived(false); // Default to not archived
            // Convert String to Integer for enrollmentLimit
            courseBundle.setEnrollmentLimit(request.getEnrollmentLimit() != null ? Integer.valueOf(request.getEnrollmentLimit()) : null);
            courseBundle.setCreatedAt(LocalDateTime.now());
            courseBundle.setUpdatedAt(LocalDateTime.now());
            courseBundle.setIsPublished(true); // Default to not published
            // Convert String to LocalDateTime for dates
            DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
            courseBundle.setEnrollmentStartDate(request.getEnrollmentStartDate() != null ? LocalDateTime.parse(request.getEnrollmentStartDate(), formatter) : null);
            courseBundle.setEnrollmentEndDate(request.getEnrollmentEndDate() != null ? LocalDateTime.parse(request.getEnrollmentEndDate(), formatter) : null);
            // Convert MultipartFile to byte[]
            if (request.getThumbnailImage() != null && !request.getThumbnailImage().isEmpty()) {
                try {
                    courseBundle.setThumbnailImage(request.getThumbnailImage().getBytes());
                } catch (Exception e) {
                    throw new RuntimeException("Failed to process thumbnail image", e);
                }
            }

            // Save to database
            courseBundleRepository.save(courseBundle);

            // Create response
            CourseBundleDTO.CourseBundleResponseDTO response = new CourseBundleDTO.CourseBundleResponseDTO();
            response.setBundleId(courseBundle.getBundleId());
            response.setTitle(courseBundle.getTitle());
            response.setPrice(courseBundle.getPrice());
            response.setThumbnailImage(courseBundle.getThumbnailImage());
            response.setDescription(courseBundle.getDescription());
            response.setEnrollmentLimit(courseBundle.getEnrollmentLimit());
            response.setEnrollmentStartDate(courseBundle.getEnrollmentStartDate());
            response.setEnrollmentEndDate(courseBundle.getEnrollmentEndDate());
            response.setDiscountPercentage(request.getDiscountPercentage() != null ? new BigDecimal(request.getDiscountPercentage()) : null);
            response.setIsFeatured(request.getIsFeatured());
            response.setIsArchived(courseBundle.getIsArchived());
            response.setCreatedAt(courseBundle.getCreatedAt());
            response.setUpdatedAt(courseBundle.getUpdatedAt());
            response.setIsPublished(courseBundle.getIsPublished());
            response.setValidityInDays(courseBundle.getValidityInDays());
            

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create course bundle", e);
        }
    }

    @Transactional
    public CourseBundleDTO.CourseBundleResponseDTO updateCourseBundle(Long bundleId, CourseBundleDTO.UpdateCourseBundleRequestDTO request) {
        CourseBundles courseBundle = courseBundleRepository.findById(bundleId)
                .orElseThrow(() -> new ResourceNotFoundException("Bundle not found with id: " + bundleId));

        // Update fields if they are provided in the request
        if (request.getTitle() != null) {
            courseBundle.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            courseBundle.setDescription(request.getDescription());
        }
        if (request.getValidityInDays() != null) {
            courseBundle.setValidityInDays(request.getValidityInDays());
        }
        if (request.getPrice() != null) {
            courseBundle.setPrice(new BigDecimal(request.getPrice()));
        }
        if (request.getDiscountPercentage() != null) {
            courseBundle.setDiscountPercentage(new BigDecimal(request.getDiscountPercentage()));
        }
        if (request.getIsFeatured() != null) {
            courseBundle.setIsFeatured(request.getIsFeatured());
        }
        if (request.getEnrollmentLimit() != null) {
            courseBundle.setEnrollmentLimit(Integer.valueOf(request.getEnrollmentLimit()));
        }

        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        if (request.getEnrollmentStartDate() != null) {
            courseBundle.setEnrollmentStartDate(LocalDateTime.parse(request.getEnrollmentStartDate(), formatter));
        }
        if (request.getEnrollmentEndDate() != null) {
            courseBundle.setEnrollmentEndDate(LocalDateTime.parse(request.getEnrollmentEndDate(), formatter));
        }

        if (request.getThumbnailImage() != null && !request.getThumbnailImage().isEmpty()) {
            try {
                courseBundle.setThumbnailImage(request.getThumbnailImage().getBytes());
            } catch (Exception e) {
                throw new RuntimeException("Failed to process thumbnail image", e);
            }
        }

        courseBundle.setUpdatedAt(LocalDateTime.now());

        CourseBundles updatedBundle = courseBundleRepository.save(courseBundle);

        return convertToResponseDTO(updatedBundle);
    }

    @Transactional
    public List<CourseBundleDTO.CourseBundleResponseDTO> getAllBundles() {
        try {
            List<CourseBundles> courseBundles = courseBundleRepository.findAll();
           
            return courseBundles.stream().map(bundle -> {
                CourseBundleDTO.CourseBundleResponseDTO response = new CourseBundleDTO.CourseBundleResponseDTO();
                List<CourseDTO.CourseResponse> courses = courseService.getCoursesByBundleId(bundle.getBundleId());
                response.setBundleId(bundle.getBundleId());
                response.setTitle(bundle.getTitle());
                response.setDescription(bundle.getDescription());
                response.setThumbnailImage(bundle.getThumbnailImage());
                response.setPrice(bundle.getPrice());
                response.setEnrollmentLimit(bundle.getEnrollmentLimit());
                response.setEnrollmentStartDate(bundle.getEnrollmentStartDate());
                response.setEnrollmentEndDate(bundle.getEnrollmentEndDate());
                response.setDiscountPercentage(bundle.getDiscountPercentage());
                response.setIsFeatured(bundle.getIsFeatured());
                response.setIsArchived(bundle.getIsArchived());
                response.setCreatedAt(bundle.getCreatedAt());
                response.setUpdatedAt(bundle.getUpdatedAt());
                response.setIsPublished(bundle.getIsPublished());
                response.setCourses(courses);
                response.setValidityInDays(bundle.getValidityInDays());
                return response;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Failed to retrieve all course bundles", e);
        }
    }

    @Transactional
    public CourseBundleDTO.CourseBundleResponseDTO getBundleById(Long bundleId) {
        try {
            CourseBundles courseBundle = courseBundleRepository.findByBundleId(bundleId)
                    .orElseThrow(() -> new IllegalArgumentException("Bundle not found with ID: " + bundleId));

            CourseBundleDTO.CourseBundleResponseDTO response = new CourseBundleDTO.CourseBundleResponseDTO();
            List<CourseDTO.CourseResponse> courses = courseService.getCoursesByBundleId(courseBundle.getBundleId());
  
            response.setBundleId(courseBundle.getBundleId());
            response.setTitle(courseBundle.getTitle());
            response.setDescription(courseBundle.getDescription());
            response.setThumbnailImage(courseBundle.getThumbnailImage());
            response.setPrice(courseBundle.getPrice());
            response.setEnrollmentLimit(courseBundle.getEnrollmentLimit());
            response.setEnrollmentStartDate(courseBundle.getEnrollmentStartDate());
            response.setEnrollmentEndDate(courseBundle.getEnrollmentEndDate());
            response.setDiscountPercentage(courseBundle.getDiscountPercentage());
            response.setIsFeatured(courseBundle.getIsFeatured());
            response.setIsArchived(courseBundle.getIsArchived());
            response.setCreatedAt(courseBundle.getCreatedAt());
            response.setUpdatedAt(courseBundle.getUpdatedAt());
            response.setIsPublished(courseBundle.getIsPublished());
            response.setCourses(courses);
            response.setValidityInDays(courseBundle.getValidityInDays());

            return response;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to retrieve course bundle with ID: " + bundleId, e);
        }
    }

    @Transactional
    public Map<String, Object> linkCourseToBundle(CourseBundleDTO.LinkCourseToBundleDTO request) {
        try {
            // Validate bundleId and courseId
            if (request.getBundleId() == null || request.getCourseId() == null) {
                throw new IllegalArgumentException("Course ID and Bundle ID must not be null");
            }

            // Check if bundle exists
            CourseBundles courseBundle = courseBundleRepository.findByBundleId(request.getBundleId())
                    .orElseThrow(() -> new IllegalArgumentException("Bundle not found with ID: " + request.getBundleId()));
            
            Course course = courseRepository.findByCourseId(request.getCourseId())
                .orElseThrow(() -> new IllegalArgumentException("Course not found with ID: " + request.getCourseId()));

            // Check if course is already linked to bundle
            Optional<BundleCourses> existingBundleCourse = bundleCourseRepository.findByIdBundleIdAndIdCourseId(
                    request.getBundleId(), request.getCourseId());
            if (existingBundleCourse.isPresent()) {
                throw new IllegalArgumentException("Course ID " + request.getCourseId() + " is already linked to Bundle ID " + request.getBundleId());
            }

            // Create new BundleCourses entry
            BundleCourses bundleCourse = new BundleCourses();
            bundleCourse.setId(new BundleCourses.BundleCoursesId(request.getBundleId(), request.getCourseId()));
            bundleCourse.setBundle(courseBundle);
            bundleCourse.setCourse(course); // Set the course property
            bundleCourse.setSequenceOrder(0); 

            // Save the link
            bundleCourseRepository.save(bundleCourse);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Course ID " + request.getCourseId() + " linked to Bundle ID " + request.getBundleId() + " successfully");
            return response;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to link course to bundle", e);
        }
    }

    @Transactional
    public Map<String, Object> unlinkCourseToBundle(CourseBundleDTO.LinkCourseToBundleDTO request) {
        try {
            // Check if course is already linked to bundle
            Optional<BundleCourses> existingBundleCourse = bundleCourseRepository.findByIdBundleIdAndIdCourseId(
                    request.getBundleId(), request.getCourseId());
            if (!existingBundleCourse.isPresent()) {
                throw new IllegalArgumentException("Course ID " + request.getCourseId() + " is not linked to Bundle ID " + request.getBundleId());
            }

            // Save the link
            bundleCourseRepository.delete(existingBundleCourse.get());

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Course ID " + request.getCourseId() + " unlinked from Bundle ID " + request.getBundleId() + " successfully");
            return response;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to unlink course from bundle", e);
        }
    }

    @Transactional
    public Map<String, Object> archiveBundle(Long bundleId) {
        try {
            // Check if bundle exists
            CourseBundles courseBundle = courseBundleRepository.findByBundleId(bundleId)
                    .orElseThrow(() -> new IllegalArgumentException("Bundle not found with ID: " + bundleId));

            // Archive the bundle by setting a flag or removing it from active lists
            courseBundle.setIsArchived(true); // Assuming you have an 'archived' field in CourseBundles

            // Save the updated bundle
            courseBundleRepository.save(courseBundle);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Bundle ID " + bundleId + " archived successfully");
            return response;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to archive bundle with ID: " + bundleId, e);
        }
    }

    @Transactional
    public Map<String, Object> unarchiveBundle(Long bundleId) {
        try {
            // Check if bundle exists
            CourseBundles courseBundle = courseBundleRepository.findByBundleId(bundleId)
                    .orElseThrow(() -> new IllegalArgumentException("Bundle not found with ID: " + bundleId));

            // Archive the bundle by setting a flag or removing it from active lists
            courseBundle.setIsArchived(false); // Assuming you have an 'archived' field in CourseBundles

            // Save the updated bundle
            courseBundleRepository.save(courseBundle);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Bundle ID " + bundleId + " unarchived successfully");
            return response;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to unarchive bundle with ID: " + bundleId, e);
        }
    }

    @Transactional
    public void addPlanToBundle(Long bundleId, Long planId) {
        logger.debug("Attempting to link plan ID {} to bundle ID {}", planId, bundleId);

        // 1. Check if the bundle contains at least one course.
        if (!bundleCourseRepository.existsById_BundleId(bundleId)) {
            throw new IllegalStateException("Cannot add a plan to an empty bundle. Please add at least one course to the bundle first.");
        }

        if (coursePlanRepository.existsByBundle_BundleIdAndPlan_PlanId(bundleId, planId)) {
            throw new IllegalStateException("This payment plan is already attached to the bundle.");
        }

        CourseBundles bundle = courseBundleRepository.findById(bundleId)
                .orElseThrow(() -> new ResourceNotFoundException("Bundle not found with id: " + bundleId));

        PaymentPlans plan = paymentPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment Plan not found with id: " + planId));

        // Check if this is the first plan for the bundle
        boolean isFirstPlan = !coursePlanRepository.existsByBundle_BundleId(bundleId);

        // Create and save the new association in the course_plans table
        CoursePlan coursePlan = new CoursePlan();
        coursePlan.setBundle(bundle);
        coursePlan.setPlan(plan);
        coursePlanRepository.save(coursePlan);
        logger.info("Successfully linked plan ID {} to bundle ID {}", planId, bundleId);

        // If it's the first plan, trigger default batch creation
        if (isFirstPlan) {
            logger.info("This is the first payment plan for bundle ID {}. Triggering default batch creation.", bundleId);

            UserDTO.UserResponse currentUserDto = userService.getCurrentUser();
            Users currentUser = userRepository.findById(currentUserDto.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Current user not found with id: " + currentUserDto.getId()));

            batchService.createDefaultBatchForNewPricedBundle(bundle, currentUser.getId());
        }
    }

    public List<PaymentPlans> getPlansForBundle(Long bundleId) {
        if (!courseBundleRepository.existsById(bundleId)) {
            throw new ResourceNotFoundException("Bundle not found with id: " + bundleId);
        }
        List<CoursePlan> coursePlans = coursePlanRepository.findByBundle_BundleId(bundleId);

        return coursePlans.stream()
                .map(CoursePlan::getPlan)
                .collect(Collectors.toList());
    }

    /**
     * update the pricing and validity for a specific bundle.
     */
    @Transactional
    public CourseBundleDTO.CourseBundleResponseDTO updateBundlePricing(Long bundleId, CourseBundleDTO.PricingRequest pricingRequest) {
        CourseBundles bundle = courseBundleRepository.findById(bundleId)
                .orElseThrow(() -> new ResourceNotFoundException("Bundle not found with id: " + bundleId));

        if (pricingRequest.getPrice() != null) {
            bundle.setPrice(pricingRequest.getPrice());
        }
        if (pricingRequest.getValidityInDays() != null) {
            bundle.setValidityInDays(pricingRequest.getValidityInDays());
        }

        CourseBundles updatedBundle = courseBundleRepository.save(bundle);
        return convertToResponseDTO(updatedBundle);
    }

    /**
     * update the publish status for a specific bundle.
     */
    @Transactional
    public CourseBundleDTO.CourseBundleResponseDTO setBundlePublishStatus(Long bundleId, boolean isPublished) {
        CourseBundles bundle = courseBundleRepository.findById(bundleId)
                .orElseThrow(() -> new ResourceNotFoundException("Bundle not found with id: " + bundleId));

        bundle.setIsPublished(isPublished);
        CourseBundles updatedBundle = courseBundleRepository.save(bundle);
        return convertToResponseDTO(updatedBundle);
    }

    @Transactional(readOnly = true)
    public  CourseDTO.PricingAndPlansResponses  getBundlePricingAndPlans(Long bundleId) {
        CourseBundles bundle = courseBundleRepository.findById(bundleId)
                .orElseThrow(() -> new ResourceNotFoundException("Bundle not found with id: " + bundleId));

        List<PaymentPlans> attachedPlans = getPlansForBundle(bundleId);

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
            defaultBatchInfo = batchService.getDefaultBatchForBundle(bundleId);
        } catch (ResourceNotFoundException e) {
            logger.info("No default batch found for bundleId {} while fetching pricing details.", bundleId);
        }

        return CourseDTO.PricingAndPlansResponses.builder()
                .courseName(bundle.getTitle())
                .thumbnailUrl(null)
                .price(bundle.getPrice())
                .validityInDays(bundle.getValidityInDays())
                .isPublished(bundle.getIsPublished())
                .plans(planSummaries)
                .defaultBatch(defaultBatchInfo)
                .build();
    }


    private CourseBundleDTO.CourseBundleResponseDTO convertToResponseDTO(CourseBundles bundle) {
        CourseBundleDTO.CourseBundleResponseDTO response = new CourseBundleDTO.CourseBundleResponseDTO();
        response.setBundleId(bundle.getBundleId());
        response.setTitle(bundle.getTitle());
        response.setDescription(bundle.getDescription());
        response.setThumbnailImage(bundle.getThumbnailImage());
        response.setPrice(bundle.getPrice());
        response.setEnrollmentLimit(bundle.getEnrollmentLimit());
        response.setEnrollmentStartDate(bundle.getEnrollmentStartDate());
        response.setEnrollmentEndDate(bundle.getEnrollmentEndDate());
        response.setDiscountPercentage(bundle.getDiscountPercentage());
        response.setIsFeatured(bundle.getIsFeatured());
        response.setIsArchived(bundle.getIsArchived());
        response.setCreatedAt(bundle.getCreatedAt());
        response.setUpdatedAt(bundle.getUpdatedAt());
        response.setIsPublished(bundle.getIsPublished());
        response.setValidityInDays(bundle.getValidityInDays());
        return response;
    }
}