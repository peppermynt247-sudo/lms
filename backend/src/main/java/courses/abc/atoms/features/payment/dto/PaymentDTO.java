package courses.abc.atoms.features.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public  class PaymentDTO {

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Payment {

        private Long userId;
        private BigDecimal amount;
        private String currency = "INR";

        private Long courseId;
        private Long bundleId;
        private Long planId;
        private Long installmentId;
        private String orderId;
        private String keyId;
        private Long paymentId;
        private String receipt;
        private String status;
        private String message;
        private String itemType;
        private Long itemId;
        private String itemName;
        private String planName;
        private String transactionId;
        private String paymentMethod;
        private LocalDateTime paymentDate;



    }


    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PaymentVerificationRequest {
        private String orderId;
        private String paymentId;
        private String signature;
        private Long internalPaymentId;
    }


    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UpdatePaymentDetails{

        private Long InstallmentId;
        private LocalDateTime date;
        private String paymentMode;
        private String referenceNo;
    }


}
