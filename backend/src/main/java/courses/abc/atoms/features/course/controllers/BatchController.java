package courses.abc.atoms.features.course.controllers;

import courses.abc.atoms.core.dto.ApiResponse;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.features.course.dto.BatchDTO;
import courses.abc.atoms.features.course.services.BatchService;
import courses.abc.atoms.core.dto.UserDTO; 
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
public class BatchController {

    private static final Logger logger = LoggerFactory.getLogger(BatchController.class);

    @Autowired
    private BatchService batchService;

    /**
     * Creates a new batch.
     *
     * @param request the batch creation request containing necessary details
     * @param bundleId optional bundle ID to create batch from a bundle
     * @return ResponseEntity with the created batch details and appropriate HTTP status
     */
    @PostMapping("/batches")
    public ResponseEntity<ApiResponse<BatchDTO.BatchResponse>> createBatch(
            @Valid @RequestBody BatchDTO.BatchCreateRequest request,
            @RequestParam(required = false) Long bundleId
    ) {
        logger.info("API hit: POST /api/batches with name: {} and bundleId: {}", request.getBatchName(), bundleId);
        
        try {
            BatchDTO.BatchResponse createdBatch = batchService.createBatch(request, bundleId);
            logger.info("Successfully created batch with ID: {}", createdBatch.getBatchId());
            return new ResponseEntity<>(ApiResponse.success(createdBatch, "Batch created successfully"), HttpStatus.CREATED);
        } catch (ResourceNotFoundException e) {
            logger.warn("Failed to create batch, resource not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
        catch (IllegalStateException e) {
            logger.warn("Invalid request to create batch: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
        catch (Exception e) {
            logger.error("An unexpected error occurred while creating batch: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred."));
        }
    }

    /**
     * Updates an existing batch.
     *
     * @param id      the ID of the batch to update
     * @param request the batch update request containing updated details
     * @return ResponseEntity with the updated batch details and appropriate HTTP status
     */
    @PutMapping("/batches/{id}")
    public ResponseEntity<ApiResponse<BatchDTO.BatchResponse>> updateBatch(@PathVariable Long id, @Valid @RequestBody BatchDTO.BatchUpdateRequest request) {
        logger.info("API hit: PUT /api/batches/{}", id);
        try {
            BatchDTO.BatchResponse updatedBatch = batchService.updateBatch(id, request);
            return ResponseEntity.ok(ApiResponse.success(updatedBatch, "Batch updated successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
        catch (IllegalStateException e) {
            logger.warn("Invalid request to update batch {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
        catch (Exception e) {
            logger.error("Error updating batch with ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("An unexpected error occurred."));
        }
    }
    
    /**
     * Retrieves a list of potential batch managers.
     *
     * @return ResponseEntity with a list of potential batch managers and appropriate HTTP status
     */
    @GetMapping("/batches/potential-managers")
    public ResponseEntity<ApiResponse<List<BatchDTO.ManagerResponse>>> getPotentialBatchManagers() {
        logger.info("API hit: GET /api/batches/potential-managers");
        try {
            List<BatchDTO.ManagerResponse> managers = batchService.findPotentialBatchManagers();
            logger.info("Successfully retrieved {} potential batch managers.", managers.size());
            return ResponseEntity.ok(ApiResponse.success(managers, "Potential batch managers retrieved successfully."));
        } catch (Exception e) {
            logger.error("An unexpected error occurred while retrieving potential batch managers: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred."));
        }
    }

    /**
     * Retrieves all batches with optional status filtering.
     *
     * @param status  optional status filter for batches
     * @param pageable pagination information
     * @return ResponseEntity with a paginated list of batches and appropriate HTTP status
     */
    @GetMapping("/batches")
    public ResponseEntity<ApiResponse<Page<BatchDTO.BatchResponse>>> getAllBatches(
            @RequestParam(required = false) String status,
            Pageable pageable) {
        logger.info("API hit: GET /api/batches with status filter: {}", status);
        try {
            Page<BatchDTO.BatchResponse> batches = batchService.getAllBatches(status, pageable);
            logger.info("Successfully retrieved {} batches.", batches.getTotalElements());
            return ResponseEntity.ok(ApiResponse.success(batches, "Batches retrieved successfully."));
        } catch (Exception e) {
            logger.error("An unexpected error occurred while retrieving batches: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred."));
        }
    }
    
    /**
     * Retrieves a batch by its ID.
     *
     * @param id the ID of the batch to retrieve
     * @return ResponseEntity with the batch details and appropriate HTTP status
     */
    @GetMapping("/batches/{id}")
    public ResponseEntity<ApiResponse<BatchDTO.BatchResponse>> getBatchById(@PathVariable Long id) {
        logger.info("API hit: GET /api/batches/{}", id);
        try {
            BatchDTO.BatchResponse batch = batchService.getBatchById(id);
            logger.info("Successfully retrieved batch with ID: {}", id);
            return ResponseEntity.ok(ApiResponse.success(batch, "Batch retrieved successfully."));
        } catch (ResourceNotFoundException e) {
            logger.warn("Batch not found with ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
             logger.error("Error retrieving batch with ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("An unexpected error occurred."));
        }
    }
    
    /**
     * Updates the status of a batch.
     *
     * @param id      the ID of the batch to update
     * @param request the batch status update request containing the new status
     * @return ResponseEntity with the updated batch details and appropriate HTTP status
     */
    @PatchMapping("/batches/{id}/status")
    public ResponseEntity<ApiResponse<BatchDTO.BatchResponse>> updateBatchStatus(
            @PathVariable Long id,
            @Valid @RequestBody BatchDTO.BatchStatusUpdateRequest request) {
        logger.info("API hit: PATCH /api/batches/{}/status to {}", id, request.getStatus());
        try {
            BatchDTO.BatchResponse updatedBatch = batchService.updateBatchStatus(id, request);
            logger.info("Successfully updated status for batch ID: {}", id);
            return ResponseEntity.ok(ApiResponse.success(updatedBatch, "Batch status updated successfully."));
        } catch (ResourceNotFoundException e) {
            logger.warn("Cannot update status, batch not found with ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("An unexpected error occurred while updating status for batch ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred."));
        }
    }

    /**
     * Sets a specific batch as the primary default for a specific course.
     */
    @PutMapping("/courses/{courseId}/batches/{batchId}/set-default")
    public ResponseEntity<Map<String, Object>> setPrimaryDefaultBatch(
            @PathVariable Long courseId,
            @PathVariable Long batchId) {

        logger.info("API hit: Request to set batch {} as primary default for course {}", batchId, courseId);
        try {
            batchService.setPrimaryDefaultBatchForCourse(courseId, batchId);
            String message = String.format("Batch %d is now default for course %d.", batchId, courseId);
            return ResponseEntity.ok(Map.of("status", "success", "message", message));
        } catch (ResourceNotFoundException e) {
            logger.warn("Failed to set default batch. Resource not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("status", "error", "message", e.getMessage()));
        } catch (IllegalStateException e) {
            logger.error("Invalid request to set default batch: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("status", "error", "message", e.getMessage()));
        } catch (Exception e) {
            logger.error("An unexpected error occurred while setting the default batch: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", "An unexpected error occurred."));
        }
    }

    /**
     * Sets a specific batch as the primary default for a specific course bundle.
     */
    @PutMapping("/course-bundles/{bundleId}/batches/{batchId}/set-default")
    public ResponseEntity<Map<String, Object>> setPrimaryDefaultBatchForBundle(
            @PathVariable Long bundleId,
            @PathVariable Long batchId) {

        logger.info("API hit: Request to set batch {} as primary default for bundle {}", batchId, bundleId);
        try {
            batchService.setPrimaryDefaultBatchForBundle(bundleId, batchId);
            String message = String.format("Batch %d is now default for bundle %d.", batchId, bundleId);
            return ResponseEntity.ok(Map.of("status", "success", "message", message));
        } catch (ResourceNotFoundException e) {
            logger.warn("Failed to set default batch. Resource not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("status", "error", "message", e.getMessage()));
        } catch (IllegalStateException e) {
            logger.error("Invalid request to set default batch: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("status", "error", "message", e.getMessage()));
        } catch (Exception e) {
            logger.error("An unexpected error occurred while setting the default batch: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", "An unexpected error occurred."));
        }
    }

    /**
     * Deletes a batch by its ID.
     *
     * @param id the ID of the batch to delete
     * @return ResponseEntity with success message and appropriate HTTP status
     */
    @DeleteMapping("/batches/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBatch(@PathVariable Long id) {
        logger.info("API hit: DELETE /api/batches/{}", id);
        try {
            batchService.deleteBatch(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Batch deleted successfully."));
        } catch (ResourceNotFoundException e) {
            logger.warn("Cannot delete, batch not found with ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("An unexpected error occurred while deleting batch ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred."));
        }
    }

    @GetMapping("/courses/{courseId}/batches")
    public ResponseEntity<ApiResponse<List<BatchDTO.BatchResponse>>> getBatchesForCourse(@PathVariable Long courseId) {
        logger.info("API hit: GET /api/courses/{}/batches", courseId);
        List<BatchDTO.BatchResponse> batches = batchService.getBatchesByCourseId(courseId);
        return ResponseEntity.ok(ApiResponse.success(batches, "Batches for course retrieved successfully."));
    }


    @GetMapping("/course-bundles/{bundleId}/batches")
    public ResponseEntity<ApiResponse<List<BatchDTO.BatchResponse>>> getBatchesForBundle(@PathVariable Long bundleId) {
        List<BatchDTO.BatchResponse> batches = batchService.getBatchesByBundleId(bundleId);
        return ResponseEntity.ok(ApiResponse.success(batches, "Batches for bundle retrieved successfully."));
    }

    /**
     * Retrieves the default batch for a given course or bundle.
     * Use EITHER courseId OR bundleId as a request parameter.
     */
    @GetMapping("/batches/default-batch")
    public ResponseEntity<ApiResponse<BatchDTO.DefaultBatchInfo>> getDefaultBatchInfo(
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Long bundleId) {

        try {
            // --- Input Validation ---
            if (courseId != null && bundleId != null) {
                throw new IllegalArgumentException("Please provide either a courseId or a bundleId, but not both.");
            }

            BatchDTO.DefaultBatchInfo defaultBatch;

            if (courseId != null) {
                logger.info("Public API hit: GET /api/public/default-batch?courseId={}", courseId);
                defaultBatch = batchService.getDefaultBatchForCourse(courseId);
            } else if (bundleId != null) {
                logger.info("Public API hit: GET /api/public/default-batch?bundleId={}", bundleId);
                defaultBatch = batchService.getDefaultBatchForBundle(bundleId);
            } else {
                throw new IllegalArgumentException("A courseId or a bundleId is required.");
            }

            return ResponseEntity.ok(ApiResponse.success(defaultBatch, "Default batch retrieved successfully."));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }
}