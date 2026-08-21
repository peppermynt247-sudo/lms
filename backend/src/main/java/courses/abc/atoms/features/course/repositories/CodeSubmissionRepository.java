package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.features.course.model.CodeSubmission;
import courses.abc.atoms.features.course.model.CodingExercise;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CodeSubmissionRepository extends JpaRepository<CodeSubmission, Long> {

    /**
     * Finds the submission with the highest attempt number for a given user and exercise.
     */
    Optional<CodeSubmission> findTopByUserAndCodingExerciseOrderByAttemptNumberDesc(Users user, CodingExercise exercise);

    /**
     * Counts the number of submissions made by a specific user for a specific exercise.
     */
    long countByUserAndCodingExercise(Users user, CodingExercise exercise);

    /**
     * Finds all submissions for a given user and exercise, ordered by most recent first.
     */
    Page<CodeSubmission> findByUserAndCodingExerciseOrderByAttemptNumberDesc(Users user, CodingExercise exercise, Pageable pageable);
}