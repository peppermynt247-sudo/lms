package courses.abc.atoms.features.student.services;

import java.util.List;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.util.Base64;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import courses.abc.atoms.core.repositories.UserCourseEnrollmentRepository;
import courses.abc.atoms.features.course.repositories.CourseBundleRepository;
import courses.abc.atoms.features.course.repositories.BatchCourseRepository;
import courses.abc.atoms.features.course.repositories.CourseRepository;
import courses.abc.atoms.features.student.DTO.StudentDTO;
import courses.abc.atoms.features.course.model.CourseBundles;
import courses.abc.atoms.features.course.model.Course;
import courses.abc.atoms.features.student.repositories.UserBundleProgressRepository;
import courses.abc.atoms.features.student.repositories.UserCourseProgressRepository;
import courses.abc.atoms.features.student.model.UserBundleProgress;
import courses.abc.atoms.core.model.core.Users; // Added import for Users
import courses.abc.atoms.features.student.model.UserCourseProgress;

@Service
public class StudentService {

    @Autowired
    private UserCourseEnrollmentRepository userCourseEnrollmentRepository;

    @Autowired
    private CourseBundleRepository courseBundleRepository;

    @Autowired
    private BatchCourseRepository batchCourseRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserBundleProgressRepository userBundleProgressRepository;

    @Autowired
    private UserCourseProgressRepository userCourseProgressRepository;

    public List<StudentDTO.EnrolledCourseWithBatch> getEnrolledCoursesWithBatchDetails(Long userId) {
        List<Object[]> results = userCourseEnrollmentRepository.findEnrolledCoursesWithBatchAndThumbnails(userId);
        
        return results.stream().map(row -> {
            StudentDTO.EnrolledCourseWithBatch course = new StudentDTO.EnrolledCourseWithBatch();


            Users userEntity = new Users();
            userEntity.setId(userId);
            Course courseEntity = new Course();
            courseEntity.setCourseId(((Number) row[0]).longValue());
            UserCourseProgress userCourseProgressOpt = userCourseProgressRepository.findByUserAndCourse(userEntity, courseEntity);

            course.setCourseId(row[0] != null ? ((Number) row[0]).longValue() : null);
            course.setCourseName((String) row[1]);
            course.setDescription((String) row[2]);
            course.setThumbnailUrl((String) row[3]);
            course.setBatchId(row[4] != null ? ((Number) row[4]).longValue() : null);
            course.setBatchName((String) row[5]);
            course.setBatchManagerId(row[6] != null ? ((Number) row[6]).longValue() : null);
            course.setBatchManagerName((String) row[7]);
            course.setPaymentStatus((String) row[8]);
            course.setAccessGranted(row[9] != null ? (Boolean) row[9] : false);
            course.setEnrolledAt(row[10] != null ? row[10].toString() : null);
            course.setExpiresAt(row[11] != null ? row[11].toString() : null);
            course.setActiveBy(row[12] != null ? row[12].toString() : null);
            course.setProgressPercentage(userCourseProgressOpt != null ? userCourseProgressOpt.getProgressPercentage().toString() : "0");
            course.setCompletionStatus(userCourseProgressOpt != null ? userCourseProgressOpt.getStatus().toString() : "IN_PROGRESS");
            course.setLastActivityAt(userCourseProgressOpt != null ? userCourseProgressOpt.getLastUpdated().toString() : null);
            course.setCompletedAt(row[16] != null ? row[16].toString() : null);
            course.setCoursePrice(row[17] != null ? row[17].toString() : "0");
            course.setTotalLessons(row[18] != null ? ((Number) row[18]).intValue() : 0);
            course.setCompletedLessons(row[19] != null ? ((Number) row[19]).intValue() : 0);
            return course;
        }).collect(Collectors.toList());
    }

    public List<StudentDTO.EnrolledBundleWithBatch> getEnrolledBundlesWithBatchDetails(Long userId) {
        List<Object[]> results = userCourseEnrollmentRepository.findEnrolledBundlesWithBatchAndThumbnails(userId);
        
        return results.stream().map(row -> {
            StudentDTO.EnrolledBundleWithBatch bundle = new StudentDTO.EnrolledBundleWithBatch();


                Users user = new Users();
                user.setId(userId);
                CourseBundles bundleEntity = new CourseBundles();
                bundleEntity.setBundleId(((Number) row[0]).longValue());
                UserBundleProgress userBundleProgressOpt = userBundleProgressRepository.findByUserAndBundle(user, bundleEntity).orElse(null);
            


            bundle.setBundleId(row[0] != null ? ((Number) row[0]).longValue() : null);
            bundle.setBundleName((String) row[1]);
            bundle.setDescription((String) row[2]);
            bundle.setThumbnailUrl((String) row[3]);
            bundle.setBatchId(row[4] != null ? ((Number) row[4]).longValue() : null);
            bundle.setBatchName((String) row[5]);
            bundle.setBatchManagerId(row[6] != null ? ((Number) row[6]).longValue() : null);
            bundle.setBatchManagerName((String) row[7]);
            bundle.setPaymentStatus((String) row[8]);
            bundle.setAccessGranted(row[9] != null ? (Boolean) row[9] : false);
            bundle.setEnrolledAt(row[10] != null ? row[10].toString() : null);
            bundle.setExpiresAt(row[11] != null ? row[11].toString() : null);
            bundle.setActiveBy(row[12] != null ? row[12].toString() : null);
            bundle.setProgressPercentage(userBundleProgressOpt != null ? userBundleProgressOpt.getProgressPercentage().toString() : "0");
            bundle.setCompletionStatus(userBundleProgressOpt != null ? userBundleProgressOpt.getStatus().toString() : "0");
            bundle.setLastActivityAt(userBundleProgressOpt != null ? userBundleProgressOpt.getLastUpdated().toString() : null);
            bundle.setCompletedAt(row[16] != null ? row[16].toString() : null);
            bundle.setBundlePrice(row[17] != null ? row[17].toString() : "0");
            bundle.setTotalCourses(row[18] != null ? ((Number) row[18]).intValue() : 0);
            return bundle;
        }).collect(Collectors.toList());
    }
    
    public StudentDTO.BundleWithCourses getBundleWithCourses(Long userId, Long bundleId) {
        // First check if user is enrolled in the bundle
        Optional<Object[]> enrollmentCheck = userCourseEnrollmentRepository.findEnrolledBundlesWithBatchAndThumbnails(userId)
                .stream()
                .filter(row -> row[0] != null && ((Number) row[0]).longValue() == bundleId)
                .findFirst();

        if (enrollmentCheck.isEmpty()) {
            throw new RuntimeException("User is not enrolled in bundle with ID: " + bundleId);
        }

        Object[] enrollmentData = enrollmentCheck.get();

        // Get bundle metadata
        Optional<CourseBundles> bundleOptional = courseBundleRepository.findByBundleId(bundleId);
        if (bundleOptional.isEmpty()) {
            throw new RuntimeException("Bundle not found with ID: " + bundleId);
        }

        CourseBundles bundle = bundleOptional.get();

        // Get batch ID from enrollment data
        Long batchId = enrollmentData[4] != null ? ((Number) enrollmentData[4]).longValue() : null;
        
        // Get distinct course IDs linked to this bundle from batch_courses table
        // Use both bundle_id and batch_id for more accurate course retrieval
        List<Long> courseIds = batchCourseRepository.findDistinctCourseIdsByBundleIdAndBatchId(bundleId, batchId);

        // Fetch the courses by their IDs
        List<Course> courses = courseRepository.findByIdIn(courseIds);

        List<StudentDTO.CourseMetadata> coursesMetadata = courses.stream().map(course -> {
            StudentDTO.CourseMetadata courseMetadata = new StudentDTO.CourseMetadata();

            Users userEntity = new Users();
            userEntity.setId(userId);
            Course courseEntity = new Course();
            courseEntity.setCourseId(course.getCourseId());
            UserCourseProgress userCourseProgressOpt = userCourseProgressRepository.findByUserAndCourse(userEntity, courseEntity);
        
            courseMetadata.setCourseId(course.getCourseId());
            courseMetadata.setCourseName(course.getTitle());
            courseMetadata.setDescription(course.getDescription());
            courseMetadata.setOverview(course.getOverview());
            courseMetadata.setThumbnailUrl(course.getThumbnailUrl());
            courseMetadata.setCoursePrice(course.getPrice() != null ? 
                course.getPrice().toString() : "0");
            courseMetadata.setDifficultyLevel(course.getDifficultyLevel());
            courseMetadata.setEstimatedHours(course.getEstimatedHours());
            courseMetadata.setSequenceOrder(null); // BatchCourse doesn't have sequenceOrder like BundleCourse
            courseMetadata.setValidityInDays(course.getValidityInDays());
            courseMetadata.setIsPublished(course.isPublished());
            courseMetadata.setIsFeatured(course.isFeatured());
            courseMetadata.setProgressPercentage(userCourseProgressOpt != null ? userCourseProgressOpt.getProgressPercentage().toString() : "0");
            return courseMetadata;
        }).collect(Collectors.toList());

        // Create response DTO
        StudentDTO.BundleWithCourses response = new StudentDTO.BundleWithCourses();
        response.setBundleId(bundle.getBundleId());
        response.setBundleName(bundle.getTitle());
        response.setDescription(bundle.getDescription());
        response.setThumbnailUrl(bundle.getThumbnailImage() != null ? 
            Base64.getEncoder().encodeToString(bundle.getThumbnailImage()) : null);
        response.setBundlePrice(bundle.getPrice() != null ? bundle.getPrice().toString() : "0");
        response.setValidityInDays(bundle.getValidityInDays());
        response.setDiscountPercentage(bundle.getDiscountPercentage() != null ? 
            bundle.getDiscountPercentage().toString() : "0");
        response.setIsFeatured(bundle.getIsFeatured());
        response.setIsPublished(bundle.getIsPublished());

        // Set enrollment specific data from the enrollment check
        response.setEnrolledAt(enrollmentData[10] != null ? enrollmentData[10].toString() : null);
        response.setExpiresAt(enrollmentData[11] != null ? enrollmentData[11].toString() : null);
        response.setProgressPercentage(enrollmentData[13] != null ? enrollmentData[13].toString() : "0");
        response.setCompletionStatus((String) enrollmentData[14]);
        response.setPaymentStatus((String) enrollmentData[8]);
        response.setAccessGranted(enrollmentData[9] != null ? (Boolean) enrollmentData[9] : false);

        response.setCourses(coursesMetadata);

        return response;
    }
}
