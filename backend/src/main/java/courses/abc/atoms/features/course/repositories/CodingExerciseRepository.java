package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.features.course.model.CodingExercise;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CodingExerciseRepository extends JpaRepository<CodingExercise, Long> {
    boolean existsByTitle(String title);
}
