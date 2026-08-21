package courses.abc.atoms.features.course.controllers;

import courses.abc.atoms.core.dto.ApiResponse;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.features.course.dto.QuestionBankDTO;
import courses.abc.atoms.features.course.services.QuestionBankService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/question-banks") 
@PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
public class QuestionBankController {

    private static final Logger logger = LoggerFactory.getLogger(QuestionBankController.class);

    @Autowired
    private QuestionBankService questionBankService;


    @PostMapping
    public ResponseEntity<ApiResponse<QuestionBankDTO>> createQuestionBank(@Valid @RequestBody QuestionBankDTO dto) {
        logger.info("API hit: POST /api/question-banks with name: {}", dto.getName());
        try {
            QuestionBankDTO createdBank = questionBankService.createQuestionBank(dto);
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(ApiResponse.success(createdBank, "Question bank created successfully."));
        } catch (DataIntegrityViolationException e) {
            logger.warn("Data integrity violation while creating question bank: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<QuestionBankDTO>>> getAllQuestionBanks() {
        logger.info("API hit: GET /api/question-banks");
        List<QuestionBankDTO> banks = questionBankService.getAllQuestionBanks();
        return ResponseEntity.ok(ApiResponse.success(banks, "Retrieved all question banks."));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionBankDTO>> getQuestionBankById(@PathVariable Long id) {
        logger.info("API hit: GET /api/question-banks/{}", id);
        try {
            QuestionBankDTO bank = questionBankService.getQuestionBankById(id);
            return ResponseEntity.ok(ApiResponse.success(bank, "Retrieved question bank."));
        } catch (ResourceNotFoundException e) {
            logger.warn("Cannot find question bank with ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionBankDTO>> updateQuestionBank(@PathVariable Long id, @Valid @RequestBody QuestionBankDTO dto) {
        logger.info("API hit: PUT /api/question-banks/{}", id);
        try {
            QuestionBankDTO updatedBank = questionBankService.updateQuestionBank(id, dto);
            return ResponseEntity.ok(ApiResponse.success(updatedBank, "Question bank updated successfully."));
        } catch (ResourceNotFoundException e) {
            logger.warn("Cannot update non-existent question bank with ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (DataIntegrityViolationException e) {
            logger.warn("Data integrity violation while updating question bank ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteQuestionBank(@PathVariable Long id) {
        logger.info("API hit: DELETE /api/question-banks/{}", id);
        try {
            questionBankService.deleteQuestionBank(id);
            return ResponseEntity.ok(ApiResponse.success("Question bank deleted successfully."));
        } catch (ResourceNotFoundException e) {
            logger.warn("Cannot delete non-existent question bank with ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }


}