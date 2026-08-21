package courses.abc.atoms.features.course.dto;

import java.time.LocalDateTime;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

public class ForumReplyDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForumReplyRequestDTO {
        private Integer forumId;
        private String content;
        private Integer vote;
        private Boolean isSolution;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForumReplyResponseDTO {
        private Integer replyId;
        private Integer forumId;
        private Integer userId;
        private String userName;
        private String userRole;
        private String content;
        private Integer vote;
        private Boolean isSolution;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}