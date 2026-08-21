package courses.abc.atoms.features.sessions.service;

import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.exception.UnauthorizedAccessException;
import courses.abc.atoms.core.model.core.Profiles;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.repositories.ProfileRepository;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.features.course.model.Batches;
import courses.abc.atoms.features.course.model.Course;
import courses.abc.atoms.features.course.repositories.BatchRepository;
import courses.abc.atoms.features.course.repositories.BatchUserRepository;
import courses.abc.atoms.features.course.repositories.CourseRepository;
import courses.abc.atoms.features.sessions.dto.LiveSessionDTO;
import courses.abc.atoms.features.sessions.enums.SessionStatus;
import courses.abc.atoms.features.sessions.model.LiveSession;
import courses.abc.atoms.features.sessions.model.SessionRecording;
import courses.abc.atoms.features.sessions.repositories.LiveSessionRepository;
import courses.abc.atoms.features.sessions.repositories.SessionRecordingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class LiveSessionService {

    private static final Logger logger = LoggerFactory.getLogger(LiveSessionService.class);

    /** Minutes before scheduledAt at which the Zoom join URL becomes visible to students. */
    private static final int JOIN_URL_VISIBILITY_WINDOW_MINUTES = 30;

    @Autowired
    private LiveSessionRepository sessionRepository;

    @Autowired
    private SessionRecordingRepository recordingRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private BatchUserRepository batchUserRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepository profileRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // Admin / Instructor — Session Management
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Creates a new live session for a batch.
     */
    @Transactional
    public LiveSessionDTO.SessionResponse createSession(LiveSessionDTO.CreateRequest request,
                                                        String createdByEmail) {
        logger.info("Creating live session '{}' for batch ID: {}", request.getTitle(), request.getBatchId());

        Batches batch = batchRepository.findByBatchId(request.getBatchId())
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + request.getBatchId()));

        LiveSession session = new LiveSession();
        session.setBatch(batch);
        session.setTitle(request.getTitle());
        session.setDescription(request.getDescription());
        session.setZoomJoinUrl(request.getZoomJoinUrl());
        session.setZoomMeetingId(request.getZoomMeetingId());
        session.setScheduledAt(request.getScheduledAt());
        session.setDurationMinutes(request.getDurationMinutes());
        session.setStatus(SessionStatus.SCHEDULED);

        if (request.getCourseId() != null) {
            Course course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + request.getCourseId()));
            session.setCourse(course);
        }

        if (request.getInstructorId() != null) {
            Users instructor = userRepository.findById(request.getInstructorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Instructor not found with ID: " + request.getInstructorId()));
            session.setInstructor(instructor);
        }

        Users creator = getUserByEmail(createdByEmail);
        session.setCreatedBy(creator);

        LiveSession saved = sessionRepository.save(session);
        logger.info("Live session created with ID: {}", saved.getSessionId());
        // A brand-new session has no recordings — skip the query and pass an empty list directly.
        return toSessionResponse(saved, List.of());
    }

    /**
     * Updates an existing live session.
     * COMPLETED and CANCELLED sessions cannot be updated.
     */
    @Transactional
    public LiveSessionDTO.SessionResponse updateSession(Long sessionId, LiveSessionDTO.UpdateRequest request) {
        logger.info("Updating live session ID: {}", sessionId);

        LiveSession session = sessionRepository.findByIdWithDetails(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with ID: " + sessionId));

        if (session.getStatus() == SessionStatus.COMPLETED || session.getStatus() == SessionStatus.CANCELLED) {
            throw new IllegalStateException("Cannot update a session that is " + session.getStatus());
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            session.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            session.setDescription(request.getDescription());
        }
        if (request.getZoomJoinUrl() != null) {
            session.setZoomJoinUrl(request.getZoomJoinUrl());
        }
        if (request.getZoomMeetingId() != null) {
            session.setZoomMeetingId(request.getZoomMeetingId());
        }
        if (request.getScheduledAt() != null) {
            session.setScheduledAt(request.getScheduledAt());
        }
        if (request.getDurationMinutes() != null) {
            session.setDurationMinutes(request.getDurationMinutes());
        }
        if (request.getInstructorId() != null) {
            Users instructor = userRepository.findById(request.getInstructorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Instructor not found with ID: " + request.getInstructorId()));
            session.setInstructor(instructor);
        }

        LiveSession saved = sessionRepository.save(session);
        logger.info("Live session ID {} updated successfully", sessionId);
        return toSessionResponse(saved, getRecordingResponses(saved.getSessionId()));
    }

    /**
     * Transitions the status of a session following the enforced state machine:
     * <pre>
     *   SCHEDULED → LIVE | CANCELLED
     *   LIVE      → COMPLETED | CANCELLED
     *   COMPLETED → (terminal — no further transitions)
     *   CANCELLED → (terminal — no further transitions)
     * </pre>
     */
    @Transactional
    public LiveSessionDTO.SessionResponse updateSessionStatus(Long sessionId,
                                                              LiveSessionDTO.StatusUpdateRequest request) {
        logger.info("Updating status of session ID {} to {}", sessionId, request.getStatus());

        LiveSession session = sessionRepository.findByIdWithDetails(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with ID: " + sessionId));

        validateStatusTransition(session.getStatus(), request.getStatus());
        session.setStatus(request.getStatus());

        LiveSession saved = sessionRepository.save(session);
        logger.info("Session ID {} status changed to {}", sessionId, saved.getStatus());
        return toSessionResponse(saved, getRecordingResponses(saved.getSessionId()));
    }

    /**
     * Deletes a session and cascade-deletes all its recordings.
     */
    @Transactional
    public void deleteSession(Long sessionId) {
        logger.info("Deleting live session ID: {}", sessionId);

        LiveSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with ID: " + sessionId));

        sessionRepository.delete(session);
        logger.info("Live session ID {} deleted", sessionId);
    }

    /**
     * Returns a paginated, filterable list of sessions (admin/instructor view).
     */
    @Transactional(readOnly = true)
    public Page<LiveSessionDTO.SessionSummary> getAllSessions(Long batchId, SessionStatus status,
                                                              Pageable pageable) {
        logger.info("Fetching sessions — batchId: {}, status: {}", batchId, status);
        Page<LiveSession> page = sessionRepository.findWithFilters(batchId, status, pageable);
        // Batch-load all instructor profiles in one query to prevent N+1 on every page load.
        Map<Long, String> instructorNames = buildInstructorNameMap(page.getContent());
        return page.map(session -> toSessionSummary(session, instructorNames));
    }

    /**
     * Returns full session details including all recordings (admin/instructor view).
     */
    @Transactional(readOnly = true)
    public LiveSessionDTO.SessionResponse getSessionById(Long sessionId) {
        logger.info("Fetching session ID: {}", sessionId);
        LiveSession session = sessionRepository.findByIdWithDetails(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with ID: " + sessionId));
        return toSessionResponse(session, getRecordingResponses(sessionId));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin / Instructor — Recording Management
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Attaches a recording URL to an existing session.
     */
    @Transactional
    public LiveSessionDTO.RecordingResponse addRecording(Long sessionId,
                                                         LiveSessionDTO.AddRecordingRequest request) {
        logger.info("Adding recording to session ID: {}", sessionId);

        LiveSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with ID: " + sessionId));

        SessionRecording recording = new SessionRecording();
        recording.setSession(session);
        recording.setRecordingUrl(request.getRecordingUrl());
        recording.setTitle(request.getTitle());
        recording.setRecordingPassword(request.getRecordingPassword());
        recording.setDurationSeconds(request.getDurationSeconds());
        recording.setRecordedAt(request.getRecordedAt());
        recording.setVdoCipherId(request.getVdoCipherId());
        recording.setVisible(Objects.requireNonNullElse(request.getVisible(), Boolean.TRUE));

        SessionRecording saved = recordingRepository.save(recording);
        logger.info("Recording ID {} added to session ID {}", saved.getRecordingId(), sessionId);
        return toRecordingResponse(saved, sessionId);
    }

    /**
     * Partially updates an existing recording after verifying it belongs to the given session.
     * Only non-null fields in the request are applied.
     */
    @Transactional
    public LiveSessionDTO.RecordingResponse updateRecording(Long sessionId, Long recordingId,
                                                            LiveSessionDTO.UpdateRecordingRequest request) {
        logger.info("Updating recording ID {} for session ID {}", recordingId, sessionId);

        // Single query combining existence + ownership. Falls back to existsById only
        // when the combined check fails, to produce the correct 404 vs 400 error.
        SessionRecording recording = recordingRepository
                .findByRecordingIdAndSession_SessionId(recordingId, sessionId)
                .orElseThrow(() -> {
                    if (!recordingRepository.existsById(recordingId)) {
                        return new ResourceNotFoundException("Recording not found with ID: " + recordingId);
                    }
                    return new IllegalArgumentException(
                            "Recording ID " + recordingId + " does not belong to session ID " + sessionId);
                });

        if (request.getRecordingUrl() != null && !request.getRecordingUrl().isBlank()) {
            recording.setRecordingUrl(request.getRecordingUrl());
        }
        if (request.getTitle() != null) {
            recording.setTitle(request.getTitle());
        }
        if (request.getRecordingPassword() != null) {
            recording.setRecordingPassword(request.getRecordingPassword());
        }
        if (request.getDurationSeconds() != null) {
            recording.setDurationSeconds(request.getDurationSeconds());
        }
        if (request.getRecordedAt() != null) {
            recording.setRecordedAt(request.getRecordedAt());
        }
        if (request.getVdoCipherId() != null) {
            recording.setVdoCipherId(request.getVdoCipherId());
        }
        if (request.getVisible() != null) {
            recording.setVisible(request.getVisible());
        }

        SessionRecording saved = recordingRepository.save(recording);
        logger.info("Recording ID {} updated", recordingId);
        return toRecordingResponse(saved, sessionId);
    }

    /**
     * Deletes a recording after verifying it belongs to the given session.
     */
    @Transactional
    public void deleteRecording(Long sessionId, Long recordingId) {
        logger.info("Deleting recording ID {} from session ID {}", recordingId, sessionId);

        // Check ownership first (happy-path = 1 query). Only fall back to existsById
        // when the combined check fails, to produce the correct 404 vs 400 error.
        if (!recordingRepository.existsByRecordingIdAndSession_SessionId(recordingId, sessionId)) {
            if (!recordingRepository.existsById(recordingId)) {
                throw new ResourceNotFoundException("Recording not found with ID: " + recordingId);
            }
            throw new IllegalArgumentException(
                    "Recording ID " + recordingId + " does not belong to session ID " + sessionId);
        }

        recordingRepository.deleteById(recordingId);
        logger.info("Recording ID {} deleted", recordingId);
    }

    /**
     * Returns all recordings for a session including hidden ones (admin/instructor view).
     */
    @Transactional(readOnly = true)
    public List<LiveSessionDTO.RecordingResponse> getRecordingsForSession(Long sessionId) {
        logger.info("Fetching all recordings for session ID: {}", sessionId);

        if (!sessionRepository.existsById(sessionId)) {
            throw new ResourceNotFoundException("Session not found with ID: " + sessionId);
        }

        return getRecordingResponses(sessionId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Student — Read-Only Access
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns live + upcoming sessions for all batches the student is enrolled in.
     * Used to populate the student home/dashboard page.
     */
    @Transactional(readOnly = true)
    public List<LiveSessionDTO.DashboardItem> getStudentDashboard(String email) {
        logger.info("Fetching session dashboard for student: {}", email);

        Users student = getUserByEmail(email);
        List<Long> batchIds = batchUserRepository.findBatchIdsByUserId(student.getId());

        if (batchIds.isEmpty()) {
            logger.info("Student {} is not enrolled in any batch", email);
            return List.of();
        }

        return sessionRepository
                .findLiveAndUpcomingForBatches(batchIds, LocalDateTime.now(), SessionStatus.LIVE, SessionStatus.SCHEDULED)
                .stream()
                .map(this::toDashboardItem)
                .toList();
    }

    /**
     * Returns all sessions for a specific batch. Student must be enrolled in the batch.
     */
    @Transactional(readOnly = true)
    public List<LiveSessionDTO.SessionSummary> getSessionsForBatch(Long batchId, String email) {
        logger.info("Fetching sessions for batch ID {} — requested by student: {}", batchId, email);

        Users student = getUserByEmail(email);
        verifyBatchMembership(batchId, student.getId());

        List<LiveSession> sessions = sessionRepository.findByBatchIdOrdered(batchId);
        Map<Long, String> instructorNames = buildInstructorNameMap(sessions);
        return sessions.stream()
                .map(s -> toSessionSummary(s, instructorNames))
                .toList();
    }

    /**
     * Returns the Zoom join URL for a session if the student is enrolled and the URL is currently visible.
     * Returns the full DashboardItem — callers should check {@code joinUrlAvailable} before rendering a join button.
     *
     * <p>Visibility rules:
     * <ul>
     *   <li>LIVE: always visible</li>
     *   <li>SCHEDULED: visible within {@value #JOIN_URL_VISIBILITY_WINDOW_MINUTES} minutes of scheduledAt</li>
     *   <li>COMPLETED / CANCELLED: never visible</li>
     * </ul>
     */
    @Transactional(readOnly = true)
    public LiveSessionDTO.DashboardItem getJoinUrl(Long sessionId, String email) {
        logger.info("Student {} requesting join URL for session ID {}", email, sessionId);

        LiveSession session = sessionRepository.findByIdWithDetails(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with ID: " + sessionId));

        Users student = getUserByEmail(email);
        verifyBatchMembership(session.getBatch().getBatchId(), student.getId());

        return toDashboardItem(session);
    }

    /**
     * Returns only visible recordings for a session (student view — hidden recordings excluded).
     */
    @Transactional(readOnly = true)
    public List<LiveSessionDTO.RecordingResponse> getVisibleRecordingsForStudent(Long sessionId, String email) {
        logger.info("Student {} fetching recordings for session ID {}", email, sessionId);

        // findByIdWithDetails JOIN FETCHes batch, avoiding a lazy proxy hit on getBatchId().
        LiveSession session = sessionRepository.findByIdWithDetails(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with ID: " + sessionId));

        Users student = getUserByEmail(email);
        verifyBatchMembership(session.getBatch().getBatchId(), student.getId());

        return recordingRepository.findBySession_SessionIdAndVisible(sessionId, true)
                .stream()
                .map(r -> toRecordingResponse(r, sessionId))
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private Users getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    /**
     * Verifies batch membership using an EXISTS query — no entity loading required.
     * Throws {@link UnauthorizedAccessException} if the user is not enrolled.
     */
    private void verifyBatchMembership(Long batchId, Long userId) {
        if (!batchUserRepository.existsByUser_IdAndBatch_BatchId(userId, batchId)) {
            throw new UnauthorizedAccessException("You are not enrolled in this batch");
        }
    }

    /**
     * Enforces forward-only status transitions:
     * <pre>
     *   SCHEDULED → LIVE | CANCELLED
     *   LIVE      → COMPLETED | CANCELLED
     *   COMPLETED → (terminal)
     *   CANCELLED → (terminal)
     * </pre>
     *
     * @throws IllegalStateException if the transition is not permitted
     */
    private void validateStatusTransition(SessionStatus current, SessionStatus next) {
        boolean valid = switch (current) {
            case SCHEDULED -> next == SessionStatus.LIVE || next == SessionStatus.CANCELLED;
            case LIVE      -> next == SessionStatus.COMPLETED || next == SessionStatus.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
        if (!valid) {
            throw new IllegalStateException(
                    String.format("Invalid status transition: %s → %s", current, next));
        }
    }

    private boolean isJoinUrlVisible(LiveSession session) {
        if (session.getStatus() == SessionStatus.LIVE) {
            return true;
        }
        if (session.getStatus() == SessionStatus.SCHEDULED) {
            LocalDateTime windowStart = session.getScheduledAt()
                    .minusMinutes(JOIN_URL_VISIBILITY_WINDOW_MINUTES);
            return !LocalDateTime.now().isBefore(windowStart);
        }
        return false;
    }

    /**
     * Fetches and maps all recordings for a session to DTOs.
     * Centralised to avoid duplicate fetch logic across read and write methods.
     * The sessionId is passed explicitly to {@link #toRecordingResponse} to avoid
     * lazy-loading the parent session proxy on each recording.
     */
    private List<LiveSessionDTO.RecordingResponse> getRecordingResponses(Long sessionId) {
        return recordingRepository.findBySession_SessionId(sessionId)
                .stream()
                .map(r -> toRecordingResponse(r, sessionId))
                .toList();
    }

    // ── Mappers ────────────────────────────────────────────────────────────────

    private LiveSessionDTO.SessionResponse toSessionResponse(LiveSession session,
                                                              List<LiveSessionDTO.RecordingResponse> recordings) {
        LiveSessionDTO.SessionResponse dto = new LiveSessionDTO.SessionResponse();
        dto.setSessionId(session.getSessionId());
        dto.setBatchId(session.getBatch().getBatchId());
        dto.setBatchName(session.getBatch().getBatchName());

        if (session.getCourse() != null) {
            dto.setCourseId(session.getCourse().getCourseId());
            dto.setCourseTitle(session.getCourse().getTitle());
        }
        if (session.getInstructor() != null) {
            dto.setInstructorId(session.getInstructor().getId());
            dto.setInstructorEmail(session.getInstructor().getEmail());
            // Fall back to email when no profile exists — consistent with toSessionSummary.
            String name = profileRepository.findByUserId(session.getInstructor().getId())
                    .map(Profiles::getName)
                    .filter(n -> n != null && !n.isBlank())
                    .orElse(session.getInstructor().getEmail());
            dto.setInstructorName(name);
        }
        if (session.getCreatedBy() != null) {
            dto.setCreatedById(session.getCreatedBy().getId());
        }

        dto.setTitle(session.getTitle());
        dto.setDescription(session.getDescription());
        dto.setZoomJoinUrl(session.getZoomJoinUrl());
        dto.setZoomMeetingId(session.getZoomMeetingId());
        dto.setScheduledAt(session.getScheduledAt());
        dto.setDurationMinutes(session.getDurationMinutes());
        dto.setStatus(session.getStatus());
        dto.setCreatedAt(session.getCreatedAt());
        dto.setUpdatedAt(session.getUpdatedAt());
        dto.setRecordings(recordings);
        return dto;
    }

    /**
     * Batch-loads profiles for all instructors referenced in a list of sessions in a single query.
     * Returns a map of userId → display name, used by toSessionSummary to avoid N+1 queries.
     * If a user has no profile or a blank name, they are absent from the map and the caller
     * falls back to the instructor's email address.
     */
    private Map<Long, String> buildInstructorNameMap(List<LiveSession> sessions) {
        List<Long> instructorIds = sessions.stream()
                .map(LiveSession::getInstructor)
                .filter(Objects::nonNull)
                .map(Users::getId)
                .distinct()
                .toList();
        if (instructorIds.isEmpty()) return Map.of();
        return profileRepository.findAllByUserIdIn(instructorIds)
                .stream()
                .filter(p -> p.getName() != null && !p.getName().isBlank())
                .collect(Collectors.toMap(p -> p.getUser().getId(), Profiles::getName));
    }

    /**
     * Maps a LiveSession to a SessionSummary DTO.
     * Accepts a pre-loaded instructor name map (keyed by userId) to avoid per-session
     * profile queries. Falls back to the instructor's email when no profile name is available.
     */
    private LiveSessionDTO.SessionSummary toSessionSummary(LiveSession session,
                                                            Map<Long, String> instructorNames) {
        LiveSessionDTO.SessionSummary dto = new LiveSessionDTO.SessionSummary();
        dto.setSessionId(session.getSessionId());
        dto.setBatchId(session.getBatch().getBatchId());
        dto.setBatchName(session.getBatch().getBatchName());

        if (session.getCourse() != null) {
            dto.setCourseId(session.getCourse().getCourseId());
            dto.setCourseTitle(session.getCourse().getTitle());
        }

        if (session.getInstructor() != null) {
            Long instructorId = session.getInstructor().getId();
            dto.setInstructorId(instructorId);
            // Resolved from batch-loaded map — no per-row DB hit. Falls back to email.
            String name = instructorNames.getOrDefault(instructorId,
                    session.getInstructor().getEmail());
            dto.setInstructorName(name);
        }

        dto.setTitle(session.getTitle());
        dto.setScheduledAt(session.getScheduledAt());
        dto.setDurationMinutes(session.getDurationMinutes());
        dto.setStatus(session.getStatus());
        dto.setJoinUrlAvailable(isJoinUrlVisible(session));
        return dto;
    }

    private LiveSessionDTO.DashboardItem toDashboardItem(LiveSession session) {
        LiveSessionDTO.DashboardItem dto = new LiveSessionDTO.DashboardItem();
        dto.setSessionId(session.getSessionId());
        dto.setBatchId(session.getBatch().getBatchId());
        dto.setBatchName(session.getBatch().getBatchName());

        if (session.getCourse() != null) {
            dto.setCourseId(session.getCourse().getCourseId());
            dto.setCourseTitle(session.getCourse().getTitle());
        }

        dto.setTitle(session.getTitle());
        dto.setScheduledAt(session.getScheduledAt());
        dto.setDurationMinutes(session.getDurationMinutes());
        dto.setStatus(session.getStatus());

        boolean urlVisible = isJoinUrlVisible(session);
        dto.setJoinUrlAvailable(urlVisible);
        if (urlVisible) {
            dto.setZoomJoinUrl(session.getZoomJoinUrl());
        }
        return dto;
    }

    /**
     * Maps a SessionRecording to its response DTO.
     * Accepts sessionId explicitly to avoid triggering a lazy proxy load on {@code recording.session}.
     */
    private LiveSessionDTO.RecordingResponse toRecordingResponse(SessionRecording recording, Long sessionId) {
        LiveSessionDTO.RecordingResponse dto = new LiveSessionDTO.RecordingResponse();
        dto.setRecordingId(recording.getRecordingId());
        dto.setSessionId(sessionId);
        dto.setTitle(recording.getTitle());
        dto.setRecordingUrl(recording.getRecordingUrl());
        dto.setRecordingPassword(recording.getRecordingPassword());
        dto.setDurationSeconds(recording.getDurationSeconds());
        dto.setRecordedAt(recording.getRecordedAt());
        dto.setVdoCipherId(recording.getVdoCipherId());
        dto.setVisible(recording.isVisible());
        dto.setCreatedAt(recording.getCreatedAt());
        return dto;
    }
}
