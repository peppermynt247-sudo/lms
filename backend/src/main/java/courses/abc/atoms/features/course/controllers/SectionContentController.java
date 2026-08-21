package courses.abc.atoms.features.course.controllers;

import courses.abc.atoms.core.dto.ApiResponse;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.features.course.dto.SectionContentDTO;
import courses.abc.atoms.features.course.services.ContentItemService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/curriculum-sections/{sectionId}/content")
@RequiredArgsConstructor
public class SectionContentController {

    private static final Logger logger = LoggerFactory.getLogger(SectionContentController.class);
    private final ContentItemService contentItemService;

    @GetMapping("")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<SectionContentDTO>> getContentForSection(@PathVariable Integer sectionId) {
        logger.info("API hit: GET /api/curriculum-sections/{}/content", sectionId);
        try {
            SectionContentDTO sectionContent = contentItemService.getContentForSection(sectionId);
            return ResponseEntity.ok(ApiResponse.success(sectionContent, "Section content retrieved successfully."));
        } catch (ResourceNotFoundException e) {
            logger.warn("Failed to get section content. Resource not found for section {}: {}", sectionId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error retrieving content for section {}: {}", sectionId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while retrieving section content."));
        }
    }
}
