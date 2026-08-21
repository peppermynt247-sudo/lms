package courses.abc.atoms.features.course.services;

import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.features.course.dto.*;
import courses.abc.atoms.features.course.enums.ContentType;
import courses.abc.atoms.features.course.model.*;
import courses.abc.atoms.features.course.repositories.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContentItemService {

    private static final Logger logger = LoggerFactory.getLogger(ContentItemService.class);
    private static final String CONTENT_CACHE = "content-items";

    private final ContentItemRepository contentItemRepository;
    private final ExerciseRepository exerciseRepository;
    private final CodingExerciseRepository codingExerciseRepository;
    private final VideoRepository videoRepository;
    private final EbookRepository ebookRepository;
    private final CurriculumSectionsRepository curriculumSectionsRepository;
    private final ContentProgressRepository contentProgressRepository;

    /**
     * NEW METHOD for lazy-loading section content.
     * Fetches and formats the content summaries for a single section on demand.
     *
     * @param sectionId The ID of the section to fetch content for.
     * @param userId    The ID of the student to check completion status against.
     * @return A list of content item summaries.
     */
    @Transactional(readOnly = true)
    public List<CurriculumDTO.ContentItemSummary> getContentSummariesForSection(Integer sectionId, Long userId) {
        logger.info("Lazy-loading content for section ID: {} for user ID: {}", sectionId, userId);

        // Use the existing method to get all content details for the section.
        SectionContentDTO sectionContent = this.getContentForSection(sectionId);
        if (sectionContent.getContentItems().isEmpty()) {
            return Collections.emptyList();
        }

        // Get the curriculum ID from the first content item to fetch all completed IDs for that curriculum.
        // This is efficient as it's a single query for the whole curriculum context.
        Integer curriculumId = sectionContent.getContentItems().get(0).getSection().getCurriculumId().getCurriculumId();
        Set<Long> completedItemIds = contentProgressRepository
                .findCompletedContentItemIdsByUserAndCurriculum(userId, curriculumId, ContentProgressDTO.ContentProgressStatus.COMPLETED);

        // Map the results to the required DTO, checking against the completed IDs.
        return sectionContent.getContentItems().stream()
                .map(item -> new CurriculumDTO.ContentItemSummary(
                        item.getItemId(),
                        item.getContentReferenceId().longValue(),
                        getTitleFromSectionContent(item, sectionContent),
                        completedItemIds.contains(item.getItemId()),
                        item.getContentType().name()
                ))
                .collect(Collectors.toList());
    }

    /**
     * helper to dynamically get the title from the correct map in SectionContentDTO.
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
                return sectionContent.getEbooks().get(refId.longValue()).getTitle();
            default:
                return "Untitled Content";
        }
    }
    @Transactional(readOnly = true)
   // @Cacheable(value = "content-items", key = "'section-' + #sectionId")
    public SectionContentDTO getContentForSection(Integer sectionId) {
        logger.info("Attempting to fetch content for section ID: {}", sectionId);

        // Verify section exists before proceeding - optimized check
        if (!curriculumSectionsRepository.existsById(sectionId)) {
            logger.warn("Fetch failed. CurriculumSection not found with id: {}", sectionId);
            throw new ResourceNotFoundException("CurriculumSection not found with id: " + sectionId);
        }

        List<ContentItem> contentItems = contentItemRepository.findBySection_SectionIdOrderByItemOrderAsc(sectionId);
        logger.info("Found {} content items for section ID: {}", contentItems.size(), sectionId);

        // Early return if no content items
        if (contentItems.isEmpty()) {
            SectionContentDTO emptyResponse = new SectionContentDTO();
            emptyResponse.setContentItems(Collections.emptyList());
            emptyResponse.setExercises(Collections.emptyMap());
            emptyResponse.setVideos(Collections.emptyMap());
            emptyResponse.setEbooks(Collections.emptyMap());
            return emptyResponse;
        }

        // Separate IDs by content type
        List<Integer> exerciseIds = new ArrayList<>();
        List<Integer> elabIds = new ArrayList<>();
        List<Integer> videoIds = new ArrayList<>();
        List<Integer> ebookIds = new ArrayList<>();

        for (ContentItem item : contentItems) {
            if (item.getContentType() == ContentType.EXERCISE) {
                exerciseIds.add(item.getContentReferenceId());
            } else if (item.getContentType() == ContentType.ELAB) {
                elabIds.add(item.getContentReferenceId());
            } else if (item.getContentType() == ContentType.VIDEO) {
                videoIds.add(item.getContentReferenceId());
            } else if (item.getContentType() == ContentType.EBOOK) {
                ebookIds.add(item.getContentReferenceId());
            }
        }

        // Batch fetch exercises
        Map<Integer, ExerciseDTO.SummaryResponse> exercisesMap = exerciseIds.isEmpty()
                ? Collections.emptyMap()
                : exerciseRepository.findAllById(exerciseIds).stream()
                .map(this::convertToExerciseSummary)
                .collect(Collectors.toMap(ExerciseDTO.SummaryResponse::getExerciseId, Function.identity()));

        // Batch fetch ELABs
        Map<Integer, CodingExerciseDTO.SummaryResponse> elabsMap = elabIds.isEmpty()
                ? Collections.emptyMap()
                : codingExerciseRepository.findAllById(elabIds.stream().map(Long::valueOf).collect(Collectors.toList())).stream()
                .map(this::convertToCodingExerciseSummary)
                .collect(Collectors.toMap(CodingExerciseDTO.SummaryResponse::getCodingExerciseId, Function.identity()));

        // Batch fetch Videos
        Map<Integer, VideoDTO.SummaryResponse> videosMap = videoIds.isEmpty()
                ? Collections.emptyMap()
                : videoRepository.findAllById(videoIds).stream()
                .map(this::convertToVideoSummary)
                .collect(Collectors.toMap(VideoDTO.SummaryResponse::getVideoId, Function.identity()));

        // Batch fetch Ebooks
        Map<Long, EbookDTO.SummaryResponse> ebooksMap = ebookIds.isEmpty()
                ? Collections.emptyMap()
                : ebookRepository.findAllById(ebookIds.stream().map(Long::valueOf).collect(Collectors.toList())).stream()
                .map(this::convertToEbookSummary)
                .collect(Collectors.toMap(EbookDTO.SummaryResponse::getEbookId, Function.identity()));


        SectionContentDTO response = new SectionContentDTO();
        response.setContentItems(contentItems);
        response.setExercises(exercisesMap);
        response.setElabs(elabsMap);
        response.setVideos(videosMap);
        response.setEbooks(ebooksMap);

        logger.info("Successfully retrieved content for section ID: {} with {} exercises, {} elabs, {} videos, and {} ebooks",
                sectionId, exercisesMap.size(), elabsMap.size(), videosMap.size(), ebooksMap.size());
        return response;
    }

    /**
     * Updates the metadata of a ContentItem based on the provided request.
     * It only modifies the fields that are present in the request body.
     * Optimized to avoid unnecessary updates.
     */
    @Transactional
    @CacheEvict(value = "content-items", key = "'section-' + #result.section.sectionId", condition = "#result != null")
    public void updateContentItemMetadata(Long itemId, ContentItemDTO.MetadataUpdateRequest request) {
        logger.info("Attempting to update metadata for content item ID: {}", itemId);

        ContentItem contentItem = contentItemRepository.findById(itemId)
                .orElseThrow(() -> {
                    logger.warn("Update failed. ContentItem not found with id: {}", itemId);
                    return new ResourceNotFoundException("ContentItem not found with id: " + itemId);
                });

        // Track if any changes are made to avoid unnecessary saves
        boolean hasChanges = false;

        if (request.getIsPublished() != null
                && !Objects.equals(contentItem.getIsPublished(), request.getIsPublished())) {
            contentItem.setIsPublished(request.getIsPublished());
            hasChanges = true;
        }

        if (request.getIsRequired() != null && !Objects.equals(contentItem.getIsRequired(), request.getIsRequired())) {
            contentItem.setIsRequired(request.getIsRequired());
            hasChanges = true;
        }

        if (request.getItemOrder() != null && !Objects.equals(contentItem.getItemOrder(), request.getItemOrder())) {
            contentItem.setItemOrder(request.getItemOrder());
            hasChanges = true;
        }

        // Only save if there are actual changes
        if (hasChanges) {
            contentItemRepository.save(contentItem);
            logger.info("Successfully updated metadata for content item ID: {}", itemId);
        } else {
            logger.debug("No changes detected for content item ID: {}, skipping save", itemId);
        }
    }

    @Transactional
    public void deleteContentItem(Long itemId) {
        logger.info("Attempting to delete content item with ID: {}", itemId);

        ContentItem contentItem = contentItemRepository.findById(itemId)
                .orElseThrow(() -> {
                    logger.warn("Delete failed. ContentItem not found with id: {}", itemId);
                    return new ResourceNotFoundException("ContentItem not found with id: " + itemId);
                });

        if (contentItem.getContentType() == ContentType.EXERCISE) {
            logger.info("ContentItem is an exercise. Deleting associated exercise with ID: {}",
                    contentItem.getContentReferenceId());
            // Check if the exercise exists before trying to delete
            if (exerciseRepository.existsById(contentItem.getContentReferenceId())) {
                exerciseRepository.deleteById(contentItem.getContentReferenceId());
                logger.info("Successfully deleted exercise with ID: {}", contentItem.getContentReferenceId());
            } else {
                logger.warn("Associated exercise with ID: {} not found, but continuing with ContentItem deletion.",
                        contentItem.getContentReferenceId());
            }
        } else if (contentItem.getContentType() == ContentType.ELAB) {
            // Convert the reference ID to Long
            Long elabId = contentItem.getContentReferenceId().longValue();
            logger.info("ContentItem is an ELAB. Checking for associated ELAB with ID: {}", elabId);

            // Check if the ELAB exists before trying to delete
            if (codingExerciseRepository.existsById(elabId)) {
                codingExerciseRepository.deleteById(elabId);
                logger.info("Successfully deleted associated ELAB with ID: {}", elabId);
            } else {
                logger.warn("Associated ELAB with ID: {} not found, but continuing with ContentItem deletion.", elabId);
            }
        } else if (contentItem.getContentType() == ContentType.VIDEO) { // Add deletion logic for videos
            if (videoRepository.existsById(contentItem.getContentReferenceId())) {
                videoRepository.deleteById(contentItem.getContentReferenceId());
                logger.info("Successfully deleted Video with ID: {}", contentItem.getContentReferenceId());
            }
        } else if (contentItem.getContentType() == ContentType.EBOOK) { // Added ebook deletion
            Long ebookId = contentItem.getContentReferenceId().longValue();
            logger.info("ContentItem is an EBOOK. Checking for associated EBOOK with ID: {}", ebookId);

            if (ebookRepository.existsById(ebookId)) {
                ebookRepository.deleteById(ebookId);
                logger.info("Successfully deleted associated EBOOK with ID: {}", ebookId);
            } else {
                logger.warn("Associated EBOOK with ID: {} not found, but continuing with ContentItem deletion.", ebookId);
            }
        }

        // Purge any progress records first to avoid foreign key constraints
        contentProgressRepository.deleteByContentItem(contentItem);

        contentItemRepository.delete(contentItem);
        logger.info("Successfully deleted content item with ID: {}", itemId);
    }

    private ExerciseDTO.SummaryResponse convertToExerciseSummary(Exercise exercise) {
        ExerciseDTO.SummaryResponse dto = new ExerciseDTO.SummaryResponse();
        dto.setExerciseId(exercise.getExerciseId());
        dto.setTitle(exercise.getTitle());
        dto.setDescription(exercise.getDescription());
        dto.setExerciseType(exercise.getExerciseType());
        // dto.setInstructions(exercise.getInstructions());
        return dto;
    }

    private CodingExerciseDTO.SummaryResponse convertToCodingExerciseSummary(CodingExercise exercise) {
        CodingExerciseDTO.SummaryResponse dto = new CodingExerciseDTO.SummaryResponse();
        dto.setCodingExerciseId(exercise.getCodingExerciseId());
        dto.setTitle(exercise.getTitle());
        dto.setDescription(exercise.getDescription());
        dto.setDifficultyLevel(exercise.getDifficultyLevel());
        return dto;
    }

    private VideoDTO.SummaryResponse convertToVideoSummary(Video video) {
        VideoDTO.SummaryResponse dto = new VideoDTO.SummaryResponse();
        dto.setVideoId(video.getVideoId());
        dto.setTitle(video.getTitle());
        dto.setDescription(video.getDescription());
        dto.setVideoUrl(video.getVideoUrl());
        dto.setDurationSeconds(video.getDurationSeconds());
        dto.setUploadStatus(video.getUploadStatus());
        return dto;
    }

    private EbookDTO.SummaryResponse convertToEbookSummary(Ebook ebook) {
        EbookDTO.SummaryResponse dto = new EbookDTO.SummaryResponse();
        dto.setEbookId(ebook.getEbookId());
        dto.setTitle(ebook.getTitle());
        dto.setDescription(ebook.getDescription());
        return dto;
    }
}
