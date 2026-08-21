package courses.abc.atoms.features.admission.dto;

import liquibase.datatype.DataTypeInfo;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class AdmissionDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class payments{
        private Long paymentId;
        private LocalDateTime date;
        private String paymentMethod;
        private String transactionId;
        private BigDecimal amount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class admissionDetails{
        private Long Id;
        private String  title;
        private BigDecimal  Fees;
        private String PaymentStatus;
        private LocalDateTime EnrolledAt;
        private String admissionStatus;
        private String type;

        private List<Installments> installments = new ArrayList<>();

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Installments {
            private Long installmentId;
            private BigDecimal amount;
            private LocalDateTime dueDate;
            private String status;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class updatePayment{
        private Long paymentId;
        private LocalDateTime date;
        private String paymentMethod;
        private String transactionId;
    }


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class updateInstallment{
        private Long userId;
        private Long Id;
        private String type;

        private List<Installments> installments = new ArrayList<>();

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Installments {
            private Long installmentId;
            private BigDecimal amount;
            private LocalDateTime dueDate;
        }
    }
}
