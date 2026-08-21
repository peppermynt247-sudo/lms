package courses.abc.atoms.features.course.services;

import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.services.UserService;
import courses.abc.atoms.features.course.dto.CodeSubmissionDTO;
import courses.abc.atoms.features.course.dto.CodingExerciseDTO;
import courses.abc.atoms.features.course.dto.CodingTestCaseDTO;
import courses.abc.atoms.features.course.dto.ContentProgressDTO;
import courses.abc.atoms.features.course.enums.ContentType;
import courses.abc.atoms.features.course.model.CodeSubmission;
import courses.abc.atoms.features.course.model.CodingExercise;
import courses.abc.atoms.features.course.model.ContentItem;
import courses.abc.atoms.features.course.repositories.CodingExerciseRepository;
import courses.abc.atoms.features.course.repositories.ContentItemRepository;
import courses.abc.atoms.features.course.repositories.CodeSubmissionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CodeSubmissionService {

    private final CodeSubmissionRepository codeSubmissionRepository;
    private final CodingExerciseRepository codingExerciseRepository;
    private final ContentItemRepository contentItemRepository;
    private final UserService userService;
    private final ContentProgressService contentProgressService;

    private static final Logger logger = LoggerFactory.getLogger(CodeSubmissionService.class);

    @Transactional
    public CodeSubmissionDTO.SubmissionResultResponse saveSubmission(
            CodingExerciseDTO.RunCodeRequestDTO request,
            List<CodingExerciseDTO.RunCodeResponseDTO> hiddenTestResults,
            Users user,
            List<CodingTestCaseDTO.Response> hiddenTestCases
    ) {
        CodingExercise exercise = codingExerciseRepository.findById(request.getCodingExerciseId().longValue())
                .orElseThrow(() -> new ResourceNotFoundException("CodingExercise not found"));

        ContentItem contentItem = contentItemRepository.findByContentReferenceIdAndContentType(exercise.getCodingExerciseId(), ContentType.ELAB)
                .orElseThrow(() -> new EntityNotFoundException("ContentItem for this exercise not found"));

        int maxAttempts = exercise.getMaxAttempts() != null ? exercise.getMaxAttempts() : Integer.MAX_VALUE;
        int lastAttemptNumber = codeSubmissionRepository.findTopByUserAndCodingExerciseOrderByAttemptNumberDesc(user, exercise)
                .map(CodeSubmission::getAttemptNumber)
                .orElse(0);
        int currentAttemptNumber = lastAttemptNumber + 1;
        if (currentAttemptNumber > maxAttempts) {
            throw new IllegalStateException("You have no attempts left for this exercise.");
        }

        int totalTestCases = hiddenTestResults.size();
        long passedTestCases = hiddenTestResults.stream().filter(r -> r.getStatusId() == 3).count();
        String finalStatus = determineFinalStatus(hiddenTestResults);

        final int MAX_SCORE = 10;
        BigDecimal score = BigDecimal.ZERO;
        if (totalTestCases > 0) {
            score = new BigDecimal(passedTestCases)
                    .divide(new BigDecimal(totalTestCases), 2, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal(MAX_SCORE));
        }

        CodeSubmission submission = CodeSubmission.builder()
                .user(user)
                .codingExercise(exercise)
                .contentItem(contentItem)
                .language(request.getLanguageId())
                .code(request.getSourceCode())
                .totalTestCases(totalTestCases)
                .passedTestCases((int) passedTestCases)
                .failedTestCases(totalTestCases - (int) passedTestCases)
                .status(finalStatus)
                .score(score)
                .maxScore(MAX_SCORE)
                .attemptNumber(currentAttemptNumber)
                .build();

        CodeSubmission savedSubmission = codeSubmissionRepository.save(submission);

        if ("Pass".equalsIgnoreCase(finalStatus)) {
            ContentProgressDTO.ContentProgressRequest progressRequest = new ContentProgressDTO.ContentProgressRequest(
                    user.getId(),
                    contentItem.getItemId(),
                    100L 
            );
            contentProgressService.saveContentProgress(progressRequest);
            logger.info("Content progress updated for user {} on content item {}", user.getId(), contentItem.getItemId());
        }

        int remainingAttempts = maxAttempts - savedSubmission.getAttemptNumber();

        return CodeSubmissionDTO.SubmissionResultResponse.builder()
                .submissionId(savedSubmission.getSubmissionId())
                .status(savedSubmission.getStatus())
                .score(savedSubmission.getScore())
                .maxScore(savedSubmission.getMaxScore())
                .totalTestCases(savedSubmission.getTotalTestCases())
                .passedTestCases(savedSubmission.getPassedTestCases())
                .failedTestCases(savedSubmission.getFailedTestCases())
                .remainingAttempts(Math.max(0, remainingAttempts))
                .submissionDetails(hiddenTestResults)
                .build();
    }

    // Gets a paginated list of all attempts for a given exercise by the user.
    @Transactional(readOnly = true)
    public Page<CodeSubmissionDTO.AttemptSummaryResponse> getAllAttemptsForExercise(Long exerciseId, Users user, Pageable pageable) {
        CodingExercise exercise = codingExerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("CodingExercise not found with id: " + exerciseId));

        Page<CodeSubmission> submissions = codeSubmissionRepository.findByUserAndCodingExerciseOrderByAttemptNumberDesc(user, exercise, pageable);

        return submissions.map(this::convertToSummaryDto);
    }

    //Gets the full details of a single submission attempt, ensuring the user owns it.
    @Transactional(readOnly = true)
    public CodeSubmissionDTO.AttemptDetailResponse getAttemptById(Long attemptId, Users currentUser) {
        CodeSubmission submission = codeSubmissionRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission attempt not found with id: " + attemptId));

        // Get the current user's roles using the existing UserService.
        List<String> userRoles = userService.getUserRolesByUserID(currentUser.getId());

        // Check if the user has a privileged role.
        boolean isPrivilegedUser = userRoles.contains("ADMIN") || userRoles.contains("INSTRUCTOR");

        // Check if the current user is the owner of the submission.
        boolean isOwner = submission.getUser().getId().equals(currentUser.getId());

        // Allow access only if the user is privileged OR is the owner.
        if (!isPrivilegedUser && !isOwner) {
            throw new SecurityException("Access denied. You do not have permission to view this submission.");
        }


        return convertToDetailDto(submission);
    }

    private CodeSubmissionDTO.AttemptSummaryResponse convertToSummaryDto(CodeSubmission submission) {
        return new CodeSubmissionDTO.AttemptSummaryResponse(
                submission.getSubmissionId(),
                submission.getAttemptNumber(),
                submission.getStatus(),
                submission.getScore(),
                submission.getMaxScore(),
                submission.getSubmittedAt()
        );
    }

    private CodeSubmissionDTO.AttemptDetailResponse convertToDetailDto(CodeSubmission submission) {
        return new CodeSubmissionDTO.AttemptDetailResponse(
                submission.getSubmissionId(),
                submission.getAttemptNumber(),
                submission.getStatus(),
                submission.getScore(),
                submission.getMaxScore(),
                submission.getSubmittedAt(),
                submission.getLanguage(),
                submission.getCode(),
                submission.getTotalTestCases(),
                submission.getPassedTestCases(),
                submission.getFailedTestCases()
        );
    }

    private String determineFinalStatus(List<CodingExerciseDTO.RunCodeResponseDTO> results) {
        if (results.isEmpty()) return "Error";
        if (results.stream().anyMatch(r -> r.getStatusId() == 6)) {
            return "Compilation Error";
        }
        if (results.stream().allMatch(r -> r.getStatusId() == 3)) {
            return "Pass";
        }
        return "Fail";
    }
}