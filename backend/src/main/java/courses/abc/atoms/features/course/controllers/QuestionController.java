package courses.abc.atoms.features.course.controllers;

import java.util.List;

import courses.abc.atoms.features.course.dto.QuestionDTO.AdminQuestionResponse;
import courses.abc.atoms.features.course.dto.StudentTestDTO;
import courses.abc.atoms.features.course.dto.QuestionDTO.QuestionCreateRequest;
import courses.abc.atoms.features.course.services.QuestionService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * REST controller for question-bank question management.
 *
 * <p>All endpoints require ADMIN or INSTRUCTOR role. Students receive masked
 * question data (without {@code correctAnswer} or {@code isCorrect} flags)
 * exclusively through {@code GET /api/exercises/{exerciseId}/questions},
 * which uses {@code StudentTestDTO.StudentQuestion} instead.
 */
@RestController
@RequestMapping("/api/question-banks")
@PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
public class QuestionController {

    private static final Logger logger = LoggerFactory.getLogger(QuestionController.class);

    @Autowired
    private QuestionService questionService;
    
    @PostMapping("/{questionBankId}/questions")
    public ResponseEntity<AdminQuestionResponse> createQuestion(
            @PathVariable Long questionBankId,
            @Valid @RequestBody QuestionCreateRequest request) {
        logger.info("POST /api/question-banks/{}/questions", questionBankId);
        try {
            AdminQuestionResponse response = questionService.createQuestion(questionBankId, request);
            logger.info("Created question for questionBankId: {}", questionBankId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            logger.error("Error creating question for questionBankId {}: {}", questionBankId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{questionBankId}/bulkquestions")
    public ResponseEntity<List<AdminQuestionResponse>> createBulkQuestions(
            @PathVariable Long questionBankId,
            @Valid @RequestBody List<QuestionCreateRequest> requests) {
        logger.info("POST /api/question-banks/{}/bulkquestions — {} questions", questionBankId, requests.size());
        try {
            List<AdminQuestionResponse> responses = questionService.createBulkQuestions(questionBankId, requests);
            return ResponseEntity.status(HttpStatus.CREATED).body(responses);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            logger.error("Error bulk-creating questions for questionBankId {}: {}", questionBankId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR', 'STUDENT')")
    @GetMapping("/{questionBankId}/questions")
    public ResponseEntity<?> getAllQuestionsByQuestionBankId(
            @PathVariable Long questionBankId) {
        logger.info("GET /api/question-banks/{}/questions", questionBankId);

        // Check if the user is a student
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isStudent = authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_STUDENT"));

        try {
            if (isStudent) {
                // Return student-safe questions without answer correctness
                List<StudentTestDTO.StudentQuestion> questions =
                        questionService.getStudentQuestionsForQuestionBank(questionBankId);
                return ResponseEntity.ok(questions);
            } else {
                // Return full admin questions for instructors/admins
                List<AdminQuestionResponse> questions =
                        questionService.getAllQuestionsByQuestionBankId(questionBankId);
                return ResponseEntity.ok(questions);
            }
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            logger.error("Error retrieving questions for questionBankId {}: {}", questionBankId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{questionBankId}/questions/{questionId}")
    public ResponseEntity<AdminQuestionResponse> getQuestionByQuestionId(
            @PathVariable Long questionBankId,
            @PathVariable Long questionId) {
        logger.info("GET /api/question-banks/{}/questions/{}", questionBankId, questionId);
        try {
            AdminQuestionResponse question =
                    questionService.getQuestionByQuestionId(questionBankId, questionId);
            return ResponseEntity.ok(question);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            logger.error("Error retrieving question {} for questionBankId {}: {}",
                    questionId, questionBankId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{questionBankId}/questions/{questionId}")
    public ResponseEntity<AdminQuestionResponse> updateQuestion(
            @PathVariable Long questionBankId,
            @PathVariable Long questionId,
            @Valid @RequestBody QuestionCreateRequest request) {
        logger.info("PUT /api/question-banks/{}/questions/{}", questionBankId, questionId);
        try {
            AdminQuestionResponse response =
                    questionService.updateQuestion(questionBankId, questionId, request);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            logger.error("Error updating question {} for questionBankId {}: {}",
                    questionId, questionBankId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @DeleteMapping("/{questionBankId}/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable Long questionBankId,
            @PathVariable Long questionId) {
        logger.info("DELETE /api/question-banks/{}/questions/{}", questionBankId, questionId);
        try {
            questionService.deleteQuestion(questionBankId, questionId);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            logger.error("Error deleting question {} for questionBankId {}: {}",
                    questionId, questionBankId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}