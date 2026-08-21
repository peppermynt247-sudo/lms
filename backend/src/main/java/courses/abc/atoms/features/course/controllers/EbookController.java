package courses.abc.atoms.features.course.controllers;

import courses.abc.atoms.core.dto.ApiResponse;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.features.course.dto.EbookDTO;
import courses.abc.atoms.features.course.services.EbookService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
public class EbookController {

    private static final Logger logger = LoggerFactory.getLogger(EbookController.class);

    @Autowired
    private EbookService ebookService;

    // ─── Create ──────────────────────────────────────────────────────────────

    /**
     * Creates an ebook by uploading a file + optional cover image to DigitalOcean Spaces.
     * Files are stored under atoms-lms/ebooks/{courseSlug}/
     *
     * Request type : multipart/form-data
     * Parts:
     *   - title        (required, text)
     *   - description  (optional, text)
     *   - pageCount    (optional, text)
     *   - ebookFile    (required, file) — .pdf / .ppt / .pptx
     *   - coverImage   (optional, file) — .jpg / .png
     */
    @PostMapping(
        value = "/curriculum-sections/{sectionId}/ebooks",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ApiResponse<EbookDTO.EbookResponse>> createEbook(
            @PathVariable Integer sectionId,
            @RequestPart("title")                                    String title,
            @RequestPart(value = "description",  required = false)   String description,
            @RequestPart(value = "pageCount",    required = false)   String pageCount,
            @RequestPart("ebookFile")                                MultipartFile ebookFile,
            @RequestPart(value = "coverImage",   required = false)   MultipartFile coverImage) {

        logger.info("API hit: POST /api/curriculum-sections/{}/ebooks - title: {}", sectionId, title);
        try {
            EbookDTO.CreateEbookRequest request = new EbookDTO.CreateEbookRequest();
            request.setTitle(title);
            request.setDescription(description);
            request.setPageCount(pageCount != null ? Integer.parseInt(pageCount) : null);

            EbookDTO.EbookResponse created = ebookService.createEbook(sectionId, request, ebookFile, coverImage);
            return new ResponseEntity<>(
                    ApiResponse.success(created, "Ebook uploaded and created successfully."),
                    HttpStatus.CREATED);

        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating ebook: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create ebook: " + e.getMessage()));
        }
    }

    // ─── Update ──────────────────────────────────────────────────────────────

    /**
     * Updates ebook metadata and/or replaces files.
     * All parts are optional — only supply what needs to change.
     * If pptFile or coverImage is supplied, old file is deleted from Spaces and replaced.
     *
     * Request type : multipart/form-data
     * Parts:
     *   - title        (optional, text)
     *   - description  (optional, text)
     *   - pageCount    (optional, text)
     *   - ebookFile    (optional, file) — replaces existing file in Spaces
     *   - coverImage   (optional, file) — replaces existing cover image in Spaces
     */
    @PutMapping(
        value = "/ebooks/{ebookId}",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ApiResponse<EbookDTO.EbookResponse>> updateEbook(
            @PathVariable Long ebookId,
            @RequestPart(value = "title",        required = false)   String title,
            @RequestPart(value = "description",  required = false)   String description,
            @RequestPart(value = "pageCount",    required = false)   String pageCount,
            @RequestPart(value = "ebookFile",    required = false)   MultipartFile ebookFile,
            @RequestPart(value = "coverImage",   required = false)   MultipartFile coverImage) {

        logger.info("API hit: PUT /api/ebooks/{}", ebookId);
        try {
            EbookDTO.UpdateEbookRequest request = new EbookDTO.UpdateEbookRequest();
            request.setTitle(title);
            request.setDescription(description);
            request.setPageCount(pageCount != null ? Integer.parseInt(pageCount) : null);

            EbookDTO.EbookResponse updated = ebookService.updateEbook(ebookId, request, ebookFile, coverImage);
            return ResponseEntity.ok(ApiResponse.success(updated, "Ebook updated successfully."));

        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating ebook {}: {}", ebookId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update ebook: " + e.getMessage()));
        }
    }

    // ─── Get by ID ────────────────────────────────────────────────────────────

    /**
     * Returns ebook details with a fresh 15-minute presigned viewUrl.
     * Students can view inline but cannot download.
     */
    @GetMapping("/ebooks/{ebookId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<EbookDTO.EbookResponse>> getEbookById(
            @PathVariable Long ebookId) {

        logger.info("API hit: GET /api/ebooks/{}", ebookId);
        try {
            EbookDTO.EbookResponse ebook = ebookService.getEbookById(ebookId);
            return ResponseEntity.ok(ApiResponse.success(ebook, "Ebook retrieved successfully."));
        } catch (ResourceNotFoundException e) {
            logger.warn("Ebook not found: {}", ebookId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error retrieving ebook {}: {}", ebookId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred."));
        }
    }

    // ─── Get All ──────────────────────────────────────────────────────────────

    @GetMapping("/ebooks")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<Page<EbookDTO.EbookResponse>>> getAllEbooks(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        logger.info("API hit: GET /api/ebooks?page={}&size={}", page, size);
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<EbookDTO.EbookResponse> ebooks = ebookService.getAllEbooks(pageable);
            return ResponseEntity.ok(ApiResponse.success(ebooks, "Ebooks retrieved successfully."));
        } catch (Exception e) {
            logger.error("Error retrieving ebooks: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred."));
        }
    }

    // ─── Delete ──────────────────────────────────────────────────────────────

    /**
     * Deletes the ebook record AND removes both PPT and cover image from Spaces.
     */
    @DeleteMapping("/ebooks/{ebookId}")
    public ResponseEntity<ApiResponse<Void>> deleteEbook(@PathVariable Long ebookId) {
        logger.info("API hit: DELETE /api/ebooks/{}", ebookId);
        try {
            ebookService.deleteEbook(ebookId);
            return ResponseEntity.ok(ApiResponse.success(null, "Ebook deleted successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error deleting ebook {}: {}", ebookId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred."));
        }
    }
}