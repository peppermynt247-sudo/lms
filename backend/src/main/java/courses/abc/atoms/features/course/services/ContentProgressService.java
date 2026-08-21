package courses.abc.atoms.features.course.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import courses.abc.atoms.features.course.model.CourseBundles;
import courses.abc.atoms.features.course.model.Batches;
import courses.abc.atoms.features.course.repositories.BatchUserRepository;
import courses.abc.atoms.features.student.model.UserBundleProgress;
import courses.abc.atoms.features.student.repositories.UserBundleProgressRepository;

import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.features.course.model.Course;
import courses.abc.atoms.features.course.dto.ContentProgressDTO;
import courses.abc.atoms.features.course.model.ContentItem;
import courses.abc.atoms.features.course.model.ContentProgress;
import courses.abc.atoms.features.course.model.CurriculumSection;
import courses.abc.atoms.features.course.model.Curriculum;
import courses.abc.atoms.features.course.repositories.ContentProgressRepository;
import courses.abc.atoms.features.course.repositories.ContentItemRepository;
import courses.abc.atoms.features.course.repositories.CurriculumSectionsRepository;
import courses.abc.atoms.features.student.enums.StatusType;
import courses.abc.atoms.features.student.model.UserSectionProgress;
import courses.abc.atoms.features.student.model.UserCurriculumProgress;
import courses.abc.atoms.features.student.repositories.UserSectionProgressRepository;
import courses.abc.atoms.features.student.repositories.UserCurriculumProgressRepository;
import courses.abc.atoms.features.course.model.BatchCourse;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.features.course.repositories.BatchCourseRepository;
import courses.abc.atoms.features.student.model.UserCourseProgress;
import courses.abc.atoms.features.student.repositories.UserCourseProgressRepository;
import jakarta.transaction.Transactional;


@Service
public class ContentProgressService {

    private static final Logger logger = LoggerFactory.getLogger(ContentProgressService.class);

    @Autowired
    private  ContentProgressRepository contentProgressRepository;
    @Autowired
    private  UserRepository usersRepository;
    @Autowired
    private  ContentItemRepository contentItemRepository;
    @Autowired
    private  UserSectionProgressRepository userSectionProgressRepository;
    @Autowired
    private  CurriculumSectionsRepository curriculumSectionsRepository;
    @Autowired
    private  UserCurriculumProgressRepository userCurriculumProgressRepository;
    @Autowired
    private  BatchCourseRepository batchCourseRepository;
    @Autowired
    private  BatchUserRepository batchUserRepository;
    @Autowired
    private  UserCourseProgressRepository userCourseProgressRepository;
    @Autowired
    private UserBundleProgressRepository userBundleProgressRepository;


    private Users getAuthenticatedUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getPrincipal() == null) {
                throw new RuntimeException("User not found in security context");
            }

            Object principal = authentication.getPrincipal();
            if (principal instanceof UserDetails userDetails) {
                return usersRepository.findByEmail(userDetails.getUsername())
                        .orElseThrow(() -> new RuntimeException("User not found by email"));
            } else if (principal instanceof String principalStr) {
                if (principalStr.contains("@")) {
                    return usersRepository.findByEmail(principalStr)
                            .orElseThrow(() -> new RuntimeException("User not found by email"));
                }
                try {
                    Long userId = Long.valueOf(principalStr);
                    return usersRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found by id"));
                } catch (NumberFormatException e) {
                    throw new RuntimeException("Invalid user principal format", e);
                }
            }
            throw new RuntimeException("Unsupported principal type");
        } catch (Exception e) {
            throw new RuntimeException("Error retrieving authenticated user: " + e.getMessage(), e);
        }
    }


    @Transactional
    public void saveContentProgress(ContentProgressDTO.ContentProgressRequest request) {
        try {

            Users user = getAuthenticatedUser();

            ContentItem contentItem = contentItemRepository.findByItemId(request.getContentItemId())
                    .orElseThrow(() -> new RuntimeException("Content item not found with id: " + request.getContentItemId()));

            // Check if content progress already exists for the user and content item
            Optional<ContentProgress> existingProgressOpt = contentProgressRepository.findByUserAndContentItem(user, contentItem);
            if (existingProgressOpt.isPresent()) {
                ContentProgress existingProgress = existingProgressOpt.get();
                existingProgress.setProgressPercentage(request.getProgressPercentage());
                existingProgress.setStatus(ContentProgressDTO.ContentProgressStatus.IN_PROGRESS);
                existingProgress.setLastAccessedAt(LocalDateTime.now());
                existingProgress.setTimeSpentSeconds(existingProgress.getTimeSpentSeconds() + request.getTimeSpentSeconds());
                if (request.getProgressPercentage() >= 100) {
                    existingProgress.setStatus(ContentProgressDTO.ContentProgressStatus.COMPLETED);
                    existingProgress.setCompletedAt(LocalDateTime.now());
                } else {
                    existingProgress.setStatus(ContentProgressDTO.ContentProgressStatus.IN_PROGRESS);
                }
                contentProgressRepository.save(existingProgress);
                
                // Update section progress after saving content progress
                if (request.getProgressPercentage() >= 100) {
                    contentProgressRepository.flush(); // Ensure data is committed before calculating section progress
                    updateUserSectionProgress(user, contentItem.getSection());
                    // Also update curriculum progress when content item is completed
                    updateUserCurriculumProgress(user, contentItem.getSection().getCurriculumId());

                    updateUserCourseProgress(user, contentItem.getSection().getCurriculumId());

                    updateUserBundleProgress(user, contentItem.getSection().getCurriculumId());

                }
                return; 
            }

            ContentProgress contentProgress = new ContentProgress();
            contentProgress.setUser(user);
            contentProgress.setContentItem(contentItem);
            contentProgress.setProgressPercentage(request.getProgressPercentage());
            contentProgress.setFirstAccessedAt(LocalDateTime.now());
            contentProgress.setLastAccessedAt(LocalDateTime.now());
            contentProgress.setTimeSpentSeconds(request.getTimeSpentSeconds());
            
            if (request.getProgressPercentage() >= 100) {
                contentProgress.setStatus(ContentProgressDTO.ContentProgressStatus.COMPLETED);
                contentProgress.setCompletedAt(LocalDateTime.now());
            } else {
                contentProgress.setStatus(ContentProgressDTO.ContentProgressStatus.IN_PROGRESS);
                contentProgress.setCompletedAt(null);
            }
            
            contentProgressRepository.save(contentProgress);
            
            // Update section progress after saving content progress
            if (request.getProgressPercentage() >= 100) {
                contentProgressRepository.flush(); // Ensure data is committed before calculating section progress
                updateUserSectionProgress(user, contentItem.getSection());
                // Also update curriculum progress when content item is completed
                updateUserCurriculumProgress(user, contentItem.getSection().getCurriculumId());

                updateUserCourseProgress(user, contentItem.getSection().getCurriculumId());

                updateUserBundleProgress(user, contentItem.getSection().getCurriculumId());

            }            
        } catch (RuntimeException e) {
            // Business logic errors - send message to frontend
            throw new RuntimeException(e.getMessage());
        } catch (Exception e) {
            // Critical system errors - detailed logging and handling
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Updates user section progress when a content item is completed
     */
    private void updateUserSectionProgress(Users user, CurriculumSection section) {
        try {            
            // Get all content items in this section
            List<ContentItem> sectionContentItems = contentItemRepository.findBySection_SectionIdOrderByItemOrderAsc(section.getSectionId());
                        
            if (sectionContentItems.isEmpty()) {
                return; // No content items in section
            }

            // Get user's progress for all content items in this section
            List<ContentProgress> userContentProgress = contentProgressRepository.findByUserAndSection(user, section);
            
            // Calculate section progress percentage
            long completedItems = userContentProgress.stream()
                .filter(cp -> {
                    boolean isCompleted = cp.getStatus() == ContentProgressDTO.ContentProgressStatus.COMPLETED;
                    logger.info("Content item {} status: {}, completed: {}", 
                        cp.getContentItem().getItemId(), cp.getStatus(), isCompleted);
                    return isCompleted;
                })
                .count();
                        
            BigDecimal progressPercentage = BigDecimal.valueOf(completedItems)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(sectionContentItems.size()), 2, RoundingMode.HALF_UP);
            
            // Determine section status
            StatusType sectionStatus;
            if (completedItems == 0) {
                sectionStatus = StatusType.NOT_STARTED;
            } else if (completedItems == sectionContentItems.size()) {
                sectionStatus = StatusType.COMPLETED;
            } else {
                sectionStatus = StatusType.IN_PROGRESS;
            }
                        
            // Find existing section progress or create new one
            Optional<UserSectionProgress> existingSectionProgressOpt = userSectionProgressRepository.findByUserAndSection(user, section);
            
            UserSectionProgress sectionProgress;
            if (existingSectionProgressOpt.isPresent()) {
                sectionProgress = existingSectionProgressOpt.get();
            } else {
                sectionProgress = new UserSectionProgress();
                sectionProgress.setUser(user);
                sectionProgress.setSection(section);
            }
            
            // Update section progress
            sectionProgress.setProgressPercentage(progressPercentage);
            sectionProgress.setStatus(sectionStatus);
            sectionProgress.setLastUpdated(LocalDateTime.now());
            
            userSectionProgressRepository.save(sectionProgress);
            
        } catch (Exception e) {
            logger.error("Error updating user section progress: {}", e.getMessage());
            // Don't throw exception here as it's a secondary operation
        }
    }

    /**
     * Updates user curriculum progress when a content item is completed
     */
    private void updateUserCurriculumProgress(Users user, Curriculum curriculum) {
        try {
            // Get all sections in this curriculum
            List<CurriculumSection> curriculumSections = curriculumSectionsRepository.findByCurriculumIdCurriculumId(curriculum.getCurriculumId());
            
            if (curriculumSections.isEmpty()) {
                return; // No sections in curriculum
            }

            // Get user's section progress for all sections in this curriculum
            List<UserSectionProgress> userSectionProgressList = curriculumSections.stream()
                .map(section -> userSectionProgressRepository.findByUserAndSection(user, section))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();
            
            // Calculate curriculum progress percentage as average of section percentages
            BigDecimal totalSectionProgress = BigDecimal.ZERO;
            
            for (CurriculumSection section : curriculumSections) {
                Optional<UserSectionProgress> sectionProgressOpt = userSectionProgressRepository.findByUserAndSection(user, section);
                if (sectionProgressOpt.isPresent()) {
                    BigDecimal sectionPercentage = sectionProgressOpt.get().getProgressPercentage();
                    totalSectionProgress = totalSectionProgress.add(sectionPercentage);
                    logger.info("Section {} progress: {}%", section.getSectionId(), sectionPercentage);
                } else {
                    // Section not started, contributes 0%
                    logger.info("Section {} progress: 0% (not started)", section.getSectionId());
                }
            }
            
            // Calculate average percentage across all sections
            BigDecimal progressPercentage;
            if (curriculumSections.size() > 0) {
                progressPercentage = totalSectionProgress.divide(BigDecimal.valueOf(curriculumSections.size()), 2, RoundingMode.HALF_UP);
            } else {
                progressPercentage = BigDecimal.ZERO;
            }
            
            // Determine curriculum status based on average percentage
            StatusType curriculumStatus;
            if (progressPercentage.compareTo(BigDecimal.ZERO) == 0) {
                curriculumStatus = StatusType.NOT_STARTED;
            } else if (progressPercentage.compareTo(BigDecimal.valueOf(100)) == 0) {
                curriculumStatus = StatusType.COMPLETED;
            } else {
                curriculumStatus = StatusType.IN_PROGRESS;
            }
                        
            // Find existing curriculum progress or create new one
            Optional<UserCurriculumProgress> existingCurriculumProgressOpt = userCurriculumProgressRepository.findByUserAndCurriculum(user, curriculum);
            
            UserCurriculumProgress curriculumProgress;
            if (existingCurriculumProgressOpt.isPresent()) {
                curriculumProgress = existingCurriculumProgressOpt.get();
                logger.info("Updating existing curriculum progress record");
            } else {
                curriculumProgress = new UserCurriculumProgress();
                curriculumProgress.setUser(user);
                curriculumProgress.setCurriculum(curriculum);
                logger.info("Creating new curriculum progress record");
            }
            
            // Update curriculum progress
            curriculumProgress.setProgressPercentage(progressPercentage);
            curriculumProgress.setStatus(curriculumStatus);
            curriculumProgress.setLastUpdated(LocalDateTime.now());
            
            userCurriculumProgressRepository.save(curriculumProgress);
            
        } catch (Exception e) {
            logger.error("Error updating user curriculum progress: {}", e.getMessage());
            // Don't throw exception here as it's a secondary operation
        }
    }

    /**
     * Updates user course progress when curriculum progress is updated
     */
    private void updateUserCourseProgress(Users user, Curriculum curriculum) {
        try {
            Integer curriculumIdInt = curriculum.getCurriculumId();
            List<BatchCourse> batchCourses = batchCourseRepository.findByCurriculumId(curriculumIdInt.longValue());
            if (batchCourses != null && !batchCourses.isEmpty()) {
                for (BatchCourse batchCourse : batchCourses) {
                    Course course = batchCourse.getCourse();
                    if (course == null) {
                        logger.warn("BatchCourse {} has no associated Course", batchCourse.getId());
                        continue;
                    }
                    Batches batch = batchCourse.getBatch();
                    if (batch == null) continue;
                    // Check if user is in this batch
                    boolean userInBatch = batchUserRepository.findAllByBatchId(batch.getBatchId()).stream()
                        .anyMatch(bu -> bu.getUser().getId().equals(user.getId()));
                    if (!userInBatch) continue;

                    // Only count curriculums from batch course table for this batch and course
                    List<BatchCourse> courseBatchCourses = batchCourseRepository.findByCourse_CourseId(course.getCourseId());
                    int totalCurriculums = 0;
                    BigDecimal sumProgress = BigDecimal.ZERO;
                    for (BatchCourse cb : courseBatchCourses) {
                        if (cb.getBatch() == null || !cb.getBatch().getBatchId().equals(batch.getBatchId())) continue;
                        Curriculum linkedCurriculum = cb.getCurriculum();
                        if (linkedCurriculum == null) continue;
                        Optional<UserCurriculumProgress> userCurriculumProgressOpt = userCurriculumProgressRepository.findByUserAndCurriculum(user, linkedCurriculum);
                        if (userCurriculumProgressOpt.isPresent()) {
                            sumProgress = sumProgress.add(userCurriculumProgressOpt.get().getProgressPercentage());
                        }
                        totalCurriculums++;
                    }
                    BigDecimal avgProgress = BigDecimal.ZERO;
                    if (totalCurriculums > 0) {
                        avgProgress = sumProgress.divide(BigDecimal.valueOf(totalCurriculums), 2, RoundingMode.HALF_UP);
                    }
                    StatusType status;
                    if (avgProgress.compareTo(BigDecimal.ZERO) == 0) {
                        status = StatusType.NOT_STARTED;
                    } else if (avgProgress.compareTo(BigDecimal.valueOf(100)) == 0) {
                        status = StatusType.COMPLETED;
                    } else {
                        status = StatusType.IN_PROGRESS;
                    }
                    Optional<UserCourseProgress> courseProgressOpt = userCourseProgressRepository.findAll().stream()
                        .filter(cp -> cp.getUser().getId().equals(user.getId()) && cp.getCourse().getCourseId().equals(course.getCourseId()))
                        .findFirst();
                    UserCourseProgress courseProgress;
                    if (courseProgressOpt.isPresent()) {
                        courseProgress = courseProgressOpt.get();
                        logger.info("Updating existing course progress record for user {} and course {}", user.getId(), course.getCourseId());
                    } else {
                        courseProgress = new UserCourseProgress();
                        courseProgress.setUser(user);
                        courseProgress.setCourse(course);
                        logger.info("Creating new course progress record for user {} and course {}", user.getId(), course.getCourseId());
                    }
                    courseProgress.setProgressPercentage(avgProgress);
                    courseProgress.setStatus(status);
                    courseProgress.setLastUpdated(LocalDateTime.now());
                    userCourseProgressRepository.save(courseProgress);
                }
            }
        } catch (Exception e) {
            logger.error("Error updating user course progress: {}", e.getMessage());
            // Don't throw exception here as it's a secondary operation
        }
    }
    
    
    /**
     * Updates user bundle progress when course progress is updated
     */
    private void updateUserBundleProgress(Users user, Curriculum curriculum) {
        try {
            Long curriculumIdLong = curriculum.getCurriculumId().longValue();
            List<BatchCourse> batchCourses = batchCourseRepository.findByCurriculumId(curriculumIdLong);
            if (batchCourses == null || batchCourses.isEmpty()) {
                return;
            }

            batchCourses.stream()
                .filter(bc -> bc.getBundle() != null && bc.getBatch() != null)
                .map(bc -> new Object[]{bc.getBundle(), bc.getBatch()})
                .distinct()
                .forEach(obj -> {
                    CourseBundles bundle = (CourseBundles) obj[0];
                    Batches batch = (Batches) obj[1];
                    List<Long> courseIds = batchCourseRepository.findDistinctCourseIdsByBundleIdAndBatchId(bundle.getBundleId(), batch.getBatchId());
                    int totalCourses = courseIds.size();
                    BigDecimal sumProgress = BigDecimal.ZERO;

                    for (Long courseId : courseIds) {
                        // Find user course progress for this user, course, and batch
                        Optional<UserCourseProgress> userCourseProgressOpt = userCourseProgressRepository.findAll().stream()
                            .filter(cp -> cp.getUser().equals(user) && cp.getCourse().getCourseId().equals(courseId))
                            .findFirst();
                        if (userCourseProgressOpt.isPresent()) {
                            sumProgress = sumProgress.add(userCourseProgressOpt.get().getProgressPercentage());
                        }
                    }

                    BigDecimal avgProgress = BigDecimal.ZERO;
                    if (totalCourses > 0) {
                        avgProgress = sumProgress.divide(BigDecimal.valueOf(totalCourses), 2, RoundingMode.HALF_UP);
                    }

                    StatusType status;
                    if (avgProgress.compareTo(BigDecimal.ZERO) == 0) {
                        status = StatusType.NOT_STARTED;
                    } else if (avgProgress.compareTo(BigDecimal.valueOf(100)) == 0) {
                        status = StatusType.COMPLETED;
                    } else {
                        status = StatusType.IN_PROGRESS;
                    }

                    Optional<UserBundleProgress> bundleProgressOpt = userBundleProgressRepository.findByUserAndBundle(user, bundle);
                    UserBundleProgress bundleProgress;
                    if (bundleProgressOpt.isPresent()) {
                        bundleProgress = bundleProgressOpt.get();
                    } else {
                        bundleProgress = new UserBundleProgress();
                        bundleProgress.setUser(user);
                        bundleProgress.setBundle(bundle);
                    }
                    bundleProgress.setProgressPercentage(avgProgress);
                    bundleProgress.setStatus(status);
                    bundleProgress.setLastUpdated(LocalDateTime.now());
                    userBundleProgressRepository.save(bundleProgress);
                });
        } catch (Exception e) {
            logger.error("Error updating user bundle progress: {}", e.getMessage());
            // Don't throw exception here as it's a secondary operation
        }
    }

}
