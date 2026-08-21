package courses.abc.atoms.features.course.repositories;

import org.springframework.stereotype.Repository;
import courses.abc.atoms.features.course.model.ExerciseAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExerciseAttemptRepository extends JpaRepository<ExerciseAttempt, Long> {

    Integer countByUserIdAndExerciseExerciseId(Long userId, Integer exerciseId);

    List<ExerciseAttempt> findByUserIdAndExerciseExerciseIdAndCompletedAtIsNull(Long userId, Integer exerciseId);

    Optional<ExerciseAttempt> findByAttemptId(Long attemptId);

    List<ExerciseAttempt> findByUserIdAndExerciseExerciseIdOrderByAttemptNumberDesc(Long userId, Integer exerciseId);

    /**
     * Checks whether any attempt records exist for the given exercise.
     * Used before deletion to provide a descriptive error instead of a raw FK violation.
     */
    boolean existsByExerciseExerciseId(Integer exerciseId);
}
