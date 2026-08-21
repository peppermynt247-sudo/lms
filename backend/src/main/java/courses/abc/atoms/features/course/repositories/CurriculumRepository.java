package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.features.course.model.Curriculum;
import courses.abc.atoms.features.course.model.QuestionBank;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;
import java.util.List;

@Repository
public interface CurriculumRepository extends JpaRepository<Curriculum, Integer> {
       // Useful for checking for duplicates before creation/update
    Optional<Curriculum> findByTitleAndVersion(String title, String version);
    Optional<Curriculum> findByCurriculumId(Integer curriculumId);

        /**
     * Finds all curriculums linked to a course via the curriculum_courses join table.
     * Schema: curriculum_courses (curriculum_id, course_id, sequence_order)
     */
    @Query(value = """
            SELECT cu.* FROM curriculum cu
            JOIN curriculum_courses cc ON cc.curriculum_id = cu.curriculum_id
            WHERE cc.course_id = :courseId
            ORDER BY cc.sequence_order ASC
            """, nativeQuery = true)
    List<Curriculum> findByCourseId(@Param("courseId") Integer courseId);
}