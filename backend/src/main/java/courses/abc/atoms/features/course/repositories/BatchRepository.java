package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.features.course.model.Batches;

import org.hibernate.engine.jdbc.batch.spi.Batch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BatchRepository extends JpaRepository<Batches,Long> {
      // Returns a paginated list of batches filtered by status.
      Page<Batches> findByStatus(String status, Pageable pageable);

      // Returns a paginated list of all batches.
      Page<Batches> findAll(Pageable pageable);

      Optional<Batches> findByBatchId(Long id);

      // List<Batches> findByCourse_CourseId(Long courseId);

      /**
       * Finds all batches associated with a specific course through the batch_courses join table.
       * @param courseId The ID of the course.
       * @return A list of associated batches.
       */
      @Query("SELECT DISTINCT b FROM Batches b JOIN b.batchCourses bc WHERE bc.course.courseId = :courseId")
      List<Batches> findBatchesByCourseId(@Param("courseId") Long courseId);

      @Query("SELECT DISTINCT b FROM Batches b JOIN b.batchCourses bc WHERE bc.bundle.bundleId = :bundleId")
      List<Batches> findByCourseBundle_BundleId(Long bundleId);

      List<Batches> findByBatchManagerId(Long userId);

      @Query("SELECT b FROM Batches b JOIN b.batchCourses bc ON b.batchId = bc.batch.batchId " +
              "WHERE bc.course.courseId = :courseId AND bc.bundle IS NULL AND b.isDefault = true")
      Optional<Batches> findDefaultBatchForCourse(@Param("courseId") Long courseId);

      @Query("SELECT b FROM Batches b JOIN b.batchCourses bc WHERE bc.bundle.bundleId = :bundleId AND b.isDefault = true")
      Optional<Batches> findDefaultBatchForBundle(@Param("bundleId") Long bundleId);
}
