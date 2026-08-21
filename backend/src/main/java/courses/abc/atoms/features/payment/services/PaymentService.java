
package courses.abc.atoms.features.payment.services;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.model.core.UserCourseEnrollment;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.repositories.UserCourseEnrollmentRepository;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.features.admission.dto.AdmissionDTO;
import courses.abc.atoms.features.course.model.Course;
import courses.abc.atoms.features.course.model.CourseAccessControl;
import courses.abc.atoms.features.course.model.CourseBundles;
import courses.abc.atoms.features.course.repositories.CourseAccessControlRepository;
import courses.abc.atoms.features.course.repositories.CourseBundleRepository;
import courses.abc.atoms.features.course.repositories.CoursePlanRepository;
import courses.abc.atoms.features.course.repositories.CourseRepository;
import courses.abc.atoms.features.payment.dto.PaymentDTO;
import courses.abc.atoms.features.payment.model.Installments;
import courses.abc.atoms.features.payment.model.PaymentPlans;
import courses.abc.atoms.features.payment.model.Payments;
import courses.abc.atoms.features.payment.repositories.InstallmentsRepository;
import courses.abc.atoms.features.payment.repositories.PaymentPlanRepository;
import courses.abc.atoms.features.payment.repositories.PaymentsRepository;
import jakarta.persistence.EntityNotFoundException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    private final ConcurrentHashMap<Long,Object> paymentLocks = new ConcurrentHashMap<>();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PaymentsRepository paymentsRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseBundleRepository courseBundleRepository;

    @Autowired
    private PaymentPlanRepository planRepository;

    @Autowired
    private InstallmentsRepository installmentsRepository;

    @Autowired
    private UserCourseEnrollmentRepository userCourseEnrollmentRepository;

    @Autowired
    private CourseAccessControlRepository courseAccessControlRepository;

    @Autowired
    private CoursePlanRepository coursePlanRepository;

    @Autowired
    private RazorpayClient razorpayClient;

    @Value("${razorpay.key-id}")
    private String keyId;


    @Value("${razorpay.key-secret}")
    private String secret;






    public List<AdmissionDTO.payments> getPaymentDetailsById(Long Id){
        try{

            Optional<Users> users = userRepository.findById(Id);

            if(users.isEmpty()){
                throw new ResourceNotFoundException("User not found or invalid user ID.");
            }

            List<Payments>   payments= paymentsRepository.findByUser_IdAndPaymentStatus(Id,"SUCCESS");
            List<AdmissionDTO.payments> paymentsList = new ArrayList<>();

            for (Payments  paymentDetails : payments) {
                AdmissionDTO.payments payments1 = new AdmissionDTO.payments();

                payments1.setPaymentId(paymentDetails.getPaymentId());
                payments1.setDate(paymentDetails.getCreatedAt());
                payments1.setPaymentMethod(paymentDetails.getPaymentMethod());
                payments1.setTransactionId(paymentDetails.getTransactionId());
                payments1.setAmount(paymentDetails.getAmount());

                paymentsList.add(payments1);
            }

            return paymentsList;


        }catch (Exception e){
            throw  e;
        }
    }


    public String updatePayments(AdmissionDTO.updatePayment payment){
        try{
            Optional<Payments>  Payment = paymentsRepository.findByPaymentId(payment.getPaymentId());

            Payments payments =Payment.get();

            if (payment.getDate() != null) {
                payments.setCreatedAt(payment.getDate());
            }
            if (payment.getPaymentMethod() != null) {
                payments.setPaymentMethod(payment.getPaymentMethod());
            }
            if (payment.getTransactionId() != null) {
                payments.setTransactionId(payment.getTransactionId());
            }

            paymentsRepository.save(payments);
            return "Successfully updated the details";
        } catch (Exception e) {
            throw  e;
        }
    }


    public List<AdmissionDTO.payments> getPaymentByCourseIdOrBundleId(Long userId,Long courseId,Long BundleId){
        try{

            if (!userRepository.existsById(userId)) {
                throw new EntityNotFoundException("User not found with ID: " + userId);
            }


            if (courseId != null && !courseRepository.existsById(courseId)) {
                throw new EntityNotFoundException("Course not found with ID: " + courseId);
            }


            if (BundleId != null && !courseBundleRepository.existsById(BundleId)) {
                throw new EntityNotFoundException("Bundle not found with ID: " + BundleId);
            }

            List<Payments> payments = paymentsRepository.findByUser_IdAndCourse_CourseIdOrBundle_BundleId(userId,courseId,BundleId);

            List<AdmissionDTO.payments> paymentsList = new ArrayList<>();

            for (Payments  paymentDetails : payments) {
                AdmissionDTO.payments payments1 = new AdmissionDTO.payments();

                payments1.setPaymentId(paymentDetails.getPaymentId());
                payments1.setDate(paymentDetails.getCreatedAt());
                payments1.setPaymentMethod(paymentDetails.getPaymentMethod());
                payments1.setTransactionId(paymentDetails.getTransactionId());
                payments1.setAmount(paymentDetails.getAmount());

                paymentsList.add(payments1);
            }

            return paymentsList;

        } catch (Exception e) {
            throw e;
        }
    }


    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public PaymentDTO.Payment createPaymentOrder(PaymentDTO.Payment request) throws RazorpayException {
        try {


          Users user =null;
          PaymentPlans plan =null;

            Optional<Users> users = userRepository.findById(request.getUserId());

            if(!users.isPresent()){
                throw new ResourceNotFoundException("User not Found");
            }

           user =users.get();


            Optional<PaymentPlans> plans = planRepository.findByPlanId(request.getPlanId());

            if(!plans.isPresent()){
                throw new ResourceNotFoundException("Payment plan not found");
            }

            plan =plans.get();

            Course course = null;
            CourseBundles bundle = null;
            String itemName = "";

            if (request.getCourseId() != null) {
                Optional<Course>  courses = courseRepository.findByCourseId(request.getCourseId());
                if(!courses.isPresent()){
                    throw new ResourceNotFoundException("Course not found");
                }



                Optional<UserCourseEnrollment> userCourseEnrollments=userCourseEnrollmentRepository.findByUser_IdAndCourse_CourseId(request.getUserId(),request.getCourseId());

                if(!userCourseEnrollments.isPresent()){
                    throw new ResourceNotFoundException("User not enrolled to that Course");
                }

                UserCourseEnrollment userCourseEnrollment =userCourseEnrollments.get();





              boolean coursePlan =  coursePlanRepository.existsByCourse_CourseIdAndPlan_PlanId(request.getCourseId(),request.getPlanId());

              if(coursePlan ==false){
                  throw new ResourceNotFoundException("Plan is not attached to Course");
              }

              Optional<Installments> installments =installmentsRepository.findByInstallmentIdAndUser_IdAndCourse_CourseId(request.getInstallmentId(),request.getUserId(),request.getCourseId());

              if(!installments.isPresent()){
                  throw new ResourceNotFoundException("Installment not found");
              }

                course =courses.get();
                itemName = course.getTitle();


            } else if (request.getBundleId() != null) {

                Optional<CourseBundles> bundles = courseBundleRepository.findByBundleId(request.getBundleId());

                if(!bundles.isPresent()){
                    throw  new ResourceNotFoundException("Bundle not found");
                }


                Optional<UserCourseEnrollment> userCourseEnrollments=userCourseEnrollmentRepository.findByUser_IdAndBundle_BundleId(request.getUserId(),request.getBundleId());

                if(!userCourseEnrollments.isPresent()){
                    throw new ResourceNotFoundException("User not enrolled to that Course");
                }

                UserCourseEnrollment userCourseEnrollment =userCourseEnrollments.get();

                boolean BundlePlan =  coursePlanRepository.existsByBundle_BundleIdAndPlan_PlanId(request.getBundleId(),request.getPlanId());

                if(BundlePlan == false){
                    throw new ResourceNotFoundException("Plan is not attached to Course");
                }


                Optional<Installments> installments =installmentsRepository.findByInstallmentIdAndUser_IdAndBundle_BundleId(request.getInstallmentId(),request.getUserId(),request.getBundleId());

              if(!installments.isPresent()){
                  throw new ResourceNotFoundException("Installment not found");
              }


                bundle =bundles.get();
                itemName = bundle.getTitle();
            }


            Optional<Installments> installments =installmentsRepository.findByInstallmentId(request.getInstallmentId());


            if(!installments.isPresent()){
                throw new ResourceNotFoundException("Installment id Not found");
            }


            Installments installments1 =installments.get();

            if ("PAID".equalsIgnoreCase(installments1.getStatus())) {
                throw new ResourceNotFoundException("User already paid the installment");
            }

            // Create internal payment record
            Payments payment = new Payments();
            payment.setUser(user);
            payment.setAmount(request.getAmount());
            payment.setCurrency(request.getCurrency());
            payment.setPaymentStatus("CREATED");
            payment.setPaymentGateway("RAZORPAY");
            payment.setCourse(course);
            payment.setBundle(bundle);
            payment.setPlan(plan);
            payment.setCreatedAt(LocalDateTime.now());


            paymentsRepository.save(payment);

            // Create Razorpay order
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", request.getAmount().multiply(new BigDecimal("100")).intValue());
            orderRequest.put("currency", request.getCurrency());
            orderRequest.put("receipt", "COURSE_" + payment.getPaymentId() + "_" + System.currentTimeMillis());


            // Add notes for tracking
            JSONObject notes = new JSONObject();
            notes.put("payment_id", payment.getPaymentId());
            notes.put("user_id", user.getId());
            notes.put("email",user.getEmail());
            notes.put("item_type", course != null ? "COURSE" : "BUNDLE");
            notes.put("item_id", course != null ? course.getCourseId() : bundle.getBundleId());
            notes.put("InstallmentId",installments1.getInstallmentId());
            orderRequest.put("notes", notes);
   

            Order razorpayOrder = razorpayClient.orders.create(orderRequest);



            // Update payment with Razorpay order ID
            payment.setRazorpayOrderId(razorpayOrder.get("id"));
            payment.setTransactionId(razorpayOrder.get("id"));
            paymentsRepository.save(payment);

            

            // Prepare response using the same DTO
            PaymentDTO.Payment response = new PaymentDTO.Payment();
            response.setOrderId(razorpayOrder.get("id"));
            response.setAmount(new BigDecimal(razorpayOrder.get("amount").toString()).divide(new BigDecimal("100")));
            response.setCurrency(razorpayOrder.get("currency"));
            response.setKeyId(keyId);
            response.setPaymentId(payment.getPaymentId());
            response.setReceipt(razorpayOrder.get("receipt"));
            response.setStatus("CREATED");
            response.setMessage("Payment order created successfully");

            // Set item details
            response.setItemType(course != null ? "COURSE" : "BUNDLE");
            response.setItemId(course != null ? course.getCourseId() : bundle.getBundleId());
            response.setItemName(itemName);
            response.setPlanName(plan.getName());

            return response;
        } catch (Exception e) {
            throw e;
        }


    }


    @Transactional
    public Boolean verifySignature(PaymentDTO.PaymentVerificationRequest paymentrequest) {
        try {
            if (paymentrequest == null || paymentrequest.getInternalPaymentId() == null) {
                throw new ResourceNotFoundException("Invalid payment verification request");
            }

            Optional<Payments> paymentOpt = paymentsRepository.findById(paymentrequest.getInternalPaymentId());
            if (paymentOpt.isEmpty()) {
                throw new ResourceNotFoundException("Payment id not found");
            }

            JSONObject data = new JSONObject();
            data.put("razorpay_order_id", paymentrequest.getOrderId());
            data.put("razorpay_payment_id", paymentrequest.getPaymentId());
            data.put("razorpay_signature", paymentrequest.getSignature());

            boolean isSignatureValid = Utils.verifyPaymentSignature(data, secret);

            if (!isSignatureValid) {
                return false;
            }

            Payments payment = paymentOpt.get();


            Object lock = paymentLocks.computeIfAbsent(payment.getPaymentId(), k -> new Object());

            synchronized (lock) {



                    payment.setRazorpayPaymentId(paymentrequest.getPaymentId());
                    payment.setRazorpaySignature(paymentrequest.getSignature());
                    payment.setUpdateAt(LocalDateTime.now());
                    paymentsRepository.save(payment);
            }

            return true;
        } catch (Exception e) {
            logger.error("Error verifying signature for payment ID: " + paymentrequest.getInternalPaymentId(), e);
            return false;
        }
    }

    public Boolean verifyWebhookSignature(String payload, String signature) {
        try {
            boolean isValid = Utils.verifyWebhookSignature(payload, signature, secret);
            return isValid;
        } catch (Exception e) {
            logger.error("Error verifying webhook signature", e);
            return false;
        }
    }

    @Transactional
    public void handleWebhookEvent(String payload) {
        try {
            JSONObject json = new JSONObject(payload);
            String event = json.getString("event");



            if (event.equals("payment.authorized") || event.equals("payment.captured")) {
                JSONObject paymentEntity = json.getJSONObject("payload")
                        .getJSONObject("payment")
                        .getJSONObject("entity");

                String razorpayPaymentId = paymentEntity.getString("id");
                String paymentStatus = paymentEntity.getString("status");
                String razorpayOrderId = paymentEntity.getString("order_id");
                JSONObject notes = paymentEntity.getJSONObject("notes");
                Long PaymentId = notes.optLong("payment_id");
                Long InstallmentId =notes.optLong("InstallmentId");
                String method = paymentEntity.getString("method");



                Object lock = paymentLocks.computeIfAbsent(PaymentId, k -> new Object());

                Payments payment = findPaymentWithRetry(razorpayPaymentId, razorpayOrderId, PaymentId);

                synchronized (lock) {
                    if (payment != null) {
                        String currentStatus = payment.getPaymentStatus();


                        if (event.equals("payment.authorized")) {

                            if (!"COMPLETED".equals(currentStatus)) {
                                payment.setPaymentStatus("AUTHORIZED");

                            }
                        } else if (event.equals("payment.captured")) {
                            logger.info("Successfully getting the info ");
                            payment.setPaymentStatus("SUCCESS");
                            payment.setPaymentMethod(method);

                             // trigger the endpoint
                            try {
                                // Get installment ID from payment


                                if (InstallmentId != null) {

                                    updateInstallmentAsPaid(InstallmentId,PaymentId);


                                    updateAccessControlAndNextDueDate(InstallmentId);

                                    checkAndUpdateCourseStatus(InstallmentId);

                                    logger.info("Payment processing completed successfully for installment: " + InstallmentId);
                                } else {
                                    logger.error("Installment ID not found for payment: " + PaymentId);
                                }
                            } catch (Exception e) {
                                logger.error("Error processing payment success: " + e.getMessage(), e);
                                // Consider rollback strategy here
                            }



                        }

                        // Update Razorpay details if not already set
                        if (payment.getRazorpayPaymentId() == null) {
                            payment.setRazorpayPaymentId(razorpayPaymentId);
                        }

                        payment.setUpdateAt(LocalDateTime.now());
                        paymentsRepository.save(payment);

                    } else {
                        logger.warn("Payment not found even after retries - Payment ID: " + PaymentId);
                    }
                }


                paymentLocks.remove(PaymentId);

            } else if (event.equals("payment.failed")) {
                // Handle failed payments
                JSONObject paymentEntity = json.getJSONObject("payload")
                        .getJSONObject("payment")
                        .getJSONObject("entity");
                String razorpayPaymentId = paymentEntity.getString("id");
                String razorpayOrderId = paymentEntity.getString("order_id");
                JSONObject notes = paymentEntity.getJSONObject("notes");
                Long PaymentId = notes.optLong("payment_id", 0L);

                Object lock = paymentLocks.computeIfAbsent(PaymentId, k -> new Object());

                synchronized (lock) {
                    Optional<Payments> paymentsOptional = paymentsRepository.findByPaymentId(PaymentId);

                    if (paymentsOptional.isPresent()) {
                        Payments payment = paymentsOptional.get();
                        payment.setPaymentStatus("FAILED");
                        payment.setUpdateAt(LocalDateTime.now());
                        paymentsRepository.save(payment);

                    } else {
                        logger.warn("Payment not found for failed event - Payment ID: " + PaymentId);
                    }
                }

                paymentLocks.remove(PaymentId);
            }

        } catch (Exception e) {
            logger.error("Webhook processing error: " + e.getMessage(), e);
        }
    }


   private  Payments findPaymentWithRetry(String razorpayOrderId, String razorpayPaymentId,Long PaymentId) {
        int maxRetries =5;
        int delays =500;

        for(int i=0;i<maxRetries;i++){
            Optional<Payments> paymentOpt = paymentsRepository.findById(PaymentId);
            if (paymentOpt.isPresent()) {
                return paymentOpt.get();
            }

            if (i < maxRetries - 1) {
                try {
                    Thread.sleep(delays);
                    delays = Math.min(delays* 2, 5000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }


        }

       return null;
   }


      public String updatePaymentByInstallmentId(PaymentDTO.UpdatePaymentDetails paymentDetails){
            try{
               Optional<Installments> installments  = installmentsRepository.findByInstallmentId(paymentDetails.getInstallmentId());

               if(!installments.isPresent()){
                   throw new ResourceNotFoundException("Installments not Found");
               }

                Installments installments1 =installments.get();


                Users user = installments1.getUser();
                Course course = installments1.getCourse();
                CourseBundles bundles =installments1.getBundle();
                Long courseId=null;
                Long BundleId=null;
                Long userId = user.getId();
                Optional<UserCourseEnrollment> userCourseEnrollments =null;
                if(course != null){
                    courseId = course.getCourseId();
                    userCourseEnrollments=userCourseEnrollmentRepository.findByUser_IdAndCourse_CourseId(userId,courseId);
                }else if(bundles != null){
                    BundleId=bundles.getBundleId();
                    userCourseEnrollments= userCourseEnrollmentRepository.findByUser_IdAndBundle_BundleId(userId,BundleId);
                }






                if(!userCourseEnrollments.isPresent()){
                    throw new ResourceNotFoundException("Payment Plan not found");
                }

                UserCourseEnrollment userCourseEnrollment =userCourseEnrollments.get();

                Payments payments =new Payments();
               payments.setUser(installments1.getUser());
               payments.setAmount(installments1.getAmount());
               payments.setCourse(installments1.getCourse());
               payments.setBundle(installments1.getBundle());
               payments.setPaymentMethod(paymentDetails.getPaymentMode());
               payments.setCurrency("INR");
               payments.setPaymentStatus("SUCCESS");
               payments.setPlan(userCourseEnrollment.getPlan());

               if(paymentDetails.getReferenceNo() != null){
                   payments.setTransactionId(paymentDetails.getReferenceNo());
               }

                payments.setCreatedAt(paymentDetails.getDate());


                payments =paymentsRepository.save(payments);


                updateInstallmentAsPaid(installments1.getInstallmentId(),payments.getPaymentId());

                updateAccessControlAndNextDueDate(installments1.getInstallmentId());
                checkAndUpdateCourseStatus(installments1.getInstallmentId());

                installments1.setStatus("PAID");
                installments1.setPayment(payments);

                installmentsRepository.save(installments1);

                return "Updated successfully";

            }catch (Exception e){
               throw e;
            }
      }




    private void updateInstallmentAsPaid(Long installmentId, Long paymentId) {
        try {
            Installments installment = installmentsRepository.findById(installmentId)
                    .orElseThrow(() -> new RuntimeException("Installment not found: " + installmentId));

            if ("PAID".equals(installment.getStatus())) {
                logger.warn("Installment {} already marked as PAID", installmentId);
                return;
            }

            installment.setStatus("PAID");

            Optional<Payments> payments = paymentsRepository.findByPaymentId(paymentId);
            if (payments.isPresent()) {
                installment.setPayment(payments.get());
            }

            installmentsRepository.save(installment);
            logger.info("Installment {} marked as PAID", installmentId);

        } catch (Exception e) {
            logger.error("Error updating installment {}: {}", installmentId, e.getMessage());
        }
    }

    private void updateAccessControlAndNextDueDate(Long installmentId) {

        try {
        Installments currentInstallment = installmentsRepository.findById(installmentId)
                .orElseThrow(() -> new RuntimeException("Installment not found: " + installmentId));

        Users user = currentInstallment.getUser();
        Course course = currentInstallment.getCourse();
        CourseBundles bundles =currentInstallment.getBundle();
        Long courseId=null;
        Long BundleId=null;
        Long userId = user.getId();

        CourseAccessControl accessControl =null;
        if(course != null){
            courseId =course.getCourseId();
            accessControl =courseAccessControlRepository.findByUser_IdAndCourse_CourseId(userId, courseId);
        }else if(bundles != null){
            BundleId=bundles.getBundleId();
            accessControl =courseAccessControlRepository.findByUser_IdAndBundle_BundleId(userId, BundleId);
        }





        accessControl.setAccessGranted(true);
        accessControl.setInstallment(currentInstallment);


            Optional<Installments> nextInstallment = installmentsRepository.findFirstByUser_IdAndCourse_CourseIdAndStatusNotOrderByDueDateAsc(userId, courseId, "PAID");


        if (nextInstallment.isPresent()) {

            accessControl.setActiveBy(nextInstallment.get().getDueDate());
            logger.info("Access granted until next installment due date: " + nextInstallment.get().getDueDate());
        } else {

            UserCourseEnrollment enrollment =null;
            if(course != null){
                enrollment = userCourseEnrollmentRepository.findByUser_IdAndCourse_CourseId(userId, courseId)
                        .orElseThrow(() -> new RuntimeException("User course enrollment not found"));
            }else if(bundles != null){
                enrollment = userCourseEnrollmentRepository.findByUser_IdAndBundle_BundleId(userId, BundleId)
                        .orElseThrow(() -> new RuntimeException("User course enrollment not found"));
            }


            accessControl.setActiveBy(enrollment.getExpiresAt());
            logger.info("Last installment paid, access granted until course expiry: " + enrollment.getExpiresAt());
        }

        courseAccessControlRepository.save(accessControl);
        } catch (Exception e) {
            logger.error("Error updating access control for installment {}: {}", installmentId, e.getMessage());
        }
    }

    private void checkAndUpdateCourseStatus(Long installmentId) {
        try {

        Installments currentInstallment = installmentsRepository.findById(installmentId)
                .orElseThrow(() -> new RuntimeException("Installment not found: " + installmentId));

        Users user = currentInstallment.getUser();
        Course course = currentInstallment.getCourse();
        CourseBundles bundles =currentInstallment.getBundle();
        Long courseId=null;
        Long BundleId=null;
        Long userId=user.getId();


        List<Installments> allInstallments=null;

        if(course != null){
            courseId=course.getCourseId();
            allInstallments= installmentsRepository.findAllByUser_IdAndCourse_CourseId(userId, courseId);
        }else if(bundles != null){
            BundleId = bundles.getBundleId();
            allInstallments = installmentsRepository.findByUser_IdAndBundle_BundleId(userId,BundleId);
        }



        boolean allInstallmentsPaid = allInstallments.stream()
                .allMatch(installment -> "PAID".equals(installment.getStatus()));

        if (allInstallmentsPaid) {

            UserCourseEnrollment enrollment = null;
            if(course != null){
                enrollment = userCourseEnrollmentRepository.findByUser_IdAndCourse_CourseId(userId, courseId)
                        .orElseThrow(() -> new RuntimeException("User course enrollment not found"));
            }else if(bundles != null){
                enrollment = userCourseEnrollmentRepository.findByUser_IdAndBundle_BundleId(userId, BundleId)
                        .orElseThrow(() -> new RuntimeException("User course enrollment not found"));
            }

            enrollment.setPaymentStatus("PAID");
            userCourseEnrollmentRepository.save(enrollment);

            logger.info("All installments paid. Course status updated to PAID for user: " +
                    userId + ", course: " + courseId);

        }

        } catch (Exception e) {
            logger.error("Error updating course status for installment {}: {}", installmentId, e.getMessage());
        }

    }

}


