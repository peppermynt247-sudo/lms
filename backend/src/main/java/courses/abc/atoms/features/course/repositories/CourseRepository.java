package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.features.course.model.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    /**
     * Finds a course by its unique pretty name with optimized query.
     * This is useful for creating user-friendly URLs.
     *
     * @param prettyName The URL-friendly name of the course.
     * @return An Optional containing the course if found.
     */
    @Query("SELECT c FROM Course c WHERE c.prettyName = :prettyName AND c.isArchived = false")
    Optional<Course> findByPrettyName(@Param("prettyName") String prettyName);

    /**
     * Find course by ID with eager loading of curriculums
     */
    @EntityGraph(attributePaths = { "curriculums" })
    Optional<Course> findByCourseId(Long id);

    /**
     * Find all active courses with pagination
     */
    @Query("SELECT c FROM Course c WHERE c.isArchived = false ORDER BY c.createdAt DESC")
    Page<Course> findAllActiveCourses(Pageable pageable);

    /**
     * Find courses by instructor with pagination
     */
    @Query("SELECT c FROM Course c WHERE c.instructorId = :instructorId AND c.isArchived = false")
    Page<Course> findByInstructorId(@Param("instructorId") Long instructorId, Pageable pageable);

    /**
     * Find featured courses
     */
    @Query("SELECT c FROM Course c WHERE c.isFeatured = true AND c.isArchived = false ORDER BY c.featuredRank ASC")
    List<Course> findFeaturedCourses();

    /**
     * Bulk update archive status
     */
    @Modifying
    @Query("UPDATE Course c SET c.isArchived = :archived WHERE c.courseId IN :courseIds")
    int bulkUpdateArchiveStatus(@Param("courseIds") List<Long> courseIds, @Param("archived") boolean archived);

    /**
     * Count courses by instructor
     */
    @Query("SELECT COUNT(c) FROM Course c WHERE c.instructorId = :instructorId AND c.isArchived = false")
    long countByInstructorId(@Param("instructorId") Long instructorId);

    /**
     * Check if course exists by ID
     */
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Course c WHERE c.courseId = :id")
    boolean existsByCourseId(@Param("id") Long id);

    /**
     * Find courses by multiple IDs for batch operations
     */
    @Query("SELECT c FROM Course c WHERE c.courseId IN :ids")
    List<Course> findByIdIn(@Param("ids") List<Long> ids);

    /**
     * Find courses by archived status with pagination.
     */
    Page<Course> findByIsArchived(boolean isArchived, Pageable pageable);

    @Query(value = """
        SELECT c.title FROM courses c
        JOIN curriculum_courses cc ON cc.course_id = c.course_id
        WHERE cc.curriculum_id = :curriculumId
        LIMIT 1
        """, nativeQuery = true)
    Optional<String> findFirstCourseTitleByCurriculumId(@Param("curriculumId") Integer curriculumId);
}