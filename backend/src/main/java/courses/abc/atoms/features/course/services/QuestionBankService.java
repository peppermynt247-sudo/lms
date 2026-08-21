package courses.abc.atoms.features.course.services;

import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.features.course.dto.QuestionBankDTO;
import courses.abc.atoms.features.course.model.QuestionBank;
import courses.abc.atoms.features.course.repositories.QuestionBankRepository;
import courses.abc.atoms.features.course.repositories.QuestionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuestionBankService {

    private static final Logger logger = LoggerFactory.getLogger(QuestionBankService.class);

    private final QuestionBankRepository questionBankRepository;
    private final QuestionRepository questionRepository;

    // Using constructor injection
    public QuestionBankService(QuestionBankRepository questionBankRepository, QuestionRepository questionRepository) {
        this.questionBankRepository = questionBankRepository;
        this.questionRepository = questionRepository;
    }

    @Transactional
    public QuestionBankDTO createQuestionBank(QuestionBankDTO dto) {
        logger.info("Creating a new question bank with name: {}", dto.getName());
        if (questionBankRepository.findByName(dto.getName()).isPresent()) {
            throw new DataIntegrityViolationException("A question bank with the name '" + dto.getName() + "' already exists.");
        }
        QuestionBank questionBank = convertToEntity(dto);
        QuestionBank savedBank = questionBankRepository.save(questionBank);
        logger.info("Successfully created question bank with ID: {}", savedBank.getQuestionBankId());
        return convertToDto(savedBank);
    }

    @Transactional(readOnly = true)
    public List<QuestionBankDTO> getAllQuestionBanks() {
        logger.info("Retrieving all question banks");
        return questionBankRepository.findAll()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuestionBankDTO getQuestionBankById(Long id) {
        logger.info("Retrieving question bank with ID: {}", id);
        QuestionBank questionBank = questionBankRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("QuestionBank not found with id: " + id));
        return convertToDto(questionBank);
    }

    @Transactional
    public QuestionBankDTO updateQuestionBank(Long id, QuestionBankDTO dto) {
        logger.info("Updating question bank with ID: {}", id);
        QuestionBank existingBank = questionBankRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("QuestionBank not found with id: " + id));

        // Check if the new name is being used by another bank
        questionBankRepository.findByName(dto.getName()).ifPresent(bank -> {
            if (!bank.getQuestionBankId().equals(id)) {
                throw new DataIntegrityViolationException("Another question bank with the name '" + dto.getName() + "' already exists.");
            }
        });

        existingBank.setName(dto.getName());
        existingBank.setDescription(dto.getDescription());
        existingBank.setQuestionsType(dto.getQuestionsType());
        existingBank.setDifficultyLevel(dto.getDifficultyLevel());

        QuestionBank updatedBank = questionBankRepository.save(existingBank);
        logger.info("Successfully updated question bank with ID: {}", updatedBank.getQuestionBankId());
        return convertToDto(updatedBank);
    }

    @Transactional
    public void deleteQuestionBank(Long id) {
        logger.info("Attempting to delete question bank with ID: {}", id);
        if (!questionBankRepository.existsById(id)) {
            throw new ResourceNotFoundException("QuestionBank not found with id: " + id);
        }
        questionBankRepository.deleteById(id);
        logger.info("Successfully deleted question bank with ID: {}", id);
    }

    // --- DTO Conversion Helper Methods ---

    private QuestionBankDTO convertToDto(QuestionBank entity) {
        QuestionBankDTO dto = new QuestionBankDTO();
        dto.setQuestionBankId(entity.getQuestionBankId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setQuestionsType(entity.getQuestionsType());
        dto.setDifficultyLevel(entity.getDifficultyLevel());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        
        // Get total questions count from repository
        int count = questionRepository.countByQuestionBankQuestionBankId(entity.getQuestionBankId());
        dto.setTotalQuestions(count);
        
        return dto;
    }

    private QuestionBank convertToEntity(QuestionBankDTO dto) {
        QuestionBank entity = new QuestionBank();
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setQuestionsType(dto.getQuestionsType());
        entity.setDifficultyLevel(dto.getDifficultyLevel());
        return entity;
    }
}