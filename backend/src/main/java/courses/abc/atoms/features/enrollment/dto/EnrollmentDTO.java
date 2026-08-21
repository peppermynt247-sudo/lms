package courses.abc.atoms.features.enrollment.dto;

import jakarta.persistence.Column;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.beanvalidation.SpringValidatorAdapter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class EnrollmentDTO {
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnrollmentRequest {
        private Long courseId;
        private Long userId;
    }

    // DTO representing the Enrolment table
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Enrolment {
        private Integer id;
        private Integer userId;
        private Integer courseId;
        private String orderNumber;
        private Integer price;
        private String paymentId;
        private String paymentStatus; // PENDING, PAID, CANCELLED, HOLD
        private String status;        // PENDING, PAID, CANCELLED, HOLD
        private String paymentVia;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static  class NewEnrollmentByEmail {
        private Long userId;
        private String email;
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static  class NewEnrollmentByPhoneNumber {
        private Long userId;
        private String phoneNumber;
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static  class NewEnrollmentToCourse{

    private Long userId;

    private Long courseId;
    private Long bundleId;
    private Long batchId;
    private String paymentStatus;
    private Long planId;



    private List<Installments> installments;
      @Data
      @NoArgsConstructor
      @AllArgsConstructor
      public static class Installments{
        private BigDecimal  amount;
        private String   status;
        private LocalDateTime  dueDate;
      }

    }


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkEnrollmentToCourse {
        private String email;
        private String name;
        private String password;
        private Long courseId;
        private Long bundleId;
        private Long batchId;
        private String paymentStatus;
        private Long planId;
        private String phone;
        private String currency;
        private String feesScheme;
        private String place;
        private String promocode;
        private String paymentMode;
        private String referenceNo;


        private List<Installments> installments;
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Installments{
            private BigDecimal  amount;
            private String   status;
            private LocalDateTime  dueDate;
        }
    }


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GetEnrolledCourses {
        private String courseName;
        private String batchName;
        private String enrolled;
        private String progress;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GetCoursesWithDetails {
        @NotBlank(message = "Course name is required")
        private String courseName;

        @NotBlank(message = "Enrolled date is required")
        private String enrolledAt;

        @NotBlank(message = "Expiration date is required")
        private String expiresAt;

        @NotNull(message = "Progress is required")
        @DecimalMin(value = "0.0", inclusive = true)
        @DecimalMax(value = "100.0", inclusive = true)
        private String progress;

        @NotBlank(message = "Payment status is required")
        private String paymentStatus;

        @NotNull(message = "Access granted is required")
        private Boolean accessGranted;

        @NotBlank(message = "Active by is required")
        private String activeBy;
    }

   @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GetBundlesWithDetails {
        @NotBlank(message = "Bundle name is required")
        private String bundleName;

        @NotBlank(message = "Enrolled date is required")
        private String enrolledAt;

        @NotBlank(message = "Expiration date is required")
        private String expiresAt;

        @NotNull(message = "Progress is required")
        @DecimalMin(value = "0.0", inclusive = true)
        @DecimalMax(value = "100.0", inclusive = true)
        private String progress;

        @NotBlank(message = "Payment status is required")
        private String paymentStatus;

        @NotNull(message = "Access granted is required")
        private Boolean accessGranted;

        @NotBlank(message = "Active by is required")
        private String activeBy;
    }


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static  class Enrollment{

        private Long userId;

        private List<Installments> installments;
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Installments{
            private Long installmentId;
            private BigDecimal  amount;
            private String   status;
            private LocalDateTime  dueDate;
        }

    }


}
