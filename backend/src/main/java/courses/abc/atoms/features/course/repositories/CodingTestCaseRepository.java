package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.features.course.model.CodingTestCase;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CodingTestCaseRepository extends JpaRepository<CodingTestCase, Long> {
    List<CodingTestCase> findByCodingExercise_CodingExerciseId(Long codingExerciseId);
}
