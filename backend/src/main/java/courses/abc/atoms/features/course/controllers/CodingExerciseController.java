package courses.abc.atoms.features.course.controllers;

import courses.abc.atoms.core.dto.UserDTO;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.core.services.UserService;
import courses.abc.atoms.features.course.dto.CodeSubmissionDTO;
import courses.abc.atoms.features.course.dto.CodingExerciseDTO;
import courses.abc.atoms.features.course.dto.CodingTestCaseDTO;
import courses.abc.atoms.features.course.services.CodeSubmissionService;
import courses.abc.atoms.features.course.services.CodingExerciseService;
import courses.abc.atoms.features.course.services.Judge0IntegrationService;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/codingexercise")
public class CodingExerciseController {

    private static final Logger logger = LoggerFactory.getLogger(CodingExerciseController.class);

    @Autowired
    private CodingExerciseService codingExerciseService;

    @Autowired
    private Judge0IntegrationService judge0Service;

    @Autowired
    private CodeSubmissionService codeSubmissionService;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createCodingExercise(
            @RequestParam("curriculumsectionId") Integer curriculumSectionId,
            @Valid @RequestBody CodingExerciseDTO.CreateRequest request) {
        logger.info("Request to create coding exercise for curriculumSectionId: {}", curriculumSectionId);

        try {
            CodingExerciseDTO.Response response = codingExerciseService.createCodingExercise(curriculumSectionId, request);
            logger.info("Successfully created coding exercise for curriculumSectionId: {}", curriculumSectionId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (EntityNotFoundException e) {
            logger.error("Failed to create coding exercise: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("Failed to create coding exercise: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Failed to create coding exercise: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create coding exercise: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getByCodingExerciseId(@PathVariable("id") Long id) {
        logger.info("Request to get coding exercise by id: {}", id);
        try {
            UserDTO.UserResponse currentUserDto = userService.getCurrentUser();
            Users currentUser = userRepository.findById(currentUserDto.getId())
                    .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found in database."));

            CodingExerciseDTO.Response response = codingExerciseService.getByCodingExerciseId(id, currentUser);
            return ResponseEntity.status(HttpStatus.OK).body(response);
        } catch (EntityNotFoundException e) {
            logger.error("Coding exercise not found: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Failed to get coding exercise: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to get coding exercise: " + e.getMessage());
        }
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteByCodingExerciseId(@PathVariable("id") Long id) {
        logger.info("Request to delete coding exercise by id: {}", id);
        try {
            codingExerciseService.deleteByCodingExerciseId(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "ELAB deleted successfully");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (EntityNotFoundException e) {
            logger.error("Coding exercise not found: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Failed to delete coding exercise: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete coding exercise: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCodingExercise(
            @PathVariable("id") long id,
            @Valid @RequestBody CodingExerciseDTO.UpdateRequest request) {
        logger.info("Request to update coding exercise with id: {}", id);
        try {
            CodingExerciseDTO.Response response = codingExerciseService.updateCodingExercise(id, request);
            logger.info("Successfully updated coding exercise with id: {}", id);
            return ResponseEntity.status(HttpStatus.OK).body(response);
        } catch (EntityNotFoundException e) {
            logger.error("Coding exercise not found: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("Failed to update coding exercise: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Failed to update coding exercise: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update coding exercise: " + e.getMessage());
        }
    }



    @PostMapping("/run")
    public ResponseEntity<?> runCode(@RequestBody CodingExerciseDTO.RunCodeRequestDTO runRequest) {
        try {
            // Validate input
            if (runRequest == null || runRequest.getCodingExerciseId() == null || runRequest.getSourceCode() == null || runRequest.getLanguageId() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Missing required fields: codingExerciseId, sourceCode, or languageId");
            }

            // Fetch coding exercise by ID
            Long codingExerciseId = runRequest.getCodingExerciseId().longValue();
            Users currentUser = userRepository.findById(userService.getCurrentUser().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found in database."));

            CodingExerciseDTO.Response exercise = codingExerciseService.getByCodingExerciseId(codingExerciseId, currentUser);

            List<CodingTestCaseDTO.Response> visibleTestCases = exercise.getTestCases().stream()
                    .filter(tc -> tc.getIsHidden() != null && !tc.getIsHidden())
                    .collect(Collectors.toList());

            if (visibleTestCases.isEmpty()) {
                return ResponseEntity.badRequest().body("No visible test cases available to run.");
            }

            logger.debug("Running code against {} visible test cases for exercise ID: {}", visibleTestCases.size(), codingExerciseId);

            // Use batch processing for test cases
            List<CodingExerciseDTO.RunCodeResponseDTO> responses = judge0Service.runCodeBatch(
                    runRequest.getSourceCode(),
                    runRequest.getLanguageId(),
                    visibleTestCases
            );

            return ResponseEntity.ok(responses);
        } catch (EntityNotFoundException e) {
            logger.error("Exercise not found for ID: {}", runRequest.getCodingExerciseId(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Failed to run code for exercise ID: {}", runRequest.getCodingExerciseId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to run code: " + e.getMessage());
        }
    }

    /**
     * Submits the user's code for final grading against ALL test cases (visible and hidden).
     * This action SAVES the submission result to the database.
     */
    @PostMapping("/submit")
    public ResponseEntity<?> submitCode(@RequestBody CodingExerciseDTO.RunCodeRequestDTO submitRequest) {
        try {
            Users currentUser = userRepository.findById(userService.getCurrentUser().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found in database."));

            Long codingExerciseId = submitRequest.getCodingExerciseId().longValue();
            CodingExerciseDTO.Response exercise = codingExerciseService.getByCodingExerciseId(codingExerciseId, currentUser);

            List<CodingTestCaseDTO.Response> hiddenTestCases = exercise.getTestCases().stream()
                    .filter(tc -> tc.getIsHidden() != null && tc.getIsHidden())
                    .collect(Collectors.toList());

            if (hiddenTestCases.isEmpty()) {
                return ResponseEntity.badRequest().body("This exercise has no hidden test cases to submit against for grading.");
            }

            logger.debug("Submitting code against {} hidden test cases for exercise ID: {} by user: {}",
                    hiddenTestCases.size(), codingExerciseId, currentUser.getEmail());

            List<CodingExerciseDTO.RunCodeResponseDTO> results = judge0Service.runCodeBatch(
                    submitRequest.getSourceCode(),
                    submitRequest.getLanguageId(),
                    hiddenTestCases
            );

            CodeSubmissionDTO.SubmissionResultResponse submissionResult = codeSubmissionService.saveSubmission(submitRequest, results, currentUser, hiddenTestCases);
            logger.info("Saved final submission with ID: {}", submissionResult.getSubmissionId());

            return ResponseEntity.ok(submissionResult);

        } catch (IllegalStateException e) {
            logger.warn("User {} submission blocked for exercise {}: {}",
                    userService.getCurrentUser().getEmail(),
                    submitRequest.getCodingExerciseId(),
                    e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (ResourceNotFoundException e) {
            logger.warn("Submission failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Failed to submit code for exercise ID: {}", submitRequest.getCodingExerciseId(), e);
            return ResponseEntity.internalServerError().body("Failed to submit code: " + e.getMessage());
        }
    }

    // Gets a paginated list of all submission attempts for a specific exercise.
    @GetMapping("/{exerciseId}/attempts")
    public ResponseEntity<?> getAllAttempts(
            @PathVariable Long exerciseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            Users currentUser = userRepository.findById(userService.getCurrentUser().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found in database."));

            Pageable pageable = PageRequest.of(page, size);
            Page<CodeSubmissionDTO.AttemptSummaryResponse> attempts = codeSubmissionService.getAllAttemptsForExercise(exerciseId, currentUser, pageable);

            return ResponseEntity.ok(attempts);
        } catch (Exception e) {
            logger.error("Failed to retrieve attempts for exercise ID {}: {}", exerciseId, e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to retrieve attempts: " + e.getMessage());
        }
    }

    // Gets the full details of a specific submission attempt.
    @GetMapping("/attempts/{attemptId}")
    public ResponseEntity<?> getAttemptById(@PathVariable Long attemptId) {
        try {
            Users currentUser = userRepository.findById(userService.getCurrentUser().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found in database."));

            CodeSubmissionDTO.AttemptDetailResponse attempt = codeSubmissionService.getAttemptById(attemptId, currentUser);
            return ResponseEntity.ok(attempt);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Failed to retrieve attempt ID {}: {}", attemptId, e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to retrieve attempt: " + e.getMessage());
        }
    }
}