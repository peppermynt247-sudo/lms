package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.features.course.model.QuestionBank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QuestionBankRepository extends JpaRepository<QuestionBank, Long> {

    // Useful for checking for duplicates before creation/update
    Optional<QuestionBank> findByName(String name);
}