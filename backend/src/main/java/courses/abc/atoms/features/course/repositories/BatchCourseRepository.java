package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.features.course.model.BatchCourse;
import courses.abc.atoms.features.course.model.Curriculum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BatchCourseRepository extends JpaRepository<BatchCourse, Long> {
    List<BatchCourse> findByBundle_BundleId(Long bundleId);
    /**
     * Finds all BatchCourse entries for a given course ID.
     * @param courseId The ID of the course.
     * @return A list of BatchCourse entries.
     */
    @Query("SELECT bc FROM BatchCourse bc WHERE bc.course.courseId = :courseId")
    List<BatchCourse> findByCourse_CourseId(@Param("courseId") Long courseId);
    
    /**
     * Deletes all BatchCourse entries associated with a given batch ID.
     * This is useful for efficiently updating batch-course associations.
     *
     * @param batchId The ID of the batch whose course associations are to be deleted.
     */
    void deleteByBatch_BatchId(Long batchId);

    /**
     * Deletes BatchCourse entries for specific courses in a batch.
     *
     * @param batchId The ID of the batch.
     * @param courseIds The list of course IDs to remove.
     */
    @Modifying
    @Query("DELETE FROM BatchCourse bc WHERE bc.batch.batchId = :batchId AND bc.course.courseId IN :courseIds")
    void deleteByBatchAndCourses(@Param("batchId") Long batchId, @Param("courseIds") List<Long> courseIds);

    /**
     * Deletes BatchCourse entries for specific curriculums in a course within a batch.
     *
     * @param batchId The ID of the batch.
     * @param courseId The ID of the course.
     * @param curriculumIds The list of curriculum IDs to remove.
     */
    @Modifying
    @Query("DELETE FROM BatchCourse bc WHERE bc.batch.batchId = :batchId AND bc.course.courseId = :courseId AND bc.curriculum.curriculumId IN :curriculumIds")
    void deleteByCurriculums(@Param("batchId") Long batchId, @Param("courseId") Long courseId, @Param("curriculumIds") List<Integer> curriculumIds);

    /**
     * Finds the primary batch-course association for a given course.
     * This was missing and caused a compilation error.
     * @param courseId The ID of the course.
     * @return An Optional containing the primary BatchCourse association.
     */
    @Query("SELECT bc FROM BatchCourse bc WHERE bc.course.courseId = :courseId AND bc.primaryForCourse = true")
    Optional<BatchCourse> findPrimaryByCourseId(@Param("courseId") Long courseId);

    /**
     * method to find the current primary default for a course.
     * The BatchService uses this to find the old default that needs to be unset.
     */
    Optional<BatchCourse> findByCourse_CourseIdAndPrimaryForCourse(Long courseId, boolean primaryForCourse);

    /**
     * method to find the specific association you want to update.
     * The BatchService uses this to find the exact record to set as the new primary default.
     */
    Optional<BatchCourse> findByBatch_BatchIdAndCourse_CourseId(Long batchId, Long courseId);


    @Query("SELECT bc FROM BatchCourse bc WHERE bc.batch.batchId = :batchId AND bc.primaryForCourse = true")
    Optional<BatchCourse> findPrimaryCourseForBatch(@Param("batchId") Long batchId);

    /**
     * Finds distinct course IDs for a given bundle ID and batch ID.
     * This method gets courses linked to a specific bundle through a specific batch.
     * @param bundleId The ID of the bundle.
     * @param batchId The ID of the batch.
     * @return A list of distinct course IDs.
     */
    @Query("SELECT DISTINCT bc.course.courseId FROM BatchCourse bc WHERE bc.bundle.bundleId = :bundleId AND bc.batch.batchId = :batchId")
    List<Long> findDistinctCourseIdsByBundleIdAndBatchId(@Param("bundleId") Long bundleId, @Param("batchId") Long batchId);

    /**
     * Finds all BatchCourse entries for a given curriculum ID.
     * @param curriculumId The ID of the curriculum.
     * @return A list of BatchCourse entries.
     */
    @Query("SELECT bc FROM BatchCourse bc WHERE bc.curriculum.curriculumId = :curriculumId")
    List<BatchCourse> findByCurriculumId(@Param("curriculumId") Long curriculumId);

    /**
     * Finds all curriculums linked to a specific batch and course.
     * This is the core of the new logic for displaying customized curriculum lists.
     *
     * @param batchId  The ID of the batch.
     * @param courseId The ID of the course.
     * @return A list of associated curriculums.
     */
    @Query("SELECT bc.curriculum FROM BatchCourse bc WHERE bc.batch.batchId = :batchId AND bc.course.courseId = :courseId AND bc.curriculum IS NOT NULL")
    List<Curriculum> findCurriculumsByBatchIdAndCourseId(@Param("batchId") Long batchId, @Param("courseId") Long courseId);
    
    @Query("SELECT c FROM Course co JOIN co.curriculums c WHERE co.courseId = :courseId")
    List<Curriculum> findCurriculumsByCourseId(@Param("courseId") Long courseId);
    /**
     * Checks if a batch has access to a specific curriculum.
     * This is used for the security check to prevent unauthorized access.
     *
     * @param batchId      The ID of the batch.
     * @param curriculumId The ID of the curriculum.
     * @return True if an association exists, false otherwise.
     */
    @Query("SELECT COUNT(bc) > 0 FROM BatchCourse bc WHERE bc.batch.batchId = :batchId AND bc.curriculum.curriculumId = :curriculumId")
    boolean existsByBatchIdAndCurriculumId(@Param("batchId") Long batchId, @Param("curriculumId") Integer curriculumId);
}
