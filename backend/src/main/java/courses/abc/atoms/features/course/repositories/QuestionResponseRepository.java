package courses.abc.atoms.features.course.repositories;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import courses.abc.atoms.features.course.model.QuestionResponse;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionResponseRepository extends JpaRepository<QuestionResponse, Long> {

    /**
     * Loads all responses for an attempt with their associated {@link courses.abc.atoms.features.course.model.Question},
     * question options, and selected option fetched in a single JOIN — eliminates N+1 queries
     * during scoring in {@code completeExerciseAttempt} and result display in {@code getExerciseAttemptById}.
     */
    @EntityGraph("QuestionResponse.withQuestionAndOptions")
    List<QuestionResponse> findByAttemptAttemptId(Long attemptId);

    /**
     * Finds the student's saved response for a specific question within an attempt.
     * Used for the upsert (find-or-create) logic when saving answers progressively
     * during the test session.
     */
    Optional<QuestionResponse> findByAttemptAttemptIdAndQuestionQuestionId(Long attemptId, Long questionId);
}