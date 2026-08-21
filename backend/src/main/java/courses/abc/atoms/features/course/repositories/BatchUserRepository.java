package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.features.course.model.BatchUser;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BatchUserRepository extends JpaRepository<BatchUser,Long> {

   @Query("SELECT bu FROM BatchUser bu WHERE bu.batch.batchId = :batchId")
    Optional<BatchUser> findByBatchId(@Param("batchId") Long batchId);

    // Optional: If you need a primary course association, join with BatchCourse
    @Query("SELECT bu FROM BatchUser bu JOIN BatchCourse bc ON bc.batch.batchId = bu.batch.batchId WHERE bu.batch.batchId = :batchId AND bc.primaryForCourse = true")
    Optional<BatchUser> findPrimaryCourseForBatch(@Param("batchId") Long batchId);

    @Query("SELECT bu FROM BatchUser bu WHERE bu.batch.batchId = :batchId")
       List<BatchUser> findAllByBatchId(@Param("batchId") Long batchId);

    @Query(value = """
    SELECT 
        u.user_id AS userId,
        p.name AS name,
        p.phone_number AS phonenumber,
        u.email AS email,
        CASE 
            WHEN uce.course_id IS NOT NULL THEN c.title
            WHEN uce.bundle_id IS NOT NULL THEN b.title
            ELSE 'N/A'
        END AS title,
        uce.enrolled_at AS enrolled,
        uce.progress_percentage AS progress
    FROM user_course_enrollments uce
    JOIN users u ON u.user_id = uce.user_id
    JOIN profiles p ON p.user_id = uce.user_id
    LEFT JOIN courses c ON c.course_id = uce.course_id
    LEFT JOIN course_bundles b ON b.bundle_id = uce.bundle_id
    WHERE uce.batch_id = :batchId
    """, nativeQuery = true)
    List<Object[]> findBatchUsersByBatchId(@Param("batchId") Long batchId);

    long countByBatch_BatchId(Long batchId);
    void deleteByUserIdAndBatch_BatchId(Long UserId,Long batchId);

    boolean existsByUser_IdAndBatch_BatchId(Long userId, Long batchId);

    @Query("SELECT bu.batch.batchId FROM BatchUser bu WHERE bu.user.id = :userId")
    List<Long> findBatchIdsByUserId(@Param("userId") Long userId);
}
