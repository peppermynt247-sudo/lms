package courses.abc.atoms.features.course.repositories;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import courses.abc.atoms.features.course.dto.ContentProgressDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.features.course.model.ContentItem;
import courses.abc.atoms.features.course.model.ContentProgress;
import courses.abc.atoms.features.course.model.CurriculumSection;


public interface ContentProgressRepository extends JpaRepository<ContentProgress, Long> {
	Optional<ContentProgress> findByUserAndContentItem(Users user, ContentItem contentItem);

	void deleteByContentItem(ContentItem contentItem);

	@Query("SELECT cp FROM ContentProgress cp WHERE cp.user = :user AND cp.contentItem.section = :section")
	List<ContentProgress> findByUserAndSection(@Param("user") Users user, @Param("section") CurriculumSection section);

	/**
	 * Finds the IDs of all content items that a user has marked as 'COMPLETED'
	 * for a given curriculum. This is used for quick progress lookups.
	 */
	@Query("SELECT cp.contentItem.itemId FROM ContentProgress cp WHERE cp.user.id = :userId AND cp.contentItem.section.curriculumId.curriculumId = :curriculumId AND cp.status = :status")
	Set<Long> findCompletedContentItemIdsByUserAndCurriculum(
			@Param("userId") Long userId,
			@Param("curriculumId") Integer curriculumId,
			@Param("status") ContentProgressDTO.ContentProgressStatus status
	);
}
