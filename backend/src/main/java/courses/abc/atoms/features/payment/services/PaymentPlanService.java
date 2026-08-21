package courses.abc.atoms.features.payment.services;


import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.features.payment.dto.PaymentPlanDTO;
import courses.abc.atoms.features.payment.dto.PaymentPlanDTO.PaymentPlan;
import courses.abc.atoms.features.payment.model.PaymentPlanRule;
import courses.abc.atoms.features.payment.model.PaymentPlans;
import courses.abc.atoms.features.payment.repositories.PaymentPlanRepository;
import courses.abc.atoms.features.payment.repositories.PaymentPlanRuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentPlanService {

    @Autowired
    private PaymentPlanRepository paymentPlanRepository;

    @Autowired
    private PaymentPlanRuleRepository paymentPlanRuleRepository;

    public String addPaymentPlan(PaymentPlanDTO.PaymentPlan paymentPlan){
        try{

            if (paymentPlan.getPaymentPlanRules() != null &&
                    paymentPlan.getBillingCycle() != null &&
                    paymentPlan.getBillingCycle() != paymentPlan.getPaymentPlanRules().size()) {
                throw new IllegalArgumentException("Billing cycle count must be equal to number of payment plan rules.");
            }

            PaymentPlans paymentPlans = new PaymentPlans();
            paymentPlans.setName(paymentPlan.getName());
            paymentPlans.setDescription(paymentPlan.getDescription());
            paymentPlans.setBillingCycle(paymentPlan.getBillingCycle());
            paymentPlans.setIsActive(paymentPlan.getIsActive());
            paymentPlans.setCreatedAt(LocalDateTime.now());
            paymentPlans.setUpdatedAt(LocalDateTime.now());


            PaymentPlans savedPaymentPlan = paymentPlanRepository.save(paymentPlans);


            for (PaymentPlanDTO.PaymentPlan.PaymentPlanRules pay : paymentPlan.getPaymentPlanRules()) {

                PaymentPlanRule paymentPlanRule = new PaymentPlanRule();
                paymentPlanRule.setPaymentPlan(savedPaymentPlan);
                paymentPlanRule.setInstallment(pay.getInstallment());
                paymentPlanRule.setWeightage(pay.getWeightage());
                paymentPlanRule.setInterval(pay.getInterval());

                paymentPlanRuleRepository.save(paymentPlanRule);
            }

            return "Successfully added the payment plan";
        }catch (Exception e){
             throw e;
        }
    }


    public String updatePaymentPlan(PaymentPlanDTO.UpdatePaymentPlan updatePaymentPlan) {
        try {
            Optional<PaymentPlans> existingPaymentPlanOpt = paymentPlanRepository.findByPlanId(updatePaymentPlan.getPlanId());

            if (existingPaymentPlanOpt.isEmpty()) {
                throw new ResourceNotFoundException("Payment plan not found with ID: " + updatePaymentPlan.getPlanId());
            }


            if (updatePaymentPlan.getPaymentPlanRules() != null &&
                    updatePaymentPlan.getBillingCycle() != null &&
                    updatePaymentPlan.getBillingCycle() != updatePaymentPlan.getPaymentPlanRules().size()) {
                throw new IllegalArgumentException("Billing cycle count must be equal to number of payment plan rules.");
            }

            PaymentPlans existingPaymentPlan = existingPaymentPlanOpt.get();


            if (updatePaymentPlan.getName() != null)
                existingPaymentPlan.setName(updatePaymentPlan.getName());

            if (updatePaymentPlan.getDescription() != null)
                existingPaymentPlan.setDescription(updatePaymentPlan.getDescription());

            if (updatePaymentPlan.getBillingCycle() != null)
                existingPaymentPlan.setBillingCycle(updatePaymentPlan.getBillingCycle());

            if (updatePaymentPlan.getIsActive() != null)
                existingPaymentPlan.setIsActive(updatePaymentPlan.getIsActive());

            existingPaymentPlan.setUpdatedAt(LocalDateTime.now());
            paymentPlanRepository.save(existingPaymentPlan);


            if (updatePaymentPlan.getPaymentPlanRules() != null) {
                for (PaymentPlanDTO.UpdatePaymentPlan.PaymentPlanRules ruleDTO : updatePaymentPlan.getPaymentPlanRules()) {

                        Optional<PaymentPlanRule> existingRuleOpt =
                                paymentPlanRuleRepository.findByPaymentPlanRulesId(ruleDTO.getPaymentPlanRulesId());

                          if(existingRuleOpt.isEmpty()){
                              throw new ResourceNotFoundException("Payment plan Rule not found with ID: " + ruleDTO.getPaymentPlanRulesId());
                          }
                          


                            PaymentPlanRule existingRule = existingRuleOpt.get();
                            if (ruleDTO.getInstallment() != null)
                                existingRule.setInstallment(ruleDTO.getInstallment());
                            if (ruleDTO.getWeightage() != null)
                                existingRule.setWeightage(ruleDTO.getWeightage());
                            if (ruleDTO.getInterval() != null)
                                existingRule.setInterval(ruleDTO.getInterval());

                            paymentPlanRuleRepository.save(existingRule);

                    }

            }

            return "Successfully updated the payment plan";
        } catch (Exception e) {

            throw e;
        }
    }


    public PaymentPlanDTO.UpdatePaymentPlan getPaymentPlanById(Long planId) {
        try {

            Optional<PaymentPlans> paymentPlanOpt = paymentPlanRepository.findByPlanId(planId);

            if (paymentPlanOpt.isEmpty()) {
                throw new ResourceNotFoundException("Payment plan not found with ID: " + planId);
            }

            PaymentPlans paymentPlan = paymentPlanOpt.get();


            List<PaymentPlanRule> paymentRules = paymentPlanRuleRepository.findByPaymentPlan_PlanId(planId);


            PaymentPlanDTO.UpdatePaymentPlan responseDTO = new PaymentPlanDTO.UpdatePaymentPlan();
            responseDTO.setPlanId(paymentPlan.getPlanId().longValue());
            responseDTO.setName(paymentPlan.getName());
            responseDTO.setDescription(paymentPlan.getDescription());
            responseDTO.setBillingCycle(paymentPlan.getBillingCycle());
            responseDTO.setIsActive(paymentPlan.getIsActive());


            List<PaymentPlanDTO.UpdatePaymentPlan.PaymentPlanRules> rulesDTO = new ArrayList<>();
            for (PaymentPlanRule rule : paymentRules) {
                PaymentPlanDTO.UpdatePaymentPlan.PaymentPlanRules ruleDTO = new PaymentPlanDTO.UpdatePaymentPlan.PaymentPlanRules();
                ruleDTO.setPaymentPlanRulesId(rule.getPaymentPlanRulesId().longValue());
                ruleDTO.setInstallment(rule.getInstallment());
                ruleDTO.setWeightage(rule.getWeightage());
                ruleDTO.setInterval(rule.getInterval());
                rulesDTO.add(ruleDTO);
            }

            responseDTO.setPaymentPlanRules(rulesDTO);

            return responseDTO;

        } catch (ResourceNotFoundException e) {
            throw e;
        }
    }


   

    public String updateActiveStatus(Long paymentPlanId, Boolean isActive) {
        try {
            Optional<PaymentPlans> Paymentplan = paymentPlanRepository.findByPlanId(paymentPlanId);
            if (Paymentplan.isEmpty()) {
                throw new ResourceNotFoundException("Payment plan not found with ID: " + paymentPlanId);
            }


            PaymentPlans plan = Paymentplan.get();
             plan.setIsActive(isActive);
             paymentPlanRepository.save(plan);

             return "Successfully updated the active status of the payment plan";
        } catch (Exception e) {
           throw e;
        }
    }


    public List<PaymentPlanDTO.UpdatePaymentPlan> getAllPaymentPlans() {
        try {
            List<PaymentPlans> paymentPlans = paymentPlanRepository.findAll();
            List<PaymentPlanDTO.UpdatePaymentPlan> responseDTOs = new ArrayList<>();

            for (PaymentPlans paymentPlan : paymentPlans) {
                List<PaymentPlanRule> paymentRules = paymentPlanRuleRepository.findByPaymentPlan_PlanId(paymentPlan.getPlanId());


                PaymentPlanDTO.UpdatePaymentPlan responseDTO = new PaymentPlanDTO.UpdatePaymentPlan();
                responseDTO.setPlanId(paymentPlan.getPlanId().longValue());
                responseDTO.setName(paymentPlan.getName());
                responseDTO.setDescription(paymentPlan.getDescription());
                responseDTO.setBillingCycle(paymentPlan.getBillingCycle());
                responseDTO.setIsActive(paymentPlan.getIsActive());


                List<PaymentPlanDTO.UpdatePaymentPlan.PaymentPlanRules> rulesDTO = new ArrayList<>();
                for (PaymentPlanRule rule : paymentRules) {
                    PaymentPlanDTO.UpdatePaymentPlan.PaymentPlanRules ruleDTO = new PaymentPlanDTO.UpdatePaymentPlan.PaymentPlanRules();
                    ruleDTO.setPaymentPlanRulesId(rule.getPaymentPlanRulesId().longValue());
                    ruleDTO.setInstallment(rule.getInstallment());
                    ruleDTO.setWeightage(rule.getWeightage());
                    ruleDTO.setInterval(rule.getInterval());
                    rulesDTO.add(ruleDTO);

                }

                responseDTO.setPaymentPlanRules(rulesDTO);
                responseDTOs.add(responseDTO);
            }
            return responseDTOs;

        } catch (Exception e) {

            throw e;
        }
    }



}
