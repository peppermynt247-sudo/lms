package courses.abc.atoms.features.sessions.controller;

import courses.abc.atoms.core.dto.ApiResponse;
import courses.abc.atoms.features.sessions.dto.LiveSessionDTO;
import courses.abc.atoms.features.sessions.enums.SessionStatus;
import courses.abc.atoms.features.sessions.service.LiveSessionService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class LiveSessionController {

    private static final Logger logger = LoggerFactory.getLogger(LiveSessionController.class);

    @Autowired
    private LiveSessionService sessionService;

    // ─────────────────────────────────────────────────────────────────────────
    // Admin / Instructor — Session CRUD
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST /api/sessions
     * Creates a new live session. Accessible by ADMIN and INSTRUCTOR.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<ApiResponse<LiveSessionDTO.SessionResponse>> createSession(
            @Valid @RequestBody LiveSessionDTO.CreateRequest request,
            Authentication authentication) {

        logger.info("API hit: POST /api/sessions for batch ID: {}", request.getBatchId());
        LiveSessionDTO.SessionResponse response = sessionService.createSession(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Live session created successfully"));
    }

    /**
     * PUT /api/sessions/{id}
     * Updates session details. Accessible by ADMIN and INSTRUCTOR.
     * COMPLETED and CANCELLED sessions cannot be updated.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<ApiResponse<LiveSessionDTO.SessionResponse>> updateSession(
            @PathVariable Long id,
            @Valid @RequestBody LiveSessionDTO.UpdateRequest request) {

        logger.info("API hit: PUT /api/sessions/{}", id);
        LiveSessionDTO.SessionResponse response = sessionService.updateSession(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Session updated successfully"));
    }

    /**
     * PATCH /api/sessions/{id}/status
     * Transitions session status following the enforced state machine:
     * SCHEDULED → LIVE | CANCELLED, LIVE → COMPLETED | CANCELLED.
     * Backward transitions (e.g., LIVE → SCHEDULED) are rejected with 400.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<ApiResponse<LiveSessionDTO.SessionResponse>> updateSessionStatus(
            @PathVariable Long id,
            @Valid @RequestBody LiveSessionDTO.StatusUpdateRequest request) {

        logger.info("API hit: PATCH /api/sessions/{}/status to {}", id, request.getStatus());
        LiveSessionDTO.SessionResponse response = sessionService.updateSessionStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Session status updated to " + response.getStatus()));
    }

    /**
     * DELETE /api/sessions/{id}
     * Deletes a session and cascade-deletes all its recordings. Accessible by ADMIN only.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSession(@PathVariable Long id) {
        logger.info("API hit: DELETE /api/sessions/{}", id);
        sessionService.deleteSession(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Session deleted successfully"));
    }

    /**
     * GET /api/sessions
     * Returns a paginated list of sessions with optional filters.
     * Accessible by ADMIN and INSTRUCTOR.
     *
     * @param batchId  optional batch filter
     * @param status   optional status filter (SCHEDULED | LIVE | COMPLETED | CANCELLED)
     * @param pageable pagination parameters (page, size, sort)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<ApiResponse<Page<LiveSessionDTO.SessionSummary>>> getAllSessions(
            @RequestParam(required = false) Long batchId,
            @RequestParam(required = false) SessionStatus status,
            Pageable pageable) {

        logger.info("API hit: GET /api/sessions — batchId: {}, status: {}", batchId, status);
        Page<LiveSessionDTO.SessionSummary> page = sessionService.getAllSessions(batchId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Sessions retrieved successfully"));
    }

    /**
     * GET /api/sessions/{id}
     * Returns full session details including all recordings.
     * Accessible by ADMIN and INSTRUCTOR.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<ApiResponse<LiveSessionDTO.SessionResponse>> getSessionById(@PathVariable Long id) {
        logger.info("API hit: GET /api/sessions/{}", id);
        LiveSessionDTO.SessionResponse response = sessionService.getSessionById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Session retrieved successfully"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin / Instructor — Recording Management
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST /api/sessions/{sessionId}/recordings
     * Attaches a recording URL to a session. recordingUrl is mandatory.
     */
    @PostMapping("/{sessionId}/recordings")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<ApiResponse<LiveSessionDTO.RecordingResponse>> addRecording(
            @PathVariable Long sessionId,
            @Valid @RequestBody LiveSessionDTO.AddRecordingRequest request) {

        logger.info("API hit: POST /api/sessions/{}/recordings", sessionId);
        LiveSessionDTO.RecordingResponse response = sessionService.addRecording(sessionId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Recording added successfully"));
    }

    /**
     * PUT /api/sessions/{sessionId}/recordings/{recordingId}
     * Partially updates a recording — only supplied (non-null) fields are applied.
     */
    @PutMapping("/{sessionId}/recordings/{recordingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<ApiResponse<LiveSessionDTO.RecordingResponse>> updateRecording(
            @PathVariable Long sessionId,
            @PathVariable Long recordingId,
            @RequestBody LiveSessionDTO.UpdateRecordingRequest request) {

        logger.info("API hit: PUT /api/sessions/{}/recordings/{}", sessionId, recordingId);
        LiveSessionDTO.RecordingResponse response = sessionService.updateRecording(sessionId, recordingId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Recording updated successfully"));
    }

    /**
     * DELETE /api/sessions/{sessionId}/recordings/{recordingId}
     * Deletes a recording after verifying it belongs to the given session.
     */
    @DeleteMapping("/{sessionId}/recordings/{recordingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<ApiResponse<Void>> deleteRecording(
            @PathVariable Long sessionId,
            @PathVariable Long recordingId) {

        logger.info("API hit: DELETE /api/sessions/{}/recordings/{}", sessionId, recordingId);
        sessionService.deleteRecording(sessionId, recordingId);
        return ResponseEntity.ok(ApiResponse.success(null, "Recording deleted successfully"));
    }

    /**
     * GET /api/sessions/{sessionId}/recordings
     * Returns all recordings for a session including hidden ones (admin/instructor view).
     */
    @GetMapping("/{sessionId}/recordings")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<ApiResponse<List<LiveSessionDTO.RecordingResponse>>> getRecordingsForSession(
            @PathVariable Long sessionId) {

        logger.info("API hit: GET /api/sessions/{}/recordings", sessionId);
        List<LiveSessionDTO.RecordingResponse> recordings = sessionService.getRecordingsForSession(sessionId);
        return ResponseEntity.ok(ApiResponse.success(recordings, "Recordings retrieved successfully"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Student — Read-Only Access
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/sessions/dashboard
     * Returns live and upcoming sessions for the authenticated student's enrolled batches.
     * Used for the student home page widget.
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<LiveSessionDTO.DashboardItem>>> getStudentDashboard(
            Authentication authentication) {

        String email = authentication.getName();
        logger.info("API hit: GET /api/sessions/dashboard for student: {}", email);
        List<LiveSessionDTO.DashboardItem> items = sessionService.getStudentDashboard(email);
        return ResponseEntity.ok(ApiResponse.success(items, "Dashboard sessions retrieved"));
    }

    /**
     * GET /api/sessions/batch/{batchId}
     * Returns all sessions for a specific batch. Student must be enrolled in the batch.
     */
    @GetMapping("/batch/{batchId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<LiveSessionDTO.SessionSummary>>> getSessionsForBatch(
            @PathVariable Long batchId,
            Authentication authentication) {

        String email = authentication.getName();
        logger.info("API hit: GET /api/sessions/batch/{} for student: {}", batchId, email);
        List<LiveSessionDTO.SessionSummary> sessions = sessionService.getSessionsForBatch(batchId, email);
        return ResponseEntity.ok(ApiResponse.success(sessions, "Batch sessions retrieved successfully"));
    }

    /**
     * GET /api/sessions/{id}/join
     * Returns the Zoom join URL for a session if the student is enrolled and the URL is currently visible.
     * Always returns 200 OK when the student is enrolled — the client reads {@code joinUrlAvailable}
     * to decide whether to show the join button. A URL not being available yet is a timing issue,
     * not a permissions issue, so 403 is intentionally avoided here.
     */
    @GetMapping("/{id}/join")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<LiveSessionDTO.DashboardItem>> getJoinUrl(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();
        logger.info("API hit: GET /api/sessions/{}/join for student: {}", id, email);
        LiveSessionDTO.DashboardItem item = sessionService.getJoinUrl(id, email);
        return ResponseEntity.ok(ApiResponse.success(item, "Session info retrieved"));
    }

    /**
     * GET /api/sessions/{sessionId}/recordings/student
     * Returns only visible recordings for a session. Student must be enrolled in the batch.
     */
    @GetMapping("/{sessionId}/recordings/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<LiveSessionDTO.RecordingResponse>>> getVisibleRecordingsForStudent(
            @PathVariable Long sessionId,
            Authentication authentication) {

        String email = authentication.getName();
        logger.info("API hit: GET /api/sessions/{}/recordings/student for student: {}", sessionId, email);
        List<LiveSessionDTO.RecordingResponse> recordings =
                sessionService.getVisibleRecordingsForStudent(sessionId, email);
        return ResponseEntity.ok(ApiResponse.success(recordings, "Recordings retrieved successfully"));
    }
}
