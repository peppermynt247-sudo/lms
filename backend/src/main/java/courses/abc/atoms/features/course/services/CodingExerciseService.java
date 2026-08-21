package courses.abc.atoms.features.course.services;

import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.features.course.dto.CodingExerciseDTO;
import courses.abc.atoms.features.course.dto.CodingTestCaseDTO;
import courses.abc.atoms.features.course.model.CodingExercise;
import courses.abc.atoms.features.course.model.CodingTestCase;
import courses.abc.atoms.features.course.model.ContentItem;
import courses.abc.atoms.features.course.model.CurriculumSection;
import courses.abc.atoms.features.course.enums.ContentType;
import courses.abc.atoms.features.course.repositories.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Set;
    
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CodingExerciseService {

    @Autowired
    private CodingExerciseRepository codingExerciseRepository;

    @Autowired
    private CurriculumSectionsRepository curriculumSectionRepository;

    @Autowired
    private ContentItemRepository contentItemRepository;

    @Autowired
    private CodingTestCaseRepository codingTestCaseRepository;

    @Autowired
    private CodeSubmissionRepository codeSubmissionRepository;

    /**
     * Handles creation of test cases for a coding exercise (for create).
     */
    private List<CodingTestCaseDTO.Response> handleTestCases(
            CodingExercise codingExercise,
            List<CodingTestCaseDTO.CreateRequest> testCaseRequests
    ) {
        if (testCaseRequests != null && !testCaseRequests.isEmpty()) {
            List<CodingTestCase> testCasesToSave = testCaseRequests.stream().map(tcReq -> {
                CodingTestCase testCase = new CodingTestCase();
                testCase.setCodingExercise(codingExercise);
                testCase.setInput(tcReq.getInput());
                testCase.setExpectedOutput(tcReq.getExpectedOutput());
                testCase.setExplanation(tcReq.getExplanation());
                testCase.setIsHidden(tcReq.getIsHidden());
                testCase.setTestOrder(tcReq.getTestOrder());
                return testCase;
            }).collect(Collectors.toList());
            List<CodingTestCase> savedTestCases = codingTestCaseRepository.saveAll(testCasesToSave);
            return savedTestCases.stream().map(this::mapToTestCaseResponse).collect(Collectors.toList());
        }
        return Collections.emptyList();
    }

    /**
     * Handles update/delete/add of test cases for a coding exercise (for update).
     */
    private List<CodingTestCaseDTO.Response> handleTestCases(
            CodingExercise codingExercise,
            List<CodingTestCaseDTO.UpdateRequest> testCaseRequests,
            boolean isUpdate
    ) {
        List<CodingTestCaseDTO.Response> testCaseResponses = Collections.emptyList();
        Long codingExerciseId = codingExercise.getCodingExerciseId() != null ? Long.valueOf(codingExercise.getCodingExerciseId()) : null;
        List<CodingTestCase> existingTestCases = codingTestCaseRepository.findByCodingExercise_CodingExerciseId(codingExerciseId);
        Map<Integer, CodingTestCase> existingTestCaseMap = existingTestCases.stream()
                .collect(Collectors.toMap(CodingTestCase::getTestCaseId, tc -> tc));

        if (testCaseRequests != null && !testCaseRequests.isEmpty()) {
            Set<Integer> requestTestCaseIds = testCaseRequests.stream()
                    .filter(tc -> tc.getTestCaseId() != null)
                    .map(CodingTestCaseDTO.UpdateRequest::getTestCaseId)
                    .collect(Collectors.toSet());

            // Delete test cases not in the request
            List<CodingTestCase> testCasesToDelete = existingTestCases.stream()
                    .filter(tc -> !requestTestCaseIds.contains(tc.getTestCaseId()))
                    .collect(Collectors.toList());
            if (!testCasesToDelete.isEmpty()) {
                codingTestCaseRepository.deleteAll(testCasesToDelete);
            }

            // Update or add test cases
            List<CodingTestCase> testCasesToSave = testCaseRequests.stream().map(tcReq -> {
                CodingTestCase testCase;
                Integer testCaseId = tcReq.getTestCaseId();
                if (testCaseId != null && existingTestCaseMap.containsKey(testCaseId)) {
                    // Update existing test case
                    testCase = existingTestCaseMap.get(testCaseId);
                } else {
                    // New test case
                    testCase = new CodingTestCase();
                    testCase.setCodingExercise(codingExercise);
                }
                testCase.setInput(tcReq.getInput());
                testCase.setExpectedOutput(tcReq.getExpectedOutput());
                testCase.setExplanation(tcReq.getExplanation());
                testCase.setIsHidden(tcReq.getIsHidden());
                testCase.setTestOrder(tcReq.getTestOrder());
                return testCase;
            }).collect(Collectors.toList());

            List<CodingTestCase> savedTestCases = codingTestCaseRepository.saveAll(testCasesToSave);
            testCaseResponses = savedTestCases.stream()
                    .map(this::mapToTestCaseResponse)
                    .collect(Collectors.toList());
        } else if (isUpdate) {
            // If no test cases provided in update request, delete all existing test cases
            if (!existingTestCases.isEmpty()) {
                codingTestCaseRepository.deleteAll(existingTestCases);
            }
        }
        return testCaseResponses;
    }

    @Transactional
    @CacheEvict(value = "content-items", key = "'section-' + #curriculumSectionId")
    public CodingExerciseDTO.Response createCodingExercise(Integer curriculumSectionId, CodingExerciseDTO.CreateRequest request) {
        // Check for duplicate title
        if (codingExerciseRepository.existsByTitle(request.getTitle())) {
            throw new IllegalArgumentException("A coding exercise with the same title already exists.");
        }

        // Find the curriculum section
        CurriculumSection curriculumSection = curriculumSectionRepository.findBySectionId(curriculumSectionId)
                .orElseThrow(() -> new EntityNotFoundException("CurriculumSection not found with id: " + curriculumSectionId));

        // Create and populate CodingExercise entity
        CodingExercise codingExercise = new CodingExercise();
        codingExercise.setTitle(request.getTitle());
        codingExercise.setCodingQuestion(request.getCodingQuestion());
        codingExercise.setDescription(request.getDescription());
        codingExercise.setInstructions(request.getInstructions());
        codingExercise.setDifficultyLevel(request.getDifficultyLevel());
        codingExercise.setStarterCode(request.getStarterCode());
        codingExercise.setSolutionCode(request.getSolutionCode());
        codingExercise.setTimeLimitMinutes(request.getTimeLimitMinutes());
        codingExercise.setMaxAttempts(request.getMaxAttempts());
        codingExercise.setSupportedLanguages(request.getSupportedLanguages());
        // Set createdAt and updatedAt
        codingExercise.setCreatedAt(java.time.LocalDateTime.now());
        codingExercise.setUpdatedAt(java.time.LocalDateTime.now());

        // Save coding exercise
        CodingExercise savedCodingExercise = codingExerciseRepository.save(codingExercise);

        // Save test cases if provided (use helper)
        List<CodingTestCaseDTO.Response> testCaseResponses = handleTestCases(savedCodingExercise, request.getTestCases());

        // Create and populate ContentItem entity
        ContentItem contentItem = new ContentItem();
        contentItem.setSection(curriculumSection);
        contentItem.setContentType(ContentType.ELAB);
        contentItem.setContentReferenceId(savedCodingExercise.getCodingExerciseId());
        contentItem.setItemOrder(calculateItemOrder(curriculumSection));
        contentItem.setIsPublished(false);
        contentItem.setIsRequired(false);
        contentItem.setEstimatedMinutes(request.getTimeLimitMinutes());
        contentItem.setXpPoints(calculateXpPoints(request.getDifficultyLevel()));
        contentItem.setReleaseDate(null);
        contentItem.setPrerequisiteItem(null);

        // Save content item
        contentItemRepository.save(contentItem);

        // Map to response DTO
        CodingExerciseDTO.Response response = mapToResponse(savedCodingExercise);
        response.setTestCases(testCaseResponses);
        return response;
    }

    private Integer calculateItemOrder(CurriculumSection curriculumSection) {
        Integer maxOrder = contentItemRepository.findMaxItemOrderBySection(curriculumSection);
        if (maxOrder == null) maxOrder = 0;
        return maxOrder + 1;
    }

    private Integer calculateXpPoints(courses.abc.atoms.features.course.enums.DifficultyLevel difficultyLevel) {
        if (difficultyLevel == null) return 0;
        switch (difficultyLevel) {
            case EASY:
                return 10;
            case MEDIUM:
                return 20;
            case HARD:
                return 30;
            default:
                return 0;
        }
    }

    private CodingExerciseDTO.Response mapToResponse(CodingExercise codingExercise) {
        CodingExerciseDTO.Response response = new CodingExerciseDTO.Response();
        response.setCodingExerciseId(codingExercise.getCodingExerciseId());
        response.setTitle(codingExercise.getTitle());
        response.setCodingQuestion(codingExercise.getCodingQuestion());
        response.setDescription(codingExercise.getDescription());
        response.setInstructions(codingExercise.getInstructions());
        response.setDifficultyLevel(codingExercise.getDifficultyLevel());
        response.setStarterCode(codingExercise.getStarterCode());
        response.setSolutionCode(codingExercise.getSolutionCode());
        response.setTimeLimitMinutes(codingExercise.getTimeLimitMinutes());
        response.setMaxAttempts(codingExercise.getMaxAttempts());
        response.setSupportedLanguages(codingExercise.getSupportedLanguages());
        response.setCreatedAt(codingExercise.getCreatedAt());
        response.setUpdatedAt(codingExercise.getUpdatedAt());
        return response;
    }

    private CodingTestCaseDTO.Response mapToTestCaseResponse(CodingTestCase testCase) {
        CodingTestCaseDTO.Response response = new CodingTestCaseDTO.Response();
        response.setTestCaseId(testCase.getTestCaseId());
        response.setCodingExerciseId(testCase.getCodingExercise().getCodingExerciseId());
        response.setInput(testCase.getInput());
        response.setExpectedOutput(testCase.getExpectedOutput());
        response.setExplanation(testCase.getExplanation());
        response.setIsHidden(testCase.getIsHidden());
        response.setTestOrder(testCase.getTestOrder());
        return response;
    }

    public CodingExerciseDTO.Response getByCodingExerciseId(Long codingExerciseId, Users user) {
        // Fetch coding exercise by id
        CodingExercise codingExercise = codingExerciseRepository.findById(codingExerciseId)
                .orElseThrow(() -> new EntityNotFoundException("CodingExercise not found with id: " + codingExerciseId));

        // Calculate attempts for the given user
        long attemptsMade = codeSubmissionRepository.countByUserAndCodingExercise(user, codingExercise);
        Integer maxAttempts = codingExercise.getMaxAttempts();
        int remainingAttempts = (maxAttempts != null) ? (int) (maxAttempts - attemptsMade) : Integer.MAX_VALUE;

        // Fetch and map test cases
        List<CodingTestCase> testCases = codingTestCaseRepository.findByCodingExercise_CodingExerciseId(codingExerciseId);
        List<CodingTestCaseDTO.Response> testCaseResponses = testCases.stream()
                .map(this::mapToTestCaseResponse)
                .collect(Collectors.toList());

        // Map to response DTO
        CodingExerciseDTO.Response response = mapToResponse(codingExercise);
        response.setTestCases(testCaseResponses);

        // Populate the new attempt fields in the response
        response.setMaxAttempts(maxAttempts);
        response.setAttemptsMade((int) attemptsMade);
        response.setRemainingAttempts(Math.max(0, remainingAttempts));

        return response;
    }

    @Transactional
    public void deleteByCodingExerciseId(Long codingExerciseId) {
        // Fetch coding exercise by id
        CodingExercise codingExercise = codingExerciseRepository.findById(codingExerciseId)
                .orElseThrow(() -> new EntityNotFoundException("CodingExercise not found with id: " + codingExerciseId));

        // Delete all test cases for this coding exercise
        List<CodingTestCase> testCases = codingTestCaseRepository.findByCodingExercise_CodingExerciseId(codingExerciseId);
        codingTestCaseRepository.deleteAll(testCases);

        contentItemRepository
                .findByContentReferenceIdAndContentType(codingExerciseId.intValue(), ContentType.ELAB)
                .ifPresentOrElse(
                    contentItem -> {
                        log.info("Found and deleting associated ContentItem with ID: {}", contentItem.getItemId());
                        contentItemRepository.delete(contentItem);
                    },
                    () -> log.warn("No ContentItem found for exercise ID: {}. It might have been already removed.", codingExerciseId)
                );

        // Delete the coding exercise itself
        codingExerciseRepository.delete(codingExercise);
    }

@Transactional
public CodingExerciseDTO.Response updateCodingExercise(Long codingExerciseId, CodingExerciseDTO.UpdateRequest request) {
    // Fetch existing coding exercise
    CodingExercise codingExercise = codingExerciseRepository.findById(codingExerciseId)
            .orElseThrow(() -> new EntityNotFoundException("CodingExercise not found with id: " + codingExerciseId));

    // Update coding exercise fields
    codingExercise.setTitle(request.getTitle());
    codingExercise.setCodingQuestion(request.getCodingQuestion());
    codingExercise.setDescription(request.getDescription());
    codingExercise.setInstructions(request.getInstructions());
    codingExercise.setDifficultyLevel(request.getDifficultyLevel());
    codingExercise.setStarterCode(request.getStarterCode());
    codingExercise.setSolutionCode(request.getSolutionCode());
    codingExercise.setTimeLimitMinutes(request.getTimeLimitMinutes());
    codingExercise.setMaxAttempts(request.getMaxAttempts());
    codingExercise.setSupportedLanguages(request.getSupportedLanguages());
    codingExercise.setUpdatedAt(java.time.LocalDateTime.now());
    CodingExercise savedCodingExercise = codingExerciseRepository.save(codingExercise);

    // Handle test cases (use helper)
    List<CodingTestCaseDTO.Response> testCaseResponses = handleTestCases(savedCodingExercise, request.getTestCases(), true);

    // Return response with test cases
    CodingExerciseDTO.Response response = mapToResponse(savedCodingExercise);
    response.setTestCases(testCaseResponses);
    return response;
}
}