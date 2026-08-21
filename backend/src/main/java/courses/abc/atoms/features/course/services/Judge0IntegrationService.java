package courses.abc.atoms.features.course.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import courses.abc.atoms.features.course.dto.CodingExerciseDTO;
import courses.abc.atoms.features.course.dto.CodingTestCaseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class Judge0IntegrationService {

    private static final Logger logger = LoggerFactory.getLogger(Judge0IntegrationService.class);
    private static final int MAX_BATCH_SIZE = 20; // Limit batch size for better performance
    private static final int REQUEST_TIMEOUT_SECONDS = 30;

    @Value("${judge0.api.url}")
    private String judge0ApiUrl;

    @Value("${judge0.api.key}")
    private String judge0ApiKey;

    @Value("${judge0.api.host:judge0-ce.p.rapidapi.com}")
    private String judge0ApiHost;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public Judge0IntegrationService(ObjectMapper objectMapper) {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(java.time.Duration.ofSeconds(10))
                .build();
        this.objectMapper = objectMapper;
    }

    public List<CodingExerciseDTO.RunCodeResponseDTO> runCodeBatch(String sourceCode, String languageId,
            List<CodingTestCaseDTO.Response> testCases) {
        // Enhanced validation
        if (testCases == null || testCases.isEmpty()) {
            throw new IllegalArgumentException("Test cases cannot be null or empty");
        }
        if (testCases.stream().allMatch(Objects::isNull)) {
            throw new IllegalArgumentException("Test cases contain only null entries");
        }
        if (sourceCode == null || sourceCode.trim().isEmpty()) {
            throw new IllegalArgumentException("Source code cannot be empty");
        }

        // Limit batch size for better performance
        if (testCases.size() > MAX_BATCH_SIZE) {
            logger.warn("Test case batch size {} exceeds maximum {}, processing first {} cases",
                    testCases.size(), MAX_BATCH_SIZE, MAX_BATCH_SIZE);
            testCases = testCases.subList(0, MAX_BATCH_SIZE);
        }

        logger.info("Processing {} test cases for language ID: {}", testCases.size(), languageId);

        int parsedLanguageId;
        try {
            parsedLanguageId = Integer.parseInt(languageId);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid language ID: " + languageId, e);
        }

        // Build submissions with better error handling
        List<Map<String, Object>> submissions = testCases.stream()
                .filter(Objects::nonNull)
                .map(testCase -> {
                    Map<String, Object> submission = new HashMap<>();
                    submission.put("source_code", sourceCode);
                    submission.put("language_id", parsedLanguageId);
                    submission.put("stdin", testCase.getInput() != null ? testCase.getInput() : "");
                    submission.put("expected_output",
                            testCase.getExpectedOutput() != null ? testCase.getExpectedOutput() : "");
                    return submission;
                })
                .collect(Collectors.toList());

        if (submissions.isEmpty()) {
            throw new RuntimeException("No valid test cases found after filtering");
        }

        logger.debug("Prepared {} submissions for execution", submissions.size());

        // Prepare request body as a Map
        Map<String, Object> batchRequest = new HashMap<>();
        batchRequest.put("submissions", submissions);

        // Serialize the request with error handling
        String jsonPayload;
        try {
            jsonPayload = objectMapper.writeValueAsString(batchRequest);
            logger.debug("Serialized JSON payload for {} submissions", submissions.size());
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize batch request", e);
            throw new RuntimeException("Failed to prepare request for Judge0 API", e);
        }

        // Prepare request with timeout
        String batchUrl = judge0ApiUrl + "/submissions/batch";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(batchUrl))
                .header("X-RapidAPI-Key", judge0ApiKey)
                .header("X-RapidAPI-Host", judge0ApiHost)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .timeout(java.time.Duration.ofSeconds(REQUEST_TIMEOUT_SECONDS))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response;
        try {
            logger.info("Sending batch submission request to Judge0: {}", batchUrl);
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            logger.error("Judge0 API error: {}", e.getMessage());
            throw new RuntimeException("Failed to create batch submission on Judge0", e);
        }

        if (response.body() == null) {
            throw new RuntimeException("Received empty response from Judge0 after submission");
        }

        // Convert the response body to the structure we need
        List<Map<String, String>> submissionTokens;
        logger.info("*********************response.body()*************************"+response.body());
        try {
            submissionTokens = objectMapper.readValue(response.body(), new TypeReference<List<Map<String, String>>>() {
            });
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse Judge0 response", e);
        }

        if (submissionTokens.size() != submissions.size()) {
            throw new RuntimeException("Mismatch between sent submissions (" + submissions.size()
                    + ") and received tokens (" + submissionTokens.size() + ")");
        }

        // Process results with improved error handling
        List<CodingExerciseDTO.RunCodeResponseDTO> results = new ArrayList<>();
        int tokenIndex = 0;
        for (CodingTestCaseDTO.Response testCase : testCases) {
            if (testCase != null) {
                String token = submissionTokens.get(tokenIndex).get("token");
                if (token == null) {
                    throw new RuntimeException("Received null token for test case ID: " + testCase.getTestCaseId());
                }
                results.add(pollSubmission(token, testCase.getTestCaseId()));
                tokenIndex++;
            }
        }

        logger.info("Successfully processed {} submissions", results.size());
        return results;
    }

    private CodingExerciseDTO.RunCodeResponseDTO pollSubmission(String token, Integer testCaseId) {
        String url = judge0ApiUrl + "/submissions/" + token + "?base64_encoded=false";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("X-RapidAPI-Key", judge0ApiKey)
                .header("X-RapidAPI-Host", judge0ApiHost)
                .build();

        // Poll for 30 seconds max
        for (int i = 0; i < 30; i++) {
            HttpResponse<String> response;
            try {
                response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            } catch (Exception e) {
                throw new RuntimeException("Error polling Judge0 for submission " + token, e);
            }
            Map<String, Object> body;
            try {
                body = objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {
                });
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Failed to parse Judge0 polling response", e);
            }
            if (body == null || body.get("status") == null) {
                throw new RuntimeException("Invalid response while polling for submission " + token);
            }
            Map<String, Object> status = objectMapper.convertValue(
                    body.get("status"), new TypeReference<Map<String, Object>>() {});
            String statusDesc = (String) status.get("description");
            if (!"In Queue".equals(statusDesc) && !"Processing".equals(statusDesc)) {
                return mapToRunResponse(body, testCaseId);
            }
            try {
                TimeUnit.SECONDS.sleep(1);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Polling interrupted", e);
            }
        }
        throw new RuntimeException("Submission timeout for token " + token);
    }

    private CodingExerciseDTO.RunCodeResponseDTO mapToRunResponse(Map<String, Object> responseBody,
            Integer testCaseId) {
        CodingExerciseDTO.RunCodeResponseDTO response = new CodingExerciseDTO.RunCodeResponseDTO();
        response.setTestCaseId(testCaseId);
        response.setStdout((String) responseBody.get("stdout"));
        response.setStderr((String) responseBody.get("stderr"));
        response.setCompileOutput((String) responseBody.get("compile_output"));
        response.setMessage((String) responseBody.get("message"));
        response.setTime((String) responseBody.get("time"));

        Object memoryObj = responseBody.get("memory");
        if (memoryObj instanceof Number) {
            response.setMemory(((Number) memoryObj).intValue());
        }

        Map<String, Object> status = objectMapper.convertValue(
                responseBody.get("status"), new TypeReference<Map<String, Object>>() {});
        if (status != null) {
            response.setStatusId((Integer) status.get("id"));
            response.setStatusDescription((String) status.get("description"));
        }

        return response;
    }
}