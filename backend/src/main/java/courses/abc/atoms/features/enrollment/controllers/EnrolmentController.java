package courses.abc.atoms.features.enrollment.controllers;

import courses.abc.atoms.core.dto.UserDTO;
import courses.abc.atoms.core.exception.ResourceAlreadyExistsException;
import courses.abc.atoms.core.model.core.Profiles;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.repositories.ProfileRepository;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.core.services.ProfileService;
import courses.abc.atoms.core.services.UserService;
import courses.abc.atoms.features.enrollment.dto.EnrollmentDTO;
import courses.abc.atoms.features.enrollment.model.Enrolment;
import courses.abc.atoms.features.enrollment.services.EnrollmentService;
import jakarta.validation.Valid;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.swing.plaf.synth.SynthTabbedPaneUI;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/enrollments")
@PreAuthorize("hasRole('ADMIN')")
public class EnrolmentController {

    private static final Logger logger = LoggerFactory.getLogger(EnrolmentController.class);
    private final EnrollmentService enrollmentService;
    private final UserRepository userRepository;
    @Autowired
    private  UserService userService;
    private final ProfileService profileService;

    @Autowired
    public EnrolmentController(EnrollmentService enrollmentService, UserRepository userRepository, ProfileService profileService) {
        this.enrollmentService = enrollmentService;
        this.userRepository = userRepository;
        this.profileService=profileService;
    }

    // DTO for summary view
    public static class EnrolmentSummary {
        public Integer id;
        public String username;
        public Integer courseId;
        public String orderNumber;

        public EnrolmentSummary(Integer id, String username, Integer courseId, String orderNumber) {
            this.id = id;
            this.username = username;
            this.courseId = courseId;
            this.orderNumber = orderNumber;
        }
    }

    @GetMapping
    public ResponseEntity<List<EnrolmentSummary>> getAllEnrollments() {
        List<Enrolment> enrolments = enrollmentService.getAllEnrolments();
        List<EnrolmentSummary> summaries = enrolments.stream().map(e -> {
            String username = userRepository.findById(Long.valueOf(e.getUserId()))
                    .map(Users::getEmail)
                    .orElse("Unknown");
            return new EnrolmentSummary(e.getId(), username, e.getCourseId(), e.getOrderNumber());
        }).collect(Collectors.toList());
        return ResponseEntity.ok(summaries);
    }

    @GetMapping("/enrolledcourses")
    public ResponseEntity<Map<String,Object>> getEnrolmentDetails(@RequestParam Long userid) {
      try{
          List<EnrollmentDTO.GetEnrolledCourses>  data= enrollmentService.getEnrolmentById(userid);
          Map<String, Object> response = new HashMap<>();
          response.put("success", true);
          response.put("message", "Successfully able to get the enrolled courses");
          response.put("Data",data);
          return ResponseEntity.status(HttpStatus.OK).body(response);

      } catch (Exception e) {
          logger.error("Error unable to get the enrolled to course:"+e);
          Map<String, Object> response = new HashMap<>();
          response.put("success", false);
          response.put("message", "Error unable to get the enrolled to course");
          return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);

      }
    }

    @PostMapping("/bulkregistration")
    public ResponseEntity<UserDTO.BulkRegistrationResponse> registerBulkLearners(
            @Valid @RequestBody UserDTO.BulkRegistrationRequest request) {
        UserDTO.BulkRegistrationResponse response = userService.registerBulkLearners(request);
        return ResponseEntity.ok(response);
    }


    @PostMapping("/isemailexist")
    public ResponseEntity<Map<String,Object>> isEmailExist(@RequestParam String email) {
        try {
            Users user = userService.getUserByEmail(email);
            Map<String, Object> response = new HashMap<>();
            if (user == null) {
                logger.warn("User does not exist for email: {}", email);
                response.put("success", false);
                response.put("message", "User does not exist.");
                return ResponseEntity.status(HttpStatus.OK).body(response);
            } else {
                EnrollmentDTO.NewEnrollmentByEmail data = enrollmentService.getUserDetailsByEmail(email);
                response.put("success", true);
                response.put("message", "User  exist.");
                response.put("Data",data);
                return ResponseEntity.status(HttpStatus.OK).body(response);
            }


        } catch (Exception e) {
            logger.error("Error validating email:"+ e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Unable to validate Phone Number."+e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);

        }
    }


    @PostMapping("/isnumberexist")
    public ResponseEntity<Map<String,Object>> isPhoneNumberExist(@RequestParam String phonenumber) {
        try {
            Optional<Profiles> profiles = profileService.getProfileByPhoneNumber(phonenumber);
            Map<String, Object> response = new HashMap<>();

            if (profiles.isEmpty()) {
                logger.warn("User does not exist for phonenumber: {}", phonenumber);
                response.put("success", false);
                response.put("message", "User does not exist.");
                return ResponseEntity.status(HttpStatus.OK).body(response);
            } else {
                EnrollmentDTO.NewEnrollmentByPhoneNumber data = enrollmentService.getUserDetailsByPhoneNumber(phonenumber);

                response.put("success", true);
                response.put("message", "User exist.");
                response.put("Data",data);
                return ResponseEntity.status(HttpStatus.OK).body(response);

            }
        } catch (Exception e) {
            logger.error("Error validating email: "+ e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Unable to validate Email."+e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }


   @PostMapping("/enroll")
   @PreAuthorize("hasRole('ADMIN') or  hasRole('STUDENT')")
   public ResponseEntity<Map<String,Object>> newEnrollmentToCourse(@RequestBody EnrollmentDTO.NewEnrollmentToCourse newEnrollmentToCourse){

        try{
            EnrollmentDTO.Enrollment data= enrollmentService.enrollToNewCourse(newEnrollmentToCourse);
           logger.info("User successfully enrolled to the new course");
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("Data",data);
            response.put("message", "User successfully enrolled  to the course");
            return ResponseEntity.status(HttpStatus.OK).body(response);

        } catch (ResourceAlreadyExistsException e) {
            logger.error("Enrollment conflict: " + e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Unable to enroll, Already enrolled to the course");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);

        } catch (IllegalArgumentException e){
            logger.error("Error: "+e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            logger.error("Unexpected error ", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);

        }
   }

   @PostMapping("/bulkenroll")
    public ResponseEntity<?> bulkEnrollment(@RequestBody List<EnrollmentDTO.BulkEnrollmentToCourse> bulkEnrollmentToCourse){
       try{
           Map<String, Object> result =  enrollmentService.BulkenrollToNewCourse(bulkEnrollmentToCourse);
           logger.info("Users sucessfully enrolled to the new course");
           return ResponseEntity.status(HttpStatus.OK).body(result);
       } catch (ResourceAlreadyExistsException e) {
           logger.error("Enrollment conflict: " + e.getMessage());
           return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
       } catch (IllegalArgumentException e){
           logger.error("Error: "+e.getMessage());
           return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
       } catch (Exception e) {
           logger.error("Unexpected error ", e.getMessage(), e);
           return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                   .body("Error: unable to enroll in the course");
       }
   }



}
