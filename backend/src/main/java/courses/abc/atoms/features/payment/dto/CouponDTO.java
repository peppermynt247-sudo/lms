package courses.abc.atoms.features.payment.dto;

import courses.abc.atoms.features.payment.enums.CouponType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CouponDTO {


    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Coupon  {

        @NotBlank(message = "Code is required")
        private String code;

        private String description;

        @NotNull(message = "Discount percentage is required")
        private BigDecimal discountPercentage;

        @NotBlank(message = "minPurchaseAmount is required")
        private BigDecimal minPurchaseAmount;

        @NotNull(message = "Start date is required")
        private LocalDateTime startDate;

        @NotNull(message = "expires date is required")
        private LocalDateTime expiresAt;

        private Boolean isActive;

        @NotNull(message = "couponType  is required")
        private CouponType couponType;
    }


    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class GetCoupons  {

        private Long CouponId;
        private String code;
        private String description;
        private BigDecimal discountPercentage;
        private BigDecimal minPurchaseAmount;
        private LocalDateTime startDate;
        private LocalDateTime expiresAt;
        private Boolean isActive;
        private CouponType couponType;
        private LocalDateTime createdAt;
    }


    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UpdateCoupon {

        private Long CouponId;
        private String code;
        private String description;
        private BigDecimal discountPercentage;
        private BigDecimal minPurchaseAmount;
        private LocalDateTime startDate;
        private Boolean isActive;
        private LocalDateTime expiresAt;
        private CouponType couponType;
    }



}
