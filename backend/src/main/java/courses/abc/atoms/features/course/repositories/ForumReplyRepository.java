package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.features.course.model.ForumReply;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ForumReplyRepository extends JpaRepository<ForumReply, Integer> {
    List<ForumReply> findByDiscussionForumForumId(Integer forumId);
    <Optional> ForumReply findByReplyId(Integer replyId);
}