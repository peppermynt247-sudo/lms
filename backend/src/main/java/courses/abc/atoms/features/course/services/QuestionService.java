package courses.abc.atoms.features.course.services;

import courses.abc.atoms.features.course.dto.QuestionDTO;
import courses.abc.atoms.features.course.dto.StudentTestDTO;
import courses.abc.atoms.features.course.enums.QuestionType;
import courses.abc.atoms.features.course.model.Question;
import courses.abc.atoms.features.course.model.QuestionBank;
import courses.abc.atoms.features.course.model.QuestionOptions;
import courses.abc.atoms.features.course.repositories.QuestionBankRepository;
import courses.abc.atoms.features.course.repositories.QuestionOptionsRepository;
import courses.abc.atoms.features.course.repositories.QuestionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private static final Logger logger = LoggerFactory.getLogger(QuestionService.class);

    private final QuestionRepository questionRepository;
    private final QuestionOptionsRepository questionOptionsRepository;
    private final QuestionBankRepository questionBankRepository;

    @Transactional
    public QuestionDTO.AdminQuestionResponse createQuestion(
            Long questionBankId, QuestionDTO.QuestionCreateRequest request) {

        QuestionBank questionBank = questionBankRepository.findById(questionBankId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "QuestionBank not found with id: " + questionBankId));

        validateCorrectAnswerUsage(request.getQuestionType(), request.getCorrectAnswer());
        validateOptionsPresence(request.getQuestionType(), request.getOptions());

        Question question = new Question();
        question.setQuestionBank(questionBank);
        question.setQuestionType(request.getQuestionType());
        question.setQuestionText(request.getQuestionText());
        question.setExplanation(request.getExplanation());
        question.setPoints(request.getPoints());
        question.setDifficultyLevel(request.getDifficultyLevel());
        question.setQuestionOrder(request.getQuestionOrder());
        question.setMediaUrl(request.getMediaUrl());
        question.setCorrectAnswer(request.getCorrectAnswer() != null ? request.getCorrectAnswer().trim() : null);
        question.setNegativeMark(request.getNegativeMark());

        Question savedQuestion = questionRepository.save(question);

        List<QuestionDTO.QuestionOptionResponse> optionResponses = Collections.emptyList();
        if (request.getOptions() != null && !request.getOptions().isEmpty()) {
            List<QuestionOptions> options = request.getOptions().stream().map(optReq -> {
                QuestionOptions opt = new QuestionOptions();
                opt.setQuestionId(savedQuestion);
                opt.setOptionText(optReq.getOptionText());
                opt.setIsCorrect(optReq.getIsCorrect());
                opt.setExplanation(optReq.getExplanation());
                opt.setOptionOrder(optReq.getOptionOrder());
                return opt;
            }).collect(Collectors.toList());

            optionResponses = questionOptionsRepository.saveAll(options).stream()
                    .map(this::mapToOptionResponse)
                    .collect(Collectors.toList());
        }

        return mapToAdminQuestionResponse(savedQuestion, optionResponses);
    }

    /**
     * Creates multiple questions in two batch round-trips: one {@code saveAll} for
     * questions, one {@code saveAll} for all their options combined.
     *
     * <p>All requests are validated before any DB write — a single invalid entry
     * aborts the entire batch atomically.
     */
    @Transactional
    public List<QuestionDTO.AdminQuestionResponse> createBulkQuestions(
            Long questionBankId, List<QuestionDTO.QuestionCreateRequest> requests) {

        QuestionBank questionBank = questionBankRepository.findById(questionBankId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "QuestionBank not found with id: " + questionBankId));

        for (int i = 0; i < requests.size(); i++) {
            QuestionDTO.QuestionCreateRequest req = requests.get(i);
            try {
                validateCorrectAnswerUsage(req.getQuestionType(), req.getCorrectAnswer());
                validateOptionsPresence(req.getQuestionType(), req.getOptions());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException(
                        "Validation failed for question at index " + i + ": " + ex.getMessage());
            }
        }

        List<Question> questions = requests.stream().map(req -> {
            Question q = new Question();
            q.setQuestionBank(questionBank);
            q.setQuestionType(req.getQuestionType());
            q.setQuestionText(req.getQuestionText());
            q.setExplanation(req.getExplanation());
            q.setPoints(req.getPoints());
            q.setDifficultyLevel(req.getDifficultyLevel());
            q.setQuestionOrder(req.getQuestionOrder());
            q.setMediaUrl(req.getMediaUrl());
            q.setCorrectAnswer(req.getCorrectAnswer() != null ? req.getCorrectAnswer().trim() : null);
            q.setNegativeMark(req.getNegativeMark());
            return q;
        }).collect(Collectors.toList());

        List<Question> savedQuestions = questionRepository.saveAll(questions);

        List<QuestionOptions> allOptions = new ArrayList<>();
        for (int i = 0; i < requests.size(); i++) {
            List<QuestionDTO.QuestionOptionRequest> optReqs = requests.get(i).getOptions();
            if (optReqs != null && !optReqs.isEmpty()) {
                Question savedQ = savedQuestions.get(i);
                for (QuestionDTO.QuestionOptionRequest optReq : optReqs) {
                    QuestionOptions opt = new QuestionOptions();
                    opt.setQuestionId(savedQ);
                    opt.setOptionText(optReq.getOptionText());
                    opt.setIsCorrect(optReq.getIsCorrect());
                    opt.setExplanation(optReq.getExplanation());
                    opt.setOptionOrder(optReq.getOptionOrder());
                    allOptions.add(opt);
                }
            }
        }

        List<QuestionOptions> savedOptions = questionOptionsRepository.saveAll(allOptions);

        Map<Long, List<QuestionOptions>> optionsByQuestionId = savedOptions.stream()
                .collect(Collectors.groupingBy(opt -> opt.getQuestionId().getQuestionId()));

        return savedQuestions.stream().map(sq -> {
            List<QuestionDTO.QuestionOptionResponse> optionResponses =
                    optionsByQuestionId.getOrDefault(sq.getQuestionId(), Collections.emptyList())
                            .stream()
                            .map(this::mapToOptionResponse)
                            .collect(Collectors.toList());
            return mapToAdminQuestionResponse(sq, optionResponses);
        }).collect(Collectors.toList());
    }


    @Transactional(readOnly = true)
    public QuestionDTO.AdminQuestionResponse getQuestionByQuestionId(
            Long questionBankId, Long questionId) {

        questionBankRepository.findById(questionBankId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "QuestionBank not found with id: " + questionBankId));

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Question not found with id: " + questionId));

        if (!question.getQuestionBank().getQuestionBankId().equals(questionBankId)) {
            throw new EntityNotFoundException(
                    "Question does not belong to the specified QuestionBank");
        }

        List<QuestionOptions> options = questionOptionsRepository.findByQuestionId(question);
        List<QuestionDTO.QuestionOptionResponse> optionResponses = options.stream()
                .map(this::mapToOptionResponse)
                .collect(Collectors.toList());

        return mapToAdminQuestionResponse(question, optionResponses);
    }

    @Transactional(readOnly = true)
    public List<QuestionDTO.AdminQuestionResponse> getAllQuestionsByQuestionBankId(Long questionBankId) {
        QuestionBank questionBank = questionBankRepository.findById(questionBankId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "QuestionBank not found with id: " + questionBankId));

        List<Question> questions = questionRepository.findByQuestionBank(questionBank);
        List<Long> questionIds = questions.stream()
                .map(Question::getQuestionId)
                .collect(Collectors.toList());

        Map<Long, List<QuestionOptions>> optionsByQuestionId = questionOptionsRepository
                .findByQuestionIds(questionIds)
                .stream()
                .collect(Collectors.groupingBy(opt -> opt.getQuestionId().getQuestionId()));

        return questions.stream().map(question -> {
            List<QuestionDTO.QuestionOptionResponse> optionResponses =
                    optionsByQuestionId.getOrDefault(question.getQuestionId(), Collections.emptyList())
                            .stream()
                            .map(this::mapToOptionResponse)
                            .collect(Collectors.toList());
            return mapToAdminQuestionResponse(question, optionResponses);
        }).collect(Collectors.toList());
    }

    /**
     * Returns student-safe questions for a question bank without exposing answer correctness.
     * This method is used during test-taking to prevent answer exposure.
     * 
     * @param questionBankId the ID of the question bank
     * @return list of student-safe questions (without isCorrect or correctAnswer fields)
     */
    @Transactional(readOnly = true)
    public List<StudentTestDTO.StudentQuestion> getStudentQuestionsForQuestionBank(Long questionBankId) {
        logger.info("Fetching student questions for questionBankId: {}", questionBankId);

        QuestionBank questionBank = questionBankRepository.findById(questionBankId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "QuestionBank not found with id: " + questionBankId));

        List<Question> questions = questionRepository.findByQuestionBank(questionBank);
        logger.info("Found {} questions for questionBankId: {}", questions.size(), questionBankId);

        List<Long> questionIds = questions.stream()
                .map(Question::getQuestionId)
                .collect(Collectors.toList());

        Map<Long, List<QuestionOptions>> optionsByQuestionId = questionOptionsRepository
                .findByQuestionIds(questionIds)
                .stream()
                .collect(Collectors.groupingBy(opt -> opt.getQuestionId().getQuestionId()));

        List<StudentTestDTO.StudentQuestion> result = questions.stream().map(question -> {
            List<StudentTestDTO.StudentOption> options = optionsByQuestionId
                    .getOrDefault(question.getQuestionId(), Collections.emptyList())
                    .stream()
                    .map(opt -> new StudentTestDTO.StudentOption(
                            opt.getOptionId(),
                            opt.getOptionText(),
                            opt.getOptionOrder()))
                    .collect(Collectors.toList());

            return new StudentTestDTO.StudentQuestion(
                    question.getQuestionId(),
                    question.getQuestionText(),
                    question.getQuestionType(),
                    question.getPoints(),
                    question.getDifficultyLevel(),
                    question.getMediaUrl(),
                    question.getQuestionOrder(),
                    options);
        }).collect(Collectors.toList());

        logger.info("Returning {} student questions for questionBankId: {}", result.size(), questionBankId);
        return result;
    }


    @Transactional
    public QuestionDTO.AdminQuestionResponse updateQuestion(
            Long questionBankId, Long questionId, QuestionDTO.QuestionCreateRequest request) {

        questionBankRepository.findById(questionBankId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "QuestionBank not found with id: " + questionBankId));

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Question not found with id: " + questionId));

        if (!question.getQuestionBank().getQuestionBankId().equals(questionBankId)) {
            throw new EntityNotFoundException(
                    "Question does not belong to the specified QuestionBank");
        }

        validateCorrectAnswerUsage(request.getQuestionType(), request.getCorrectAnswer());
        validateOptionsPresence(request.getQuestionType(), request.getOptions());

        question.setQuestionType(request.getQuestionType());
        question.setQuestionText(request.getQuestionText());
        question.setExplanation(request.getExplanation());
        question.setPoints(request.getPoints());
        question.setDifficultyLevel(request.getDifficultyLevel());
        question.setQuestionOrder(null);
        question.setMediaUrl(request.getMediaUrl());
        question.setCorrectAnswer(request.getCorrectAnswer() != null ? request.getCorrectAnswer().trim() : null);
        question.setNegativeMark(request.getNegativeMark());

        Question updatedQuestion = questionRepository.save(question);

        List<QuestionDTO.QuestionOptionResponse> optionResponses = Collections.emptyList();
        if (request.getOptions() != null && !request.getOptions().isEmpty()) {
            List<QuestionOptions> existingOptions = questionOptionsRepository.findByQuestionId(question);
            Set<Long> requestOptionIds = request.getOptions().stream()
                    .filter(option -> option.getOptionId() != null)
                    .map(QuestionDTO.QuestionOptionRequest::getOptionId)
                    .collect(Collectors.toSet());

            List<QuestionOptions> optionsToDelete = existingOptions.stream()
                    .filter(option -> !requestOptionIds.contains(option.getOptionId()))
                    .collect(Collectors.toList());
            if (!optionsToDelete.isEmpty()) {
                questionOptionsRepository.deleteAll(optionsToDelete);
            }

            List<QuestionOptions> optionsToSave = request.getOptions().stream().map(optionRequest -> {
                QuestionOptions option;
                if (optionRequest.getOptionId() != null) {
                    option = existingOptions.stream()
                            .filter(o -> o.getOptionId().equals(optionRequest.getOptionId()))
                            .findFirst()
                            .orElseThrow(() -> new EntityNotFoundException(
                                    "Option not found with id: " + optionRequest.getOptionId()));
                } else {
                    option = new QuestionOptions();
                    option.setQuestionId(updatedQuestion);
                }
                option.setOptionText(optionRequest.getOptionText());
                option.setIsCorrect(optionRequest.getIsCorrect());
                option.setExplanation(optionRequest.getExplanation());
                option.setOptionOrder(optionRequest.getOptionOrder());
                return option;
            }).collect(Collectors.toList());

            optionResponses = questionOptionsRepository.saveAll(optionsToSave).stream()
                    .map(this::mapToOptionResponse)
                    .collect(Collectors.toList());
        } else {
            List<QuestionOptions> existingOptions = questionOptionsRepository.findByQuestionId(question);
            if (!existingOptions.isEmpty()) {
                questionOptionsRepository.deleteAll(existingOptions);
            }
        }

        return mapToAdminQuestionResponse(updatedQuestion, optionResponses);
    }

    @Transactional
    public void deleteQuestion(Long questionBankId, Long questionId) {
        questionBankRepository.findById(questionBankId)
                .orElseThrow(() -> new EntityNotFoundException("QuestionBank not found with id: " + questionBankId));

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("Question not found with id: " + questionId));

        if (!question.getQuestionBank().getQuestionBankId().equals(questionBankId)) {
            throw new EntityNotFoundException("Question does not belong to the specified QuestionBank");
        }

        questionRepository.delete(question);
    }


    // =========================================================================
    // Private — Validation Guards
    // =========================================================================

    /**
     * Rejects a non-blank {@code correctAnswer} for any question type other than
     * {@code ONE_WORD}. Prevents stale values from silently activating auto-grading
     * if the question type is later changed.
     */
    private void validateCorrectAnswerUsage(QuestionType type, String correctAnswer) {
        if (correctAnswer != null && !correctAnswer.isBlank()
                && type != QuestionType.ONE_WORD) {
            throw new IllegalArgumentException(
                    "correctAnswer is only applicable to ONE_WORD questions. "
                    + "Received questionType: " + type);
        }
    }

    /**
     * Enforces that option-based question types ({@code MCQ}, {@code TRUE_FALSE},
     * {@code MULTIPLE_CORRECT}, {@code MIXED}) are submitted with at least one option.
     * A question of these types with no options causes every student submission to
     * evaluate as unanswered regardless of what the student selects.
     */
    private void validateOptionsPresence(QuestionType type,
            List<QuestionDTO.QuestionOptionRequest> options) {
        boolean requiresOptions = type == QuestionType.MCQ
                || type == QuestionType.TRUE_FALSE
                || type == QuestionType.MULTIPLE_CORRECT;
        if (requiresOptions && (options == null || options.isEmpty())) {
            throw new IllegalArgumentException(
                    type + " questions must include at least one option.");
        }
    }

    // =========================================================================
    // Private — DTO Mappers
    // =========================================================================

    private QuestionDTO.AdminQuestionResponse mapToAdminQuestionResponse(
            Question question, List<QuestionDTO.QuestionOptionResponse> optionResponses) {
        return new QuestionDTO.AdminQuestionResponse(
                question.getQuestionId(),
                question.getQuestionType(),
                question.getQuestionText(),
                question.getExplanation(),
                question.getPoints(),
                question.getDifficultyLevel(),
                question.getQuestionOrder(),
                question.getMediaUrl(),
                question.getCorrectAnswer(),
                question.getNegativeMark(),
                optionResponses
        );
    }

    private QuestionDTO.QuestionOptionResponse mapToOptionResponse(QuestionOptions option) {
        return new QuestionDTO.QuestionOptionResponse(
                option.getOptionId(),
                option.getOptionText(),
                option.getIsCorrect(),
                option.getExplanation(),
                option.getOptionOrder()
        );
    }
}