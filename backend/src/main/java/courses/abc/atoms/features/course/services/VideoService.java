package courses.abc.atoms.features.course.services;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import courses.abc.atoms.features.course.dto.VideoDTO;
import courses.abc.atoms.features.course.enums.ContentType;
import courses.abc.atoms.features.course.model.ContentItem;
import courses.abc.atoms.features.course.model.CurriculumSection;
import courses.abc.atoms.features.course.model.Video;
import courses.abc.atoms.features.course.repositories.VideoRepository;
import courses.abc.atoms.features.course.repositories.CurriculumSectionsRepository;
import courses.abc.atoms.features.course.repositories.ContentItemRepository;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.model.core.Profiles;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.core.repositories.ProfileRepository;
import jakarta.persistence.EntityNotFoundException;

import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;


@Service
public class VideoService {

    private static final Logger logger = LoggerFactory.getLogger(VideoService.class);
    
    @Value("${vdocipher.api.url}")
    private String vdoCipherApiUrl;

    @Value("${vdocipher.api.key}")
    private String vdoCipherApiSecret;

    
    @Autowired
    private VideoRepository videoRepository;
    @Autowired
    private CurriculumSectionsRepository curriculumSectionRepository;
    @Autowired
    private ContentItemRepository contentItemRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProfileRepository profileRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Gets current authenticated user's email and name from security context
     */
    private UserInfo getCurrentUserInfo() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getPrincipal() == null) {
                logger.warn("No authentication context found, using default watermark");
                return new UserInfo("unknown@example.com", "Unknown User");
            }

            Object principal = authentication.getPrincipal();
            String email = null;
            
            if (principal instanceof String) {
                email = (String) principal;
            } else if (principal instanceof UserDetails) {
                email = ((UserDetails) principal).getUsername();
            } else if (principal instanceof Users) {
                email = ((Users) principal).getEmail();
            }

            if (email == null) {
                logger.warn("Could not extract email from principal, using default watermark");
                return new UserInfo("unknown@example.com", "Unknown User");
            }

            // Get user from database
            Optional<Users> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                logger.warn("User not found for email: {}, using email as name", email);
                return new UserInfo(email, email);
            }

            Users user = userOpt.get();
            
            // Get profile to get the name
            Optional<Profiles> profileOpt = profileRepository.findByUserId(user.getId());
            String name = email; // Default to email if name not found
            
            if (profileOpt.isPresent() && profileOpt.get().getName() != null) {
                name = profileOpt.get().getName();
            }

            return new UserInfo(email, name);

        } catch (Exception e) {
            logger.error("Error getting current user info", e);
            return new UserInfo("unknown@example.com", "Unknown User");
        }
    }

    /**
     * Helper class to hold user information
     */
    private static class UserInfo {
        private final String email;
        private final String name;
        
        public UserInfo(String email, String name) {
            this.email = email;
            this.name = name;
        }
        
        public String getEmail() { return email; }
        public String getName() { return name; }
    }
    
    public String uploadVideo(VideoDTO.VideoUploadRequest request, Integer curriculumSectionId) {
        try {

            // Find the curriculum section
        CurriculumSection curriculumSection = curriculumSectionRepository.findBySectionId(curriculumSectionId)
                .orElseThrow(() -> new EntityNotFoundException("CurriculumSection not found with id: " + curriculumSectionId));

            String encodedTitle = URLEncoder.encode(request.getTitle(), StandardCharsets.UTF_8);
            String apiUrl = vdoCipherApiUrl + "/api/videos?title=" + encodedTitle;

            logger.info("Calling VdoCipher API to upload video with title: {}", request.getTitle());

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Apisecret " + vdoCipherApiSecret)
                    .PUT(HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                logger.info("Successfully created video upload session for title: {}", request.getTitle());
                
                // Save to database but return raw response
                saveVideoToDatabase(response.body(), request, curriculumSection);
                
                return response.body(); 
            } else {
                logger.error("VdoCipher API returned error status: {} for title: {}", response.statusCode(), request.getTitle());
                throw new RuntimeException("Failed to upload video: HTTP " + response.statusCode());
            }
            
        } catch (IOException | InterruptedException e) {
            logger.error("Error calling VdoCipher API for title: {}", request.getTitle(), e);
            throw new RuntimeException("Failed to upload video: " + e.getMessage(), e);
        }
    }

    @Transactional
    public String addYoutubeVideo(VideoDTO.VideoYoutubeRequest request, Integer curriculumSectionId) {
        try {
            logger.info("Adding YouTube video: {}", request.getTitle());
            CurriculumSection curriculumSection = curriculumSectionRepository.findBySectionId(curriculumSectionId)
                    .orElseThrow(() -> new EntityNotFoundException("CurriculumSection not found with id: " + curriculumSectionId));

            Video video = new Video();
            video.setTitle(request.getTitle());
            video.setDescription(request.getDescription());
            video.setVideoUrl(request.getUrl());
            video.setUploadStatus(VideoDTO.UploadStatus.READY);
            
            // Set a unique vdoCipherId for YouTube videos to satisfy DB constraints (Unique/Not Null)
            String youtubeId = extractYoutubeId(request.getUrl());
            video.setVdoCipherId("YT-" + (youtubeId != null ? youtubeId : java.util.UUID.randomUUID().toString()));
            
            Video savedVideo = videoRepository.save(video);
            logger.info("Saved YouTube video with ID: {}", savedVideo.getVideoId());

            ContentItem contentItem = new ContentItem();
            contentItem.setSection(curriculumSection);
            contentItem.setContentType(ContentType.VIDEO);
            contentItem.setContentReferenceId(savedVideo.getVideoId());
            contentItem.setItemOrder(calculateItemOrder(curriculumSection));
            contentItem.setIsPublished(true);
            contentItem.setIsRequired(false);

            contentItemRepository.save(contentItem);
            
            return "YouTube video added successfully";
        } catch (Exception e) {
            logger.error("Failed to add YouTube video: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to add YouTube video: " + e.getMessage());
        }
    }

    private String extractYoutubeId(String url) {
        if (url == null) return null;
        if (url.contains("v=")) {
            return url.split("v=")[1].split("&")[0];
        } else if (url.contains("youtu.be/")) {
            return url.split("youtu.be/")[1].split("\\?")[0];
        } else if (url.contains("embed/")) {
            return url.split("embed/")[1].split("\\?")[0];
        }
        return null;
    }

    private Integer calculateItemOrder(CurriculumSection curriculumSection) {
        Integer maxOrder = contentItemRepository.findMaxItemOrderBySection(curriculumSection);
        if (maxOrder == null) maxOrder = 0;
        return maxOrder + 1;
    }

    @Transactional
    public String updateYoutubeVideo(Integer videoId, VideoDTO.VideoYoutubeRequest request) {
        try {
            logger.info("Updating YouTube video with ID: {}", videoId);

            Video video = videoRepository.findById(videoId)
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Video not found with id: " + videoId));

            // Only allow updating YouTube videos (identified by YT- prefix)
            if (video.getVdoCipherId() == null || !video.getVdoCipherId().startsWith("YT-")) {
                throw new IllegalArgumentException(
                        "Video ID " + videoId + " is not a YouTube video and cannot be updated here.");
            }

            if (request.getTitle() != null)       video.setTitle(request.getTitle());
            if (request.getDescription() != null) video.setDescription(request.getDescription());

            // If URL changed, update both videoUrl and vdoCipherId
            if (request.getUrl() != null && !request.getUrl().isBlank()) {
                String youtubeId = extractYoutubeId(request.getUrl());
                video.setVideoUrl(request.getUrl());
                video.setVdoCipherId("YT-" + (youtubeId != null
                        ? youtubeId : UUID.randomUUID().toString()));
            }

            videoRepository.save(video);
            logger.info("Updated YouTube video with ID: {}", videoId);
            return "YouTube video updated successfully";

        } catch (Exception e) {
            logger.error("Failed to update YouTube video {}: {}", videoId, e.getMessage(), e);
            throw new RuntimeException("Failed to update YouTube video: " + e.getMessage());
        }
    }

    @Transactional
    public String deleteYoutubeVideo(Integer videoId) {
        try {
            logger.info("Deleting YouTube video with ID: {}", videoId);

            Video video = videoRepository.findById(videoId)
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Video not found with id: " + videoId));

            // Only allow deleting YouTube videos
            if (video.getVdoCipherId() == null || !video.getVdoCipherId().startsWith("YT-")) {
                throw new IllegalArgumentException(
                        "Video ID " + videoId + " is not a YouTube video and cannot be deleted here.");
            }

            // Delete the ContentItem link first
            contentItemRepository
                    .findByContentReferenceIdAndContentType(videoId, ContentType.VIDEO)
                    .ifPresent(contentItemRepository::delete);

            // Delete the video record
            videoRepository.deleteById(videoId);
            logger.info("Deleted YouTube video with ID: {}", videoId);
            return "YouTube video deleted successfully";

        } catch (Exception e) {
            logger.error("Failed to delete YouTube video {}: {}", videoId, e.getMessage(), e);
            throw new RuntimeException("Failed to delete YouTube video: " + e.getMessage());
        }
    }
    
    /**
     * Saves video details to database from VdoCipher response
     */
    private void saveVideoToDatabase(String responseBody, VideoDTO.VideoUploadRequest request, CurriculumSection curriculumSection) {
        try {
            JsonNode responseJson = objectMapper.readTree(responseBody);

            logger.info("Parsing VdoCipher response for video upload");
            logger.info("VdoCipher response: {}", responseJson);
            
            // Extract data from VdoCipher response
            String vdoCipherId = responseJson.get("videoId").asText();
            
            logger.info("Saving video to database - VdoCipher ID: {}", vdoCipherId);
            
            // Create and save new Video entity
            Video video = new Video();
            video.setTitle(request.getTitle());
            video.setDescription(request.getDescription());
            video.setVdoCipherId(vdoCipherId);
            video.setUploadStatus(VideoDTO.UploadStatus.PENDING);
            
            Video savedVideo = videoRepository.save(video);
            logger.info("Saved video to database with ID: {} and VdoCipher ID: {}", savedVideo.getVideoId(), vdoCipherId);

        // Create and populate ContentItem entity
            ContentItem contentItem = new ContentItem();
            contentItem.setSection(curriculumSection);
            contentItem.setContentType(ContentType.VIDEO);
            contentItem.setContentReferenceId(savedVideo.getVideoId());
            contentItem.setItemOrder(calculateItemOrder(curriculumSection));
            contentItem.setIsPublished(false);
            contentItem.setIsRequired(false);
            contentItem.setEstimatedMinutes(null);
            contentItem.setXpPoints(null); // Assuming you have a method to calculate this
            contentItem.setReleaseDate(null);
            contentItem.setPrerequisiteItem(null);

            // Save content item
            contentItemRepository.save(contentItem);

        } catch (Exception e) {
            logger.error("Failed to save video to database", e);
            // Don't throw exception here, just log it so the response still gets returned
        }
    }



    public VideoDTO.VideoPlaybackResponse getVideoPlaybackInfo(Integer videoId) {
        try {
            // Validate input
            if (videoId == null || videoId <= 0) {
                throw new IllegalArgumentException("Invalid video ID: " + videoId);
            }

            // Fetch video from database
            Video video = videoRepository.findByVideoId(videoId)
                    .orElseThrow(() -> new EntityNotFoundException("Video not found with id: " + videoId));

            logger.info("Fetching video details for videoId: {}", videoId);

            // Check if it's a YouTube video
            boolean isYoutube = video.getVideoUrl() != null || (video.getVdoCipherId() != null && video.getVdoCipherId().startsWith("YT-"));
            
            if (isYoutube) {
                VideoDTO.VideoPlaybackResponse response = new VideoDTO.VideoPlaybackResponse();
                response.setVideoId(video.getVideoId());
                response.setTitle(video.getTitle());
                response.setDescription(video.getDescription());
                response.setVideoUrl(video.getVideoUrl());
                response.setUploadStatus(video.getUploadStatus());
                response.setCreatedAt(video.getCreatedAt());
                return response;
            }

            // Check if vdoCipherId exists
            if (video.getVdoCipherId() == null || video.getVdoCipherId().trim().isEmpty()) {
                logger.error("VdoCipher ID and Video URL are both null or empty for videoId: {}", videoId);
                throw new RuntimeException("Video is not properly configured - missing playback information");
            }

            // Generate OTP using VdoCipher API
            String otpPayload = generateVdoCipherOtp(video.getVdoCipherId());

            // Parse OTP response
            JsonNode otpResponse = objectMapper.readTree(otpPayload);
            
            // Validate OTP response structure
            if (otpResponse.get("otp") == null || otpResponse.get("playbackInfo") == null) {
                logger.error("Invalid OTP response structure for videoId: {}", videoId);
                throw new RuntimeException("Failed to get valid OTP response from VdoCipher");
            }
            
            String otp = otpResponse.get("otp").asText();
            String playbackInfo = otpResponse.get("playbackInfo").asText();

            // Construct DTO for frontend using the available constructor
            VideoDTO.VideoPlaybackResponse response = new VideoDTO.VideoPlaybackResponse();
            response.setVideoId(video.getVideoId());
            response.setTitle(video.getTitle());
            response.setDescription(video.getDescription());
            response.setVdoCipherId(video.getVdoCipherId());
            response.setOtp(otp);
            response.setPlaybackInfo(playbackInfo);
            response.setVideoUrl(video.getVideoUrl());
            response.setUploadStatus(video.getUploadStatus());
            response.setCreatedAt(video.getCreatedAt());

            logger.info("Successfully retrieved video details and OTP for videoId: {}", videoId);
            return response;

        } catch (EntityNotFoundException e) {
            logger.error("Video not found with id: {}", videoId);
            throw e;
        } catch (IllegalArgumentException e) {
            logger.error("Invalid argument for videoId: {}", videoId, e);
            throw e;
        } catch (IOException e) {
            logger.error("Error communicating with VdoCipher API for videoId: {}", videoId, e);
            throw new RuntimeException("Failed to communicate with video service: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error while retrieving video details for videoId: {}", videoId, e);
            throw new RuntimeException("Failed to retrieve video details: " + e.getMessage(), e);
        }
    }

    /**
     * Calls VdoCipher API to generate OTP for video playback
     * @param vdoCipherId The VdoCipher ID of the video
     * @return JSON response body containing OTP and playback info
     */
    private String generateVdoCipherOtp(String vdoCipherId) throws IOException, InterruptedException {
        String apiUrl = vdoCipherApiUrl + "/api/videos/" + vdoCipherId + "/otp";

        logger.info("Calling VdoCipher API to generate OTP for video: {}", vdoCipherId);

        // Get current user information for watermarking
        UserInfo userInfo = getCurrentUserInfo();
        
        // Create request body with annotation watermark as per VdoCipher API docs
        // Using rtext (rotating text) annotation with user name and email
        String watermarkText = String.format("%s %s", userInfo.getName(), userInfo.getEmail());
        String requestBody = String.format(
            "{\"annotate\":\"[{'type':'rtext', 'text':'%s', 'alpha':'0.60', 'color':'0xFF0000','size':'10','interval':'5000'}]\"}",
            watermarkText.replace("\"", "\\\"").replace("'", "\\'")
        );

        logger.info("Generating OTP with annotation watermark for user: {} ({})", userInfo.getName(), userInfo.getEmail());

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .header("Content-Type", "application/json")
                .header("Authorization", "Apisecret " + vdoCipherApiSecret)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200 || response.statusCode() == 201) {
            logger.info("Successfully generated OTP for video: {} with watermark for user: {}", vdoCipherId, userInfo.getEmail());
            return response.body();
        } else {
            logger.error("VdoCipher API returned error status: {} for video: {}", response.statusCode(), vdoCipherId);
            throw new RuntimeException("Failed to generate OTP: HTTP " + response.statusCode());
        }
    }

    /**
     * Handles webhook notifications from Videocipher.
     *
     * @param payload The parsed JSON payload from the webhook request.
     */
    @Transactional
    public void handleWebhook(VideoDTO.VideocipherWebhookPayload payload) {

        if (payload == null || payload.getVideoData() == null || payload.getVideoData().getVdoCipherId() == null) {
            logger.error("Received an invalid or incomplete webhook payload.");
            return;
        }

        String vdoId = payload.getVideoData().getVdoCipherId();
        String eventType = payload.getEvent();
        logger.info("Received webhook event: {} for vdoCipherId: {}", eventType, vdoId);

        Optional<Video> videoOptional = videoRepository.findByVdoCipherId(vdoId);

        if (videoOptional.isEmpty()) {
            logger.error("Webhook received for unknown video ID: {}. Ignoring.", vdoId);
            return;
        }

        Video video = videoOptional.get();

        switch (eventType) {
            case "video:ready":
                video.setUploadStatus(VideoDTO.UploadStatus.READY);
                if (payload.getVideoData().getDuration() != null) {
                    video.setDurationSeconds(payload.getVideoData().getDuration());
                }
                logger.info("Video status updated to READY for vdoCipherId: {}", vdoId);
                break;

            default:
                video.setUploadStatus(VideoDTO.UploadStatus.FAILED);
                logger.warn("Video status updated to FAILED for vdoCipherId: {}. Reason: Unhandled or error event type '{}'", vdoId, eventType);
                break;
        }

        videoRepository.save(video);

    }

    public VideoDTO.VideoPlaybackResponse updateVideo(VideoDTO.VideoUploadRequest request, Integer videoId) {
        Video video = videoRepository.findByVideoId(videoId)
                .orElseThrow(() -> new EntityNotFoundException("Video not found with id: " + videoId));

        boolean isYoutube = video.getVideoUrl() != null || (video.getVdoCipherId() != null && video.getVdoCipherId().startsWith("YT-"));

        // Update title
        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            if (!isYoutube && video.getVdoCipherId() != null && !video.getVdoCipherId().isEmpty()) {
                try {
                    // Create JSON payload with proper escaping
                    String escapedTitle = request.getTitle().replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
                    String jsonPayload = "{\"title\":\"" + escapedTitle + "\"}";
                    
                    HttpRequest httpRequest = HttpRequest.newBuilder()
                            .uri(URI.create(vdoCipherApiUrl + "/api/videos/" + video.getVdoCipherId()))
                            .header("accept", "application/json")
                            .header("Content-Type", "application/json")
                            .header("Authorization", "Apisecret " + vdoCipherApiSecret)
                            .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                            .build();

                    HttpResponse<String> response = HttpClient.newHttpClient()
                            .send(httpRequest, HttpResponse.BodyHandlers.ofString());
                    
                    if (response.statusCode() == 200 || response.statusCode() == 204) {
                        video.setTitle(request.getTitle());
                    } else {
                        logger.error("Failed to update video title on VdoCipher. Status: {}", response.statusCode());
                        // We still update locally if VdoCipher fails or decide to throw?
                        // For now, let's keep it consistent: if we intended to update VdoCipher and failed, throw.
                        throw new RuntimeException("Failed to update video title on VdoCipher: HTTP " + response.statusCode());
                    }
                } catch (IOException | InterruptedException e) {
                    throw new RuntimeException("Failed to update video title: " + e.getMessage());
                }
            } else {
                // Just update locally for YouTube videos
                video.setTitle(request.getTitle());
            }
        }

        // Update description
        if (request.getDescription() != null) {
            video.setDescription(request.getDescription());
        }

        // Update YouTube URL if it's a YouTube video
        if (isYoutube && request.getUrl() != null && !request.getUrl().trim().isEmpty()) {
            video.setVideoUrl(request.getUrl());
            // Also update vdoCipherId if the YouTube ID changed to keep it unique/correct
            String newYoutubeId = extractYoutubeId(request.getUrl());
            if (newYoutubeId != null) {
                video.setVdoCipherId("YT-" + newYoutubeId);
            }
        }

        // Save updated video entity
        videoRepository.save(video);

        return getVideoPlaybackInfo(videoId);
    }

    /**
     * Deletes a video by its ID.
     * 
     * @param videoId The ID of the video to delete.
     */
    public void deleteVideo(Integer videoId) {
        Video video = videoRepository.findByVideoId(videoId)
                .orElseThrow(() -> new EntityNotFoundException("Video not found with id: " + videoId));

        String vdoCipherUrl = vdoCipherApiUrl + "/api/videos?videos=" + video.getVdoCipherId();

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(vdoCipherUrl))
                .header("accept", "application/json")
                .header("Content-Type", "application/json")
                .header("Authorization", "Apisecret " + vdoCipherApiSecret)
                .DELETE()
                .build();

        try {
            HttpResponse<String> response = HttpClient.newHttpClient().send(httpRequest, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200 || response.statusCode() == 204) {                
                // Delete associated ContentItem first (foreign key constraint)
                ContentItem contentItem = contentItemRepository.findByContentReferenceIdAndContentType(videoId, ContentType.VIDEO).orElse(null);
                if (contentItem != null) {
                    contentItemRepository.delete(contentItem);
                }
                
                // Finally delete the video from our database
                videoRepository.delete(video);                
            } else {
                throw new RuntimeException("Failed to delete video from VdoCipher: HTTP " + response.statusCode());
            }
            
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("Failed to delete video: " + e.getMessage());
        }
    }
}
