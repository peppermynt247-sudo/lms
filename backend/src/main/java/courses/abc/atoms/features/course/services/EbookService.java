package courses.abc.atoms.features.course.services;

import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.services.SpacesService;
import courses.abc.atoms.features.course.dto.EbookDTO;
import courses.abc.atoms.features.course.enums.ContentType;
import courses.abc.atoms.features.course.model.ContentItem;
import courses.abc.atoms.features.course.model.Curriculum;
import courses.abc.atoms.features.course.model.CurriculumSection;
import courses.abc.atoms.features.course.model.Ebook;
import courses.abc.atoms.features.course.repositories.ContentItemRepository;
import courses.abc.atoms.features.course.repositories.CourseRepository;
import courses.abc.atoms.features.course.repositories.CurriculumSectionsRepository;
import courses.abc.atoms.features.course.repositories.EbookRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class EbookService {

    private static final Logger logger = LoggerFactory.getLogger(EbookService.class);

    @Autowired
    private EbookRepository ebookRepository;

    @Autowired
    private CurriculumSectionsRepository curriculumSectionsRepository;

    @Autowired
    private ContentItemRepository contentItemRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private SpacesService spacesService;

    // ─── Create ──────────────────────────────────────────────────────────────

    @Transactional
    public EbookDTO.EbookResponse createEbook(Integer sectionId,
                                              EbookDTO.CreateEbookRequest request,
                                              MultipartFile pptFile,
                                              MultipartFile coverImage) throws IOException {

        // 1. Validate section exists
        CurriculumSection section = curriculumSectionsRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("CurriculumSection not found with id: " + sectionId));

        // 2. Get curriculum object from section (ManyToOne relation)
        Curriculum curriculum = section.getCurriculumId();
        Integer curriculumId  = curriculum.getCurriculumId();
        String curriculumName = curriculum.getTitle(); // curriculum folder name

        // 3. Get course title via curriculum_courses join table
        String courseName = courseRepository
                .findFirstCourseTitleByCurriculumId(curriculumId)
                .orElse("General");

        logger.info("Resolved path: course='{}' curriculum='{}' for sectionId={}",
                courseName, curriculumName, sectionId);

        // 4. Upload ebook file → atoms-lms/ebooks/{courseSlug}/{curriculumSlug}/uuid.{ext}
        String fileUrl = spacesService.uploadEbookFile(pptFile, courseName, curriculumName);
        logger.info("Uploaded PPT to Spaces: {}", fileUrl);

        // 5. Upload cover image → atoms-lms/ebooks/cover-images/{courseSlug}/{curriculumSlug}/uuid.jpg
        String coverImageUrl = null;
        if (coverImage != null && !coverImage.isEmpty()) {
            coverImageUrl = spacesService.uploadCoverImage(coverImage, courseName, curriculumName);
            logger.info("Uploaded cover image to Spaces: {}", coverImageUrl);
        }

        // 6. Save Ebook
        Ebook ebook = new Ebook();
        ebook.setTitle(request.getTitle());
        ebook.setDescription(request.getDescription());
        ebook.setFileUrl(fileUrl);
        ebook.setCoverImageUrl(coverImageUrl);
        ebook.setPageCount(request.getPageCount());
        ebook.setFileSizeKb(pptFile.getSize() / 1024);
        ebook.setAllowDownload(false);

        Ebook savedEbook = ebookRepository.save(ebook);
        logger.info("Saved ebook '{}' to database with ID {}", savedEbook.getTitle(), savedEbook.getEbookId());

        // 7. Create ContentItem linked to section (original flow)
        ContentItem contentItem = new ContentItem();
        contentItem.setSection(section);
        contentItem.setContentType(ContentType.EBOOK);
        contentItem.setContentReferenceId(savedEbook.getEbookId().intValue());

        Integer maxOrder = contentItemRepository.findMaxItemOrderBySectionId(sectionId);
        contentItem.setItemOrder(maxOrder == null ? 1 : maxOrder + 1);
        contentItemRepository.save(contentItem);
        logger.info("Successfully linked ContentItem for ebook ID: {}", savedEbook.getEbookId());

        return convertToEbookResponse(savedEbook);
    }

    // ─── Update ──────────────────────────────────────────────────────────────

    @Transactional
    public EbookDTO.EbookResponse updateEbook(Long ebookId,
                                              EbookDTO.UpdateEbookRequest request,
                                              MultipartFile pptFile,
                                              MultipartFile coverImage) throws IOException {

        Ebook ebook = ebookRepository.findById(ebookId)
                .orElseThrow(() -> new ResourceNotFoundException("Ebook not found with id: " + ebookId));

        if (request.getTitle() != null)       ebook.setTitle(request.getTitle());
        if (request.getDescription() != null) ebook.setDescription(request.getDescription());
        if (request.getPageCount() != null)   ebook.setPageCount(request.getPageCount());

        // Extract course and curriculum folder names from existing stored URL
        // URL pattern: .../ebooks/{courseSlug}/{curriculumSlug}/uuid.pptx
        String courseName      = extractSegmentFromUrl(ebook.getFileUrl(), 0);
        String curriculumName  = extractSegmentFromUrl(ebook.getFileUrl(), 1);

        // Replace PPT file if a new one is supplied
        if (pptFile != null && !pptFile.isEmpty()) {
            spacesService.deleteFile(ebook.getFileUrl());
            String newFileUrl = spacesService.uploadEbookFile(pptFile, courseName, curriculumName);
            ebook.setFileUrl(newFileUrl);
            ebook.setFileSizeKb(pptFile.getSize() / 1024);
            logger.info("Replaced PPT for ebook ID {}", ebookId);
        }

        // Replace cover image if a new one is supplied
        if (coverImage != null && !coverImage.isEmpty()) {
            spacesService.deleteFile(ebook.getCoverImageUrl());
            String newCoverUrl = spacesService.uploadCoverImage(coverImage, courseName, curriculumName);
            ebook.setCoverImageUrl(newCoverUrl);
            logger.info("Replaced cover image for ebook ID {}", ebookId);
        }

        Ebook updatedEbook = ebookRepository.save(ebook);
        logger.info("Updated ebook with ID {}", updatedEbook.getEbookId());
        return convertToEbookResponse(updatedEbook);
    }

    // ─── Delete ──────────────────────────────────────────────────────────────

    @Transactional
    public void deleteEbook(Long ebookId) {
        Ebook ebook = ebookRepository.findById(ebookId)
                .orElseThrow(() -> new ResourceNotFoundException("Ebook not found with id: " + ebookId));

        spacesService.deleteFile(ebook.getFileUrl());
        spacesService.deleteFile(ebook.getCoverImageUrl());

        contentItemRepository
                .findByContentReferenceIdAndContentType(ebookId.intValue(), ContentType.EBOOK)
                .ifPresent(contentItemRepository::delete);

        ebookRepository.deleteById(ebookId);
        logger.info("Successfully deleted ebook and its content link for ID: {}", ebookId);
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<EbookDTO.EbookResponse> getAllEbooks(Pageable pageable) {
        return ebookRepository.findAll(pageable).map(this::convertToEbookResponse);
    }

    @Transactional(readOnly = true)
    public EbookDTO.EbookResponse getEbookById(Long id) {
        Ebook ebook = ebookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ebook not found with id: " + id));
        return convertToEbookResponse(ebook);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private EbookDTO.EbookResponse convertToEbookResponse(Ebook ebook) {
        String viewUrl = spacesService.generateViewPresignedUrl(ebook.getFileUrl());

        String coverUrl = null;
        if (ebook.getCoverImageUrl() != null) {
            coverUrl = spacesService.generateViewPresignedUrl(ebook.getCoverImageUrl());
        }

        return EbookDTO.EbookResponse.builder()
                .ebookId(ebook.getEbookId())
                .title(ebook.getTitle())
                .description(ebook.getDescription())
                .viewUrl(viewUrl)
                .coverImageUrl(coverUrl)
                .pageCount(ebook.getPageCount())
                .fileSizeKb(ebook.getFileSizeKb())
                .createdAt(ebook.getCreatedAt())
                .updatedAt(ebook.getUpdatedAt())
                .build();
    }

    /**
     * Extracts a path segment from the stored Spaces URL after "ebooks/".
     * URL pattern: .../atoms-lms/ebooks/{courseSlug}/{curriculumSlug}/uuid.pptx
     *
     * @param fileUrl  the permanent URL stored in DB
     * @param index    0 = courseSlug, 1 = curriculumSlug
     */
    private String extractSegmentFromUrl(String fileUrl, int index) {
        try {
            String afterEbooks = fileUrl.split("ebooks/")[1];
            return afterEbooks.split("/")[index];
        } catch (Exception e) {
            logger.warn("Could not extract segment [{}] from URL: {}", index, fileUrl);
            return "General";
        }
    }
}