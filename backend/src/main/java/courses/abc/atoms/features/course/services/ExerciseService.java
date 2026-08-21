package courses.abc.atoms.features.course.services;

import courses.abc.atoms.core.exception.InvalidInputException;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.model.core.Profiles;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.repositories.ProfileRepository;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.features.course.dto.ExerciseAttemptDTO;
import courses.abc.atoms.features.course.dto.ExerciseDTO;
import courses.abc.atoms.features.course.dto.QuestionResponseDTO;
import courses.abc.atoms.features.course.dto.StudentTestDTO;
import courses.abc.atoms.features.course.enums.ContentType;
import courses.abc.atoms.features.course.enums.QuestionType;
import courses.abc.atoms.features.course.model.ContentItem;
import courses.abc.atoms.features.course.model.CurriculumSection;
import courses.abc.atoms.features.course.model.Exercise;
import courses.abc.atoms.features.course.model.ExerciseAttempt;
import courses.abc.atoms.features.course.model.Question;
import courses.abc.atoms.features.course.model.QuestionBank;
import courses.abc.atoms.features.course.model.QuestionOptions;
import courses.abc.atoms.features.course.model.QuestionResponse;
import courses.abc.atoms.features.course.repositories.ContentItemRepository;
import courses.abc.atoms.features.course.repositories.CurriculumSectionsRepository;
import courses.abc.atoms.features.course.repositories.ExerciseAttemptRepository;
import courses.abc.atoms.features.course.repositories.ExerciseRepository;
import courses.abc.atoms.features.course.repositories.QuestionBankRepository;
import courses.abc.atoms.features.course.repositories.QuestionOptionsRepository;
import courses.abc.atoms.features.course.repositories.QuestionRepository;
import courses.abc.atoms.features.course.repositories.QuestionResponseRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExerciseService {

    private static final Logger logger = LoggerFactory.getLogger(ExerciseService.class);

    private final ExerciseRepository exerciseRepository;
    private final ContentItemRepository contentItemRepository;
    private final CurriculumSectionsRepository curriculumSectionsRepository;
    private final QuestionBankRepository questionBankRepository;
    private final ExerciseAttemptRepository exerciseAttemptRepository;
    private final UserRepository userRepository;
    private final QuestionResponseRepository questionResponseRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionsRepository questionOptionsRepository;
    private final ProfileRepository profileRepository;

    // =========================================================================
    // CRUD — Exercise Management (Admin / Instructor)
    // =========================================================================

    @Transactional
    @CacheEvict(value = "content-items", key = "'section-' + #sectionId")
    public ExerciseDTO.Response createExerciseForSection(Integer sectionId, ExerciseDTO.CreateRequest request) {
        logger.info("Creating exercise for section ID: {}", sectionId);

        CurriculumSection section = curriculumSectionsRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("CurriculumSection not found with id: " + sectionId));

        QuestionBank questionBank = questionBankRepository.findById(request.getQuestionBankId())
                .orElseThrow(() -> new ResourceNotFoundException("QuestionBank not found with id: " + request.getQuestionBankId()));

        Exercise exercise = new Exercise();
        exercise.setTitle(request.getTitle());
        exercise.setDescription(request.getDescription());
        exercise.setInstructions(request.getInstructions());
        exercise.setExerciseType(request.getExerciseType());
        exercise.setTimeLimitMinutes(request.getTimeLimitMinutes());
        exercise.setPassingPercentage(request.getPassingPercentage());
        exercise.setMaxAttempts(request.getMaxAttempts());
        exercise.setRandomizeQuestions(request.getRandomizeQuestions());
        exercise.setNumQuestions(request.getNumQuestions());
        exercise.setQuestionBank(questionBank);

        Exercise savedExercise = exerciseRepository.save(exercise);
        logger.info("Created exercise ID: {}", savedExercise.getExerciseId());

        ContentItem contentItem = new ContentItem();
        contentItem.setSection(section);
        contentItem.setContentType(ContentType.EXERCISE);
        contentItem.setContentReferenceId(savedExercise.getExerciseId());

        Integer maxOrder = contentItemRepository.findMaxItemOrderBySectionId(sectionId);
        contentItem.setItemOrder(maxOrder == null ? 1 : maxOrder + 1);
        contentItemRepository.save(contentItem);

        return toExerciseResponseDto(savedExercise);
    }

    @Transactional(readOnly = true)
    public ExerciseDTO.Response getExerciseById(Integer exerciseId) {
        return toExerciseResponseDto(
                exerciseRepository.findById(exerciseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Exercise not found with id: " + exerciseId)));
    }

    @Transactional(readOnly = true)
    public List<ExerciseDTO.SummaryResponse> getAllExercisesBySection(Integer sectionId) {
        if (!curriculumSectionsRepository.existsById(sectionId)) {
            throw new ResourceNotFoundException("CurriculumSection not found with id: " + sectionId);
        }

        List<Integer> orderedIds = contentItemRepository
                .findBySection_SectionIdOrderByItemOrderAsc(sectionId).stream()
                .filter(item -> item.getContentType() == ContentType.EXERCISE)
                .map(ContentItem::getContentReferenceId)
                .collect(Collectors.toList());

        Map<Integer, Exercise> exerciseById = exerciseRepository.findAllById(orderedIds).stream()
                .collect(Collectors.toMap(Exercise::getExerciseId, Function.identity()));

        return orderedIds.stream()
                .filter(exerciseById::containsKey)
                .map(id -> toExerciseSummaryDto(exerciseById.get(id)))
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "content-items", allEntries = true)
    public ExerciseDTO.Response updateExercise(Integer exerciseId, ExerciseDTO.UpdateRequest request) {
        Exercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise not found with id: " + exerciseId));

        exercise.setTitle(request.getTitle());
        exercise.setDescription(request.getDescription());
        exercise.setInstructions(request.getInstructions());
        exercise.setExerciseType(request.getExerciseType());
        exercise.setTimeLimitMinutes(request.getTimeLimitMinutes());
        exercise.setPassingPercentage(request.getPassingPercentage());
        exercise.setMaxAttempts(request.getMaxAttempts());
        exercise.setRandomizeQuestions(request.getRandomizeQuestions());
        exercise.setNumQuestions(request.getNumQuestions());

        return toExerciseResponseDto(exerciseRepository.save(exercise));
    }

    @Transactional
    @CacheEvict(value = "content-items", allEntries = true)
    public void deleteExercise(Integer exerciseId) {
        if (!exerciseRepository.existsById(exerciseId)) {
            throw new ResourceNotFoundException("Exercise not found with id: " + exerciseId);
        }

        if (exerciseAttemptRepository.existsByExerciseExerciseId(exerciseId)) {
            throw new InvalidInputException(
                    "Exercise ID " + exerciseId + " cannot be deleted because student attempt records exist. " +
                    "Archive the exercise instead, or remove the attempts first.");
        }

        contentItemRepository
                .findByContentReferenceIdAndContentType(exerciseId, ContentType.EXERCISE)
                .ifPresent(contentItemRepository::delete);

        exerciseRepository.deleteById(exerciseId);
        logger.info("Deleted exercise ID: {}", exerciseId);
    }

    // =========================================================================
    // TEST-TAKING — Questions (Student)
    // =========================================================================

    /**
     * Returns questions for an exercise safe for student consumption.
     * The isCorrect flag is stripped from every option.
     * If randomizeQuestions is enabled the list is shuffled server-side.
     * Respects the exercise's numQuestions limit if set.
     */
    @Transactional(readOnly = true)
    public List<StudentTestDTO.StudentQuestion> getQuestionsForExercise(Integer exerciseId) {
        logger.info("Fetching masked questions for exercise ID: {}", exerciseId);

        Exercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise not found with id: " + exerciseId));

        QuestionBank questionBank = exercise.getQuestionBank();
        if (questionBank == null) {
            throw new ResourceNotFoundException("No question bank is linked to exercise ID: " + exerciseId);
        }

        List<Question> questions =
                questionRepository.findByQuestionBankOrderByQuestionOrderAsc(questionBank);

        List<StudentTestDTO.StudentQuestion> studentQuestions = questions.stream()
                .map(this::toStudentQuestion)
                .collect(Collectors.toList());

        // Apply randomization if enabled (use exerciseId as seed for consistency)
        if (Boolean.TRUE.equals(exercise.getRandomizeQuestions())) {
            long seed = exerciseId;
            Random random = new Random(seed);
            for (int i = studentQuestions.size() - 1; i > 0; i--) {
                int index = random.nextInt(i + 1);
                StudentTestDTO.StudentQuestion temp = studentQuestions.get(i);
                studentQuestions.set(i, studentQuestions.get(index));
                studentQuestions.set(index, temp);
            }
        }

        // Apply numQuestions limit if specified
        Integer numQuestions = exercise.getNumQuestions();
        
        if (numQuestions != null && numQuestions > 0 && studentQuestions.size() > numQuestions) {
            studentQuestions = studentQuestions.subList(0, numQuestions);
        }

        logger.info("Returning {} questions for exercise ID: {}", studentQuestions.size(), exerciseId);
        return studentQuestions;
    }

    // =========================================================================
    // TEST-TAKING — Attempt Lifecycle (Student)
    // =========================================================================

    @Transactional
    public ExerciseAttemptDTO.ExerciseAttemptResponse startExerciseAttempt(
            ExerciseAttemptDTO.ExerciseAttemptRequest request,
            Integer exerciseId,
            Long authenticatedUserId) {

        logger.info("Starting attempt — userId: {}, exerciseId: {}, contentItemId: {}",
                authenticatedUserId, exerciseId, request.getContentItemId());

        Exercise exercise = exerciseRepository.findByExerciseId(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise not found with id: " + exerciseId));

        Users user = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + authenticatedUserId));

        ContentItem contentItem = contentItemRepository.findByItemId(request.getContentItemId())
                .orElseThrow(() -> new ResourceNotFoundException("ContentItem not found with id: " + request.getContentItemId()));

        if (contentItem.getContentType() != ContentType.EXERCISE
                || !exerciseId.equals(contentItem.getContentReferenceId())) {
            throw new InvalidInputException(
                    "ContentItem ID " + request.getContentItemId()
                    + " does not reference exercise ID " + exerciseId + ".");
        }

        int existingAttempts = exerciseAttemptRepository
                .countByUserIdAndExerciseExerciseId(authenticatedUserId, exerciseId);
        long nextAttemptNumber = existingAttempts + 1L;

        if (exercise.getMaxAttempts() != null
                && exercise.getMaxAttempts() > 0
                && nextAttemptNumber > exercise.getMaxAttempts()) {
            throw new InvalidInputException(
                    "Maximum attempts (" + exercise.getMaxAttempts() + ") exceeded for exercise ID: " + exerciseId);
        }

        ExerciseAttempt attempt = new ExerciseAttempt();
        attempt.setUser(user);
        attempt.setExercise(exercise);
        attempt.setContentItem(contentItem);
        attempt.setStartedAt(LocalDateTime.now());
        attempt.setAttemptNumber(nextAttemptNumber);

        try {
            attempt = exerciseAttemptRepository.save(attempt);
        } catch (DataIntegrityViolationException ex) {
            throw new InvalidInputException(
                    "A concurrent start request already created attempt " + nextAttemptNumber +
                    " for this exercise. Please refresh and try again.");
        }

        logger.info("Attempt started — attemptId: {}, attemptNumber: {}",
                attempt.getAttemptId(), nextAttemptNumber);
        return toAttemptResponseDto(attempt, 0, 0, 0, 0, 0, List.of(), List.of());
    }

    @Transactional
    public StudentTestDTO.AttemptProgressResponse saveAnswer(
            Long attemptId,
            QuestionResponseDTO.CompleteAttemptRequest request,
            Long authenticatedUserId) {

        logger.info("Saving answer — attemptId: {}, questionId: {}", attemptId, request.getQuestionId());

        ExerciseAttempt attempt = findAttemptAndVerifyOwnership(attemptId, authenticatedUserId);

        if (attempt.getCompletedAt() != null) {
            throw new InvalidInputException(
                    "Attempt ID " + attemptId + " is already completed. No further changes are allowed.");
        }

        Question question = questionRepository.findByQuestionId(request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Question not found with id: " + request.getQuestionId()));

        QuestionBank expectedBank = requireQuestionBank(attempt.getExercise());
        if (!question.getQuestionBank().getQuestionBankId()
                .equals(expectedBank.getQuestionBankId())) {
            throw new InvalidInputException(
                    "Question ID " + question.getQuestionId()
                    + " does not belong to exercise ID " + attempt.getExercise().getExerciseId() + ".");
        }

        // Validate answer type matches question type
        validateAnswerTypeMatchesQuestionType(request, question);

        QuestionResponse response = findOrCreateResponse(attempt, question);
        applyAnswerToResponse(response, request, question);
        questionResponseRepository.save(response);

        logger.debug("Answer saved — attemptId: {}, questionId: {}, markedForReview: {}",
                attemptId, request.getQuestionId(), response.isMarkedForReview());

        return buildProgressResponse(attempt);
    }

    @Transactional(readOnly = true)
    public StudentTestDTO.AttemptProgressResponse getAttemptProgress(
            Long attemptId, Long authenticatedUserId) {

        ExerciseAttempt attempt = findAttemptAndVerifyOwnership(attemptId, authenticatedUserId);
        return buildProgressResponse(attempt);
    }

    @Transactional
    public ExerciseAttemptDTO.ExerciseAttemptResponse completeExerciseAttempt(
            Long attemptId,
            List<QuestionResponseDTO.CompleteAttemptRequest> incomingResponses,
            Long authenticatedUserId) {

        logger.info("Completing attempt ID: {}", attemptId);

        ExerciseAttempt attempt = findAttemptAndVerifyOwnership(attemptId, authenticatedUserId);

        if (attempt.getCompletedAt() != null) {
            logger.warn("Attempt ID {} already completed — returning stored result", attemptId);
            return getExerciseAttemptById(attemptId, authenticatedUserId);
        }

        // 1. Resolve question bank
        QuestionBank questionBank = requireQuestionBank(attempt.getExercise());

        // 2. Upsert any answers that arrived with the submit request
        if (incomingResponses != null && !incomingResponses.isEmpty()) {
            for (QuestionResponseDTO.CompleteAttemptRequest req : incomingResponses) {
                if (req.getQuestionId() == null) {
                    throw new InvalidInputException(
                            "questionId is required for every answer in the submit request.");
                }
                Question question = questionRepository.findByQuestionId(req.getQuestionId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Question not found with id: " + req.getQuestionId()));

                if (!question.getQuestionBank().getQuestionBankId()
                        .equals(questionBank.getQuestionBankId())) {
                    throw new InvalidInputException(
                            "Question ID " + question.getQuestionId()
                            + " does not belong to exercise ID " + attempt.getExercise().getExerciseId() + ".");
                }

                // Validate answer type matches question type
                validateAnswerTypeMatchesQuestionType(req, question);

                QuestionResponse response = findOrCreateResponse(attempt, question);
                applyAnswerToResponse(response, req, question);
                questionResponseRepository.save(response);
            }
        }

        // 3. Load all saved responses
        List<QuestionResponse> allResponses =
                questionResponseRepository.findByAttemptAttemptId(attemptId);

        // 4. Compute max possible score from questions using the same question set that was served
        List<Question> allBankQuestions =
                questionRepository.findByQuestionBankOrderByQuestionOrderAsc(questionBank);
        Exercise exercise = attempt.getExercise();
        List<Question> effectiveQuestions = resolveEffectiveQuestions(exercise, allBankQuestions);
        
        BigDecimal maxPossibleScore = effectiveQuestions.stream()
                .map(this::toPoints)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 5. Evaluate each response
        BigDecimal totalScore = BigDecimal.ZERO;
        int correctCount = 0, incorrectCount = 0, pendingReviewCount = 0, unansweredCount = 0;
        List<QuestionResponseDTO.DetailedQuestionResponse> detailedResponses = new ArrayList<>();

        for (QuestionResponse response : allResponses) {
            Question question = response.getQuestion();
            BigDecimal questionPoints = toPoints(question);

            EvaluationResult result = evaluate(response, question, questionPoints);

            response.setIsCorrect(result.isCorrect());
            response.setPointsAwarded(result.pointsAwarded());

            if      (result.isPendingReview()) { pendingReviewCount++; }
            else if (result.isUnanswered())    { unansweredCount++; }
            else if (Boolean.TRUE.equals(result.isCorrect())) {
                correctCount++;
                totalScore = totalScore.add(result.pointsAwarded());
            } else {
                incorrectCount++;
            }

            detailedResponses.add(toDetailedResponse(question, response, result));
        }

        questionResponseRepository.saveAll(allResponses);

        // 6. Count completely unanswered questions (respecting numQuestions limit)
        int effectiveTotalQuestions = effectiveQuestions.size();
        unansweredCount += Math.max(0, effectiveTotalQuestions - allResponses.size());

        // 7. Score / pass-fail
        BigDecimal percentage = maxPossibleScore.compareTo(BigDecimal.ZERO) > 0
                ? totalScore.divide(maxPossibleScore, 4, RoundingMode.HALF_UP)
                             .multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        boolean passed = attempt.getExercise().getPassingPercentage() != null
                && percentage.compareTo(
                        BigDecimal.valueOf(attempt.getExercise().getPassingPercentage())) >= 0;

        // 8. Time spent (cap at time limit if timer expired)
        LocalDateTime completedAt = LocalDateTime.now();
        long timeSpentSeconds = attempt.getStartedAt() != null
                ? Duration.between(attempt.getStartedAt(), completedAt).getSeconds()
                : 0L;

        // Cap time spent at the exercise time limit (if configured)
        Integer timeLimitMinutes = attempt.getExercise().getTimeLimitMinutes();
        if (timeLimitMinutes != null && timeLimitMinutes > 0) {
            long maxTimeSeconds = timeLimitMinutes * 60L;
            if (timeSpentSeconds > maxTimeSeconds) {
                logger.info("Capping time spent from {} seconds to time limit {} seconds", 
                        timeSpentSeconds, maxTimeSeconds);
                timeSpentSeconds = maxTimeSeconds;
            }
        }

        // 9. Persist final attempt state
        attempt.setScore(totalScore);
        attempt.setMaxScore(maxPossibleScore.setScale(0, RoundingMode.HALF_UP).longValue());
        attempt.setPercentage(percentage);
        attempt.setPassed(passed);
        attempt.setCompletedAt(completedAt);
        attempt.setTimeSpentSeconds(timeSpentSeconds);
        exerciseAttemptRepository.save(attempt);

        logger.info("Attempt {} completed — score: {}/{}, {}%, passed: {}, " +
                    "correct: {}, incorrect: {}, pendingReview: {}, unanswered: {}",
                attemptId, totalScore, maxPossibleScore, percentage, passed,
                correctCount, incorrectCount, pendingReviewCount, unansweredCount);

        int totalAttemptedQuestions = correctCount + incorrectCount + pendingReviewCount;

        List<Long> servedQuestionIds = effectiveQuestions.stream()
                .map(q -> q.getQuestionId().longValue())
                .collect(Collectors.toList());

        return toAttemptResponseDto(attempt, correctCount, incorrectCount,
                totalAttemptedQuestions, unansweredCount, pendingReviewCount, detailedResponses,
                servedQuestionIds);
    }

    @Transactional(readOnly = true)
    public ExerciseAttemptDTO.ExerciseAttemptResponse getExerciseAttemptById(
            Long attemptId, Long userId) {

        logger.info("Fetching attempt ID: {} for user ID: {}", attemptId, userId);

        ExerciseAttempt attempt = exerciseAttemptRepository.findByAttemptId(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Attempt not found with id: " + attemptId));

        if (!attempt.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException(
                    "Attempt ID " + attemptId + " does not belong to user ID: " + userId);
        }

        if (attempt.getCompletedAt() == null) {
            return toAttemptResponseDto(attempt, 0, 0, 0, 0, 0, List.of(), List.of());
        }

        List<QuestionResponse> responses =
                questionResponseRepository.findByAttemptAttemptId(attemptId);

        int correctCount = 0, incorrectCount = 0, pendingReviewCount = 0, unansweredCount = 0;
        for (QuestionResponse r : responses) {
            if      (Boolean.TRUE.equals(r.getIsCorrect()))  { correctCount++; }
            else if (Boolean.FALSE.equals(r.getIsCorrect())) { incorrectCount++; }
            else if (hasAnswer(r))                           { pendingReviewCount++; }
            else                                             { unansweredCount++; }
        }

        QuestionBank questionBank = requireQuestionBank(attempt.getExercise());
        Exercise exercise = attempt.getExercise();

        List<Question> allBankQuestions =
                questionRepository.findByQuestionBankOrderByQuestionOrderAsc(questionBank);
        List<Question> servedQuestions = resolveEffectiveQuestions(exercise, allBankQuestions);

        List<Long> servedQuestionIds = servedQuestions.stream()
                .map(q -> q.getQuestionId().longValue())
                .collect(Collectors.toList());

        unansweredCount += Math.max(0, servedQuestions.size() - responses.size());

        List<QuestionResponseDTO.DetailedQuestionResponse> detailedResponses = responses.stream()
                .map(r -> toDetailedResponseFromStored(r.getQuestion(), r))
                .collect(Collectors.toList());

        int totalAttemptedQuestions = correctCount + incorrectCount + pendingReviewCount;
        return toAttemptResponseDto(attempt, correctCount, incorrectCount,
                totalAttemptedQuestions, unansweredCount, pendingReviewCount, detailedResponses,
                servedQuestionIds);
    }

    @Transactional(readOnly = true)
    public List<ExerciseAttemptDTO.ExerciseAttemptSummaryResponse> getExerciseAttemptsByExerciseId(
            Integer exerciseId, Long userId) {

        if (!exerciseRepository.existsById(exerciseId)) {
            throw new ResourceNotFoundException("Exercise not found with id: " + exerciseId);
        }
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }

        return exerciseAttemptRepository
                .findByUserIdAndExerciseExerciseIdOrderByAttemptNumberDesc(userId, exerciseId)
                .stream()
                .map(this::toAttemptSummaryResponseDto)
                .collect(Collectors.toList());
    }

    // =========================================================================
    // Private — Ownership Guard
    // =========================================================================

    private ExerciseAttempt findAttemptAndVerifyOwnership(Long attemptId, Long authenticatedUserId) {
        ExerciseAttempt attempt = exerciseAttemptRepository.findByAttemptId(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Attempt not found with id: " + attemptId));

        if (!attempt.getUser().getId().equals(authenticatedUserId)) {
            throw new ResourceNotFoundException(
                    "Attempt not found with id: " + attemptId);
        }
        return attempt;
    }

    // =========================================================================
    // Private — Answer Type Validation
    // =========================================================================

    /**
     * Validates that the answer type in the request matches the question type.
     *
     * MCQ        → must use selectedOptionId
     * TRUE_FALSE → must use selectedOptionId
     * MULTIPLE_CORRECT → must use selectedOptionIds
     * ONE_WORD   → must use textResponse
     */
    private void validateAnswerTypeMatchesQuestionType(
            QuestionResponseDTO.CompleteAttemptRequest request,
            Question question) {

        QuestionType type = question.getQuestionType();
        if (type == null) return;

        switch (type) {
            case MCQ, TRUE_FALSE -> {
                if (request.getSelectedOptionId() == null
                        && request.getTextResponse() == null
                        && (request.getSelectedOptionIds() == null || request.getSelectedOptionIds().isEmpty())) {
                    return; // marking for review without answer — allowed
                }
                if (request.getSelectedOptionIds() != null && !request.getSelectedOptionIds().isEmpty()) {
                    throw new InvalidInputException(
                            "Question ID " + question.getQuestionId() + " is " + type +
                            " — use selectedOptionId (single option), not selectedOptionIds.");
                }
                if (request.getTextResponse() != null && !request.getTextResponse().isBlank()) {
                    throw new InvalidInputException(
                            "Question ID " + question.getQuestionId() + " is " + type +
                            " — use selectedOptionId, not textResponse.");
                }
            }
            case MULTIPLE_CORRECT -> {
                if (request.getSelectedOptionId() != null) {
                    throw new InvalidInputException(
                            "Question ID " + question.getQuestionId() + " is MULTIPLE_CORRECT " +
                            "— use selectedOptionIds (list), not selectedOptionId.");
                }
                if (request.getTextResponse() != null && !request.getTextResponse().isBlank()) {
                    throw new InvalidInputException(
                            "Question ID " + question.getQuestionId() + " is MULTIPLE_CORRECT " +
                            "— use selectedOptionIds, not textResponse.");
                }
            }
            case ONE_WORD -> {
                if (request.getSelectedOptionId() != null) {
                    throw new InvalidInputException(
                            "Question ID " + question.getQuestionId() + " is ONE_WORD " +
                            "— use textResponse, not selectedOptionId.");
                }
                if (request.getSelectedOptionIds() != null && !request.getSelectedOptionIds().isEmpty()) {
                    throw new InvalidInputException(
                            "Question ID " + question.getQuestionId() + " is ONE_WORD " +
                            "— use textResponse, not selectedOptionIds.");
                }
            }
            case MIXED -> {
                // MIXED type can contain any question type - validation handled at question level
            }
        }
    }

    // =========================================================================
    // Private — Evaluation Logic
    // =========================================================================

    /**
     * Evaluates a single saved QuestionResponse.
     *
     * MCQ        → single selected option check
     * TRUE_FALSE → single selected option check
     * MULTIPLE_CORRECT → exact set match
     * ONE_WORD   → compare text against correct option text (case-insensitive)
     */
    private EvaluationResult evaluate(
            QuestionResponse response, Question question, BigDecimal questionPoints) {

        QuestionType type = question.getQuestionType();
        if (type == null) {
            logger.warn("Question ID {} has no type set — treating as unanswered", question.getQuestionId());
            return EvaluationResult.unanswered();
        }

        return switch (type) {
            case MULTIPLE_CORRECT -> evaluateMultipleCorrect(response, question, questionPoints);
            case ONE_WORD         -> evaluateOneWord(response, question, questionPoints);
            case MCQ, TRUE_FALSE  -> evaluateSingleOption(response, questionPoints);
            case MIXED            -> throw new IllegalStateException(
                    "Question ID " + question.getQuestionId() + " has questionType=MIXED, " +
                    "which is a bank-level type and cannot be evaluated as an individual question.");
        };
    }

    /** MCQ / TRUE_FALSE: single selected option check. */
    private EvaluationResult evaluateSingleOption(QuestionResponse response, BigDecimal questionPoints) {
        QuestionOptions selectedOption = response.getSelectedOption();
        if (selectedOption == null) {
            return EvaluationResult.unanswered();
        }
        return Boolean.TRUE.equals(selectedOption.getIsCorrect())
                ? EvaluationResult.correct(questionPoints)
                : EvaluationResult.incorrect();
    }

    /**
     * MULTIPLE_CORRECT: full marks only when the student's selected set exactly
     * matches the set of all correct options. No partial credit.
     */
    private EvaluationResult evaluateMultipleCorrect(
            QuestionResponse response, Question question, BigDecimal questionPoints) {

        Set<Long> selectedIds = parseSelectedOptionIds(response.getSelectedOptionIds());
        if (selectedIds.isEmpty()) {
            return EvaluationResult.unanswered();
        }

        Set<Long> correctIds = question.getOptions() == null
                ? Collections.emptySet()
                : question.getOptions().stream()
                        .filter(opt -> Boolean.TRUE.equals(opt.getIsCorrect()))
                        .map(QuestionOptions::getOptionId)
                        .collect(Collectors.toSet());

        if (correctIds.isEmpty()) {
            logger.warn("Question ID {} (MULTIPLE_CORRECT) has no correct options configured",
                    question.getQuestionId());
            return EvaluationResult.incorrect();
        }

        return selectedIds.equals(correctIds)
                ? EvaluationResult.correct(questionPoints)
                : EvaluationResult.incorrect();
    }

    /**
     * ONE_WORD grading.
     *
     * The correct answer is read from the option with isCorrect=true
     * (consistent with how ONE_WORD questions are uploaded —
     * a single option whose optionText is the expected answer).
     *
     * Fallback: if no correct option exists, checks question.getCorrectAnswer().
     * If neither is configured, routes to pendingReview for instructor grading.
     */
    private EvaluationResult evaluateOneWord(
            QuestionResponse response, Question question, BigDecimal questionPoints) {

        boolean hasText = response.getTextResponse() != null
                && !response.getTextResponse().isBlank();

        if (!hasText) {
            return EvaluationResult.unanswered();
        }

        // Primary: get correct answer from the correct option's text
        String correctAnswer = null;
        if (question.getOptions() != null) {
            correctAnswer = question.getOptions().stream()
                    .filter(opt -> Boolean.TRUE.equals(opt.getIsCorrect()))
                    .map(QuestionOptions::getOptionText)
                    .findFirst()
                    .orElse(null);
        }

        // Fallback: use correctAnswer field if option-based answer not found
        if (correctAnswer == null || correctAnswer.isBlank()) {
            correctAnswer = question.getCorrectAnswer();
        }

        if (correctAnswer != null && !correctAnswer.isBlank()) {
            // Normalize both answers: remove ALL whitespace and convert to lowercase
            String normalizedStudentAnswer = response.getTextResponse()
                    .replaceAll("\\s+", "")
                    .toLowerCase();
            String normalizedCorrectAnswer = correctAnswer
                    .replaceAll("\\s+", "")
                    .toLowerCase();
            
            boolean matched = normalizedStudentAnswer.equals(normalizedCorrectAnswer);
            return matched
                    ? EvaluationResult.correct(questionPoints)
                    : EvaluationResult.incorrect();
        }

        // No correct answer configured — route to manual instructor review
        logger.debug("Question ID {} (ONE_WORD) has no correct answer configured — routing to pendingReview",
                question.getQuestionId());
        return EvaluationResult.pendingReview();
    }

    // =========================================================================
    // Private — Upsert Helpers
    // =========================================================================

    private QuestionResponse findOrCreateResponse(ExerciseAttempt attempt, Question question) {
        return questionResponseRepository
                .findByAttemptAttemptIdAndQuestionQuestionId(
                        attempt.getAttemptId(), question.getQuestionId())
                .orElseGet(() -> {
                    QuestionResponse r = new QuestionResponse();
                    r.setAttempt(attempt);
                    r.setQuestion(question);
                    return r;
                });
    }

    /**
     * Applies the raw answer from the request onto a response entity.
     * All previous answer fields are cleared first to prevent stale data.
     *
     * MCQ / TRUE_FALSE  → selectedOptionId
     * MULTIPLE_CORRECT  → selectedOptionIds (list)
     * ONE_WORD          → textResponse
     */
    private void applyAnswerToResponse(
            QuestionResponse response,
            QuestionResponseDTO.CompleteAttemptRequest request,
            Question question) {

        int answerTypesProvided =
                (request.getSelectedOptionId()  != null ? 1 : 0)
              + (request.getSelectedOptionIds() != null && !request.getSelectedOptionIds().isEmpty() ? 1 : 0)
              + (request.getTextResponse()      != null && !request.getTextResponse().isBlank() ? 1 : 0);

        if (answerTypesProvided > 1) {
            throw new InvalidInputException(
                    "Only one answer type may be submitted per question. "
                    + "Provide selectedOptionId (MCQ / TRUE_FALSE), "
                    + "selectedOptionIds (MULTIPLE_CORRECT), "
                    + "or textResponse (ONE_WORD) — not a combination.");
        }

        // Clear all previous answer fields
        response.setSelectedOption(null);
        response.setSelectedOptionIds(null);
        response.setTextResponse(null);
        response.setIsCorrect(null);
        response.setPointsAwarded(null);

        // MCQ / TRUE_FALSE — single option
        if (request.getSelectedOptionId() != null) {
            QuestionOptions option = questionOptionsRepository
                    .findByOptionIdAndQuestionId(request.getSelectedOptionId(), question.getQuestionId())
                    .orElseThrow(() -> new InvalidInputException(
                            "Option ID " + request.getSelectedOptionId()
                            + " does not belong to question ID " + question.getQuestionId()));
            response.setSelectedOption(option);
        }

        // MULTIPLE_CORRECT — validate all supplied IDs in one DB round-trip
        if (request.getSelectedOptionIds() != null && !request.getSelectedOptionIds().isEmpty()) {
            List<Long> requestedIds = request.getSelectedOptionIds();
            List<Long> validIds = questionOptionsRepository.findValidOptionIds(
                    requestedIds, question.getQuestionId());

            if (validIds.size() != requestedIds.stream().distinct().count()) {
                Set<Long> validSet = new HashSet<>(validIds);
                List<Long> invalidIds = requestedIds.stream()
                        .distinct()
                        .filter(id -> !validSet.contains(id))
                        .collect(Collectors.toList());
                throw new InvalidInputException(
                        "Option ID(s) " + invalidIds
                        + " do not belong to question ID " + question.getQuestionId());
            }

            // Deduplicate before serialisation
            String csv = requestedIds.stream()
                    .distinct()
                    .map(String::valueOf)
                    .collect(Collectors.joining(","));
            response.setSelectedOptionIds(csv);
        }

        // ONE_WORD — text response
        if (request.getTextResponse() != null && !request.getTextResponse().isBlank()) {
            response.setTextResponse(request.getTextResponse().trim());
        }

        response.setResponseTimeSeconds(request.getResponseTimeSeconds());
        response.setMarkedForReview(Boolean.TRUE.equals(request.getMarkedForReview()));
    }

    // =========================================================================
    // Private — Progress Panel Builder
    // =========================================================================

    private StudentTestDTO.AttemptProgressResponse buildProgressResponse(ExerciseAttempt attempt) {
        QuestionBank questionBank = requireQuestionBank(attempt.getExercise());
        Exercise exercise = attempt.getExercise();
        
        // Get ALL questions from the bank first
        List<Question> allQuestions =
                questionRepository.findByQuestionBankOrderByQuestionOrderAsc(questionBank);

        List<Question> presentedQuestions = resolveEffectiveQuestions(exercise, allQuestions);

        List<QuestionResponse> savedResponses =
                questionResponseRepository.findByAttemptAttemptId(attempt.getAttemptId());

        Map<Long, QuestionResponse> responseByQuestionId = savedResponses.stream()
                .collect(Collectors.toMap(
                        r -> r.getQuestion().getQuestionId(), Function.identity()));

        int answeredCount = 0, markedCount = 0, answeredAndMarkedCount = 0, notAttemptedCount = 0;
        List<StudentTestDTO.QuestionStatus> statuses = new ArrayList<>();

        for (Question q : presentedQuestions) {
            QuestionResponse r = responseByQuestionId.get(q.getQuestionId());
            StudentTestDTO.QuestionStatusType status = resolveStatus(r);

            statuses.add(StudentTestDTO.QuestionStatus.builder()
                    .questionId(q.getQuestionId())
                    .questionOrder(q.getQuestionOrder())
                    .status(status)
                    .build());

            switch (status) {
                case ANSWERED            -> answeredCount++;
                case MARKED_FOR_REVIEW   -> markedCount++;
                case ANSWERED_AND_MARKED -> answeredAndMarkedCount++;
                case NOT_ATTEMPTED       -> notAttemptedCount++;
            }
        }

        return StudentTestDTO.AttemptProgressResponse.builder()
                .attemptId(attempt.getAttemptId())
                .totalQuestions(presentedQuestions.size())
                .answeredCount(answeredCount)
                .markedForReviewCount(markedCount)
                .answeredAndMarkedCount(answeredAndMarkedCount)
                .notAttemptedCount(notAttemptedCount)
                .questionStatuses(statuses)
                .build();
    }

    private StudentTestDTO.QuestionStatusType resolveStatus(QuestionResponse response) {
        if (response == null) {
            return StudentTestDTO.QuestionStatusType.NOT_ATTEMPTED;
        }

        boolean hasAnswer = hasAnswer(response);
        boolean flagged   = response.isMarkedForReview();

        if (hasAnswer && flagged)  return StudentTestDTO.QuestionStatusType.ANSWERED_AND_MARKED;
        if (hasAnswer)             return StudentTestDTO.QuestionStatusType.ANSWERED;
        if (flagged)               return StudentTestDTO.QuestionStatusType.MARKED_FOR_REVIEW;
        return StudentTestDTO.QuestionStatusType.NOT_ATTEMPTED;
    }

    private boolean hasAnswer(QuestionResponse response) {
        return response.getSelectedOption() != null
                || (response.getSelectedOptionIds() != null
                    && !response.getSelectedOptionIds().isBlank())
                || (response.getTextResponse() != null
                    && !response.getTextResponse().isBlank());
    }

    // =========================================================================
    // Private — DTO Conversion Helpers
    // =========================================================================

    private StudentTestDTO.StudentQuestion toStudentQuestion(Question question) {
        List<StudentTestDTO.StudentOption> options = question.getOptions() == null
                ? List.of()
                : question.getOptions().stream()
                        .map(opt -> StudentTestDTO.StudentOption.builder()
                                .optionId(opt.getOptionId())
                                .optionText(opt.getOptionText())
                                .optionOrder(opt.getOptionOrder())
                                .build())
                        .collect(Collectors.toList());

        return StudentTestDTO.StudentQuestion.builder()
                .questionId(question.getQuestionId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .points(question.getPoints())
                .difficultyLevel(question.getDifficultyLevel())
                .mediaUrl(question.getMediaUrl())
                .questionOrder(question.getQuestionOrder())
                .options(options)
                .build();
    }

    private List<QuestionResponseDTO.QuestionOptionDetail> buildOptionDetails(Question question) {
        if (question.getOptions() == null) return List.of();
        return question.getOptions().stream()
                .map(opt -> new QuestionResponseDTO.QuestionOptionDetail(
                        opt.getOptionId(),
                        opt.getOptionText(),
                        opt.getIsCorrect(),
                        opt.getExplanation(),
                        opt.getOptionOrder()))
                .collect(Collectors.toList());
    }

    /**
     * Resolves the correct answer string for ONE_WORD questions.
     * Primary source: option with isCorrect=true → optionText
     * Fallback: question.getCorrectAnswer() field
     */
    private String resolveOneWordCorrectAnswer(Question question) {
        if (question.getQuestionType() != QuestionType.ONE_WORD) return null;

        if (question.getOptions() != null) {
            String fromOption = question.getOptions().stream()
                    .filter(opt -> Boolean.TRUE.equals(opt.getIsCorrect()))
                    .map(QuestionOptions::getOptionText)
                    .findFirst()
                    .orElse(null);
            if (fromOption != null && !fromOption.isBlank()) return fromOption;
        }

        return question.getCorrectAnswer();
    }

    /** Used after evaluation (during complete) where result is freshly computed. */
    private QuestionResponseDTO.DetailedQuestionResponse toDetailedResponse(
            Question question, QuestionResponse response, EvaluationResult result) {

        return new QuestionResponseDTO.DetailedQuestionResponse(
                question.getQuestionId(),
                question.getQuestionText(),
                question.getExplanation(),
                question.getQuestionType(),
                question.getPoints(),
                question.getDifficultyLevel(),
                question.getMediaUrl(),
                buildOptionDetails(question),
                response.getSelectedOption() != null ? response.getSelectedOption().getOptionId() : null,
                response.getTextResponse(),
                result.isCorrect(),
                result.pointsAwarded(),
                response.getResponseTimeSeconds(),
                findFirstCorrectOptionId(question),
                findFirstCorrectExplanation(question),
                findAllCorrectOptionIds(question),
                resolveOneWordCorrectAnswer(question)
        );
    }

    /** Used when reading a stored attempt — correctness is read from persisted fields. */
    private QuestionResponseDTO.DetailedQuestionResponse toDetailedResponseFromStored(
            Question question, QuestionResponse response) {

        return new QuestionResponseDTO.DetailedQuestionResponse(
                question.getQuestionId(),
                question.getQuestionText(),
                question.getExplanation(),
                question.getQuestionType(),
                question.getPoints(),
                question.getDifficultyLevel(),
                question.getMediaUrl(),
                buildOptionDetails(question),
                response.getSelectedOption() != null ? response.getSelectedOption().getOptionId() : null,
                response.getTextResponse(),
                response.getIsCorrect(),
                response.getPointsAwarded(),
                response.getResponseTimeSeconds(),
                findFirstCorrectOptionId(question),
                findFirstCorrectExplanation(question),
                findAllCorrectOptionIds(question),
                resolveOneWordCorrectAnswer(question)
        );
    }

    private Long findFirstCorrectOptionId(Question question) {
        if (question.getOptions() == null) return null;
        return question.getOptions().stream()
                .filter(opt -> Boolean.TRUE.equals(opt.getIsCorrect()))
                .map(QuestionOptions::getOptionId)
                .findFirst()
                .orElse(null);
    }

    private String findFirstCorrectExplanation(Question question) {
        if (question.getOptions() == null) return null;
        return question.getOptions().stream()
                .filter(opt -> Boolean.TRUE.equals(opt.getIsCorrect()))
                .map(QuestionOptions::getExplanation)
                .findFirst()
                .orElse(null);
    }

    private List<Long> findAllCorrectOptionIds(Question question) {
        if (question.getOptions() == null) return List.of();
        return question.getOptions().stream()
                .filter(opt -> Boolean.TRUE.equals(opt.getIsCorrect()))
                .map(QuestionOptions::getOptionId)
                .collect(Collectors.toList());
    }

    private ExerciseDTO.Response toExerciseResponseDto(Exercise exercise) {
        ExerciseDTO.Response dto = new ExerciseDTO.Response();
        dto.setExerciseId(exercise.getExerciseId());
        dto.setTitle(exercise.getTitle());
        dto.setDescription(exercise.getDescription());
        dto.setInstructions(exercise.getInstructions());
        dto.setExerciseType(exercise.getExerciseType());
        dto.setTimeLimitMinutes(exercise.getTimeLimitMinutes());
        dto.setPassingPercentage(exercise.getPassingPercentage());
        dto.setMaxAttempts(exercise.getMaxAttempts());
        dto.setRandomizeQuestions(exercise.getRandomizeQuestions());
        dto.setNumQuestions(exercise.getNumQuestions());

        if (exercise.getQuestionBank() != null) {
            ExerciseDTO.QuestionBankInfo qbInfo = new ExerciseDTO.QuestionBankInfo();
            qbInfo.setQuestionBankId(exercise.getQuestionBank().getQuestionBankId());
            qbInfo.setName(exercise.getQuestionBank().getName());
            qbInfo.setQuestionsType(exercise.getQuestionBank().getQuestionsType());
            qbInfo.setDifficultyLevel(exercise.getQuestionBank().getDifficultyLevel());
            dto.setQuestionBank(qbInfo);
        }
        return dto;
    }

    private ExerciseDTO.SummaryResponse toExerciseSummaryDto(Exercise exercise) {
        ExerciseDTO.SummaryResponse dto = new ExerciseDTO.SummaryResponse();
        dto.setExerciseId(exercise.getExerciseId());
        dto.setTitle(exercise.getTitle());
        dto.setDescription(exercise.getDescription());
        dto.setExerciseType(exercise.getExerciseType());
        return dto;
    }

    private ExerciseAttemptDTO.ExerciseAttemptResponse toAttemptResponseDto(
            ExerciseAttempt attempt,
            int correctAnswers,
            int incorrectAnswers,
            int totalAttemptedQuestions,
            int unansweredQuestions,
            int pendingReviewCount,
            List<QuestionResponseDTO.DetailedQuestionResponse> questionsResponse,
            List<Long> servedQuestionIds) {

        if (attempt.getAttemptNumber() == null) {
            logger.warn("Attempt ID {} has a null attemptNumber — data integrity anomaly",
                    attempt.getAttemptId());
        }

        return new ExerciseAttemptDTO.ExerciseAttemptResponse(
                attempt.getAttemptId(),
                attempt.getUser().getId(),
                attempt.getExercise().getExerciseId().longValue(),
                attempt.getContentItem().getItemId(),
                attempt.getScore(),
                attempt.getMaxScore(),
                attempt.getPercentage(),
                attempt.getPassed(),
                attempt.getStartedAt(),
                attempt.getCompletedAt(),
                attempt.getTimeSpentSeconds(),
                attempt.getAttemptNumber() != null ? attempt.getAttemptNumber().intValue() : 1,
                questionsResponse,
                resolveUsername(attempt.getUser()),
                totalAttemptedQuestions,
                correctAnswers,
                incorrectAnswers,
                unansweredQuestions,
                pendingReviewCount,
                servedQuestionIds
        );
    }

    private ExerciseAttemptDTO.ExerciseAttemptSummaryResponse toAttemptSummaryResponseDto(
            ExerciseAttempt attempt) {

        if (attempt.getAttemptNumber() == null) {
            logger.warn("Attempt ID {} has a null attemptNumber — data integrity anomaly",
                    attempt.getAttemptId());
        }

        ExerciseAttemptDTO.ExerciseAttemptSummaryResponse dto =
                new ExerciseAttemptDTO.ExerciseAttemptSummaryResponse();
        dto.setAttemptId(attempt.getAttemptId());
        dto.setUserId(attempt.getUser().getId());
        dto.setExerciseId(attempt.getExercise().getExerciseId().longValue());
        dto.setContentItemId(attempt.getContentItem().getItemId());
        dto.setScore(attempt.getScore());
        dto.setMaxScore(attempt.getMaxScore());
        dto.setPercentage(attempt.getPercentage());
        dto.setPassed(attempt.getPassed());
        dto.setStartedAt(attempt.getStartedAt());
        dto.setCompletedAt(attempt.getCompletedAt());
        dto.setTimeSpentSeconds(attempt.getTimeSpentSeconds());
        dto.setAttemptNumber(attempt.getAttemptNumber() != null
                ? attempt.getAttemptNumber().intValue() : 1);
        return dto;
    }

    private String resolveUsername(Users user) {
        try {
            return profileRepository.findByUserId(user.getId())
                    .map(Profiles::getName)
                    .filter(name -> name != null && !name.isBlank())
                    .orElse(user.getEmail());
        } catch (DataAccessException e) {
            logger.warn("Could not resolve username for user ID: {} — falling back to email",
                    user.getId(), e);
            return user.getEmail();
        }
    }

    // =========================================================================
    // Private — Utility Helpers
    // =========================================================================

    /**
     * Returns the exact question list that was (or will be) presented to the student
     * for a given exercise. Applies shuffle (seeded by exerciseId) then numQuestions slice,
     * in the same order as getQuestionsForExercise. Use this as the single source of truth
     * whenever effective question set matters (scoring, progress, grading).
     */
    private List<Question> resolveEffectiveQuestions(Exercise exercise, List<Question> allQuestions) {
        List<Question> questions = new ArrayList<>(allQuestions);

        if (Boolean.TRUE.equals(exercise.getRandomizeQuestions())) {
            long seed = exercise.getExerciseId();
            Random random = new Random(seed);
            for (int i = questions.size() - 1; i > 0; i--) {
                int index = random.nextInt(i + 1);
                Question temp = questions.get(i);
                questions.set(i, questions.get(index));
                questions.set(index, temp);
            }
        }

        Integer numQuestions = exercise.getNumQuestions();
        if (numQuestions != null && numQuestions > 0 && questions.size() > numQuestions) {
            questions = questions.subList(0, numQuestions);
        }

        return questions;
    }

    private QuestionBank requireQuestionBank(Exercise exercise) {
        QuestionBank qb = exercise.getQuestionBank();
        if (qb == null) {
            throw new ResourceNotFoundException(
                    "No question bank is linked to exercise ID: " + exercise.getExerciseId());
        }
        return qb;
    }

    private Set<Long> parseSelectedOptionIds(String csv) {
        if (csv == null || csv.isBlank()) return Collections.emptySet();
        try {
            return Arrays.stream(csv.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Long::parseLong)
                    .collect(Collectors.toSet());
        } catch (NumberFormatException ex) {
            throw new InvalidInputException(
                    "Stored selected_option_ids contains non-numeric data: \"" + csv + "\"");
        }
    }

    private BigDecimal toPoints(Question question) {
        return question.getPoints() != null
                ? BigDecimal.valueOf(question.getPoints())
                : BigDecimal.ZERO;
    }

    // =========================================================================
    // Private — Evaluation Result Record
    // =========================================================================

    private record EvaluationResult(
            Boolean isCorrect,
            BigDecimal pointsAwarded,
            boolean isPendingReview,
            boolean isUnanswered) {

        static EvaluationResult correct(BigDecimal points) {
            return new EvaluationResult(true, points, false, false);
        }

        static EvaluationResult incorrect() {
            return new EvaluationResult(false, BigDecimal.ZERO, false, false);
        }

        static EvaluationResult pendingReview() {
            return new EvaluationResult(null, BigDecimal.ZERO, true, false);
        }

        static EvaluationResult unanswered() {
            return new EvaluationResult(null, BigDecimal.ZERO, false, true);
        }
    }
}