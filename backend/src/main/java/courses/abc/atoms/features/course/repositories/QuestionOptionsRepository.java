package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.features.course.model.Question;
import courses.abc.atoms.features.course.model.QuestionOptions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

import java.util.List;

@Repository
public interface QuestionOptionsRepository extends JpaRepository<QuestionOptions, Long> {
    
    List<QuestionOptions> findByQuestionId(Question question);

    List<QuestionOptions> findByQuestionIdOrderByOptionOrder(Question question);

    @Query("SELECT qo FROM QuestionOptions qo WHERE qo.questionId.questionId = :questionId")
    List<QuestionOptions> findByQuestionIdValue(@Param("questionId") Long questionId);

    @Query("SELECT qo FROM QuestionOptions qo WHERE qo.questionId.questionId = :questionId ORDER BY qo.optionOrder")
    List<QuestionOptions> findByQuestionIdValueOrderByOptionOrder(@Param("questionId") Long questionId);

    void deleteByQuestionId(Question question);

    Optional<QuestionOptions> findByOptionId(Long optionId);

    /**
     * Loads all options for a set of questions in a single query.
     * Use this in place of per-question {@link #findByQuestionId} calls to
     * avoid the N+1 pattern when fetching options for an entire question bank.
     */
    @Query("SELECT qo FROM QuestionOptions qo WHERE qo.questionId.questionId IN :questionIds")
    List<QuestionOptions> findByQuestionIds(@Param("questionIds") List<Long> questionIds);

    /**
     * Finds an option by ID only if it belongs to the specified question.
     * Used during answer submission to prevent cross-question option injection —
     * i.e. a student submitting the correct option from a different question.
     */
    @Query("SELECT qo FROM QuestionOptions qo WHERE qo.optionId = :optionId AND qo.questionId.questionId = :questionId")
    Optional<QuestionOptions> findByOptionIdAndQuestionId(
            @Param("optionId") Long optionId,
            @Param("questionId") Long questionId);

    /**
     * Returns the subset of {@code optionIds} that actually belong to the given question.
     * Used for bulk validation of MULTIPLE_CORRECT answers in a single round-trip — any ID
     * absent from the returned list is invalid (belongs to a different question or does not exist).
     * Eliminates the N-query-per-option pattern that would otherwise be needed.
     */
    @Query("SELECT qo.optionId FROM QuestionOptions qo WHERE qo.optionId IN :optionIds AND qo.questionId.questionId = :questionId")
    List<Long> findValidOptionIds(
            @Param("optionIds") List<Long> optionIds,
            @Param("questionId") Long questionId);
    
    long countByQuestionId(Question question);

    List<QuestionOptions> findByQuestionIdAndIsCorrect(Question question, Boolean isCorrect);

    @Query("SELECT qo FROM QuestionOptions qo WHERE qo.questionId.questionId = :questionId AND qo.isCorrect = true")
    List<QuestionOptions> findCorrectOptionsByQuestionId(@Param("questionId") Long questionId);
}