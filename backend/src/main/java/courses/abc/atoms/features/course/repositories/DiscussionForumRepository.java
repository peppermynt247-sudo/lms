package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.features.course.model.DiscussionForum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


import java.util.List;
import java.util.Optional;

public interface DiscussionForumRepository extends JpaRepository<DiscussionForum, Integer> {

    @Query("SELECT df FROM DiscussionForum df WHERE " +
           "(:batchId IS NULL OR df.batches.batchId = :batchId) AND " +
           "(:contentItemId IS NULL OR df.contentItem.itemId = :contentItemId) AND " +
           "(:sectionId IS NULL OR df.section.sectionId = :sectionId) AND " +
           "(:courseId IS NULL OR df.course.courseId = :courseId) AND " +
           "(:userId IS NULL OR df.users.id = :userId)")
    List<DiscussionForum> findAllByFilters(
            @Param("courseId") Integer courseId,
            @Param("batchId") Integer batchId,
            @Param("sectionId") Integer sectionId,
            @Param("contentItemId") Integer contentItemId,
            @Param("userId") Integer userId);

    Optional<DiscussionForum> findByForumId(Integer forumId);
}