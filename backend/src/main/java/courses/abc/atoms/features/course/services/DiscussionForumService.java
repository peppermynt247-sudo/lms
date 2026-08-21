package courses.abc.atoms.features.course.services;

import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.core.model.core.Profiles;
import courses.abc.atoms.core.repositories.ProfileRepository;
import courses.abc.atoms.core.repositories.UserRoleRepository;
import courses.abc.atoms.core.repositories.RoleRepository;
import courses.abc.atoms.core.model.lms.Role;
import courses.abc.atoms.core.model.core.UserRoles;
import courses.abc.atoms.features.course.repositories.CourseRepository;
import courses.abc.atoms.features.course.model.Course;
import courses.abc.atoms.features.course.model.Batches;
import courses.abc.atoms.features.course.model.CurriculumSection;
import courses.abc.atoms.features.course.model.ContentItem;
import courses.abc.atoms.features.course.repositories.BatchRepository;
import courses.abc.atoms.features.course.repositories.CurriculumSectionsRepository;
import courses.abc.atoms.features.course.repositories.ContentItemRepository;
import courses.abc.atoms.features.course.dto.DiscussionForumDTO;
import courses.abc.atoms.features.course.dto.ForumReplyDTO;
import courses.abc.atoms.features.course.enums.ContentType;
import courses.abc.atoms.features.course.model.DiscussionForum;
import courses.abc.atoms.features.course.model.ForumReply;
import courses.abc.atoms.features.course.repositories.DiscussionForumRepository;
import courses.abc.atoms.features.course.repositories.ForumReplyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DiscussionForumService {

    @Autowired
    private DiscussionForumRepository discussionForumRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ForumReplyRepository forumReplyRepository;
    @Autowired
    private ProfileRepository profileRepository;
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private BatchRepository batchRepository;
    @Autowired
    private CurriculumSectionsRepository curriculumSectionsRepository;
    @Autowired
    private ContentItemRepository contentItemRepository;
    @Autowired
    private UserRoleRepository userRoleRepository;
    @Autowired
    private RoleRepository roleRepository;

    private Users getAuthenticatedUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getPrincipal() == null) {
                throw new RuntimeException("User not found in security context");
            }

            Object principal = authentication.getPrincipal();
            if (principal instanceof UserDetails userDetails) {
                return userRepository.findByEmail(userDetails.getUsername())
                        .orElseThrow(() -> new RuntimeException("User not found by email"));
            } else if (principal instanceof String principalStr) {
                if (principalStr.contains("@")) {
                    return userRepository.findByEmail(principalStr)
                            .orElseThrow(() -> new RuntimeException("User not found by email"));
                }
                try {
                    Long userId = Long.valueOf(principalStr);
                    return userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found by id"));
                } catch (NumberFormatException e) {
                    throw new RuntimeException("Invalid user principal format", e);
                }
            }
            throw new RuntimeException("Unsupported principal type");
        } catch (Exception e) {
            throw new RuntimeException("Error retrieving authenticated user: " + e.getMessage(), e);
        }
    }

    @Transactional
    public DiscussionForumDTO.DiscussionForumResponseDTO createDiscussionForum(DiscussionForumDTO.DiscussionForumRequestDTO requestDTO) {
        try {
            DiscussionForum forum = new DiscussionForum();
            if (requestDTO.getCourseId() != null) {
                Course course = new Course();
                course.setCourseId(requestDTO.getCourseId().longValue());
                forum.setCourse(course);
            }
            if (requestDTO.getSectionId() != null) {
                CurriculumSection section = new CurriculumSection();
                section.setSectionId(requestDTO.getSectionId());
                forum.setSection(section);
            }
            if (requestDTO.getBatchId() != null) {
                Batches batch = new Batches();
                batch.setBatchId(requestDTO.getBatchId().longValue());
                forum.setBatches(batch);
            }
            if (requestDTO.getContentItemId() != null) {
                ContentItem item = new ContentItem();
                item.setItemId(requestDTO.getContentItemId().longValue());
                forum.setContentItem(item);
            }
            forum.setContent(requestDTO.getContent());
            forum.setViewCount(requestDTO.getViewCount() != null ? requestDTO.getViewCount() : 0);
            forum.setIsPinned(Boolean.TRUE.equals(requestDTO.getIsPinned()));
            forum.setIsLocked(Boolean.TRUE.equals(requestDTO.getIsLocked()));
            forum.setIsActive(Boolean.TRUE.equals(requestDTO.getIsActive()));
            forum.setUsers(getAuthenticatedUser());
            return mapForumToResponseDTO(discussionForumRepository.save(forum));
        } catch (Exception e) {
            throw new RuntimeException("Error creating discussion forum: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public DiscussionForumDTO.DiscussionForumResponseDTO getDiscussionForumById(Integer forumId) {
        try {
            DiscussionForum forum = discussionForumRepository.findByForumId(forumId)
                    .orElseThrow(() -> new RuntimeException("Forum not found"));
            return mapForumToResponseDTO(forum);
        } catch (Exception e) {
            throw new RuntimeException("Error retrieving discussion forum: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<DiscussionForumDTO.DiscussionForumResponseDTO> getAllDiscussionForums(Integer courseId, Integer batchId, Integer sectionId, Integer contentItemId) {
        try {
            // Get authenticated user and their role
            Users authenticatedUser = getAuthenticatedUser();
            
            // Check if the current user has STUDENT role
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isStudent = authentication.getAuthorities().stream()
                    .anyMatch(authority -> authority.getAuthority().equals("ROLE_STUDENT"));
            
            // If user is a student, they should only see their own discussions on the dashboard.
            // BUT if they are viewing a specific material (contentItemId & batchId are provided),
            // they can see all discussions from their batchmates.
            Integer filterUserId = null;
            if (isStudent) {
                if (batchId != null && contentItemId != null) {
                    filterUserId = null; // Bypass student restriction
                } else {
                    filterUserId = authenticatedUser.getId().intValue();
                }
            }
            // Admin and Instructor can see all discussions, so filterUserId remains null
            
            return discussionForumRepository.findAllByFilters(courseId, batchId, sectionId, contentItemId, filterUserId)
                    .stream()
                    .map(this::mapForumToResponseDTO)
                    .toList();
        } catch (Exception e) {
            throw new RuntimeException("Error retrieving discussion forums: " + e.getMessage(), e);
        }
    }

    @Transactional
    public DiscussionForumDTO.DiscussionForumResponseDTO updateDiscussionForum(DiscussionForumDTO.DiscussionForumRequestDTO requestDTO, Integer forumId) {
        try {
            DiscussionForum forum = discussionForumRepository.findByForumId(forumId)
                    .orElseThrow(() -> new RuntimeException("Forum not found"));

            // Check if the authenticated user is the same as the forum creator
            Users authenticatedUser = getAuthenticatedUser();
            if (!forum.getUsers().getId().equals(authenticatedUser.getId())) {
                throw new RuntimeException("Only the creator of this forum can edit it.");
            }
            // Update fields if present in requestDTO
            if (requestDTO.getContent() != null) {
                forum.setContent(requestDTO.getContent());
            }
            if (requestDTO.getIsPinned() != null) {
                forum.setIsPinned(requestDTO.getIsPinned());
            }
            if (requestDTO.getIsLocked() != null) {
                forum.setIsLocked(requestDTO.getIsLocked());
            }
            if (requestDTO.getIsActive() != null) {
                forum.setIsActive(requestDTO.getIsActive());
            }
            if (requestDTO.getViewCount() != null) {
                forum.setViewCount(requestDTO.getViewCount());
            }
            if (requestDTO.getCourseId() != null) {
                Course course = new Course();
                course.setCourseId(requestDTO.getCourseId().longValue());
                forum.setCourse(course);
            }
            if (requestDTO.getBatchId() != null) {
                Batches batch = new Batches();
                batch.setBatchId(requestDTO.getBatchId().longValue());
                forum.setBatches(batch);
            }
            if (requestDTO.getSectionId() != null) {
                CurriculumSection section = new CurriculumSection();
                section.setSectionId(requestDTO.getSectionId());
                forum.setSection(section);
            }
            if (requestDTO.getContentItemId() != null) {
                ContentItem item = new ContentItem();
                item.setItemId(requestDTO.getContentItemId().longValue());
                forum.setContentItem(item);
            }

            DiscussionForum updatedForum = discussionForumRepository.save(forum);
            return mapForumToResponseDTO(updatedForum);
        } catch (Exception e) {
            throw new RuntimeException("Error updating discussion forum: " + e.getMessage(), e);
        }
    }

    @Transactional
    public ForumReplyDTO.ForumReplyResponseDTO createForumReply(ForumReplyDTO.ForumReplyRequestDTO requestDTO) {
        try {
            DiscussionForum forum = discussionForumRepository.findById(requestDTO.getForumId())
                    .orElseThrow(() -> new RuntimeException("Forum not found"));

            ForumReply reply = new ForumReply();
            reply.setDiscussionForum(forum);
            reply.setUsers(getAuthenticatedUser());
            reply.setContent(requestDTO.getContent());
            reply.setVote(requestDTO.getVote() != null ? requestDTO.getVote() : 0);
            reply.setIsSolution(Boolean.TRUE.equals(requestDTO.getIsSolution()));

            return mapReplyToResponseDTO(forumReplyRepository.save(reply));
        } catch (Exception e) {
            throw new RuntimeException("Error creating forum reply: " + e.getMessage(), e);
        }
    }

    @Transactional
    public ForumReplyDTO.ForumReplyResponseDTO updateForumReply(ForumReplyDTO.ForumReplyRequestDTO requestDTO, Integer replyId) {
        try {
            ForumReply reply = forumReplyRepository.findByReplyId(replyId);
            if (reply == null) {
                throw new RuntimeException("Reply not found");
            }

            // Check if the authenticated user is the same as the reply creator
            Users authenticatedUser = getAuthenticatedUser();
            if (reply.getUsers() == null || !reply.getUsers().getId().equals(authenticatedUser.getId())) {
                throw new RuntimeException("Only the creator of this reply can edit it.");
            }

            if (requestDTO.getVote() != null) reply.setVote(requestDTO.getVote());
            if (requestDTO.getIsSolution() != null) reply.setIsSolution(requestDTO.getIsSolution());
            if (requestDTO.getContent() != null) reply.setContent(requestDTO.getContent());

            return mapReplyToResponseDTO(forumReplyRepository.save(reply));
        } catch (Exception e) {
            throw new RuntimeException("Error updating forum reply: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void deleteDiscussionForum(Integer forumId) {
        try {
            DiscussionForum forum = discussionForumRepository.findByForumId(forumId)
                    .orElseThrow(() -> new RuntimeException("Forum not found"));
            discussionForumRepository.delete(forum);
        } catch (Exception e) {
            throw new RuntimeException("Error deleting discussion forum: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void deleteForumReply(Integer replyId) {
        try {
            ForumReply reply = forumReplyRepository.findByReplyId(replyId);
            if (reply == null) {
                throw new RuntimeException("Reply not found");
            }
            forumReplyRepository.deleteById(replyId);
        } catch (Exception e) {
            throw new RuntimeException("Error deleting forum reply: " + e.getMessage(), e);
        }
    }

    private DiscussionForumDTO.DiscussionForumResponseDTO mapForumToResponseDTO(DiscussionForum forum) {
        try {
            Integer userId = forum.getUsers() != null ? forum.getUsers().getId().intValue() : null;
            String userName = null;
            String userProfileImage = null;
            if (userId != null) {
                Profiles profile = profileRepository.findByUserId(Long.valueOf(userId)).orElse(null);
                if (profile != null) {
                    userName = profile.getName();
                    userProfileImage = profile.getProfileImageUrl();
                }
            }

            Integer courseId = forum.getCourse() != null ? (forum.getCourse().getCourseId() != null ? forum.getCourse().getCourseId().intValue() : null) : null;
            String courseName = null;
            if (courseId != null) {
                Course course = courseRepository.findById(Long.valueOf(courseId)).orElse(null);
                if (course != null) {
                    courseName = course.getTitle();
                }
            }

            Integer batchId = forum.getBatches() != null ? (forum.getBatches().getBatchId() != null ? forum.getBatches().getBatchId().intValue() : null) : null;
            String batchName = null;

            if (batchId != null) {
                Batches batch = batchRepository.findById(Long.valueOf(batchId)).orElse(null);
                if (batch != null) {
                    batchName = batch.getBatchName();
                }
            }

            Integer sectionId = forum.getSection() != null ? forum.getSection().getSectionId() : null;
            String sectionName = null;

            if (sectionId != null) {
                CurriculumSection section = curriculumSectionsRepository.findBySectionId(sectionId).orElse(null);
                if (section != null) {
                    sectionName = section.getTitle();
                }
            }

            Integer contentItemId = forum.getContentItem() != null ? (forum.getContentItem().getItemId() != null ? forum.getContentItem().getItemId().intValue() : null) : null;
            ContentType contentItemType = null;

            if (contentItemId != null) {
                ContentItem contentItem = contentItemRepository.findByItemId(Long.valueOf(contentItemId)).orElse(null);
                if (contentItem != null) {
                    contentItemType = contentItem.getContentType();
                }
            }

            return new DiscussionForumDTO.DiscussionForumResponseDTO(
                    forum.getForumId(),
                    userId,
                    userName,
                    userProfileImage,
                    forum.getCourse() != null ? (forum.getCourse().getCourseId() != null ? forum.getCourse().getCourseId().intValue() : null) : null,
                    courseName,
                    forum.getBatches() != null ? (forum.getBatches().getBatchId() != null ? forum.getBatches().getBatchId().intValue() : null) : null,
                    batchName,
                    forum.getSection() != null ? (forum.getSection().getSectionId()) : null,
                    sectionName,
                    forum.getContentItem() != null ? (forum.getContentItem().getItemId() != null ? forum.getContentItem().getItemId().intValue() : null) : null,
                    contentItemType,
                    forum.getContent(),
                    forum.getViewCount(),
                    forum.getIsPinned(),
                    forum.getIsLocked(),
                    forum.getCreatedAt(),
                    forum.getUpdatedAt(),
                    forum.getIsActive(),
                    forumReplyRepository.findByDiscussionForumForumId(forum.getForumId())
                            .stream()
                            .map(this::mapReplyToResponseDTO)
                            .toList()
            );
        } catch (Exception e) {
            throw new RuntimeException("Error mapping forum to response DTO: " + e.getMessage(), e);
        }
    }

    private ForumReplyDTO.ForumReplyResponseDTO mapReplyToResponseDTO(ForumReply reply) {
        try {
            Integer replyUserId = reply.getUsers().getId().intValue();

            // Look up user's profile name
            String replyUserName = null;
            Profiles replyProfile = profileRepository.findByUserId(Long.valueOf(replyUserId)).orElse(null);
            if (replyProfile != null) {
                replyUserName = replyProfile.getName();
            }

            // Look up user's role
            String replyUserRole = "Student"; // default
            java.util.List<UserRoles> userRolesList = userRoleRepository.findByIdUserId(Long.valueOf(replyUserId));
            if (userRolesList != null && !userRolesList.isEmpty()) {
                Long roleId = userRolesList.get(0).getId().getRoleId();
                Role role = roleRepository.findByRoleId(roleId).orElse(null);
                if (role != null) {
                    replyUserRole = role.getRoleName();
                }
            }

            return new ForumReplyDTO.ForumReplyResponseDTO(
                    reply.getReplyId(),
                    reply.getDiscussionForum().getForumId(),
                    replyUserId,
                    replyUserName,
                    replyUserRole,
                    reply.getContent(),
                    reply.getVote(),
                    reply.getIsSolution(),
                    reply.getCreatedAt(),
                    reply.getUpdatedAt()
            );
        } catch (Exception e) {
            throw new RuntimeException("Error mapping reply to response DTO: " + e.getMessage(), e);
        }
    }
}