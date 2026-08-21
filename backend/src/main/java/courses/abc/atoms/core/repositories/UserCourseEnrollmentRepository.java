package courses.abc.atoms.core.repositories;

import courses.abc.atoms.core.model.core.UserCourseEnrollment;
import courses.abc.atoms.features.admission.dto.AdmissionDTO;
import courses.abc.atoms.features.enrollment.dto.EnrollmentDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserCourseEnrollmentRepository extends JpaRepository<UserCourseEnrollment, Long> {
 Optional<UserCourseEnrollment> findByUser_IdAndCourse_CourseId(Long userId, Long courseId);
 Optional<UserCourseEnrollment> findByUser_IdAndBundle_BundleId(Long userId, Long bundleId);

 boolean  existsByUser_IdAndCourse_CourseId(Long userId,Long courseId);
 boolean  existsByUser_IdAndBundle_BundleId(Long userId, Long bundleId);


 @Query("""
    SELECT new courses.abc.atoms.features.enrollment.dto.EnrollmentDTO$GetEnrolledCourses(
        COALESCE(c.title, b.title),
        u.batches.batchName,
        CAST(u.enrolledAt AS string),
        CAST(u.progressPercentage AS string)
    )
    FROM UserCourseEnrollment u
    LEFT JOIN u.course c
    LEFT JOIN u.bundle b
    WHERE u.user.id = :userId
""")
 List<EnrollmentDTO.GetEnrolledCourses> findEnrolledCoursesByUserId(@Param("userId") Long userId);

 @Query(value = """
    SELECT 
           c.course_id AS id,
           c.title AS title,
           c.price AS fees,
           uce.payment_status AS paymentStatus,
           uce.enrolled_at AS enrolledAt,
           uce.access_status AS admissionStatus
    FROM user_course_enrollments uce
    JOIN courses c ON c.course_id = uce.course_id
    WHERE uce.user_id = :userId AND uce.course_id IS NOT NULL
    """, nativeQuery = true)
 List<Object[]> getUserCourseEnrollmentDetails(@Param("userId") Long userId);


 @Query(value = """
    SELECT 
           b.bundle_id AS id,
           b.title AS title,
           b.price AS fees,
           uce.payment_status AS paymentStatus,
           uce.enrolled_at AS enrolledAt,
           uce.access_status AS admissionStatus
    FROM user_course_enrollments uce
    JOIN course_bundles b ON b.bundle_id = uce.bundle_id
    WHERE uce.user_id = :userId AND uce.bundle_id IS NOT NULL
    """, nativeQuery = true)
 List<Object[]> getUserBundleEnrollmentDetails(@Param("userId") Long userId);


 @Query(value = """
    SELECT 
           i.course_id,
           i.installment_id,
           i.amount,
           i.due_date,
           i.status
    FROM installments i
    WHERE i.user_id = :userId AND i.course_id IS NOT NULL
    """, nativeQuery = true)
 List<Object[]> getCourseInstallmentsByUserId(@Param("userId") Long userId);


 @Query(value = """
    SELECT 
           i.bundle_id,
           i.installment_id,
           i.amount,
           i.due_date,
           i.status
    FROM installments i
    WHERE i.user_id = :userId AND i.bundle_id IS NOT NULL
    """, nativeQuery = true)
 List<Object[]> getBundleInstallmentsByUserId(@Param("userId") Long userId);

 @Query(value = """
    SELECT
      u.user_id AS user_id,
      u.email,
      p.name,
      p.phone_number,
      e.progress_percentage,
      e.enrolled_at
    FROM user_course_enrollments e
    JOIN users u ON e.user_id = u.user_id
    JOIN profiles p ON p.user_id = u.user_id
    WHERE e.course_id = :courseId
      AND (:batchId IS NULL OR e.batch_id = :batchId)
    ORDER BY e.enrolled_at DESC
    """,nativeQuery = true)
 List<Object []> findLearnersByCourseAndOptionalBatch(@Param("courseId") Long courseId, @Param("batchId") Long batchId);


 @Query("SELECT NEW courses.abc.atoms.features.enrollment.dto.EnrollmentDTO$GetCoursesWithDetails(" +
         "c.title, " +
         "CAST(uce.enrolledAt AS string), " +
         "CAST(uce.expiresAt AS string), " +
         "CAST(uce.progressPercentage AS string), " +
         "uce.paymentStatus, " +
         "cac.accessGranted, " +
         "CAST(cac.activeBy AS string)) " +
         "FROM UserCourseEnrollment uce " +
         "JOIN uce.course c " +
         "JOIN CourseAccessControl cac ON uce.user.id = cac.user.id AND uce.course.id = cac.course.id " +
         "WHERE uce.user.id = ?1 AND uce.course IS NOT NULL AND uce.expiresAt > CURRENT_TIMESTAMP " +
         "AND uce.accessStatus = 'ADMITTED' AND uce.accessStatus != 'CANCELLED' " +
         "ORDER BY uce.enrolledAt DESC")
 List<EnrollmentDTO.GetCoursesWithDetails> findEnrolledCoursesWithAccessControl(Long userId);

 @Query(value = """
        SELECT 
            c.course_id,
            c.title AS courseName,
            c.description,
            c.thumbnail_url AS thumbnailUrl,
            b.batch_id AS batchId,
            b.batch_name AS batchName,
            b.batch_manager_id AS batchManagerId,
            p.name AS batchManagerName,
            uce.payment_status AS paymentStatus,
            COALESCE(cac.access_granted, false) AS accessGranted,
            uce.enrolled_at AS enrolledAt,
            uce.expires_at AS expiresAt,
            cac.active_by AS activeBy,
            uce.progress_percentage AS progressPercentage,
            uce.completion_status AS completionStatus,
            uce.last_activity_at AS lastActivityAt,
            uce.completed_at AS completedAt,
            c.price AS coursePrice,
            0 AS totalLessons,
            0 AS completedLessons
        FROM user_course_enrollments uce
        JOIN courses c ON uce.course_id = c.course_id
        LEFT JOIN batches b ON uce.batch_id = b.batch_id
        LEFT JOIN profiles p ON b.batch_manager_id = p.user_id
        LEFT JOIN course_access_controls cac ON uce.user_id = cac.user_id AND uce.course_id = cac.course_id
        WHERE uce.user_id = :userId 
        AND uce.course_id IS NOT NULL 
        AND uce.access_status = 'ADMITTED'
        AND uce.access_status != 'CANCELLED'
        ORDER BY uce.enrolled_at DESC
        """, nativeQuery = true)
 List<Object[]> findEnrolledCoursesWithBatchAndThumbnails(@Param("userId") Long userId);

 @Query(value = """
        SELECT 
            cb.bundle_id,
            cb.title AS bundleName,
            cb.description,
            CASE 
                WHEN cb.thumbnail_image IS NOT NULL 
                THEN  encode(cb.thumbnail_image, 'base64')
                ELSE NULL 
            END AS thumbnailUrl,
            b.batch_id AS batchId,
            b.batch_name AS batchName,
            b.batch_manager_id AS batchManagerId,
            p.name AS batchManagerName,
            uce.payment_status AS paymentStatus,
            COALESCE(cac.access_granted, false) AS accessGranted,
            uce.enrolled_at AS enrolledAt,
            uce.expires_at AS expiresAt,
            cac.active_by AS activeBy,
            uce.progress_percentage AS progressPercentage,
            uce.completion_status AS completionStatus,
            uce.last_activity_at AS lastActivityAt,
            uce.completed_at AS completedAt,
            cb.price AS bundlePrice,
            COALESCE(course_count.total_courses, 0) AS totalCourses
        FROM user_course_enrollments uce
        JOIN course_bundles cb ON uce.bundle_id = cb.bundle_id
        LEFT JOIN batches b ON uce.batch_id = b.batch_id
        LEFT JOIN profiles p ON b.batch_manager_id = p.user_id
        LEFT JOIN course_access_controls cac ON uce.user_id = cac.user_id AND uce.bundle_id = cac.bundle_id
        LEFT JOIN (
            SELECT 
                bc.bundle_id,
                bc.batch_id,
                COUNT(DISTINCT bc.course_id) AS total_courses
            FROM batch_courses bc
            GROUP BY bc.bundle_id, bc.batch_id
        ) course_count ON uce.bundle_id = course_count.bundle_id AND uce.batch_id = course_count.batch_id
        WHERE uce.user_id = :userId 
        AND uce.bundle_id IS NOT NULL 
        AND uce.access_status = 'ADMITTED'
        AND uce.access_status != 'CANCELLED'
        ORDER BY uce.enrolled_at DESC
        """, nativeQuery = true)
 List<Object[]> findEnrolledBundlesWithBatchAndThumbnails(@Param("userId") Long userId);

 @Query("SELECT NEW courses.abc.atoms.features.enrollment.dto.EnrollmentDTO$GetBundlesWithDetails(" +
         "cb.title, " +
         "CAST(uce.enrolledAt AS string), " +
         "CAST(uce.expiresAt AS string), " +
         "CAST(uce.progressPercentage AS string), " +
         "uce.paymentStatus, " +
         "cac.accessGranted, " +
         "CAST(cac.activeBy AS string)) " +
         "FROM UserCourseEnrollment uce " +
         "JOIN uce.bundle cb " +
         "JOIN CourseAccessControl cac ON uce.user.id = cac.user.id AND uce.bundle.id = cac.bundle.id " +
         "WHERE uce.user.id = ?1 AND uce.bundle IS NOT NULL AND uce.expiresAt > CURRENT_TIMESTAMP " +
         "AND uce.accessStatus = 'ADMITTED' AND uce.accessStatus != 'CANCELLED' " +
         "ORDER BY uce.enrolledAt DESC")
 List<EnrollmentDTO.GetBundlesWithDetails> findEnrolledBundlesWithAccessControl(Long userId);
 
 boolean existsByUserId(Long userId);
}
