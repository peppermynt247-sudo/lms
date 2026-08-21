package courses.abc.atoms.features.course.controllers;

import courses.abc.atoms.core.dto.ApiResponse;
import courses.abc.atoms.features.course.dto.ContentItemDTO;
import courses.abc.atoms.features.course.services.ContentItemService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/content-items")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
public class ContentItemController {

    private static final Logger logger = LoggerFactory.getLogger(ContentItemController.class);
    private final ContentItemService contentItemService;

    /**
     * Endpoint for partially updating a content item's metadata.
     * This is ideal for actions like publishing/unpublishing an item or changing its order.
     * @param itemId The ID of the ContentItem wrapper to update.
     * @param request The request body containing the fields to be updated.
     */
    @PatchMapping("/{itemId}")
    public ResponseEntity<ApiResponse<Void>> updateContentItemMetadata(
            @PathVariable Long itemId,
            @RequestBody ContentItemDTO.MetadataUpdateRequest request) {
        logger.info("API hit: PATCH /api/content-items/{}", itemId);
        try {
            contentItemService.updateContentItemMetadata(itemId, request);
            return ResponseEntity.ok(ApiResponse.success("Content item metadata updated successfully."));
        } catch (Exception e) {
            logger.error("Error updating metadata for content item {}: {}", itemId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while updating metadata."));
        }
    }

    /**
     * Endpoint for deleting a content item (which will cascade to the linked resource).
     */
    @DeleteMapping("/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deleteContentItem(@PathVariable Long itemId) {
        logger.info("API hit: DELETE /api/content-items/{}", itemId);
        try {
            contentItemService.deleteContentItem(itemId);
            return ResponseEntity.ok(ApiResponse.success("Content item and associated resource deleted successfully."));
        } catch (Exception e) {
            logger.error("Error deleting content item {}: {}", itemId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred during deletion."));
        }
    }
}