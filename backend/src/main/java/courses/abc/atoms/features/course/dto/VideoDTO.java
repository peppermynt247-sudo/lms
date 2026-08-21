package courses.abc.atoms.features.course.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
// import courses.abc.atoms.features.course.dto.VideoDTO.UploadStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A container class for all Data Transfer Objects (DTOs) related to the Video feature.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
@NoArgsConstructor
public class VideoDTO {

    /**
     * Enum representing the possible states of a video during the upload and processing lifecycle.
     */
    public enum UploadStatus {
        PENDING,
        READY,
        FAILED
    }

    /**
     * DTO for initiating a video upload from the client.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VideoUploadRequest {
        @NotBlank(message = "Video title cannot be blank")
        private String title;

        private String description;

        private String url;
    }

    /**
     * DTO for adding a YouTube video link.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VideoYoutubeRequest {
        @NotBlank(message = "Video title cannot be blank")
        private String title;

        private String description;

        @NotBlank(message = "Video URL cannot be blank")
        private String url;
    }
    
    /**
     * DTO containing the secure payload required by the client to play a video.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VideoPlaybackResponse {
        private Integer videoId;
        private String title;
        private String description;
        private String vdoCipherId;
        private String otp;
        private String playbackInfo;
        private String videoUrl;
        private UploadStatus uploadStatus;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryResponse {
        private Integer videoId;
        private String title;
        private String description;
        private String videoUrl;
        private Integer durationSeconds;
        private UploadStatus uploadStatus;
    }

    /**
     * DTO for the payload sent by Videocipher's webhook.
     */
    @Data
    public static class VideocipherWebhookPayload {
        private String event;

        @JsonProperty("payload")
        private VideoData videoData;

        @Data
        public static class VideoData {
            @JsonProperty("id")
            private String vdoCipherId;

            @JsonProperty("length")
            private Integer duration;

            private String status;
        }
    }
}