package courses.abc.atoms.features.course.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import courses.abc.atoms.features.course.enums.ContentType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class DiscussionForumDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiscussionForumRequestDTO {
        private Integer courseId;
        private Integer batchId;
        private Integer sectionId;
        private Integer contentItemId;
        private String content;
        private Integer viewCount;
        private Boolean isPinned;
        private Boolean isLocked;
        private Boolean isActive;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiscussionForumResponseDTO {
        private Integer forumId;
        private Integer userId;
        private String userName;
        private String userProfileImage;
        private Integer courseId;
        private String courseName;
        private Integer batchId;
        private String batchName;
        private Integer sectionId;
        private String sectionName;
        private Integer contentItemId;
        private ContentType contentItemType;
        private String content;
        private Integer viewCount;
        private Boolean isPinned;
        private Boolean isLocked;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Boolean isActive;
        private List<ForumReplyDTO.ForumReplyResponseDTO> replies = new ArrayList<>();
    }
}