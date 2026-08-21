package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.features.course.model.Question;
import courses.abc.atoms.features.course.model.QuestionBank;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    /** Returns all questions for a bank in definition order (unordered, avoid for student display). */
    List<Question> findByQuestionBank(QuestionBank questionBank);

    /**
     * Returns all questions for a bank sorted by {@code questionOrder} ascending.
     * Use this everywhere a deterministic question sequence is required — e.g. when
     * {@code randomizeQuestions} is false, or when building the navigation panel.
     */
    List<Question> findByQuestionBankOrderByQuestionOrderAsc(QuestionBank questionBank);

    Optional<Question> findByQuestionId(Long questionId);

    int countByQuestionBankQuestionBankId(Long questionBankId);
}