package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.features.course.model.Ebook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EbookRepository extends JpaRepository<Ebook, Long> {

    /**
     * Finds an ebook by its unique ID.
     *
     * @param ebookId The unique ID of the ebook.
     * @return An Optional containing the Ebook if found.
     */
    Optional<Ebook> findByEbookId(Long ebookId);
}