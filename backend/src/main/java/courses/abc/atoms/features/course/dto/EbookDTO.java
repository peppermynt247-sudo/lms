package courses.abc.atoms.features.course.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
@NoArgsConstructor
public class EbookDTO {

    /**
     * Received as multipart/form-data text fields alongside the actual file parts.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateEbookRequest {

        @NotBlank(message = "Ebook title cannot be blank")
        private String title;

        private String description;
        private Integer pageCount;
    }

    /**
     * For updating ebook metadata.
     * File replacement is handled by supplying new MultipartFile parts.
     * Fields left null are not updated.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateEbookRequest {
        private String title;
        private String description;
        private Integer pageCount;
    }

    /**
     * Returned to clients.
     * viewUrl is a short-lived presigned URL (15 min) with Content-Disposition: inline.
     * coverImageUrl is also a short-lived presigned URL.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EbookResponse {
        private Long ebookId;
        private String title;
        private String description;
        private Integer pageCount;
        private Long fileSizeKb;

        /** 15-minute presigned GET URL — inline only, no download */
        private String viewUrl;

        /** 15-minute presigned GET URL for cover image */
        private String coverImageUrl;

        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryResponse {
        private Long ebookId;
        private String title;
        private String description;
        private String coverImageUrl;
    }
}