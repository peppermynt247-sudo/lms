package courses.abc.atoms.features.student.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class StudentDTO {
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnrolledCourseWithBatch {
        private Long courseId;
        private String courseName;
        private String description;
        private String thumbnailUrl;
        private Long batchId;
        private String batchName;
        private Long batchManagerId;
        private String batchManagerName;
        private String paymentStatus;
        private Boolean accessGranted;
        private String enrolledAt;
        private String expiresAt;
        private String activeBy;
        private String progressPercentage;
        private String completionStatus;
        private String lastActivityAt;
        private String completedAt;
        private String coursePrice;
        private Integer totalLessons;
        private Integer completedLessons;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnrolledBundleWithBatch {
        private Long bundleId;
        private String bundleName;
        private String description;
        private String thumbnailUrl;
        private Long batchId;
        private String batchName;
        private Long batchManagerId;
        private String batchManagerName;
        private String paymentStatus;
        private Boolean accessGranted;
        private String enrolledAt;
        private String expiresAt;
        private String activeBy;
        private String progressPercentage;
        private String completionStatus;
        private String lastActivityAt;
        private String completedAt;
        private String bundlePrice;
        private Integer totalCourses;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BundleWithCourses {
        private Long bundleId;
        private String bundleName;
        private String description;
        private String thumbnailUrl;
        private String bundlePrice;
        private Integer validityInDays;
        private Integer totalItems;
        private String discountPercentage;
        private Boolean isFeatured;
        private Boolean isPublished;
        private String enrolledAt;
        private String expiresAt;
        private String progressPercentage;
        private String completionStatus;
        private String paymentStatus;
        private Boolean accessGranted;
        private List<CourseMetadata> courses;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseMetadata {
        private Long courseId;
        private String courseName;
        private String description;
        private String overview;
        private String thumbnailUrl;
        private String coursePrice;
        private String difficultyLevel;
        private Integer estimatedHours;
        private Integer sequenceOrder;
        private Integer validityInDays;
        private Boolean isPublished;
        private Boolean isFeatured;
        private String progressPercentage;
    }
}
