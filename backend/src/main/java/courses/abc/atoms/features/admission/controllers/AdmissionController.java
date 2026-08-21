package courses.abc.atoms.features.admission.controllers;

import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.features.admission.dto.AdmissionDTO;
import courses.abc.atoms.features.admission.services.AdmissionServices;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admission")
@PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR')")
public class AdmissionController {


    private static final Logger logger = LoggerFactory.getLogger(AdmissionController.class);
    @Autowired
    private AdmissionServices admissionServices;



    @GetMapping("/getadmission")
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR')or hasRole('STUDENT')")
    public ResponseEntity<Map<String,Object>> getAdmissionDetailsById(@RequestParam Long userid){
        try{
//            List<AdmissionDTO.admissionDetails> admissionDetails= .getAdmissionDetails(userid);

            List<AdmissionDTO.admissionDetails> allAdmissionDetails = new ArrayList<>();

            // Get course admission details
            List<AdmissionDTO.admissionDetails> courseDetails = admissionServices.getCourseAdmissionDetails(userid);
            allAdmissionDetails.addAll(courseDetails);

            // Get bundle admission details
            List<AdmissionDTO.admissionDetails> bundleDetails = admissionServices.getBundleAdmissionDetails(userid);
            allAdmissionDetails.addAll(bundleDetails);

            // Optional: Sort by enrollment date (most recent first)
            allAdmissionDetails.sort((a, b) -> b.getEnrolledAt().compareTo(a.getEnrolledAt()));
            logger.info("Successfully got the user admission details");
            Map<String,Object> response =new HashMap<>();
            response.put("success",true);
            response.put("message","Successfully got the user admission details");
            response.put("Data",allAdmissionDetails);
            return new ResponseEntity<>(response, HttpStatus.OK);
        }catch (Exception e){
            logger.info("Unable to get the user admission details");
            Map<String,Object> response =new HashMap<>();
            response.put("success",false);
            response.put("message","Unable to get user admission details");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }





    @PatchMapping("/updateadmission")
    public ResponseEntity<Map<String,Object>> updateAdmission(@RequestBody AdmissionDTO.updateInstallment updateInstallment){
        try {
            String data  =admissionServices.updateInstallment(updateInstallment);
            logger.info("Successfully updated the admission details");
            Map<String,Object> response =new HashMap<>();
            response.put("success",true);
            response.put("message","Successfully updated the payments details");
            response.put("Data",data);
            return new ResponseEntity<>(response, HttpStatus.OK);

        }catch (ResourceNotFoundException e){
            logger.error("Unable to update admission"+e);
            Map<String,Object> response =new HashMap<>();
            response.put("success",false);
            response.put("message",e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
        } catch (Exception e){
            logger.error("Unable to update admission"+e);
            Map<String,Object> response =new HashMap<>();
            response.put("success",false);
            response.put("message","Unable to update admission");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
     }

    @DeleteMapping("/cancelenrollment")
    public ResponseEntity<Map<String,Object>> cancelEnrollment(@RequestParam Long userId, @RequestParam(required = false) Long courseId, @RequestParam(required = false) Long bundleId) {
        try{
            String Data = admissionServices.cancelEnrollment(userId, courseId, bundleId);
            logger.error("Able to update admission");
            Map<String,Object> response =new HashMap<>();
            response.put("success",true);
            response.put("message","Sucessfully able to update admission");
            response.put("Data",Data);
            return new ResponseEntity<>(response, HttpStatus.OK);
    
        } catch (ResourceNotFoundException e) {
            logger.error("Error canceling enrollment: " + e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            logger.error("Error canceling enrollment: " + e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error canceling enrollment: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @DeleteMapping("/deleteinstallment")
    public ResponseEntity<Map<String,Object>> deleteInstallmentById(@RequestParam Long installmentId){
        try{
            String Data = admissionServices.deleteInstallmentById(installmentId);
            logger.error("Sucessfully deleted installment");
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Successfully deleted installment");
            return new ResponseEntity<>(response, HttpStatus.OK);
        }catch (ResourceNotFoundException e){
            logger.error("Error canceling enrollment: " + e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.CONFLICT);
        }catch (Exception e){
            logger.error("Error to delete installment" + e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error to delete installment" + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
