package courses.abc.atoms.features.course.services;

import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.model.core.Profiles;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.repositories.ProfileRepository;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.core.services.AdminService;
import courses.abc.atoms.features.course.dto.BatchDTO;
import courses.abc.atoms.features.course.dto.CurriculumDTO;
import courses.abc.atoms.features.course.model.*;
import courses.abc.atoms.features.course.repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import courses.abc.atoms.core.dto.UserDTO;    
import courses.abc.atoms.core.services.UserService;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BatchService {

    private static final Logger logger = LoggerFactory.getLogger(BatchService.class);

    @Autowired private BatchRepository batchRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private CurriculumRepository curriculumRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private BatchCourseRepository batchCourseRepository;
    @Autowired private CoursePlanRepository coursePlanRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private CurriculumService curriculumService;
    @Autowired private AdminService adminService;
    @Autowired private BatchUserRepository batchUserRepository;
    @Autowired private UserService  userService; 

    @Autowired private CourseBundleRepository courseBundleRepository;
    @Autowired private BundleCourseRepository bundleCourseRepository;

    @Transactional
    public BatchDTO.BatchResponse createBatch(BatchDTO.BatchCreateRequest request, Long bundleId) {
        // Set bundleId from parameter if provided
        if (bundleId != null) {
            request.setBundleId(bundleId);
        }
        
        // Validation: Either courses or bundleId must be provided, but not both UNLESS 
        // bundleId is provided to specify which bundle and courses are provided to specify curriculum info
        if (CollectionUtils.isEmpty(request.getCourses()) && request.getBundleId() == null) {
            throw new IllegalArgumentException("A bundleId or a list of courses is required to create a batch.");
        }

        List<BatchDTO.CourseDetailRequest> coursesToProcess;
        CourseBundles bundle = null;

        if (request.getBundleId() != null) {
            // Check if the BUNDLE has a payment plan
            if (!coursePlanRepository.existsByBundle_BundleId(request.getBundleId())) {
                throw new IllegalStateException("Cannot create batch. Bundle with ID " + request.getBundleId() + " does not have a payment plan.");
            }

            bundle = courseBundleRepository.findById(request.getBundleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course Bundle not found with id: " + request.getBundleId()));

            // If courses are provided in request body along with bundleId, use them with their curriculum info
            if (!CollectionUtils.isEmpty(request.getCourses())) {
                // Validate that all provided courses exist in the bundle
                List<Long> bundleCourseIds = bundleCourseRepository.findAllByIdBundleId(bundle.getBundleId())
                        .stream()
                        .map(bundleCourse -> bundleCourse.getCourse().getCourseId())
                        .collect(Collectors.toList());
                
                for (BatchDTO.CourseDetailRequest courseDetail : request.getCourses()) {
                    if (!bundleCourseIds.contains(courseDetail.getCourseId())) {
                        throw new IllegalArgumentException("Course ID " + courseDetail.getCourseId() + " is not part of bundle ID " + request.getBundleId());
                    }
                }
                
                coursesToProcess = request.getCourses();
            } else {
                // No courses provided in request body, extract all courses from bundle
                coursesToProcess = bundleCourseRepository.findAllByIdBundleId(bundle.getBundleId()).stream()
                        .map(bundleCourse -> {
                            BatchDTO.CourseDetailRequest detail = new BatchDTO.CourseDetailRequest();
                            detail.setCourseId(bundleCourse.getCourse().getCourseId());
                            detail.setPrimary(false);
                            return detail;
                        })
                        .collect(Collectors.toList());
            }
        } else {
            // Check if each individual COURSE has a payment plan
            request.getCourses().forEach(c -> {
                if (!coursePlanRepository.existsByCourse_CourseId(c.getCourseId())) {
                    throw new IllegalStateException("Cannot create batch. Course with ID " + c.getCourseId() + " does not have a payment plan.");
                }
            });
            coursesToProcess = request.getCourses();
        }

        Users batchManager = findUserById(request.getBatchManagerId(), "Batch Manager");
        Users additionalBatchManager = request.getAdditionalBatchManagerId() != null ?
                findUserById(request.getAdditionalBatchManagerId(), "Additional Batch Manager") : null;

        Batches batch = new Batches();
        batch.setBatchName(request.getBatchName());
        batch.setStartDate(request.getStartDate());
        batch.setEndDate(request.getEndDate());
        batch.setBatchManager(batchManager);
        batch.setAdditionalBatchManager(additionalBatchManager);
        batch.setAccommodation(request.getAccommodation());

        Batches savedBatch = batchRepository.save(batch);
        Set<BatchCourse> batchCourses = createBatchCourseAssociations(savedBatch, coursesToProcess, bundle);
        savedBatch.getBatchCourses().addAll(batchCourses);


        return convertToBatchResponse(batchRepository.save(savedBatch));
    }

    @Transactional
    public BatchDTO.BatchResponse updateBatch(Long id, BatchDTO.BatchUpdateRequest request) {
        // Validation: Either courses or bundleId must be provided
        if (CollectionUtils.isEmpty(request.getCourses()) && request.getBundleId() == null) {
            throw new IllegalArgumentException("Either a bundleId or a list of courses is required to update a batch.");
        }

        Batches batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with id: " + id));

        List<BatchDTO.CourseDetailRequest> coursesToProcess;
        CourseBundles bundle = null;

        if (request.getBundleId() != null) {
            // Check if the BUNDLE has a payment plan
            if (!coursePlanRepository.existsByBundle_BundleId(request.getBundleId())) {
                throw new IllegalStateException("Cannot update batch. Bundle with ID " + request.getBundleId() + " does not have a payment plan.");
            }

            bundle = courseBundleRepository.findById(request.getBundleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course Bundle not found with id: " + request.getBundleId()));

            // If courses are provided in request body along with bundleId, use them with their curriculum info
            if (!CollectionUtils.isEmpty(request.getCourses())) {
                // Validate that all provided courses exist in the bundle
                List<Long> bundleCourseIds = bundleCourseRepository.findAllByIdBundleId(bundle.getBundleId())
                        .stream()
                        .map(bundleCourse -> bundleCourse.getCourse().getCourseId())
                        .collect(Collectors.toList());
                
                for (BatchDTO.CourseDetailRequest courseDetail : request.getCourses()) {
                    if (!bundleCourseIds.contains(courseDetail.getCourseId())) {
                        throw new IllegalArgumentException("Course ID " + courseDetail.getCourseId() + " is not part of bundle ID " + request.getBundleId());
                    }
                }
                
                coursesToProcess = request.getCourses();
            } else {
                // No courses provided in request body, extract all courses from bundle
                coursesToProcess = bundleCourseRepository.findAllByIdBundleId(bundle.getBundleId()).stream()
                        .map(bundleCourse -> {
                            BatchDTO.CourseDetailRequest detail = new BatchDTO.CourseDetailRequest();
                            detail.setCourseId(bundleCourse.getCourse().getCourseId());
                            detail.setPrimary(false);
                            return detail;
                        })
                        .collect(Collectors.toList());
            }
        } else {
            // Check if each individual COURSE has a payment plan
            request.getCourses().forEach(c -> {
                if (!coursePlanRepository.existsByCourse_CourseId(c.getCourseId())) {
                    throw new IllegalStateException("Cannot update batch. Course with ID " + c.getCourseId() + " does not have a payment plan.");
                }
            });
            coursesToProcess = request.getCourses();
        }

        Users batchManager = findUserById(request.getBatchManagerId(), "Batch Manager");
        Users additionalBatchManager = request.getAdditionalBatchManagerId() != null ?
                findUserById(request.getAdditionalBatchManagerId(), "Additional Batch Manager") : null;

        // Update batch metadata - preserve existing values if not provided in request
        if (request.getBatchName() != null && !request.getBatchName().trim().isEmpty()) {
            batch.setBatchName(request.getBatchName());
        }
        if (request.getStartDate() != null) {
            batch.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            batch.setEndDate(request.getEndDate());
        }
        if (request.getAccommodation() != null) {
            batch.setAccommodation(request.getAccommodation());
        }
        batch.setBatchManager(batchManager);
        if (additionalBatchManager != null || request.getAdditionalBatchManagerId() != null) {
            batch.setAdditionalBatchManager(additionalBatchManager);
        }

        // Smart course and curriculum management
        updateBatchCoursesAndCurriculums(batch, coursesToProcess, bundle);

        Batches updatedBatch = batchRepository.save(batch);
        return convertToBatchResponse(updatedBatch);
    }

    @Transactional
    public Batches createDefaultBatchForNewPricedCourse(Course course, Long managerId) {
        logger.info("Creating default batch for newly priced course: {}", course.getTitle());

        Users batchManager = userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("User (to be batch manager) not found with id: " + managerId));

        Batches defaultBatch = new Batches();
        defaultBatch.setBatchName(course.getTitle());
        defaultBatch.setBatchManager(batchManager);
        defaultBatch.setStatus("ACTIVE");
        defaultBatch.setAccommodation(false);
        defaultBatch.setDefault(true);

        Batches savedBatch = batchRepository.save(defaultBatch);

        // Create course detail request for processing
        BatchDTO.CourseDetailRequest courseDetail = new BatchDTO.CourseDetailRequest();
        courseDetail.setCourseId(course.getCourseId());

        if (course.getDefaultCurriculumId() != null) {
            courseDetail.setCurriculumIds(List.of(course.getDefaultCurriculumId()));
        }

        List<BatchDTO.CourseDetailRequest> coursesToProcess = List.of(courseDetail);

        // Use the same logic as createBatch to create course associations with curriculums
        Set<BatchCourse> batchCourses = createBatchCourseAssociations(savedBatch, coursesToProcess, null);
        savedBatch.getBatchCourses().addAll(batchCourses);

        logger.info("Successfully created default batch with ID {} for course ID {}", savedBatch.getBatchId(), course.getCourseId());
        return savedBatch;
    }
    
    @Transactional
    public Batches createDefaultBatchForNewPricedBundle(CourseBundles bundle, Long managerId) {
        logger.info("Creating default batch for newly priced bundle: {}", bundle.getTitle());

        Users batchManager = userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("User (to be batch manager) not found with id: " + managerId));

        // 1. Create the new Batch entity
        Batches defaultBatch = new Batches();
        defaultBatch.setBatchName(bundle.getTitle());
        defaultBatch.setBatchManager(batchManager);
        defaultBatch.setStatus("ACTIVE");
        defaultBatch.setAccommodation(false);
        defaultBatch.setDefault(true);

        Batches savedBatch = batchRepository.save(defaultBatch);

        // 2. Get all courses associated with the bundle
        List<BundleCourses> coursesInBundle = bundleCourseRepository.findAllByIdBundleId(bundle.getBundleId());
        if (coursesInBundle.isEmpty()) {
            logger.warn("Bundle ID {} has no courses to link to its default batch.", bundle.getBundleId());
            return savedBatch;
        }

        // 3. Create BatchCourse associations for each course in the bundle with their curriculums
        // Convert bundle courses to course detail requests for processing
        List<BatchDTO.CourseDetailRequest> coursesToProcess = coursesInBundle.stream()
                .map(bundleCourse -> {
                    BatchDTO.CourseDetailRequest detail = new BatchDTO.CourseDetailRequest();
                    detail.setCourseId(bundleCourse.getCourse().getCourseId());
                    return detail;
                })
                .collect(Collectors.toList());

        // Use the same logic as createBatch to create course associations with curriculums
        Set<BatchCourse> batchCourses = createBatchCourseAssociations(savedBatch, coursesToProcess, bundle);
        savedBatch.getBatchCourses().addAll(batchCourses);

        logger.info("Successfully created default batch with ID {} for bundle ID {}", savedBatch.getBatchId(), bundle.getBundleId());
        return savedBatch;
    }

    @Transactional
    public void setPrimaryDefaultBatchForCourse(Long courseId, Long batchId) {
        // 1. Verify that the target batch exists and is associated with the course.
        Batches newDefaultBatch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with id: " + batchId));

        boolean isAssociatedWithCourse = newDefaultBatch.getBatchCourses().stream()
                .anyMatch(bc -> bc.getCourse() != null && bc.getCourse().getCourseId().equals(courseId));

        if (!isAssociatedWithCourse) {
            throw new IllegalStateException(String.format("Batch %d is not associated with Course %d.", batchId, courseId));
        }

        // 2. Find and unset the current default batch for the course.
        batchRepository.findDefaultBatchForCourse(courseId).ifPresent(oldDefaultBatch -> {
            if (!oldDefaultBatch.getBatchId().equals(batchId)) {
                oldDefaultBatch.setDefault(false);
                batchRepository.save(oldDefaultBatch);
                logger.info("Unset batch {} as default for course {}.", oldDefaultBatch.getBatchId(), courseId);
            }
        });

        // 3. Set the new batch as the default.
        if (!newDefaultBatch.isDefault()) {
            newDefaultBatch.setDefault(true);
            batchRepository.save(newDefaultBatch);
            logger.info("Set batch {} as the new default for course {}.", batchId, courseId);
        }
    }

    @Transactional
    public void setPrimaryDefaultBatchForBundle(Long bundleId, Long batchId) {
        // 1. Verify that the target batch exists and is associated with the bundle.
        Batches newDefaultBatch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with id: " + batchId));

        boolean isAssociatedWithBundle = newDefaultBatch.getBatchCourses().stream()
                .anyMatch(bc -> bc.getBundle() != null && bc.getBundle().getBundleId().equals(bundleId));

        if (!isAssociatedWithBundle) {
            throw new IllegalStateException(String.format("Batch %d is not associated with Bundle %d.", batchId, bundleId));
        }

        // 2. Find and unset the current default batch for the bundle.
        batchRepository.findDefaultBatchForBundle(bundleId).ifPresent(oldDefaultBatch -> {
            if (!oldDefaultBatch.getBatchId().equals(batchId)) {
                oldDefaultBatch.setDefault(false);
                batchRepository.save(oldDefaultBatch);
                logger.info("Unset batch {} as default for bundle {}.", oldDefaultBatch.getBatchId(), bundleId);
            }
        });

        // 3. Set the new batch as the default.
        if (!newDefaultBatch.isDefault()) {
            newDefaultBatch.setDefault(true);
            batchRepository.save(newDefaultBatch);
            logger.info("Set batch {} as the new default for bundle {}.", batchId, bundleId);
        }
    }

    /**
     * Retrieves the default batch information for a given course.
     *
     * @param courseId The ID of the course.
     * @return A DTO with the default batch's ID and name.
     * @throws ResourceNotFoundException if no default batch is set for the course.
     */
    @Transactional(readOnly = true, noRollbackFor = ResourceNotFoundException.class)
    public BatchDTO.DefaultBatchInfo getDefaultBatchForCourse(Long courseId) {
        return batchRepository.findDefaultBatchForCourse(courseId)
                .map(batch -> BatchDTO.DefaultBatchInfo.builder()
                        .batchId(batch.getBatchId())
                        .batchTitle(batch.getBatchName())
                        .build())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No default batch found for course with id: " + courseId
                ));
    }

    /**
     * Retrieves the default batch information for a given bundle.
     *
     * @param bundleId The ID of the course bundle.
     * @return A DTO with the default batch's ID and name.
     * @throws ResourceNotFoundException if no default batch is set for the bundle.
     */
    @Transactional(readOnly = true)
    public BatchDTO.DefaultBatchInfo getDefaultBatchForBundle(Long bundleId) {
        return batchRepository.findDefaultBatchForBundle(bundleId)
                .map(batch -> BatchDTO.DefaultBatchInfo.builder()
                        .batchId(batch.getBatchId())
                        .batchTitle(batch.getBatchName())
                        .build())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No default batch found for bundle with id: " + bundleId
                ));
    }

    @Transactional(readOnly = true)
    public Page<BatchDTO.BatchResponse> getAllBatches(String status, Pageable pageable) {
        Page<Batches> batchPage = StringUtils.hasText(status) ?
                batchRepository.findByStatus(status.toUpperCase(), pageable) :
                batchRepository.findAll(pageable);
        return batchPage.map(this::convertToBatchResponse);
    }
    
    @Transactional(readOnly = true)
    public BatchDTO.BatchResponse getBatchById(Long id) {
        Batches batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with id: " + id));
        return convertToBatchResponse(batch);
    }

    @Transactional
    public BatchDTO.BatchResponse updateBatchStatus(Long id, BatchDTO.BatchStatusUpdateRequest request) {
        Batches batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with id: " + id));
        batch.setStatus(request.getStatus().toUpperCase());
        Batches updatedBatch = batchRepository.save(batch);
        return convertToBatchResponse(updatedBatch);
    }

    @Transactional
    public void deleteBatch(Long id) {
        if (!batchRepository.existsById(id)) {
            throw new ResourceNotFoundException("Batch not found with id: " + id);
        }
        batchRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<BatchDTO.BatchResponse> getBatchesByCourseId(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found with id: " + courseId);
        }
        List<Batches> batches = batchRepository.findBatchesByCourseId(courseId);
        return batches.stream()
                .map(this::convertToBatchResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BatchDTO.ManagerResponse> findPotentialBatchManagers() {
        return adminService.getAdminsAndInstructors().stream()
                .map(user -> BatchDTO.ManagerResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .build())
                .collect(Collectors.toList());
    }

    private Set<BatchCourse> createBatchCourseAssociations(Batches batch, List<BatchDTO.CourseDetailRequest> courseDetails, CourseBundles bundle) {
        Set<BatchCourse> batchCourses = new HashSet<>();
        for (BatchDTO.CourseDetailRequest detail : courseDetails) {
            Course course = findCourseById(detail.getCourseId());

            Set<Integer> curriculumIdsToProcess = new HashSet<>();
            if (detail.getCurriculumIds() != null) {
                curriculumIdsToProcess.addAll(detail.getCurriculumIds());
            }

            // if (course.getDefaultCurriculum() != null) {
            //     curriculumIdsToProcess.add(course.getDefaultCurriculum().getCurriculumId());
            // }

            if (curriculumIdsToProcess.isEmpty()) {
                batchCourses.add(buildBatchCourse(batch, course, null, detail.isPrimary(), bundle));
            } else {
                List<Curriculum> curriculums = curriculumRepository.findAllById(curriculumIdsToProcess);
                if (curriculums.size() != curriculumIdsToProcess.size()) {
                    throw new ResourceNotFoundException("One or more curriculums not found for course " + course.getTitle());
                }
                for (Curriculum curriculum : curriculums) {
                    batchCourses.add(buildBatchCourse(batch, course, curriculum, detail.isPrimary(), bundle));
                }
            }
        }
        return batchCourses;
    }

    private BatchCourse buildBatchCourse(Batches batch, Course course, Curriculum curriculum, boolean isPrimary, CourseBundles bundle) {
        if (isPrimary) {
            batchCourseRepository.findPrimaryByCourseId(course.getCourseId()).ifPresent(oldPrimary -> {
                if (!oldPrimary.getBatch().getBatchId().equals(batch.getBatchId())) {
                    oldPrimary.setPrimaryForCourse(false);
                    batchCourseRepository.save(oldPrimary);
                }
            });
        }
        return BatchCourse.builder()
                .batch(batch)
                .course(course)
                .curriculum(curriculum)
                .primaryForCourse(isPrimary)
                .bundle(bundle) 
                .build();
    }


    @Transactional(readOnly = true)
    public List<BatchDTO.BatchResponse> getBatchesByBundleId(Long bundleId) {
    List<Batches> batches = batchRepository.findByCourseBundle_BundleId(bundleId);
    return batches.stream()
        .map(this::convertToBatchResponse)
        .collect(Collectors.toList());
    }

    /**
     * Intelligently updates batch courses and curriculums by comparing current state with requested state.
     * This method handles:
     * - Adding new courses to the batch
     * - Removing courses from the batch
     * - Adding new curriculums to existing courses
     * - Removing curriculums from existing courses
     * - Updating primary status for courses
     */
    @Transactional
    public void updateBatchCoursesAndCurriculums(Batches batch, List<BatchDTO.CourseDetailRequest> newCourseDetails, CourseBundles bundle) {
        // Get current state
        Set<BatchCourse> currentBatchCourses = new HashSet<>(batch.getBatchCourses());
        
        // Maps for easier comparison
        Map<Long, List<BatchCourse>> currentCourseMap = currentBatchCourses.stream()
                .collect(Collectors.groupingBy(bc -> bc.getCourse().getCourseId()));
        
        Map<Long, BatchDTO.CourseDetailRequest> newCourseMap = newCourseDetails.stream()
                .collect(Collectors.toMap(
                    BatchDTO.CourseDetailRequest::getCourseId,
                    detail -> detail,
                    (existing, replacement) -> replacement // In case of duplicates, keep the last one
                ));

        Set<Long> currentCourseIds = currentCourseMap.keySet();
        Set<Long> newCourseIds = newCourseMap.keySet();

        // 1. REMOVE COURSES that are no longer in the request
        Set<Long> coursesToRemove = new HashSet<>(currentCourseIds);
        coursesToRemove.removeAll(newCourseIds);
        
        for (Long courseIdToRemove : coursesToRemove) {
            batch.getBatchCourses().removeIf(bc -> bc.getCourse().getCourseId().equals(courseIdToRemove));
            batchCourseRepository.deleteByBatchAndCourses(batch.getBatchId(), List.of(courseIdToRemove));
            logger.info("Removed course ID {} from batch ID {}", courseIdToRemove, batch.getBatchId());
        }

        // 2. ADD NEW COURSES that are in the request but not currently in batch
        Set<Long> coursesToAdd = new HashSet<>(newCourseIds);
        coursesToAdd.removeAll(currentCourseIds);
        
        for (Long courseIdToAdd : coursesToAdd) {
            BatchDTO.CourseDetailRequest courseDetail = newCourseMap.get(courseIdToAdd);
            Course course = findCourseById(courseIdToAdd);
            
            // Validate course has payment plan
            if (!coursePlanRepository.existsByCourse_CourseId(courseIdToAdd)) {
                throw new IllegalStateException("Cannot add course to batch. Course with ID " + courseIdToAdd + " does not have a payment plan.");
            }
            
            // If batch is associated with a bundle, validate course belongs to that bundle
            if (bundle != null) {
                List<Long> bundleCourseIds = bundleCourseRepository.findAllByIdBundleId(bundle.getBundleId())
                        .stream()
                        .map(bundleCourse -> bundleCourse.getCourse().getCourseId())
                        .collect(Collectors.toList());
                        
                if (!bundleCourseIds.contains(courseIdToAdd)) {
                    throw new IllegalArgumentException("Course ID " + courseIdToAdd + " is not part of bundle ID " + bundle.getBundleId());
                }
            }
            
            // Create batch course associations for this new course
            Set<Integer> curriculumIdsToProcess = new HashSet<>();
            if (courseDetail.getCurriculumIds() != null) {
                curriculumIdsToProcess.addAll(courseDetail.getCurriculumIds());
            }
            
            // if (course.getDefaultCurriculum() != null) {
            //     curriculumIdsToProcess.add(course.getDefaultCurriculum().getCurriculumId());
            // }
            
            if (curriculumIdsToProcess.isEmpty()) {
                BatchCourse newBatchCourse = buildBatchCourse(batch, course, null, courseDetail.isPrimary(), bundle);
                batch.getBatchCourses().add(newBatchCourse);
            } else {
                List<Curriculum> curriculums = curriculumRepository.findAllById(curriculumIdsToProcess);
                if (curriculums.size() != curriculumIdsToProcess.size()) {
                    throw new ResourceNotFoundException("One or more curriculums not found for course " + course.getTitle());
                }
                for (Curriculum curriculum : curriculums) {
                    BatchCourse newBatchCourse = buildBatchCourse(batch, course, curriculum, courseDetail.isPrimary(), bundle);
                    batch.getBatchCourses().add(newBatchCourse);
                }
            }
            
            logger.info("Added course ID {} to batch ID {}", courseIdToAdd, batch.getBatchId());
        }

        // 3. UPDATE EXISTING COURSES (handle curriculum changes and primary status changes)
        Set<Long> coursesToUpdate = new HashSet<>(currentCourseIds);
        coursesToUpdate.retainAll(newCourseIds); // Keep only courses that exist in both current and new state
        
        for (Long courseIdToUpdate : coursesToUpdate) {
            BatchDTO.CourseDetailRequest newCourseDetail = newCourseMap.get(courseIdToUpdate);
            List<BatchCourse> currentCourseBatchCourses = currentCourseMap.get(courseIdToUpdate);
            Course course = findCourseById(courseIdToUpdate);
            
            // Get current curriculums for this course
            Set<Integer> currentCurriculumIds = currentCourseBatchCourses.stream()
                    .map(bc -> bc.getCurriculum() != null ? bc.getCurriculum().getCurriculumId() : null)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            
            // Get new curriculums for this course
            Set<Integer> newCurriculumIds = new HashSet<>();
            if (newCourseDetail.getCurriculumIds() != null) {
                newCurriculumIds.addAll(newCourseDetail.getCurriculumIds());
            }
            // if (course.getDefaultCurriculum() != null) {
            //     newCurriculumIds.add(course.getDefaultCurriculum().getCurriculumId());
            // }
            
            // Handle case where no specific curriculums are provided (should have one entry with null curriculum)
            if (newCurriculumIds.isEmpty()) {
                // Remove all curriculum-specific entries and add one null curriculum entry
                batch.getBatchCourses().removeIf(bc -> 
                    bc.getCourse().getCourseId().equals(courseIdToUpdate));
                batchCourseRepository.deleteByBatchAndCourses(batch.getBatchId(), List.of(courseIdToUpdate));
                
                BatchCourse newBatchCourse = buildBatchCourse(batch, course, null, newCourseDetail.isPrimary(), bundle);
                batch.getBatchCourses().add(newBatchCourse);
            } else {
                // REMOVE curriculums that are no longer needed
                Set<Integer> curriculumsToRemove = new HashSet<>(currentCurriculumIds);
                curriculumsToRemove.removeAll(newCurriculumIds);
                
                for (Integer curriculumIdToRemove : curriculumsToRemove) {
                    batch.getBatchCourses().removeIf(bc -> 
                        bc.getCourse().getCourseId().equals(courseIdToUpdate) && 
                        bc.getCurriculum() != null && 
                        bc.getCurriculum().getCurriculumId().equals(curriculumIdToRemove));
                }
                
                // Remove from database if any curriculums to remove
                if (!curriculumsToRemove.isEmpty()) {
                    batchCourseRepository.deleteByCurriculums(batch.getBatchId(), courseIdToUpdate, new ArrayList<>(curriculumsToRemove));
                }
                
                // ADD new curriculums
                Set<Integer> curriculumsToAdd = new HashSet<>(newCurriculumIds);
                curriculumsToAdd.removeAll(currentCurriculumIds);
                
                for (Integer curriculumIdToAdd : curriculumsToAdd) {
                    Curriculum curriculum = curriculumRepository.findById(curriculumIdToAdd)
                            .orElseThrow(() -> new ResourceNotFoundException("Curriculum not found with id: " + curriculumIdToAdd));
                    
                    BatchCourse newBatchCourse = buildBatchCourse(batch, course, curriculum, newCourseDetail.isPrimary(), bundle);
                    batch.getBatchCourses().add(newBatchCourse);
                }
                
                // UPDATE primary status for existing entries
                for (BatchCourse existingBatchCourse : currentCourseBatchCourses) {
                    if (newCurriculumIds.contains(
                        existingBatchCourse.getCurriculum() != null ? existingBatchCourse.getCurriculum().getCurriculumId() : null) ||
                        (existingBatchCourse.getCurriculum() == null && newCurriculumIds.isEmpty())) {
                        
                        existingBatchCourse.setPrimaryForCourse(newCourseDetail.isPrimary());
                        batchCourseRepository.save(existingBatchCourse);
                    }
                }
            }
            
            logger.info("Updated course ID {} in batch ID {}", courseIdToUpdate, batch.getBatchId());
        }
    }

    private Users findUserById(Long userId, String userRole) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(userRole + " (User) not found with id: " + userId));
    }

    private Course findCourseById(Long courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));
    }

    private BatchDTO.ManagerResponse convertUserToManagerResponse(Users user) {
        if (user == null) return null;
        String name = profileRepository.findByUserId(user.getId())
                .map(Profiles::getName)
                .orElse(user.getEmail());
        return BatchDTO.ManagerResponse.builder().id(user.getId()).name(name).build();
    }

    private BatchDTO.BatchResponse convertToBatchResponse(Batches batch) {
        long learnersCount = batchUserRepository.countByBatch_BatchId(batch.getBatchId());
        BatchDTO.ManagerResponse managerResponse = convertUserToManagerResponse(batch.getBatchManager());
        BatchDTO.ManagerResponse additionalManagerResponse = convertUserToManagerResponse(batch.getAdditionalBatchManager());

        Map<Course, List<Curriculum>> courseCurriculumMap = batch.getBatchCourses().stream()
                .filter(bc -> bc.getCourse() != null)
                .collect(Collectors.groupingBy(
                        BatchCourse::getCourse,
                        Collectors.mapping(BatchCourse::getCurriculum, Collectors.toList())
                ));

        Map<Long, Boolean> coursePrimaryStatusMap = batch.getBatchCourses().stream()
                .filter(bc -> bc.getCourse() != null)
                .collect(Collectors.toMap(
                        bc -> bc.getCourse().getCourseId(),
                        BatchCourse::isPrimaryForCourse,
                        (existing, replacement) -> existing || replacement
                ));

        List<BatchDTO.CourseDetailResponse> courseDetailResponses = courseCurriculumMap.entrySet().stream()
                .map(entry -> {
                    Course course = entry.getKey();
                    List<Curriculum> curriculums = entry.getValue().stream().filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    List<CurriculumDTO.CurriculumResponse> curriculumResponses = curriculums.stream()
                            .map(curriculumService::convertToCurriculumResponse)
                            .collect(Collectors.toList());

                    return BatchDTO.CourseDetailResponse.builder()
                            .courseId(course.getCourseId())
                            .courseName(course.getTitle())
                            .isPrimary(coursePrimaryStatusMap.getOrDefault(course.getCourseId(), false))
                            .curriculums(curriculumResponses)
                            .build();
                })
                .sorted(Comparator.comparing(BatchDTO.CourseDetailResponse::getCourseName))
                .collect(Collectors.toList());

        BatchDTO.BundleResponse bundleResponse = batch.getBatchCourses().stream()
                .map(BatchCourse::getBundle)
                .filter(Objects::nonNull)
                .findFirst()
                .map(bundle -> BatchDTO.BundleResponse.builder()
                        .bundleId(bundle.getBundleId())
                        .bundleName(bundle.getTitle())
                        .build())
                .orElse(null);

        return BatchDTO.BatchResponse.builder()
                .batchId(batch.getBatchId())
                .batchName(batch.getBatchName())
                .startDate(batch.getStartDate())
                .endDate(batch.getEndDate())
                .status(batch.getStatus())
                .accommodation(batch.getAccommodation())
                .learnersCount(learnersCount)
                .batchManager(managerResponse)
                .additionalBatchManager(additionalManagerResponse)
                .courses(courseDetailResponses)
                .bundle(bundleResponse)
                .isDefault(batch.isDefault())
                .build();
    }


}