package courses.abc.atoms.features.sessions.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import courses.abc.atoms.features.sessions.enums.SessionStatus;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class LiveSessionDTO {

    @Data
    public static class CreateRequest {

        @NotNull(message = "Batch ID is required")
        private Long batchId;

        private Long courseId;
        private Long instructorId;

        @NotBlank(message = "Title is required")
        private String title;

        private String description;
        private String zoomJoinUrl;
        private String zoomMeetingId;

        @NotNull(message = "Scheduled time is required")
        @Future(message = "Session must be scheduled in the future")
        private LocalDateTime scheduledAt;

        @Min(value = 15, message = "Duration must be at least 15 minutes")
        private int durationMinutes = 60;
    }

    @Data
    public static class UpdateRequest {
        private Long instructorId;
        private String title;
        private String description;
        private String zoomJoinUrl;
        private String zoomMeetingId;

        private LocalDateTime scheduledAt;

        @Min(value = 15, message = "Duration must be at least 15 minutes")
        private Integer durationMinutes;
    }

    @Data
    public static class StatusUpdateRequest {

        @NotNull(message = "Status is required")
        private SessionStatus status;
    }

    /** Used for POST — recordingUrl is mandatory when creating a new recording. */
    @Data
    public static class AddRecordingRequest {

        @NotBlank(message = "Recording URL is required")
        private String recordingUrl;

        private String title;
        private String recordingPassword;
        private Integer durationSeconds;
        private LocalDateTime recordedAt;
        private String vdoCipherId;
        private Boolean visible = true;
    }

    /** Used for PUT — all fields are optional; only non-null values are applied. */
    @Data
    public static class UpdateRecordingRequest {
        private String recordingUrl;
        private String title;
        private String recordingPassword;
        private Integer durationSeconds;
        private LocalDateTime recordedAt;
        private String vdoCipherId;
        private Boolean visible;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RecordingResponse {
        private Long recordingId;
        private Long sessionId;
        private String title;
        private String recordingUrl;
        private String recordingPassword;
        private Integer durationSeconds;
        private LocalDateTime recordedAt;
        private String vdoCipherId;
        private Boolean visible;
        private LocalDateTime createdAt;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SessionResponse {
        private Long sessionId;
        private Long batchId;
        private String batchName;
        private Long courseId;
        private String courseTitle;
        private Long instructorId;
        private String instructorEmail;
        private String instructorName;
        private String title;
        private String description;
        private String zoomJoinUrl;
        private String zoomMeetingId;
        private LocalDateTime scheduledAt;
        private int durationMinutes;
        private SessionStatus status;
        private Long createdById;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<RecordingResponse> recordings;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SessionSummary {
        private Long sessionId;
        private Long batchId;
        private String batchName;
        private Long courseId;
        private String courseTitle;
        private Long instructorId;
        private String instructorName;
        private String title;
        private LocalDateTime scheduledAt;
        private int durationMinutes;
        private SessionStatus status;
        private boolean joinUrlAvailable;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DashboardItem {
        private Long sessionId;
        private Long batchId;
        private String batchName;
        private Long courseId;
        private String courseTitle;
        private String title;
        private LocalDateTime scheduledAt;
        private int durationMinutes;
        private SessionStatus status;
        private String zoomJoinUrl;
        private boolean joinUrlAvailable;
    }
}
