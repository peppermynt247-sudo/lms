package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.features.course.model.Curriculum;
import courses.abc.atoms.features.course.model.CurriculumSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

import java.util.List;

@Repository
public interface CurriculumSectionsRepository extends JpaRepository<CurriculumSection, Integer> {
    @Query("SELECT MAX(cs.sectionOrder) FROM CurriculumSection cs WHERE cs.curriculumId.curriculumId = :curriculumId")
    Integer findMaxSectionOrderByCurriculum(@Param("curriculumId") Integer curriculumId);

    List<CurriculumSection> findByCurriculumIdCurriculumId(@Param("curriculumId") Integer curriculumId);
    long countByCurriculumId_CurriculumId(Integer curriculumId);

    Optional<CurriculumSection> findByTitleAndCurriculumId(String title, Curriculum curriculumId);
    Optional<CurriculumSection>findBySectionId(Integer sectionId);

    List<CurriculumSection> findByCurriculumId_CurriculumIdOrderBySectionOrderAsc(Integer curriculumId);
}