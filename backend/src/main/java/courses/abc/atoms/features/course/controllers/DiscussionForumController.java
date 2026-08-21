package courses.abc.atoms.features.course.controllers;

import courses.abc.atoms.features.course.dto.DiscussionForumDTO;
import courses.abc.atoms.features.course.dto.ForumReplyDTO;
import courses.abc.atoms.features.course.services.DiscussionForumService;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/discussion-forums")
@PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR', 'STUDENT')")
@RequiredArgsConstructor
public class DiscussionForumController {

    @Autowired
    private DiscussionForumService discussionForumService;

    @PostMapping
    public ResponseEntity<DiscussionForumDTO.DiscussionForumResponseDTO> createDiscussionForum(@RequestBody DiscussionForumDTO.DiscussionForumRequestDTO requestDTO) {
        try {
            DiscussionForumDTO.DiscussionForumResponseDTO response = discussionForumService.createDiscussionForum(requestDTO);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            throw new RuntimeException("Error creating discussion forum: " + e.getMessage(), e);
        }
    }

    @GetMapping
    public ResponseEntity<List<DiscussionForumDTO.DiscussionForumResponseDTO>> getAllDiscussionForums(
            @RequestParam(required = false) Integer courseId,
            @RequestParam(required = false) Integer batchId,
            @RequestParam(required = false) Integer sectionId,
            @RequestParam(required = false) Integer contentItemId) {
        try {
            List<DiscussionForumDTO.DiscussionForumResponseDTO> forums = discussionForumService.getAllDiscussionForums(
                    courseId, batchId, sectionId, contentItemId);
            return ResponseEntity.ok().body(forums);
        } catch (Exception e) {
            throw new RuntimeException("Error retrieving discussion forums: " + e.getMessage(), e);
        }
    }

    @GetMapping("/{forumId}")
    public ResponseEntity<DiscussionForumDTO.DiscussionForumResponseDTO> getDiscussionForumById(@PathVariable Integer forumId) {
        try {
            DiscussionForumDTO.DiscussionForumResponseDTO response = discussionForumService.getDiscussionForumById(forumId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            throw new RuntimeException("Error retrieving discussion forum: " + e.getMessage(), e);
        }
    }

    @PostMapping("/{forumId}/reply")
    public ResponseEntity<ForumReplyDTO.ForumReplyResponseDTO> createForumReply(
            @PathVariable Integer forumId,
            @RequestBody ForumReplyDTO.ForumReplyRequestDTO requestDTO) {
        try {
            requestDTO.setForumId(forumId);
            ForumReplyDTO.ForumReplyResponseDTO response = discussionForumService.createForumReply(requestDTO);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            throw new RuntimeException("Error creating forum reply: " + e.getMessage(), e);
        }
    }

    @PutMapping("/{forumId}")
    public ResponseEntity<DiscussionForumDTO.DiscussionForumResponseDTO> updateDiscussionForum(
            @PathVariable Integer forumId,
            @RequestBody DiscussionForumDTO.DiscussionForumRequestDTO requestDTO) {
        try {
            DiscussionForumDTO.DiscussionForumResponseDTO response = discussionForumService.updateDiscussionForum(requestDTO, forumId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            throw new RuntimeException("Error updating discussion forum: " + e.getMessage(), e);
        }
    }

    @PutMapping("/replies/{id}")
    public ResponseEntity<ForumReplyDTO.ForumReplyResponseDTO> updateForumReply(
            @PathVariable Integer id,
            @RequestBody ForumReplyDTO.ForumReplyRequestDTO requestDTO) {
        try {
            ForumReplyDTO.ForumReplyResponseDTO response = discussionForumService.updateForumReply(requestDTO, id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            throw new RuntimeException("Error updating forum reply: " + e.getMessage(), e);
        }
    }

    @DeleteMapping("/{forumId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<Void> deleteDiscussionForum(@PathVariable Integer forumId) {
        try {
            discussionForumService.deleteDiscussionForum(forumId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            throw new RuntimeException("Error deleting discussion forum: " + e.getMessage(), e);
        }
    }

    @DeleteMapping("/replies/{replyId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<Void> deleteForumReply(@PathVariable Integer replyId) {
        try {
            discussionForumService.deleteForumReply(replyId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            throw new RuntimeException("Error deleting forum reply: " + e.getMessage(), e);
        }
    }
}