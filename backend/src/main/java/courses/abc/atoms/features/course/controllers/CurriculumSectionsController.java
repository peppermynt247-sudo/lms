package courses.abc.atoms.features.course.controllers;

import courses.abc.atoms.core.dto.ApiResponse;
import courses.abc.atoms.core.services.UserService;
import courses.abc.atoms.features.course.dto.CurriculumDTO;
import courses.abc.atoms.features.course.dto.CurriculumSectionsDTO;
import courses.abc.atoms.features.course.services.ContentItemService;
import courses.abc.atoms.features.course.services.CurriculumSectionsService;

import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/curriculumsections")
@PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
public class CurriculumSectionsController {

    private static final Logger logger = LoggerFactory.getLogger(CurriculumSectionsController.class);

    private final CurriculumSectionsService curriculumSectionsService;
    private final ContentItemService contentItemService;
    private final UserService userService;

    public CurriculumSectionsController(CurriculumSectionsService curriculumSectionsService, ContentItemService contentItemService, UserService userService) {
        this.curriculumSectionsService = curriculumSectionsService;
        this.contentItemService = contentItemService;
        this.userService = userService;
    }

    @PostMapping("")
    public ResponseEntity<?> createSection(
            @RequestParam Integer curriculumId,
            @Valid @RequestBody CurriculumSectionsDTO.CurriculumSectionCreateRequest request) {

        logger.info("API hit: Request to create curriculum section for curriculumId: {}", curriculumId);

        try {
            CurriculumSectionsDTO.CurriculumSectionResponse createdSection =
                    curriculumSectionsService.createCurriculumSection(curriculumId, request);
            logger.info("Successfully created curriculum section for curriculumId: {}", curriculumId);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdSection);
        } catch (IllegalArgumentException e) {
            logger.error("Failed to create curriculum section for curriculumId: {}. Error: {}", curriculumId, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR', 'STUDENT')")
    @GetMapping("")
    public ResponseEntity<?> getSectionsByCurriculumId(@RequestParam Integer curriculumId) {
        logger.info(" Request to retrieve curriculum sections for curriculumId: {}", curriculumId);

        try {
            List<CurriculumSectionsDTO.CurriculumSectionResponse> sections =
                    curriculumSectionsService.getCurriculumSectionsByCurriculumId(curriculumId);
            logger.info("Successfully retrieved curriculum sections for curriculumId: {}", curriculumId);
            return ResponseEntity.status(HttpStatus.OK).body(sections);
        } catch (IllegalArgumentException e) {
            logger.error("Failed to retrieve curriculum sections for curriculumId: {}. Error: {}", curriculumId, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/{sectionId}")
    public ResponseEntity<?> getSectionById(@PathVariable Integer sectionId) {
        logger.info("API hit: Request to retrieve curriculum section with ID: {}", sectionId);

        try {
            CurriculumSectionsDTO.CurriculumSectionResponse section =
                    curriculumSectionsService.getCurriculumSectionById(sectionId);
            logger.info("Successfully retrieved curriculum section with ID: {}", sectionId);
            return ResponseEntity.status(HttpStatus.OK).body(section);
        } catch (IllegalArgumentException e) {
            logger.error("Failed to retrieve curriculum section with ID: {}. Error: {}", sectionId, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
        }
    }
    

    @PatchMapping("/{sectionId}")
    public ResponseEntity<?> updateSection(
            @PathVariable Integer sectionId,
            @Valid @RequestBody CurriculumSectionsDTO.CurriculumSectionUpdateRequest request) {

        logger.info("API hit: Request to update curriculum section with ID: {}", sectionId);

        try {
            CurriculumSectionsDTO.CurriculumSectionResponse updatedSection =
                    curriculumSectionsService.updateCurriculumSection(sectionId, request);
            logger.info("Successfully updated curriculum section with ID: {}", sectionId);
            return ResponseEntity.status(HttpStatus.OK).body(updatedSection);
        } catch (IllegalArgumentException e) {
            logger.error("Failed to update curriculum section with ID: {}. Error: {}", sectionId, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{sectionId}")
    public ResponseEntity<Map<String, Object>> deleteSection(@PathVariable Integer sectionId) {
        logger.info("API hit: Request to delete curriculum section with ID: {}", sectionId);

        try {
            curriculumSectionsService.deleteCurriculumSection(sectionId);
            logger.info("Successfully deleted curriculum section with ID: {}", sectionId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Curriculum Section deleted successfully");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            logger.error("Failed to delete curriculum section with ID: {}. Error: {}", sectionId, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
        }
    }

    /**
     * ENDPOINT for lazy-loading section content.
     * GET /api/sections/{sectionId}/content
     *
     * @param sectionId The ID of the curriculum section.
     * @return A list of content item summaries for the frontend to display.
     */
    @GetMapping("/{sectionId}/content")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<ApiResponse<List<CurriculumDTO.ContentItemSummary>>> getSectionContent(
            @PathVariable Integer sectionId) {

        Long userId = userService.getCurrentUser().getId();
        List<CurriculumDTO.ContentItemSummary> contentItems = contentItemService.getContentSummariesForSection(sectionId, userId);

        return ResponseEntity.ok(ApiResponse.success(contentItems, "Section content retrieved successfully."));
    }
}