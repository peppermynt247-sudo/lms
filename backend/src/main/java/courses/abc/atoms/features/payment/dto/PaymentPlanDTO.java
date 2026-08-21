package courses.abc.atoms.features.payment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PaymentPlanDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentPlan {

        private Long planId;
        private String name;
        private String description;
        private Long billingCycle;
        private Boolean isActive;

        @JsonProperty("PaymentPlanRules")
        private List<PaymentPlanRules> PaymentPlanRules=new ArrayList<>();

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class PaymentPlanRules{
            private Long installment;
            private Long weightage;
            private Long interval;
        }

    }


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdatePaymentPlan {

        private Long planId;
        private String name;
        private String description;
        private Long billingCycle;
        private Boolean isActive;

        @JsonProperty("paymentPlanRules")
        private List<PaymentPlanRules> paymentPlanRules =new ArrayList<>();

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class PaymentPlanRules{
            private Long PaymentPlanRulesId;
            private Long installment;
            private Long weightage;
            private Long interval;
        }
    }
 
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateActiveStatusRequest {
        private Long paymentPlanId;
        private Boolean isActive;

    }


}
