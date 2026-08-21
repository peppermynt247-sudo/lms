package courses.abc.atoms.features.payment.controllers;


import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.features.admission.controllers.AdmissionController;
import courses.abc.atoms.features.admission.dto.AdmissionDTO;
import courses.abc.atoms.features.payment.dto.PaymentDTO;
import courses.abc.atoms.features.payment.model.Payments;
import courses.abc.atoms.features.payment.repositories.PaymentsRepository;
import courses.abc.atoms.features.payment.services.PaymentService;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payment")
@PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR')")
public class PaymentController {

   private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);

  @Autowired
  private PaymentService paymentService;


  @Autowired
  private PaymentsRepository paymentsRepository;

    @GetMapping("/getpayments")
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR')or hasRole('STUDENT')")
    public ResponseEntity<Map<String,Object>> getPaymentDetailsById(@RequestParam Long userid){
        try{
            List<AdmissionDTO.payments> payments= paymentService.getPaymentDetailsById(userid);
            logger.info("Successfully got the user payments details");
            Map<String,Object> response =new HashMap<>();
            response.put("success",true);
            response.put("message","successfully retrieve the payments details");
            response.put("Data",payments);
            return new ResponseEntity<>(response, HttpStatus.OK);
        }catch (ResourceNotFoundException e){
            logger.info("User not found "+e);
            Map<String,Object> response =new HashMap<>();
            response.put("success",false);
            response.put("message","User not found ");
            return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
        }
        catch (Exception e){
            logger.info("Unable to get the payments details"+e);
            Map<String,Object> response =new HashMap<>();
            response.put("success",false);
            response.put("message","Unable to get the payments details");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @PatchMapping("/updatepayment")
    public ResponseEntity<Map<String,Object>> updatePaymentsById(@RequestBody AdmissionDTO.updatePayment updatePayment){
        try {
            String data = paymentService.updatePayments(updatePayment);
            logger.info("Successfully updated the payments details");
            Map<String,Object> response =new HashMap<>();
            response.put("success",true);
            response.put("message","Successfully updated the payments details");
            response.put("Data",data);
            return new ResponseEntity<>(response, HttpStatus.OK);
        }catch (Exception e){
            logger.error("unable updated the payments details"+e);
            Map<String,Object> response =new HashMap<>();
            response.put("success",false);
            response.put("message","unable updated the payments details");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR') or hasRole('STUDENT')")
    public ResponseEntity<Map<String,Object>> getPaymentsByCourseIdOrBundle(@RequestParam Long userid,@RequestParam(required = false) Long courseid,@RequestParam(required = false) Long bundleid){
         try{
             Map<String,Object> response =new HashMap<>();
             if(courseid == null && bundleid == null){
                 response.put("success",false);
                 response.put("message","Either course or bundle is required");
                 return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
             }

             List<AdmissionDTO.payments> payments =paymentService.getPaymentByCourseIdOrBundleId(userid,courseid,bundleid);

             if (payments.isEmpty()) {
                 response.put("success", true);
                 response.put("message", "No payments found for the given criteria");
                 response.put("Data", payments);
                 return new ResponseEntity<>(response, HttpStatus.OK);
             }

             logger.info("Successfully able to get the payments ");
             response.put("success",true);
             response.put("message","Successfully updated the payments details");
             response.put("Data",payments);
             return new ResponseEntity<>(response, HttpStatus.OK);

         }catch (EntityNotFoundException e){
             logger.error(e.getMessage());
             Map<String,Object> response =new HashMap<>();
             response.put("success",false);
             response.put("message",e.getMessage());
             return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
         } catch (Exception e){
             logger.error("unable updated the payments details"+e);
             Map<String,Object> response =new HashMap<>();
             response.put("success",false);
             response.put("message","unable updated the payments details");
             return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
         }
    }




    @PostMapping("/createorder")
    @PreAuthorize("permitAll")
    public ResponseEntity<Map<String,Object>> createPaymentOrder(@RequestBody PaymentDTO.Payment request) {
        try {
            PaymentDTO.Payment data = paymentService.createPaymentOrder(request);
            logger.info("Successfully created payments details");
            Map<String,Object> response =new HashMap<>();
            response.put("success",true);
            response.put("message","Successfully created the payments details");
            response.put("Data",data);
            return new ResponseEntity<>(response, HttpStatus.OK);

        }catch (ResourceNotFoundException e){
            logger.error("Not Found"+e.getMessage());
            Map<String,Object> response =new HashMap<>();
            response.put("success",false);
            response.put("message",e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            logger.error(e.getMessage());
            Map<String,Object> response =new HashMap<>();
            response.put("success",false);
            response.put("message","unable created the payments details");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @PostMapping("/verifypayment")
    @PreAuthorize("permitAll")
    public ResponseEntity<Map<String,Object>> verifyPayment(@RequestBody PaymentDTO.PaymentVerificationRequest request) {
        Map<String,Object> response = new HashMap<>();
        try {
            boolean isValid = paymentService.verifySignature(request);

            if (!isValid) {
                response.put("success", false);
                response.put("message", "Invalid signature");
                return new ResponseEntity<>(response, HttpStatus.CONFLICT);
            }

            logger.info("Payment verified Successfully");
            response.put("success", true);
            response.put("message", "Payment verified and updated successfully");
            return new ResponseEntity<>(response, HttpStatus.OK);

        }catch (ResourceNotFoundException e){
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            logger.error(e.getMessage());
            response.put("success", false);
            response.put("message", "Unable to verify payment");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @PostMapping("/webhook")
    @PreAuthorize("permitAll")
    public ResponseEntity<Map<String,Object>> handleWebhook(@RequestBody String payload, @RequestHeader("X-Razorpay-Signature") String signature) {
        try {
            boolean isValid = paymentService.verifyWebhookSignature(payload, signature);

            if (!isValid) {
                Map<String,Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Invalid signature");
                return new ResponseEntity<>(response, HttpStatus.CONFLICT);

            }


            paymentService.handleWebhookEvent(payload);
            Map<String,Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Webhook received and verified");
            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            Map<String,Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "  Webhook processing failed");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @PostMapping("/updateinstallment")
    public ResponseEntity<Map<String,Object>> updatePaymentDetailByInstallment(@RequestBody PaymentDTO.UpdatePaymentDetails paymentDetails){
        try{
            String data =  paymentService.updatePaymentByInstallmentId(paymentDetails);
            logger.info("Update the payment details successfully");
            Map<String,Object> response = new HashMap<>();
            response.put("success", true);
            response.put("Data",data);
            response.put("message", "Update the payment details successfully");
            return new ResponseEntity<>(response, HttpStatus.OK);
        }catch (ResourceNotFoundException e){
            logger.error("Unable to Update the payment details ");
            Map<String,Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Unable to Update the payment details"+ e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.CONFLICT);
        }catch (Exception e){
            logger.error("Unable to Update the payment details "+e);
            Map<String,Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Update the payment details successfully");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


}
