package courses.abc.atoms.features.course.controllers;

import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.features.course.dto.CourseDTO;
import courses.abc.atoms.features.payment.model.PaymentPlans;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import courses.abc.atoms.features.course.dto.CourseBundleDTO;
import courses.abc.atoms.features.course.services.CourseBundleService;

import java.util.Map;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/course-bundles")
@PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
public class CourseBundleController {

    private static final Logger logger = LoggerFactory.getLogger(CourseBundleController.class);

    @Autowired
    private CourseBundleService courseBundleService;

    @PostMapping
    public ResponseEntity<CourseBundleDTO.CourseBundleResponseDTO> createCourseBundle(
            @ModelAttribute CourseBundleDTO.CourseBundleRequestDTO request) {
        try {
            CourseBundleDTO.CourseBundleResponseDTO response = courseBundleService.createCourseBundle(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @PutMapping("/{bundleId}")
    public ResponseEntity<CourseBundleDTO.CourseBundleResponseDTO> updateCourseBundle(
            @PathVariable Long bundleId,
            @ModelAttribute CourseBundleDTO.UpdateCourseBundleRequestDTO request) {
        try {
            CourseBundleDTO.CourseBundleResponseDTO response = courseBundleService.updateCourseBundle(bundleId, request);
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (Exception e) {
            logger.error("Error updating bundle with id {}", bundleId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping
    public ResponseEntity<List<CourseBundleDTO.CourseBundleResponseDTO>> getAllBundles() {
        try {
            List<CourseBundleDTO.CourseBundleResponseDTO> response = courseBundleService.getAllBundles();
            return ResponseEntity.status(HttpStatus.OK).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

@PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR', 'STUDENT')")
    @GetMapping("/{bundleId}")
    public ResponseEntity<CourseBundleDTO.CourseBundleResponseDTO> getBundleById(
            @PathVariable Long bundleId) {
        try {
            CourseBundleDTO.CourseBundleResponseDTO response = courseBundleService.getBundleById(bundleId);
            return ResponseEntity.status(HttpStatus.OK).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @PostMapping("/link")
    public ResponseEntity<Map<String, Object>> linkCourseToBundle(
            @RequestBody CourseBundleDTO.LinkCourseToBundleDTO request) {
        try {
            Map<String, Object> response = courseBundleService.linkCourseToBundle(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", "Failed to link course to bundle"));
        }
    }

    @PostMapping("/unlink")
    public ResponseEntity<Map<String, Object>> unLinkCourseToBundle(
            @RequestBody CourseBundleDTO.LinkCourseToBundleDTO request) {
        try {
            Map<String, Object> response = courseBundleService.unlinkCourseToBundle(request);
            return ResponseEntity.status(HttpStatus.OK).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", "Failed to unlink course from bundle"));
        }
    }

    @PutMapping("{bundleId}/archive")
    public ResponseEntity<Map<String, Object>> archiveBundle(
            @PathVariable Long bundleId) {
        try {
            Map<String, Object> response = courseBundleService.archiveBundle(bundleId);
            return ResponseEntity.status(HttpStatus.OK).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", "Failed to archive bundle"));
        }
    }

    @PutMapping("/{bundleId}/unarchive")
    public ResponseEntity<Map<String, Object>> unarchiveBundle(
            @PathVariable Long bundleId) {
        try {
            Map<String, Object> response = courseBundleService.unarchiveBundle(bundleId);
            return ResponseEntity.status(HttpStatus.OK).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", "Failed to unarchive bundle"));
        }
    }

    @PostMapping("/{bundleId}/plans")
    public ResponseEntity<Map<String, Object>> addPlanToBundle(
            @PathVariable Long bundleId,
            @Valid @RequestBody CourseBundleDTO.PlanRequest planRequest) {

        logger.info("API hit: Request to add plan ID {} to bundle ID {}", planRequest.getPlanId(), bundleId);
        try {
            courseBundleService.addPlanToBundle(bundleId, planRequest.getPlanId());
            String message = String.format("Payment plan successfully added to bundle %d.", bundleId);
            return ResponseEntity.ok(Map.of("status", "success", "message", message));
        } catch (ResourceNotFoundException e) {
            logger.warn("Failed to add plan to bundle. Resource not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("status", "error", "message", e.getMessage()));
        }
        catch (IllegalStateException e) {
            logger.error("Invalid request to add plan to bundle: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("status", "error", "message", e.getMessage()));
        }
        catch (Exception e) {
            logger.error("An unexpected error occurred while adding plan to bundle {}: {}", bundleId, e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", "An unexpected error occurred."));
        }
    }

    @GetMapping("/{bundleId}/plans")
    public ResponseEntity<List<PaymentPlans>> getPlansForBundle(@PathVariable Long bundleId) {
        List<PaymentPlans> plans = courseBundleService.getPlansForBundle(bundleId);
        return ResponseEntity.ok(plans);
    }

    /**
     * Endpoint to update the pricing and validity for a bundle.
     */
    @PutMapping("/{bundleId}/pricing")
    public ResponseEntity<Map<String, Object>> updateBundlePricing(
            @PathVariable Long bundleId,
            @RequestBody CourseBundleDTO.PricingRequest pricingRequest) {
        try {
            courseBundleService.updateBundlePricing(bundleId, pricingRequest);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Bundle pricing updated successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    /**
     * Endpoint to update the publish status for a bundle.
     */
    @PatchMapping("/{bundleId}/publish")
    public ResponseEntity<Map<String, Object>> setBundlePublishStatus(
            @PathVariable Long bundleId,
            @Valid @RequestBody CourseBundleDTO.PublishRequest request) {
        try {
            courseBundleService.setBundlePublishStatus(bundleId, request.getIsPublished());
            return ResponseEntity.ok(Map.of("status", "success", "message", "Bundle publish status updated successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @GetMapping("/{bundleId}/pricing-details")
    @PreAuthorize("permitAll")
    public ResponseEntity<Map<String, Object>> getBundlePricingDetails(@PathVariable Long bundleId) {
        try {
            CourseDTO.PricingAndPlansResponses response = courseBundleService.getBundlePricingAndPlans(bundleId);
            return ResponseEntity.ok(Map.of("status", "success", "data", response));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}