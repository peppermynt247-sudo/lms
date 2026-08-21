package courses.abc.atoms.features.course.controllers;

import courses.abc.atoms.core.dto.ApiResponse;
import courses.abc.atoms.core.exception.InvalidInputException;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.features.course.dto.ExerciseAttemptDTO;
import courses.abc.atoms.features.course.dto.ExerciseDTO;
import courses.abc.atoms.features.course.dto.QuestionResponseDTO;
import courses.abc.atoms.features.course.dto.StudentTestDTO;
import courses.abc.atoms.features.course.services.ExerciseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ExerciseController {

    private static final Logger logger = LoggerFactory.getLogger(ExerciseController.class);

    private final ExerciseService exerciseService;
    private final UserRepository userRepository;

    // =========================================================================
    // CRUD — Exercise Management (Admin / Instructor)
    // =========================================================================

    @PostMapping("/curriculum-sections/{sectionId}/exercises")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<ApiResponse<ExerciseDTO.Response>> createExercise(
            @PathVariable Integer sectionId,
            @Valid @RequestBody ExerciseDTO.CreateRequest request) {
        logger.info("POST /api/curriculum-sections/{}/exercises", sectionId);
        try {
            ExerciseDTO.Response response = exerciseService.createExerciseForSection(sectionId, request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Exercise created successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating exercise for section {}: {}", sectionId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while creating the exercise."));
        }
    }

    @GetMapping("/curriculum-sections/{sectionId}/exercises")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<ExerciseDTO.SummaryResponse>>> getExercisesForSection(
            @PathVariable Integer sectionId) {
        logger.info("GET /api/curriculum-sections/{}/exercises", sectionId);
        try {
            return ResponseEntity.ok(ApiResponse.success(
                    exerciseService.getAllExercisesBySection(sectionId),
                    "Exercises retrieved successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error retrieving exercises for section {}: {}", sectionId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while retrieving exercises."));
        }
    }

    @GetMapping("/exercises/{exerciseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<ExerciseDTO.Response>> getExerciseById(
            @PathVariable Integer exerciseId) {
        logger.info("GET /api/exercises/{}", exerciseId);
        try {
            return ResponseEntity.ok(ApiResponse.success(
                    exerciseService.getExerciseById(exerciseId),
                    "Exercise retrieved successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error retrieving exercise {}: {}", exerciseId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while retrieving the exercise."));
        }
    }

    @PutMapping("/exercises/{exerciseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<ApiResponse<ExerciseDTO.Response>> updateExercise(
            @PathVariable Integer exerciseId,
            @Valid @RequestBody ExerciseDTO.UpdateRequest request) {
        logger.info("PUT /api/exercises/{}", exerciseId);
        try {
            return ResponseEntity.ok(ApiResponse.success(
                    exerciseService.updateExercise(exerciseId, request),
                    "Exercise updated successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating exercise {}: {}", exerciseId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while updating the exercise."));
        }
    }

    @DeleteMapping("/exercises/{exerciseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<ApiResponse<Void>> deleteExercise(
            @PathVariable Integer exerciseId) {
        logger.info("DELETE /api/exercises/{}", exerciseId);
        try {
            exerciseService.deleteExercise(exerciseId);
            return ResponseEntity.ok(ApiResponse.success("Exercise deleted successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (InvalidInputException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error deleting exercise {}: {}", exerciseId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while deleting the exercise."));
        }
    }

    // =========================================================================
    // Test-Taking Flow — Questions
    // =========================================================================

    /**
     * Returns all questions for an exercise safe for student consumption.
     * Correct-answer flags are stripped. If {@code randomizeQuestions} is enabled
     * on the exercise the list is shuffled server-side.
     */
    @GetMapping("/exercises/{exerciseId}/questions")
    @PreAuthorize("hasAnyRole('STUDENT', 'INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<StudentTestDTO.StudentQuestion>>> getQuestionsForExercise(
            @PathVariable Integer exerciseId) {
        logger.info("GET /api/exercises/{}/questions", exerciseId);
        try {
            return ResponseEntity.ok(ApiResponse.success(
                    exerciseService.getQuestionsForExercise(exerciseId),
                    "Questions retrieved successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error retrieving questions for exercise {}: {}", exerciseId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while retrieving questions."));
        }
    }

    // =========================================================================
    // Test-Taking Flow — Attempt Lifecycle
    // =========================================================================

    /**
     * Starts a new attempt for the authenticated student.
     * The attempt number is computed server-side — clients cannot supply it.
     *
     */
    @PostMapping("/exercises/{exerciseId}/start")
    @PreAuthorize("hasAnyRole('STUDENT')")
    public ResponseEntity<ApiResponse<ExerciseAttemptDTO.ExerciseAttemptResponse>> startExerciseAttempt(
            @PathVariable Integer exerciseId,
            @Valid @RequestBody ExerciseAttemptDTO.ExerciseAttemptRequest request) {
        logger.info("POST /api/exercises/{}/start", exerciseId);
        try {
            Long currentUserId = getCurrentUserId();
            ExerciseAttemptDTO.ExerciseAttemptResponse response =
                    exerciseService.startExerciseAttempt(request, exerciseId, currentUserId);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Exercise attempt started successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (InvalidInputException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error starting attempt for exercise {}: {}", exerciseId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while starting the attempt."));
        }
    }

    /**
     * Saves or updates the authenticated student's answer for a single question
     * mid-attempt. Correctness is NOT evaluated here — deferred to {@code /complete}.
     * Returns the updated navigation-panel progress after saving.
     *
     */
    @PostMapping("/exercises/attempts/{attemptId}/answer")
    @PreAuthorize("hasAnyRole('STUDENT')")
    public ResponseEntity<ApiResponse<StudentTestDTO.AttemptProgressResponse>> saveAnswer(
            @PathVariable Long attemptId,
            @Valid @RequestBody QuestionResponseDTO.CompleteAttemptRequest request) {
        logger.info("POST /api/exercises/attempts/{}/answer — questionId: {}",
                attemptId, request.getQuestionId());
        try {
            Long currentUserId = getCurrentUserId();
            StudentTestDTO.AttemptProgressResponse progress =
                    exerciseService.saveAnswer(attemptId, request, currentUserId);
            return ResponseEntity.ok(ApiResponse.success(progress, "Answer saved successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (InvalidInputException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error saving answer for attempt {}: {}", attemptId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while saving the answer."));
        }
    }

    /**
     * Completes the attempt and runs full evaluation for all saved responses.
     * The request body may contain any remaining answers not yet saved via
     * {@code /answer} (for backwards-compatible "submit all at once" usage).
     *
     */
    @PostMapping("/exercises/attempts/{attemptId}/complete")
    @PreAuthorize("hasAnyRole('STUDENT')")
    public ResponseEntity<ApiResponse<ExerciseAttemptDTO.ExerciseAttemptResponse>> completeExerciseAttempt(
            @PathVariable Long attemptId,
            @Valid @RequestBody(required = false) List<QuestionResponseDTO.CompleteAttemptRequest> questionResponses) {
        logger.info("POST /api/exercises/attempts/{}/complete — {} incoming responses",
                attemptId, questionResponses == null ? 0 : questionResponses.size());
        try {
            Long currentUserId = getCurrentUserId();
            ExerciseAttemptDTO.ExerciseAttemptResponse response =
                    exerciseService.completeExerciseAttempt(
                            attemptId,
                            questionResponses == null ? List.of() : questionResponses,
                            currentUserId);
            return ResponseEntity.ok(ApiResponse.success(response, "Exercise attempt completed successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (InvalidInputException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error completing attempt {}: {}", attemptId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while completing the attempt."));
        }
    }

    /**
     * Returns the current navigation-panel state for an attempt:
     * per-question status (NOT_ATTEMPTED / ANSWERED / MARKED_FOR_REVIEW /
     * ANSWERED_AND_MARKED) plus aggregate counts.
     * Only the owner of the attempt may call this endpoint.
     *
     */
    @GetMapping("/exercises/attempts/{attemptId}/progress")
    @PreAuthorize("hasAnyRole('STUDENT')")
    public ResponseEntity<ApiResponse<StudentTestDTO.AttemptProgressResponse>> getAttemptProgress(
            @PathVariable Long attemptId) {
        logger.info("GET /api/exercises/attempts/{}/progress", attemptId);
        try {
            Long currentUserId = getCurrentUserId();
            StudentTestDTO.AttemptProgressResponse progress =
                    exerciseService.getAttemptProgress(attemptId, currentUserId);
            return ResponseEntity.ok(ApiResponse.success(progress, "Progress retrieved successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error retrieving progress for attempt {}: {}", attemptId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while retrieving attempt progress."));
        }
    }

    /**
     * Retrieves a completed attempt with full per-question breakdown.
     *
     * <p><strong>STUDENT</strong>: the {@code userId} query param is ignored — ownership is always
     * enforced from the JWT. Students can only retrieve their own attempts.
     * <p><strong>INSTRUCTOR / ADMIN</strong>: must supply the target student's {@code userId}
     * to retrieve that student's attempt.
     *
     */
    @GetMapping("/exercises/attempts/{attemptId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<ExerciseAttemptDTO.ExerciseAttemptResponse>> getExerciseAttemptById(
            @PathVariable Long attemptId,
            @RequestParam(required = false) Long userId) {
        logger.info("GET /api/exercises/attempts/{} — userId param: {}", attemptId, userId);
        try {
            // STUDENT: always use the authenticated user's ID — ignoring the supplied param
            //          prevents a student from retrieving another student's results.
            // INSTRUCTOR / ADMIN: use the supplied userId to look up a specific student's attempt.
            Long effectiveUserId = currentUserIsStudent() ? getCurrentUserId() : userId;
            if (effectiveUserId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("userId is required for INSTRUCTOR / ADMIN access."));
            }
            return ResponseEntity.ok(ApiResponse.success(
                    exerciseService.getExerciseAttemptById(attemptId, effectiveUserId),
                    "Exercise attempt retrieved successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error retrieving attempt {}: {}", attemptId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while retrieving the attempt."));
        }
    }

    /**
     * Returns the attempt history for a student on a given exercise.
     *
     * <p><strong>STUDENT</strong>: always scoped to the authenticated user — the {@code userId}
     * param is ignored to prevent enumeration of other students' attempt history.
     * <p><strong>INSTRUCTOR / ADMIN</strong>: must supply the target student's {@code userId}.
     *
     */
    @GetMapping("/exercises/{exerciseId}/attempts")
    @PreAuthorize("hasAnyRole('STUDENT', 'INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<ExerciseAttemptDTO.ExerciseAttemptSummaryResponse>>> getExerciseAttemptsByExerciseId(
            @PathVariable Integer exerciseId,
            @RequestParam(required = false) Long userId) {
        logger.info("GET /api/exercises/{}/attempts — userId param: {}", exerciseId, userId);
        try {
            Long effectiveUserId = currentUserIsStudent() ? getCurrentUserId() : userId;
            if (effectiveUserId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("userId is required for INSTRUCTOR / ADMIN access."));
            }
            return ResponseEntity.ok(ApiResponse.success(
                    exerciseService.getExerciseAttemptsByExerciseId(exerciseId, effectiveUserId),
                    "Exercise attempts retrieved successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error retrieving attempts for exercise {}: {}", exerciseId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while retrieving exercise attempts."));
        }
    }

    // =========================================================================
    // Private — Security Context Helpers
    // =========================================================================

    /**
     * Returns {@code true} when the currently authenticated principal holds the {@code STUDENT} role.
     * Used to enforce ownership on endpoints shared across STUDENT / INSTRUCTOR / ADMIN roles —
     * ensures students can only access their own attempts regardless of any userId param supplied.
     */
    private boolean currentUserIsStudent() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_STUDENT".equals(a.getAuthority()));
    }

    /**
     * Resolves the authenticated user's database ID from the active security context.
     * This follows the same pattern used in {@code UserController} and
     * {@code StudentDashboardController} across this codebase.
     *
     * <p>The JWT filter sets a Spring {@link UserDetails} (email as username) as the
     * principal. We look up the user record by email to get the stable database ID.
     *
     * @return the authenticated user's database ID
     * @throws IllegalStateException if no authentication context is found
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalStateException("No authentication context found.");
        }

        Object principal = authentication.getPrincipal();
        String email;

        if (principal instanceof UserDetails ud) {
            email = ud.getUsername();
        } else if (principal instanceof Users u) {
            return u.getId();
        } else if (principal instanceof String s) {
            email = s;
        } else {
            throw new IllegalStateException(
                    "Unexpected principal type: " + principal.getClass().getName());
        }

        return userRepository.findByEmail(email)
                .map(Users::getId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Authenticated user not found with email: " + email));
    }
}
