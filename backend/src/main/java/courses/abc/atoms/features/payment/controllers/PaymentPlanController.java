package courses.abc.atoms.features.payment.controllers;


import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.features.admission.controllers.AdmissionController;
import courses.abc.atoms.features.payment.dto.PaymentPlanDTO;
import courses.abc.atoms.features.payment.dto.PaymentPlanDTO.PaymentPlan;
import courses.abc.atoms.features.payment.dto.PaymentPlanDTO.UpdateActiveStatusRequest;
import courses.abc.atoms.features.payment.services.PaymentPlanService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/paymentplan")
@PreAuthorize("hasRole('ADMIN')")
public class PaymentPlanController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentPlanController.class);
    @Autowired
    private PaymentPlanService paymentPlanService;


    @PostMapping("/add")
    public ResponseEntity<Map<String,Object>> addPaymentPlan(@RequestBody PaymentPlanDTO.PaymentPlan paymentPlan){
        try{
           String data=  paymentPlanService.addPaymentPlan(paymentPlan);
            logger.info("Successfully added the payment plans");
            Map<String,Object> response =new HashMap<>();
            response.put("success",true);
            response.put("message","Successfully added the payment plans");
            response.put("Data",data);
            return new ResponseEntity<>(response, HttpStatus.OK);
        }catch (IllegalArgumentException e){
            logger.error("Billing cycle count must be equal to number of payment plan rules.",e.getMessage());

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Billing cycle count must be equal to number of payment plan rules.");

            return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
        }catch (Exception e){
            logger.error("Unable added the payment plans"+e);
            Map<String,Object> response =new HashMap<>();
            response.put("success",false);
            response.put("message","Unable added the payment plans");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PatchMapping("/update")
    public ResponseEntity<Map<String,Object>> updatePaymentPlan(@RequestBody PaymentPlanDTO.UpdatePaymentPlan updatePaymentPlan){
        try{
            String data=  paymentPlanService.updatePaymentPlan(updatePaymentPlan);
            logger.info("Successfully update the payment plans");
            Map<String,Object> response =new HashMap<>();
            response.put("success",true);
            response.put("message","Successfully update the payment plans");
            response.put("Data",data);
            return new ResponseEntity<>(response, HttpStatus.OK);
        }catch (ResourceNotFoundException e){
            logger.error("Payment plan not found"+e);
            Map<String,Object> response =new HashMap<>();
            response.put("success",false);
            response.put("message",e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.CONFLICT);
        }catch (IllegalArgumentException e){
            logger.error("Billing cycle count must be equal to number of payment plan rules.",e.getMessage());

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Billing cycle count must be equal to number of payment plan rules.");

            return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
        } catch (Exception e){
            logger.error("Unable update the payment plans"+e);
            Map<String,Object> response =new HashMap<>();
            response.put("success",false);
            response.put("message","Unable update the payment plans");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("")
    public ResponseEntity<Map<String, Object>> getPaymentPlanById(@RequestParam Long planId) {
        try {
            PaymentPlanDTO.UpdatePaymentPlan paymentPlan = paymentPlanService.getPaymentPlanById(planId);

            logger.info("Successfully retrieved payment plan");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment plan retrieved successfully");
            response.put("data", paymentPlan);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (ResourceNotFoundException e) {
            logger.error("Payment plan not found with ID"+e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Payment plan not found");

            return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);

        } catch (Exception e) {
            logger.error("Error retrieving payment plan with ID",e.getMessage());

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error retrieving payment plan"+e.getMessage());

            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }



    @PutMapping("/active")
    public ResponseEntity<Map<String, Object>> updateActiveStatus(@RequestBody PaymentPlanDTO.UpdateActiveStatusRequest request) {
        try {
            String updatedPlan = paymentPlanService.updateActiveStatus(request.getPaymentPlanId(), request.getIsActive());
            logger.info("Successfully updated the active status of the payment plan");
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Successfully updated the active status of the payment plan");
            response.put("data", updatedPlan);

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (ResourceNotFoundException e) {
            logger.error("Payment plan not found with ID:  " + request.getPaymentPlanId());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Payment plan not found with ID "+request.getPaymentPlanId());
            return new ResponseEntity<>(response,HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            logger.error("Error updating active status for payment plan ID: " + request.getPaymentPlanId(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Unable to update Payment plan "+request.getPaymentPlanId());
            return new ResponseEntity<>(response,HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }



    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllPaymentPlans() {
        try {
            List<PaymentPlanDTO.UpdatePaymentPlan> paymentPlans = paymentPlanService.getAllPaymentPlans();

            logger.info("Successfully retrieved all payment plans");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment plans retrieved successfully");
            response.put("data", paymentPlans);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (Exception e) {
            logger.error("Error retrieving all payment plans", e.getMessage());

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error retrieving payment plans: " + e.getMessage());

            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }




}
