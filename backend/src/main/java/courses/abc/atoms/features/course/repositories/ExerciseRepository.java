package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.features.course.model.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ExerciseRepository extends JpaRepository<Exercise, Integer> {
    Optional<Exercise> findByExerciseId(Integer exerciseId);
}