package courses.abc.atoms.features.admission.services;

import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.features.course.model.Batches;
import courses.abc.atoms.features.course.model.CourseBundles;
import courses.abc.atoms.features.course.repositories.CourseBundleRepository;
import courses.abc.atoms.features.payment.model.Installments;
import courses.abc.atoms.features.payment.model.Payments;
import courses.abc.atoms.core.model.core.UserCourseEnrollment;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.features.payment.repositories.InstallmentsRepository;
import courses.abc.atoms.features.payment.repositories.PaymentsRepository;
import courses.abc.atoms.core.repositories.UserCourseEnrollmentRepository;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.features.admission.dto.AdmissionDTO;
import courses.abc.atoms.features.course.model.Course;
import courses.abc.atoms.features.course.repositories.BatchUserRepository;
import courses.abc.atoms.features.course.repositories.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;


@Service
public class AdmissionServices {


    @Autowired
    private PaymentsRepository paymentsRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserCourseEnrollmentRepository userCourseEnrollmentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private InstallmentsRepository installmentsRepository;

    @Autowired
    private BatchUserRepository batchUserRepository;

    @Autowired
    private CourseBundleRepository courseBundleRepository;


    public List<AdmissionDTO.admissionDetails> getCourseAdmissionDetails(Long userId) {
        List<Object[]> courseRows = userCourseEnrollmentRepository.getUserCourseEnrollmentDetails(userId);
        List<AdmissionDTO.admissionDetails> courseDetails = new ArrayList<>();

        for (Object[] rows : courseRows) {
            AdmissionDTO.admissionDetails admissionDetails = new AdmissionDTO.admissionDetails();
            admissionDetails.setId(((Number) rows[0]).longValue());
            admissionDetails.setTitle((String) rows[1]);
            admissionDetails.setFees((BigDecimal) rows[2]);
            admissionDetails.setPaymentStatus((String) rows[3]);
            admissionDetails.setEnrolledAt(((Timestamp) rows[4]).toLocalDateTime());
            admissionDetails.setAdmissionStatus((String) rows[5]);
            admissionDetails.setType("COURSE");
            admissionDetails.setInstallments(new ArrayList<>());
            courseDetails.add(admissionDetails);
        }

        // Fetch Course Installments
        List<Object[]> courseInstallmentRows = userCourseEnrollmentRepository.getCourseInstallmentsByUserId(userId);
        Map<Long, List<AdmissionDTO.admissionDetails.Installments>> courseInstallmentMap = new HashMap<>();

        for (Object[] row : courseInstallmentRows) {
            Long courseId = ((Number) row[0]).longValue();
            Long installmentId = ((Number) row[1]).longValue();
            BigDecimal amount = BigDecimal.valueOf(((Number) row[2]).doubleValue());
            LocalDateTime dueDate = ((Timestamp) row[3]).toLocalDateTime();
            String status = (String) row[4];

            AdmissionDTO.admissionDetails.Installments installment = new AdmissionDTO.admissionDetails.Installments();
            installment.setInstallmentId(installmentId);
            installment.setAmount(amount);
            installment.setDueDate(dueDate);
            installment.setStatus(status);

            courseInstallmentMap.computeIfAbsent(courseId, k -> new ArrayList<>()).add(installment);
        }

        // Map installments to courses
        for (AdmissionDTO.admissionDetails courseDetail : courseDetails) {
            List<AdmissionDTO.admissionDetails.Installments> installments = courseInstallmentMap.getOrDefault(courseDetail.getId(), List.of());
            courseDetail.setInstallments(installments);
        }

        return courseDetails;
    }

    // Get Bundle Details
    public List<AdmissionDTO.admissionDetails> getBundleAdmissionDetails(Long userId) {
        List<Object[]> bundleRows = userCourseEnrollmentRepository.getUserBundleEnrollmentDetails(userId);
        List<AdmissionDTO.admissionDetails> bundleDetails = new ArrayList<>();

        for (Object[] rows : bundleRows) {
            AdmissionDTO.admissionDetails admissionDetails = new AdmissionDTO.admissionDetails();
            admissionDetails.setId(((Number) rows[0]).longValue());
            admissionDetails.setTitle((String) rows[1]);
            admissionDetails.setFees((BigDecimal) rows[2]);
            admissionDetails.setPaymentStatus((String) rows[3]);
            admissionDetails.setEnrolledAt(((Timestamp) rows[4]).toLocalDateTime());
            admissionDetails.setAdmissionStatus((String) rows[5]);
            admissionDetails.setType("BUNDLE");
            admissionDetails.setInstallments(new ArrayList<>());
            bundleDetails.add(admissionDetails);
        }

        // Fetch Bundle Installments
        List<Object[]> bundleInstallmentRows = userCourseEnrollmentRepository.getBundleInstallmentsByUserId(userId);
        Map<Long, List<AdmissionDTO.admissionDetails.Installments>> bundleInstallmentMap = new HashMap<>();

        for (Object[] row : bundleInstallmentRows) {
            Long bundleId = ((Number) row[0]).longValue();
            Long installmentId = ((Number) row[1]).longValue();
            BigDecimal amount = BigDecimal.valueOf(((Number) row[2]).doubleValue());
            LocalDateTime dueDate = ((Timestamp) row[3]).toLocalDateTime();
            String status = (String) row[4];

            AdmissionDTO.admissionDetails.Installments installment = new AdmissionDTO.admissionDetails.Installments();
            installment.setInstallmentId(installmentId);
            installment.setAmount(amount);
            installment.setDueDate(dueDate);
            installment.setStatus(status);

            bundleInstallmentMap.computeIfAbsent(bundleId, k -> new ArrayList<>()).add(installment);
        }

        // Map installments to bundles
        for (AdmissionDTO.admissionDetails bundleDetail : bundleDetails) {
            List<AdmissionDTO.admissionDetails.Installments> installments =
                    bundleInstallmentMap.getOrDefault(bundleDetail.getId(), List.of());
            bundleDetail.setInstallments(installments);
        }

        return bundleDetails;
    }


    public String updateInstallment(AdmissionDTO.updateInstallment updateInstallment){
        try{


            Optional<Users>  user= userRepository.findById(updateInstallment.getUserId());

             if(user.isEmpty()){
                 throw new ResourceNotFoundException("User not found");
             }


            Optional<Course> courseOptional = Optional.empty();
            Optional<CourseBundles> bundleOptional = Optional.empty();

            if ("Course".equalsIgnoreCase(updateInstallment.getType())) {
                courseOptional = courseRepository.findByCourseId(updateInstallment.getId());
            } else if ("Bundle".equalsIgnoreCase(updateInstallment.getType())) {
                bundleOptional = courseBundleRepository.findByBundleId(updateInstallment.getId());
            }

            if (courseOptional.isEmpty() && bundleOptional.isEmpty()) {
                throw new ResourceNotFoundException("Course or Bundle is required");
            }

            Course course = courseOptional.orElse(null);
            CourseBundles bundles = bundleOptional.orElse(null);


            for(AdmissionDTO.updateInstallment.Installments installment :updateInstallment.getInstallments()){

                if((Long.valueOf(-1).equals(installment.getInstallmentId()))){

                    Installments installments =new Installments();
                    installments.setUser(user.get());
                    installments.setCourse(course);
                    installments.setBundle(bundles);
                    installments.setAmount(installment.getAmount());
                    installments.setStatus("PENDING");
                    installments.setDueDate(installment.getDueDate());

                    installmentsRepository.save(installments);
                }else{
                    Installments existingInstallment;

                    if ("Course".equalsIgnoreCase(updateInstallment.getType())) {
                        existingInstallment = installmentsRepository
                                .findAllByUser_IdAndCourse_CourseId(updateInstallment.getUserId(), updateInstallment.getId())
                                .stream()
                                .filter(inst -> inst.getInstallmentId().equals(installment.getInstallmentId()))
                                .findFirst()
                                .orElseThrow(() -> new ResourceNotFoundException("Installment ID not found for the  course you enrolled "));
                    } else {
                        existingInstallment = installmentsRepository
                                .findByUser_IdAndBundle_BundleId(updateInstallment.getUserId(), updateInstallment.getId())
                                .stream()
                                .filter(inst -> inst.getInstallmentId().equals(installment.getInstallmentId()))
                                .findFirst()
                                .orElseThrow(() -> new ResourceNotFoundException("Installment ID not found for  the  bundle you enrolled "));
                    }

                    // Update fields
                    existingInstallment.setAmount(installment.getAmount());
                    existingInstallment.setDueDate(installment.getDueDate());

                    installmentsRepository.save(existingInstallment);

                }
            }

            return "Installments updated successfully.";
        }catch (Exception e){
            throw e;
        }
    }

    @Transactional
     public String cancelEnrollment(Long userId, Long courseId, Long bundleId) {
        try {
            if (!userRepository.existsById(userId)) {
                throw new ResourceNotFoundException("User not found");
            }

            UserCourseEnrollment enrollment = null;

            if (courseId != null) {
                Optional<UserCourseEnrollment> enrollmentOpt = userCourseEnrollmentRepository.findByUser_IdAndCourse_CourseId(userId, courseId);
                if (enrollmentOpt.isEmpty()) {
                    throw new ResourceNotFoundException("Enrollment not found for course");
                }
                enrollment = enrollmentOpt.get();
            } else if (bundleId != null) {
                Optional<UserCourseEnrollment> enrollmentOpt = userCourseEnrollmentRepository.findByUser_IdAndBundle_BundleId(userId, bundleId);
                if (enrollmentOpt.isEmpty()) {
                    throw new ResourceNotFoundException("Enrollment not found for bundle");
                }
                enrollment = enrollmentOpt.get();
            } else {
                throw new IllegalArgumentException("Either courseId or bundleId must be provided.");
            }


            Batches batches = enrollment.getBatches();
            Long batchId = batches.getBatchId();

            batchUserRepository.deleteByUserIdAndBatch_BatchId(userId,batchId);

            enrollment.setBatches(null);
            enrollment.setAccessStatus("CANCELED");
            userCourseEnrollmentRepository.save(enrollment);


            return "successfully cancelled enrollment.";
        } catch (Exception e) {
            throw e;
        }
     }


     public String deleteInstallmentById(Long InstallmentId){
        try{

            Optional<Installments> installments =installmentsRepository.findById(InstallmentId);

            if(!installments.isPresent()){
                throw new ResourceNotFoundException("Installment Id Not found");
            }

            installmentsRepository.deleteById(InstallmentId);

            return "Successfully Deleted the installment";
        } catch (Exception e) {
            throw e;
        }
     }


}
