package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.features.course.dto.ContentProgressDTO;
import courses.abc.atoms.features.course.enums.ContentType;
import courses.abc.atoms.features.course.model.ContentItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContentItemRepository extends JpaRepository<ContentItem, Long> {

    /**
     * Finds a content item by its ID.
     * @param itemId The ID of the content item.
     * @return An Optional containing the ContentItem if found.
     */
    Optional<ContentItem> findByItemId(Long itemId);

    /**
     * Finds all content items for a given section, ordered by their specified itemOrder.
     * @param sectionId The ID of the curriculum section.
     * @return A list of ordered ContentItems.
     */
    List<ContentItem> findBySection_SectionIdOrderByItemOrderAsc(Integer sectionId);

    /**
     * Finds the maximum itemOrder value for a given section.
     * Used to calculate the order for a new content item.
     * @param sectionId The ID of the curriculum section.
     * @return The maximum order value, or null if the section is empty.
     */
    @Query("SELECT MAX(ci.itemOrder) FROM ContentItem ci WHERE ci.section.sectionId = :sectionId")
    Integer findMaxItemOrderBySectionId(@Param("sectionId") Integer sectionId);

     /**
     * Finds the maximum itemOrder value for a given CurriculumSection entity.
     * @param section The CurriculumSection entity.
     * @return The maximum order value, or null if the section is empty.
     */
    @Query("SELECT MAX(ci.itemOrder) FROM ContentItem ci WHERE ci.section = :section")
    Integer findMaxItemOrderBySection(@Param("section") courses.abc.atoms.features.course.model.CurriculumSection section);

    /**
     * Finds a content item by its reference ID and content type.
     * This is essential for deleting an exercise and its associated content item wrapper.
     * @param contentReferenceId The ID of the referenced content (e.g., exerciseId).
     * @param contentType The type of content (e.g., EXERCISE).
     * @return An Optional containing the ContentItem if found.
     */
    Optional<ContentItem> findByContentReferenceIdAndContentType(Integer contentReferenceId, ContentType contentType);

    /**
     * Counts the total number of content items within a specific section.
     */
    long countBySection_SectionId(Integer sectionId);

    /**
     * Counts the number of content items a specific user has completed in a specific section.
     * This requires a JOIN through the ContentProgress entity.
     */
    @Query("SELECT COUNT(ci) FROM ContentItem ci JOIN ContentProgress cp ON ci.itemId = cp.contentItem.itemId WHERE ci.section.sectionId = :sectionId AND cp.user.id = :userId AND cp.status = :status")
    long countCompletedItemsBySectionAndUser(
            @Param("sectionId") Integer sectionId,
            @Param("userId") Long userId,
            @Param("status") ContentProgressDTO.ContentProgressStatus status
    );
}