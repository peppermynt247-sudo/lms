package courses.abc.atoms.features.course.services;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.exception.UnauthorizedAccessException;
import courses.abc.atoms.core.model.core.UserCourseEnrollment;
import courses.abc.atoms.core.repositories.UserCourseEnrollmentRepository;
import courses.abc.atoms.features.course.dto.ContentProgressDTO;
import courses.abc.atoms.features.course.dto.CourseDTO;
import courses.abc.atoms.features.course.dto.CurriculumDTO;
import courses.abc.atoms.features.course.dto.SectionContentDTO;
import courses.abc.atoms.features.course.model.ContentItem;
import courses.abc.atoms.features.course.model.Course;
import courses.abc.atoms.features.course.model.Curriculum;
import courses.abc.atoms.features.course.model.CurriculumSection;
import courses.abc.atoms.features.course.repositories.*;
import jakarta.validation.constraints.NotBlank;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CurriculumService {

    private static final Logger logger = LoggerFactory.getLogger(CurriculumService.class);

    private final CurriculumRepository curriculumRepository;
    private final CurriculumSectionsRepository curriculumSectionsRepository;
    private final ContentItemRepository contentItemRepository;
    private final ContentProgressRepository contentProgressRepository;
    private final ContentItemService contentItemService;
    @Autowired
    private UserCourseEnrollmentRepository userCourseEnrollmentRepository;
    @Autowired
    private BatchCourseRepository batchCourseRepository;
    @Autowired
    private CourseRepository courseRepository;

    public CurriculumService(CurriculumRepository curriculumRepository, CurriculumSectionsRepository curriculumSectionsRepository, ContentItemRepository contentItemRepository, ContentProgressRepository contentProgressRepository, ContentItemService contentItemService) {
        this.curriculumRepository = curriculumRepository;
        this.curriculumSectionsRepository = curriculumSectionsRepository;
        this.contentItemRepository = contentItemRepository;
        this.contentProgressRepository = contentProgressRepository;
        this.contentItemService = contentItemService;
    }

    /**
     * Retrieves all curriculums and maps them to response DTOs.
     *
     * @return List of CurriculumResponse DTOs
     */
    @Transactional(readOnly = true)
    public List<CurriculumDTO.CurriculumResponse> getAllCurriculums() {
        logger.debug("Retrieving all curriculums from the database");
        List<Curriculum> curriculums = curriculumRepository.findAll();
        logger.info("Retrieved {} curriculums", curriculums.size());
        return curriculums.stream()
                .map(this::convertToCurriculumResponse)
                .toList();
    }

    @Transactional
    public CurriculumDTO.CurriculumResponse createCurriculum(CurriculumDTO.CurriculumCreateRequest request) {
        logger.debug("Attempting to create a new curriculum with title: {}", request.getTitle());

        if (request.getVersion() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Curriculum title and version are required.");
        }

        // Check for duplicate by title AND version together
        if (request.getTitle() != null && request.getVersion() != null &&
            curriculumRepository.findByTitleAndVersion(request.getTitle(), request.getVersion()).isPresent()) {
            throw new DataIntegrityViolationException("A curriculum with the title '" + request.getTitle() + "' and version '" + request.getVersion() + "' already exists.");
        }   

        Curriculum curriculum = new Curriculum();
        curriculum.setTitle(request.getTitle());
        curriculum.setDescription(request.getDescription());
        curriculum.setVersion(request.getVersion());
        curriculum.setIsActive(true);

        Curriculum savedCurriculum = curriculumRepository.save(curriculum);
        logger.info("Curriculum created successfully with ID: {}", savedCurriculum.getCurriculumId());
        return convertToCurriculumResponse(savedCurriculum);
    }

    @Transactional(readOnly = true)
    public CurriculumDTO.CurriculumResponse getCurriculumById(Integer id) {
        logger.debug("Attempting to retrieve curriculum with ID: {}", id);
        Curriculum curriculum = curriculumRepository.findByCurriculumId(id)
                .orElseThrow(() -> {
                    logger.warn("Curriculum with ID {} not found", id);
                    return new IllegalArgumentException("Curriculum not found with ID: " + id);
                });
        logger.info("Curriculum retrieved successfully with ID: {}", id);
        return convertToCurriculumResponse(curriculum);
    }

    @Transactional
    public CurriculumDTO.CurriculumResponse updateCurriculum(Integer id, CurriculumDTO.CurriculumCreateRequest request) {
        logger.debug("Attempting to update curriculum with ID: {}", id);

        Curriculum curriculum = curriculumRepository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("Curriculum with ID {} not found", id);
                    return new IllegalArgumentException("Curriculum not found with ID: " + id);
                });

        if (request.getTitle() != null) {
            curriculum.setTitle(request.getTitle());
        }

        if (request.getDescription() != null) {
            curriculum.setDescription(request.getDescription());
        }

        if (request.getVersion() != null) {
            curriculum.setVersion(request.getVersion());
        }

        if (request.getIsActive() != null) {
            curriculum.setIsActive(request.getIsActive());
        }

        Curriculum updatedCurriculum = curriculumRepository.save(curriculum);
        logger.info("Curriculum updated successfully with ID: {}", id);
        return convertToCurriculumResponse(updatedCurriculum);
    }

    @Transactional
    public void deleteCurriculum(Integer id) {
        logger.debug("Attempting to delete curriculum with ID: {}", id);
        if (!curriculumRepository.existsById(id)) {
            logger.warn("Curriculum with ID {} not found", id);
            throw new IllegalArgumentException("Curriculum not found with ID: " + id);
        }
        curriculumRepository.deleteById(id);
        logger.info("Curriculum deleted successfully with ID: {}", id);
    }

    /**
     * Builds the complete student-facing view for a specific curriculum.
     */
    @Transactional(readOnly = true)
    public CurriculumDTO.CurriculumViewResponse getCurriculumViewForStudent(Integer curriculumId, Long userId) {
        Curriculum curriculum = curriculumRepository.findById(curriculumId)
                .orElseThrow(() -> new ResourceNotFoundException("Curriculum not found with id: " + curriculumId));

        // Find the course ID from the user's current enrollment context.
        Long courseId = findCourseIdForCurriculumInUserContext(curriculum, userId);

        UserCourseEnrollment enrollment = userCourseEnrollmentRepository.findByUser_IdAndCourse_CourseId(userId, courseId)
                .orElseThrow(() -> new UnauthorizedAccessException("You are not enrolled in the course for this curriculum."));
        Long batchId = enrollment.getBatches().getBatchId();

        // Check if the batch has explicit access to this curriculum.
        boolean hasExplicitAccess = batchCourseRepository.existsByBatchIdAndCurriculumId(batchId, curriculumId);

        // Find the specific course from the curriculum's set of courses to check if it's the default.
        Course currentCourse = curriculum.getCourses().stream()
                .filter(c -> c.getCourseId().equals(courseId))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Curriculum is not linked to the specified course."));

        boolean isDefaultAndNoSpecifics = curriculumId.equals(currentCourse.getDefaultCurriculumId()) &&
                batchCourseRepository.findCurriculumsByBatchIdAndCourseId(batchId, courseId).isEmpty();

        // if (!hasExplicitAccess && !isDefaultAndNoSpecifics) {
        //     throw new UnauthorizedAccessException("Your batch does not have access to this curriculum.");
        // }
        List<CurriculumSection> sections = curriculumSectionsRepository.findByCurriculumId_CurriculumIdOrderBySectionOrderAsc(curriculumId);

        Set<Long> completedItemIds = contentProgressRepository
                .findCompletedContentItemIdsByUserAndCurriculum(userId, curriculumId, ContentProgressDTO.ContentProgressStatus.COMPLETED);

        List<CurriculumDTO.CurriculumSectionWithProgress> sectionsWithProgress = new ArrayList<>();
        boolean isFirstSection = true;

        for (CurriculumSection section : sections) {
            long totalItems = contentItemRepository.countBySection_SectionId(section.getSectionId());
            long completedItems = contentItemRepository.countCompletedItemsBySectionAndUser(section.getSectionId(), userId, ContentProgressDTO.ContentProgressStatus.COMPLETED);

            List<CurriculumDTO.ContentItemSummary> contentItems = Collections.emptyList();

            if (isFirstSection && totalItems > 0) {
                // Use the injected service to get all content details efficiently
                SectionContentDTO sectionContent = contentItemService.getContentForSection(section.getSectionId());

                // Map the results to the required DTO, extracting the title from the detailed maps
                contentItems = sectionContent.getContentItems().stream()
                        .map(item -> new CurriculumDTO.ContentItemSummary(
                                item.getItemId(),
                                item.getContentReferenceId().longValue(),
                                getTitleFromSectionContent(item, sectionContent),
                                completedItemIds.contains(item.getItemId()),
                                item.getContentType().name()
                        ))
                        .collect(Collectors.toList());

                isFirstSection = false;
            } else if (totalItems == 0) {
                contentItems = Collections.emptyList();
            }

            sectionsWithProgress.add(new CurriculumDTO.CurriculumSectionWithProgress(
                    section.getSectionId(),
                    section.getTitle(),
                    totalItems,
                    completedItems,
                    contentItems
            ));
        }

        return new CurriculumDTO.CurriculumViewResponse(curriculum.getTitle(), sectionsWithProgress);
    }

    /**
     * Helper method to find the correct course ID when a curriculum can belong to many courses.
     * It finds which of the curriculum's courses the user is actually enrolled in.
     */
    private Long findCourseIdForCurriculumInUserContext(Curriculum curriculum, Long userId) {
        return curriculum.getCourses().stream()
                .map(Course::getCourseId)
                .filter(courseId -> userCourseEnrollmentRepository.findByUser_IdAndCourse_CourseId(userId, courseId).isPresent())
                .findFirst()
                .orElseThrow(() -> new UnauthorizedAccessException("You are not enrolled in any course associated with this curriculum."));
    }

    /**
     * Private helper to dynamically get the title from the correct map in SectionContentDTO.
     */
    private String getTitleFromSectionContent(ContentItem item, SectionContentDTO sectionContent) {
        Integer refId = item.getContentReferenceId();
        switch (item.getContentType()) {
            case EXERCISE:
                return sectionContent.getExercises().get(refId).getTitle();
            case ELAB:
                return sectionContent.getElabs().get(refId).getTitle();
            case VIDEO:
                return sectionContent.getVideos().get(refId).getTitle();
            case EBOOK:
                // Note: Ebook maps use Long, so a cast is needed.
                return sectionContent.getEbooks().get(refId.longValue()).getTitle();
            default:
                return "Untitled Content";
        }
    }

    public CurriculumDTO.CurriculumResponse convertToCurriculumResponse(Curriculum curriculum) {
        long numberOfSections = curriculumSectionsRepository.countByCurriculumId_CurriculumId(curriculum.getCurriculumId());
        return new CurriculumDTO.CurriculumResponse(
                curriculum.getCurriculumId(),
                curriculum.getTitle(),
                curriculum.getDescription(),
                curriculum.getVersion(),
                curriculum.getIsActive(),
                curriculum.getCreatedAt(),
                curriculum.getUpdatedAt(),
                numberOfSections
        );
    }

    @Transactional(readOnly = true)
    public List<CurriculumDTO.CurriculumResponse> getCurriculumsByCourseId(Integer courseId) {
        if (!courseRepository.existsById(courseId.longValue())) {
            throw new IllegalArgumentException("Course not found with ID: " + courseId);
        }

        return curriculumRepository.findByCourseId(courseId)
                .stream()
                .map(this::convertToCurriculumResponse)
                .collect(Collectors.toList());
    }
}
