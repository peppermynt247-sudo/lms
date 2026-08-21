package courses.abc.atoms.features.course.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import courses.abc.atoms.features.course.dto.VideoDTO;
import courses.abc.atoms.features.course.services.VideoService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import jakarta.persistence.EntityNotFoundException;



@RestController
@RequestMapping("/api/video")
public class VideoController {
    
    private static final Logger logger = LoggerFactory.getLogger(VideoController.class);

    @Autowired
    private VideoService videoService;

    @Value("${vdocipher.api.webhook-secret-token}")
    private String webhookSecretToken;

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PostMapping("/upload")
    public ResponseEntity<String> uploadVideo(@RequestBody VideoDTO.VideoUploadRequest requestBody,
                              @RequestParam("curriculumsectionId") Integer curriculumSectionId) {
        logger.info("Received video upload request: {}", requestBody);
        try {
            String response = videoService.uploadVideo(requestBody, curriculumSectionId);
            logger.info("Successfully processed video upload");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid input for video upload: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid input: " + e.getMessage());
        } catch (EntityNotFoundException e) {
            logger.error("Curriculum section not found: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Curriculum section not found: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error occurred during video upload: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Video upload failed: " + e.getMessage());
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PostMapping("/addyoutube")
    public ResponseEntity<String> uploadYoutubeVideo(@RequestBody VideoDTO.VideoYoutubeRequest requestBody,
                                                     @RequestParam("curriculumsectionId") Integer curriculumSectionId) {
        logger.info("Received YouTube video request: {}", requestBody);
        try {
            String response = videoService.addYoutubeVideo(requestBody, curriculumSectionId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid input: " + e.getMessage());
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Curriculum section not found: " + e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "YouTube video addition failed: " + e.getMessage());
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PutMapping("/updateyoutube/{videoId}")
    public ResponseEntity<String> updateYoutubeVideo(
            @PathVariable Integer videoId,
            @RequestBody VideoDTO.VideoYoutubeRequest requestBody) {
        logger.info("Received update request for YouTube video ID: {}", videoId);
        try {
            String response = videoService.updateYoutubeVideo(videoId, requestBody);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid input: " + e.getMessage());
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Video not found: " + e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "YouTube video update failed: " + e.getMessage());
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @DeleteMapping("/deleteyoutube/{videoId}")
    public ResponseEntity<String> deleteYoutubeVideo(@PathVariable Integer videoId) {
        logger.info("Received delete request for YouTube video ID: {}", videoId);
        try {
            String response = videoService.deleteYoutubeVideo(videoId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid input: " + e.getMessage());
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Video not found: " + e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "YouTube video deletion failed: " + e.getMessage());
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @GetMapping("/{videoId}/playback")
    public ResponseEntity<VideoDTO.VideoPlaybackResponse> getVideoPlaybackInfo(@PathVariable Integer videoId) {
        logger.info("Received playback info request for video ID: {}", videoId);
        try {
            if (videoId == null || videoId <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid video ID");
            }

            VideoDTO.VideoPlaybackResponse playbackInfo = videoService.getVideoPlaybackInfo(videoId);
            logger.info("Successfully retrieved playback info");
            return ResponseEntity.ok(playbackInfo);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid video ID: {}", videoId, e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid video ID: " + e.getMessage());
        } catch (EntityNotFoundException e) {
            logger.error("Video not found: {}", videoId, e);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error occurred while retrieving playback info: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve playback info: " + e.getMessage());
        }
    }

    /**
     * Endpoint to Receive and validate webhook notifications from Videocipher.
     * This endpoint is public but secured by validating a secret token in the URL.
     *
     * @param payload The webhook payload.
     * @param token The secret token passed as a query parameter.
     * @return A 200 OK response on success, or 401 Unauthorized on token mismatch.
     */
    @PostMapping("/webhook")
    @PreAuthorize("permitAll")
    public ResponseEntity<Void> handleVideocipherWebhook(@RequestBody VideoDTO.VideocipherWebhookPayload payload,
                                                         @RequestParam("token") String token) {
        // Authenticate the request by comparing the token from the URL with our secret token
        if (!webhookSecretToken.equals(token)) {
            logger.warn("Invalid webhook token received. Rejecting request.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // The token is valid, now process the payload
        videoService.handleWebhook(payload);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PutMapping("/{videoId}/update")
    public ResponseEntity<VideoDTO.VideoPlaybackResponse> updateVideo(@PathVariable Integer videoId,
                                                                    @RequestBody VideoDTO.VideoUploadRequest requestBody) {
        try {
            if (videoId == null || videoId <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid video ID");
            }

            VideoDTO.VideoPlaybackResponse updatedVideo = videoService.updateVideo(requestBody, videoId);
            return ResponseEntity.ok(updatedVideo);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid input: " + e.getMessage());
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found: " + e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update video: " + e.getMessage());
        }
    }


    @PreAuthorize("hasAnyRole('ADMIN')")
    @DeleteMapping("/{videoId}/delete")
    public ResponseEntity<String> deleteVideo(@PathVariable Integer videoId) {
        try {
            videoService.deleteVideo(videoId);
            return ResponseEntity.ok("Video deleted successfully");
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found: " + e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete video: " + e.getMessage());
        }
    }
       
}
