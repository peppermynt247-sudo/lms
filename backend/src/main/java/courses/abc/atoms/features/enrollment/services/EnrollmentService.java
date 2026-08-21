package courses.abc.atoms.features.enrollment.services;

import courses.abc.atoms.core.exception.ResourceAlreadyExistsException;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.model.core.*;

import courses.abc.atoms.core.repositories.ProfileRepository;
import courses.abc.atoms.core.util.EmailService;
import courses.abc.atoms.features.payment.repositories.InstallmentsRepository;
import courses.abc.atoms.features.payment.repositories.PaymentPlanRepository;
import courses.abc.atoms.core.repositories.UserCourseEnrollmentRepository;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.core.services.ProfileService;
import courses.abc.atoms.core.services.UserService;
import courses.abc.atoms.features.course.model.*;
import courses.abc.atoms.features.course.repositories.*;
import courses.abc.atoms.features.enrollment.dto.EnrollmentDTO;
import courses.abc.atoms.features.enrollment.model.Enrolment;
import courses.abc.atoms.features.enrollment.repositories.EnrollmentRepository;

import courses.abc.atoms.features.payment.model.Installments;
import courses.abc.atoms.features.payment.model.PaymentPlans;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserService userService;
    private final ProfileService profileService;

    private final EmailService emailService;

    private static final Logger logger = LoggerFactory.getLogger(EnrollmentService.class);
    @Autowired
    private UserCourseEnrollmentRepository userCourseEnrollmentRepository;

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private CourseBundleRepository courseBundleRepository;

    @Autowired
    private PaymentPlanRepository paymentPlanRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private InstallmentsRepository installmentsRepository;

    @Autowired
    private BatchUserRepository batchUserRepository;

    @Autowired
    private CourseAccessControlRepository courseAccessControlRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private courses.abc.atoms.features.student.repositories.UserCourseProgressRepository userCourseProgressRepository;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,UserService userService,ProfileService profileService,EmailService emailService) {
        this.enrollmentRepository = enrollmentRepository;
        this.userService=userService;
        this.profileService=profileService;
        this.emailService=emailService;
    }

    @Transactional
    public Enrolment enrollUser(EnrollmentDTO.EnrollmentRequest request) {
        Enrolment enrolment = new Enrolment();
        enrolment.setUserId(request.getUserId().intValue());
        enrolment.setCourseId(request.getCourseId().intValue());
        enrolment.setCreatedAt(LocalDateTime.now());
        enrolment.setPaymentStatus("PENDING");
        enrolment.setStatus("PENDING");
        enrolment.setPaymentVia("ONLINE");
        enrolment.setOrderNumber("ORD" + System.currentTimeMillis()); // Example order number generation
        enrolment.setPrice(0); // Set price to 0 for now, can be updated later

        return enrollmentRepository.save(enrolment);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentDTO.GetEnrolledCourses> getEnrolmentById(Long id) {
        // Load raw enrollment entities so we have the courseId needed to look up
        // the actual progress from UserCourseProgress (which ContentProgressService keeps up to date).
        // The old JPQL read progress_percentage from user_course_enrollments which was never written
        // to by ContentProgressService — causing the admin tab to always show 0.
        List<UserCourseEnrollment> enrollments = userCourseEnrollmentRepository.findByUser_Id(id);

        return enrollments.stream().map(enrollment -> {
            String courseName;
            if (enrollment.getCourse() != null) {
                courseName = enrollment.getCourse().getTitle();
            } else if (enrollment.getBundle() != null) {
                courseName = enrollment.getBundle().getTitle();
            } else {
                courseName = "-";
            }

            String batchName = (enrollment.getBatches() != null)
                    ? enrollment.getBatches().getBatchName() : "-";

            String enrolledAt = (enrollment.getEnrolledAt() != null)
                    ? enrollment.getEnrolledAt().toString() : null;

            // Prefer UserCourseProgress (real progress from content completions)
            // Fall back to UserCourseEnrollment.progressPercentage (may be 0 for older records)
            String progress;
            if (enrollment.getCourse() != null) {
                progress = userCourseProgressRepository
                        .findByUser_IdAndCourse_CourseId(id, enrollment.getCourse().getCourseId())
                        .map(cp -> cp.getProgressPercentage() != null
                                ? cp.getProgressPercentage().toPlainString() : "0")
                        .orElseGet(() -> enrollment.getProgressPercentage() != null
                                ? enrollment.getProgressPercentage().toPlainString() : "0");
            } else {
                progress = (enrollment.getProgressPercentage() != null)
                        ? enrollment.getProgressPercentage().toPlainString() : "0";
            }

            return new EnrollmentDTO.GetEnrolledCourses(courseName, batchName, enrolledAt, progress);
        }).collect(Collectors.toList());
    }

    public List<Enrolment> getAllEnrolments() {
        return enrollmentRepository.findAll();
    }




    public EnrollmentDTO.NewEnrollmentByEmail getUserDetailsByEmail(String email){
        try{

            Users user =userService.getUserByEmail(email);

           Optional<Profiles> profiles =profileService.getProfileByUserId(user.getId());
            Profiles profile =profiles.get();


           return new EnrollmentDTO.NewEnrollmentByEmail(
                user.getId(),
                user.getEmail(),
                profile.getName()
           );

        } catch (Exception e) {
            throw new ResourceNotFoundException("Unable to find the user details");
        }

    }


    public EnrollmentDTO.NewEnrollmentByPhoneNumber getUserDetailsByPhoneNumber(String phonenumber){
        try{

            Optional<Profiles> profiles = profileService.getProfileByPhoneNumber(phonenumber);
            Profiles profile =profiles.get();


            return new EnrollmentDTO.NewEnrollmentByPhoneNumber(
                    profile.getUser().getId(),
                    profile.getPhoneNumber(),
                    profile.getName()
            );



        } catch (Exception e) {
            throw e;
        }

    }

    @Transactional(rollbackFor = Exception.class)
    public EnrollmentDTO.Enrollment enrollToNewCourse(EnrollmentDTO.NewEnrollmentToCourse newEnrollmentToCourse){
        try{

            Users user = userRepository.findById(newEnrollmentToCourse.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User ID " + newEnrollmentToCourse.getUserId() + " not found"));


            if (userCourseEnrollmentRepository.existsByUser_IdAndCourse_CourseId(newEnrollmentToCourse.getUserId(), newEnrollmentToCourse.getCourseId())) {
                throw new ResourceAlreadyExistsException("You are already enrolled to that course");
            }



            if(newEnrollmentToCourse.getBundleId() != null &&
                    userCourseEnrollmentRepository.existsByUser_IdAndBundle_BundleId(newEnrollmentToCourse.getUserId(), newEnrollmentToCourse.getBundleId())){
                throw new ResourceAlreadyExistsException("You are already enrolled to that Bundle");
            }




            Profiles profile = profileRepository.findByUserId(newEnrollmentToCourse.getUserId()).orElse(null);

            Course course = newEnrollmentToCourse.getCourseId() != null
                    ? courseRepository.findByCourseId(newEnrollmentToCourse.getCourseId()).orElse(null)
                    : null;

            CourseBundles bundle = newEnrollmentToCourse.getBundleId() != null
                    ? courseBundleRepository.findByBundleId(newEnrollmentToCourse.getBundleId()).orElse(null)
                    : null;


            Batches batches = batchRepository.findByBatchId(newEnrollmentToCourse.getBatchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Batch ID " + newEnrollmentToCourse.getBatchId() + " not found"));

            if (course == null && bundle == null) {
                throw new IllegalArgumentException("Either course or bundle must be provided");
            }

            String title =null;
            if(course != null){
                title =course.getTitle();
            }else{
                title =bundle.getTitle();
            }



            PaymentPlans plan = newEnrollmentToCourse.getPlanId() != null
                    ? paymentPlanRepository.findByPlanId(newEnrollmentToCourse.getPlanId())
                    .orElseThrow(() -> new ResourceNotFoundException("Plan ID " + newEnrollmentToCourse.getPlanId() + " not found"))
                    : null;


            user.setStatus("ADMITTED");


            BatchUser batchUser = new BatchUser();
            batchUser.setBatch(batches);
            batchUser.setUser(user);
            batchUser.setJoinedAt(LocalDateTime.now());






            List<Installments> installmentEntities = new ArrayList<>();
            List<CourseAccessControl> courseAccessEntities = new ArrayList<>();


            for (int i = 0; i < newEnrollmentToCourse.getInstallments().size(); i++) {
                EnrollmentDTO.NewEnrollmentToCourse.Installments installments = newEnrollmentToCourse.getInstallments().get(i);


                Installments installment = new Installments();
                installment.setUser(user);
                installment.setCourse(course);
                installment.setBundle(bundle);
                installment.setAmount(installments.getAmount());
                installment.setStatus(installments.getStatus());
                installment.setDueDate(installments.getDueDate());
                installmentEntities.add(installment);


                if (i == 0) {
                    CourseAccessControl access = new CourseAccessControl();
                    access.setUser(user);
                    access.setCourse(course);
                    access.setBundle(bundle);
                    access.setAccessGranted(false);
                    access.setActiveBy(installments.getDueDate());
                    courseAccessEntities.add(access);
                }

            }



            userRepository.save(user);
            batchUserRepository.save(batchUser);
            installmentsRepository.saveAll(installmentEntities);

            if (!installmentEntities.isEmpty()) {
                courseAccessEntities.get(0).setInstallment(installmentEntities.get(0));
                courseAccessControlRepository.saveAll(courseAccessEntities);
            }


            UserCourseEnrollment enrollment = new UserCourseEnrollment();
            enrollment.setUser(user);
            enrollment.setCourse(course);
            enrollment.setBundle(bundle);
            enrollment.setBatches(batches);
            enrollment.setPaymentStatus("PENDING");
            enrollment.setPlan(plan);
            enrollment.setAccessStatus("ADMITTED");
            enrollment.setEnrolledAt(LocalDateTime.now());
            LocalDateTime now =LocalDateTime.now();

            if (course != null) {
                int validity = course.getValidityInDays() != null ? course.getValidityInDays() : 365;
                enrollment.setExpiresAt(now.plusDays(validity));
            } else if (bundle != null) {
                int validity = bundle.getValidityInDays() != null ? bundle.getValidityInDays() : 365;
                enrollment.setExpiresAt(now.plusDays(validity));
            }

            enrollment.setProgressPercentage(BigDecimal.ZERO);
            enrollment.setCompletionStatus("NOT_STARTED");
            enrollment.setLastActivityAt(LocalDateTime.now());
            userCourseEnrollmentRepository.save(enrollment);


            String profileName = (profile != null) ? profile.getName() : user.getEmail();
            try {
                emailService.sendCourseEnrollmentConfirmation(user.getEmail(), profileName, title);
            } catch (Exception emailEx) {
                logger.warn("Failed to send enrollment confirmation email to {}: {}", user.getEmail(), emailEx.getMessage());
            }



            List<EnrollmentDTO.Enrollment.Installments> installmentDTOs =installmentEntities.stream().map(e -> new EnrollmentDTO.Enrollment.Installments(
                    e.getInstallmentId(),
                    e.getAmount(),
                    e.getStatus(),
                    e.getDueDate()
            )).collect(Collectors.toList());


            EnrollmentDTO.Enrollment enrollmentResponse = new EnrollmentDTO.Enrollment(
                    user.getId(),
                    installmentDTOs
            );


            return enrollmentResponse;


        } catch (Exception e) {
            throw e;
        }
    }

    @Transactional(rollbackFor = Exception.class, timeout = 300)
    public Map<String, Object> BulkenrollToNewCourse(List<EnrollmentDTO.BulkEnrollmentToCourse> bulkEnrollmentList){
        try{

            List<String> alreadyEnrolled = new ArrayList<>();
            List<String> notFoundUsers   = new ArrayList<>();
           for(EnrollmentDTO.BulkEnrollmentToCourse enrollmentData :bulkEnrollmentList){

               // If user doesn't exist, auto-register them using CSV-supplied name/password
               boolean isNewUser = false;
               Users user;
               if (!userRepository.existsByEmail(enrollmentData.getEmail())) {
                   String name     = enrollmentData.getName();
                   String password = enrollmentData.getPassword();
                   if (name != null && !name.isBlank() && password != null && !password.isBlank()) {
                       user = userService.createUserForEnrollment(
                               enrollmentData.getEmail(), name, enrollmentData.getPhone(), password);
                       isNewUser = true;
                   } else {
                       notFoundUsers.add(enrollmentData.getEmail());
                       continue;
                   }
               } else {
                   user = userRepository.findByEmail(enrollmentData.getEmail())
                           .orElseThrow(() -> new ResourceNotFoundException("User Email " + enrollmentData.getEmail() + " not found"));
               }



               if (userCourseEnrollmentRepository.existsByUser_IdAndCourse_CourseId(user.getId(), enrollmentData.getCourseId())) {

                   alreadyEnrolled.add(enrollmentData.getEmail() );
                   continue;
               }



               if(enrollmentData.getBundleId() != null && userCourseEnrollmentRepository.existsByUser_IdAndBundle_BundleId(user.getId(),enrollmentData.getBundleId())){
                   alreadyEnrolled.add(enrollmentData.getEmail() );
                   continue;
               }




               Profiles profile = profileRepository.findByUserId(user.getId()).orElse(null);

               Course course = enrollmentData.getCourseId() != null
                       ? courseRepository.findByCourseId(enrollmentData.getCourseId()).orElse(null)
                       : null;

               CourseBundles bundle = enrollmentData.getBundleId() != null
                       ? courseBundleRepository.findByBundleId(enrollmentData.getBundleId()).orElse(null)
                       : null;


               Batches batches = batchRepository.findByBatchId(enrollmentData.getBatchId())
                       .orElseThrow(() -> new ResourceNotFoundException("Batch ID " + enrollmentData.getBatchId() + " not found"));

               if (course == null && bundle == null) {
                   throw new IllegalArgumentException("Either course or bundle must be provided");
               }

               String title =null;
               if(course != null){
                   title =course.getTitle();
               }else{
                   title =bundle.getTitle();
               }


               PaymentPlans plan = enrollmentData.getPlanId() != null
                       ? paymentPlanRepository.findByPlanId(enrollmentData.getPlanId())
                       .orElseThrow(() -> new ResourceNotFoundException("Plan ID " + enrollmentData.getPlanId() + " not found"))
                       : null;


               user.setStatus("ADMITTED");

               BatchUser batchUser = new BatchUser();
               batchUser.setBatch(batches);
               batchUser.setUser(user);
               batchUser.setJoinedAt(LocalDateTime.now());



               List<Installments> installmentEntities = new ArrayList<>();
               List<CourseAccessControl> courseAccessEntities = new ArrayList<>();


               for (int i = 0; i < enrollmentData.getInstallments().size(); i++) {
                   EnrollmentDTO.BulkEnrollmentToCourse.Installments installments = enrollmentData.getInstallments().get(i);


                   Installments installment = new Installments();
                   installment.setUser(user);
                   installment.setCourse(course);
                   installment.setBundle(bundle);
                   installment.setAmount(installments.getAmount());
                   installment.setStatus(installments.getStatus());
                   installment.setDueDate(installments.getDueDate());
                   installmentEntities.add(installment);


                   if (i == 0) {
                       CourseAccessControl access = new CourseAccessControl();
                       access.setUser(user);
                       access.setCourse(course);
                       access.setBundle(bundle);
                       access.setAccessGranted(false);
                       access.setActiveBy(installments.getDueDate());
                       courseAccessEntities.add(access);
                   }

               }



               userRepository.save(user);
               batchUserRepository.save(batchUser);
               installmentsRepository.saveAll(installmentEntities);

               if (!installmentEntities.isEmpty()) {
                   courseAccessEntities.get(0).setInstallment(installmentEntities.get(0));
                   courseAccessControlRepository.saveAll(courseAccessEntities);
               }


               UserCourseEnrollment enrollment = new UserCourseEnrollment();
               enrollment.setUser(user);
               enrollment.setCourse(course);
               enrollment.setBundle(bundle);
               enrollment.setBatches(batches);
               enrollment.setPaymentStatus("PENDING");
               enrollment.setPlan(plan);
               enrollment.setAccessStatus("ADMITTED");
               enrollment.setEnrolledAt(LocalDateTime.now());
               LocalDateTime now =LocalDateTime.now();

               if (course != null) {
                   int validity = course.getValidityInDays() != null ? course.getValidityInDays() : 365;
                   enrollment.setExpiresAt(now.plusDays(validity));
               } else if (bundle != null) {
                   int validity = bundle.getValidityInDays() != null ? bundle.getValidityInDays() : 365;
                   enrollment.setExpiresAt(now.plusDays(validity));
               }

               enrollment.setProgressPercentage(BigDecimal.ZERO);
               enrollment.setCompletionStatus("NOT_STARTED");
               enrollment.setLastActivityAt(LocalDateTime.now());
               userCourseEnrollmentRepository.save(enrollment);


               // Email: new users get welcome credentials; existing users get enrollment confirmation
               String displayName = (profile != null && profile.getName() != null && !profile.getName().isBlank())
                       ? profile.getName() : enrollmentData.getEmail();
               if (isNewUser) {
                   try {
                       String nameForEmail = enrollmentData.getName() != null && !enrollmentData.getName().isBlank()
                               ? enrollmentData.getName() : enrollmentData.getEmail();
                       emailService.sendWelcomeCredentials(enrollmentData.getEmail(), nameForEmail, enrollmentData.getPassword());
                   } catch (Exception emailEx) {
                       logger.warn("Failed to send welcome email to {}: {}", enrollmentData.getEmail(), emailEx.getMessage());
                   }
               } else {
                   try {
                       emailService.sendCourseEnrollmentConfirmation(enrollmentData.getEmail(), displayName, title);
                   } catch (Exception emailEx) {
                       logger.warn("Failed to send enrollment confirmation email to {}: {}", enrollmentData.getEmail(), emailEx.getMessage());
                   }
               }

           }



            Map<String, Object> result = new HashMap<>();
            result.put("message", "Users successfully enrolled in the course");
            if (!alreadyEnrolled.isEmpty()) {
                result.put("alreadyEnrolledUsers", alreadyEnrolled);
            }
            if (!notFoundUsers.isEmpty()) {
                result.put("notFoundUsers", notFoundUsers);
            }

            return result;

        } catch (Exception e) {
            throw e;
        }
    }


}
