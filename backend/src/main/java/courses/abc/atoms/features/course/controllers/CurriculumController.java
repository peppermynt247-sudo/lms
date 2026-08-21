package courses.abc.atoms.features.course.controllers;

import courses.abc.atoms.features.course.dto.CurriculumDTO;
import courses.abc.atoms.features.course.services.CurriculumService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/curriculums")
@PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
public class CurriculumController {

    private static final Logger logger = LoggerFactory.getLogger(CurriculumController.class);

    @Autowired
    private CurriculumService curriculumService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createCurriculum(
            @Valid @RequestBody CurriculumDTO.CurriculumCreateRequest curriculumRequest) {
        logger.info("API hit: Request to create a new curriculum with title: {}", curriculumRequest.getTitle());
        try {
            CurriculumDTO.CurriculumResponse createdCurriculum = curriculumService.createCurriculum(curriculumRequest);
            logger.info("Successfully created curriculum with ID: {}", createdCurriculum.getCurriculumId());
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Curriculum created successfully");
            response.put("data", createdCurriculum);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            logger.error("An unexpected error occurred while creating curriculum '{}': {}", curriculumRequest.getTitle(), e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An unexpected error occurred while creating the curriculum.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllCurriculums() {
        logger.info("API hit: Request to retrieve all curriculums");
        try {
            List<CurriculumDTO.CurriculumResponse> curriculums = curriculumService.getAllCurriculums();
            logger.info("Successfully retrieved {} curriculums", curriculums.size());
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Curriculums retrieved successfully");
            response.put("data", curriculums);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Unexpected error retrieving curriculums: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An unexpected error occurred while retrieving curriculums.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getCurriculumById(@PathVariable Integer id) {
        logger.info("API hit: Request to retrieve curriculum with ID: {}", id);
        try {
            CurriculumDTO.CurriculumResponse curriculum = curriculumService.getCurriculumById(id);
            logger.info("Successfully retrieved curriculum with ID: {}", id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Curriculum retrieved successfully");
            response.put("data", curriculum);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            logger.error("Error retrieving curriculum with ID {}: {}", id, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Curriculum not found with ID: " + id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            logger.error("Unexpected error retrieving curriculum with ID {}: {}", id, e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An unexpected error occurred while retrieving the curriculum.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateCurriculum(
            @PathVariable Integer id,
            @Valid @RequestBody CurriculumDTO.CurriculumCreateRequest curriculumRequest) {
        logger.info("API hit: Request to update curriculum with ID: {}", id);
        try {
            CurriculumDTO.CurriculumResponse updatedCurriculum = curriculumService.updateCurriculum(id, curriculumRequest);
            logger.info("Successfully updated curriculum with ID: {}", updatedCurriculum.getCurriculumId());
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Curriculum updated successfully");
            response.put("data", updatedCurriculum);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            logger.error("Error updating curriculum with ID {}: {}", id, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Curriculum not found with ID: " + id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            logger.error("Unexpected error updating curriculum with ID {}: {}", id, e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An unexpected error occurred while updating the curriculum.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteCurriculum(@PathVariable Integer id) {
        logger.info("API hit: Request to delete curriculum with ID: {}", id);
        try {
            curriculumService.deleteCurriculum(id);
            logger.info("Successfully deleted curriculum with ID: {}", id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Curriculum deleted successfully");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            logger.error("Error deleting curriculum with ID {}: {}", id, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Curriculum not found with ID: " + id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            logger.error("Unexpected error deleting curriculum with ID {}: {}", id, e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An unexpected error occurred while deleting the curriculum.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }


        // ─── Get Curriculums by Course ID ─────────────────────────────────────────

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<Map<String, Object>> getCurriculumsByCourseId(@PathVariable Integer courseId) {
        logger.info("API hit: Request to retrieve curriculums for courseId: {}", courseId);
        try {
            List<CurriculumDTO.CurriculumResponse> curriculums = curriculumService.getCurriculumsByCourseId(courseId);
            logger.info("Successfully retrieved {} curriculums for courseId: {}", curriculums.size(), courseId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Curriculums retrieved successfully");
            response.put("data", curriculums);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            logger.error("Error retrieving curriculums for courseId {}: {}", courseId, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Course not found with ID: " + courseId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            logger.error("Unexpected error retrieving curriculums for courseId {}: {}", courseId, e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An unexpected error occurred while retrieving curriculums.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

}
