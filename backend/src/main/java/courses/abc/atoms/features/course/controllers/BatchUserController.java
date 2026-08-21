package courses.abc.atoms.features.course.controllers;

import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.features.course.dto.BatchDTO.BatchUserDTO;
import courses.abc.atoms.features.course.services.BatchUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/batchusers")
public class BatchUserController {
    
     @Autowired
     private  BatchUserService batchUserService;

    private static final Logger logger = LoggerFactory.getLogger(BatchUserController.class);
   
    @GetMapping("/batch")
    public ResponseEntity<Map<String, Object>> getBatchUsersByBatchId(@RequestParam Long batchid) {
        try {
            List<BatchUserDTO> batchUsers = batchUserService.getBatchUsersByBatchId(batchid);
            logger.info("Batch users retrieved successfully");
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("Data", batchUsers);
            response.put("message", "Batch users retrieved successfully");
            return new  ResponseEntity<>(response,HttpStatus.OK);
        }catch (ResourceNotFoundException e){
            logger.error("Batch is not found"+e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Batch is not found");
            return new ResponseEntity<>(response, HttpStatus.CONFLICT);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "unable retrieve Batch users");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
