package courses.abc.atoms.features.certificates.services;

import courses.abc.atoms.core.exception.ResourceAlreadyExistsException;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.model.core.Profiles;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.repositories.ProfileRepository;
import courses.abc.atoms.core.repositories.UserRepository;
import courses.abc.atoms.core.services.SpacesService;
import courses.abc.atoms.features.certificates.dto.CertificateDTO;
import courses.abc.atoms.features.certificates.dto.CertificateDTO.BulkIssueResponse;
import courses.abc.atoms.features.certificates.dto.CertificateDTO.IssuedCertificateUpdateRequest;
import courses.abc.atoms.features.certificates.dto.CertificateDTO.StudentRequest;
import courses.abc.atoms.features.certificates.dto.CertificateLearnerDTO;
import courses.abc.atoms.features.certificates.dto.Payload;
import courses.abc.atoms.core.dto.UserDTO;
import courses.abc.atoms.core.services.UserService;
import courses.abc.atoms.features.certificates.model.Certificate;
import courses.abc.atoms.features.certificates.model.IssuedCertificate;
import courses.abc.atoms.features.certificates.repositories.CertificateRepository;
import courses.abc.atoms.features.certificates.repositories.IssuedCertificateRepository;
import jakarta.transaction.Transactional;
import org.apache.commons.text.StringEscapeUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.xhtmlrenderer.pdf.ITextRenderer;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Service
public class CertificateService {

    private static final Logger log = LoggerFactory.getLogger(CertificateService.class);

    @Autowired
    private CertificateRepository certificateRepository;

    @Autowired
    private IssuedCertificateRepository issuedCertificateRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private UserRepository usersRepository;

    @Autowired
    private SpacesService spacesService;

    @Autowired
    private UserService userService;

    @Value("${file.upload-dir}")
    private String baseUploadDir;

    @Value("${aisensy.api.key}")
    private String aisensyApiKey;

    @Value("${aisensy.api.url}")
    private String aisensyApiUrl;

    @Value("${app.base-url}")
    private String baseUrl;

    private final Path fileStorageLocation;

    /**
     * Thread pool for parallel certificate processing.
     * 10 threads handles 300 students efficiently without overwhelming the server.
     * Sequential: 300 × 2s = ~600s | Parallel: 300 / 10 × 2s = ~60s
     */
    private final ExecutorService executorService = Executors.newFixedThreadPool(10);

    @Autowired
    public CertificateService(@Value("${file.upload-dir}") String baseUploadDir) {
        this.fileStorageLocation = Paths.get(baseUploadDir, "certificates")
                .toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException(
                    "Could not create the directory for uploaded certificate files.", ex);
        }
    }

    // =========================================================================
    // Certificate Template CRUD
    // =========================================================================

    @Transactional
    public Certificate createCertificate(CertificateDTO.Certificate certificate) {
        Optional<Certificate> conflict =
                certificateRepository.findBySerialPrefix(certificate.getSerialPrefix());
        if (conflict.isPresent()) {
            throw new ResourceAlreadyExistsException(
                    "Serial prefix already in use by another certificate.");
        }
        Certificate cert = new Certificate();
        cert.setName(certificate.getName());
        cert.setDescription(certificate.getDescription());
        cert.setTemplateUrl(certificate.getTemplateUrl());
        cert.setSerialPrefix(certificate.getSerialPrefix());
        cert.setCreatedAt(LocalDateTime.now());
        cert.setUpdatedAt(LocalDateTime.now());
        return certificateRepository.save(cert);
    }

    @Transactional
    public Certificate updateCertificate(CertificateDTO.updateCertificate certificate) {
        Certificate existing = certificateRepository
                .findByTemplateId(certificate.getTemplateId())
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found"));

        if (certificate.getName()        != null) existing.setName(certificate.getName());
        if (certificate.getDescription() != null) existing.setDescription(certificate.getDescription());
        if (certificate.getTemplateUrl() != null) {
            deleteStoredFile(existing.getTemplateUrl());
            existing.setTemplateUrl(certificate.getTemplateUrl());
        }
        if (certificate.getSerialPrefix() != null) {
            Optional<Certificate> conflict =
                    certificateRepository.findBySerialPrefix(certificate.getSerialPrefix());
            if (conflict.isPresent()
                    && !conflict.get().getTemplateId().equals(certificate.getTemplateId())) {
                throw new ResourceAlreadyExistsException(
                        "Serial prefix already in use by another certificate.");
            }
            existing.setSerialPrefix(certificate.getSerialPrefix());
        }
        existing.setUpdatedAt(LocalDateTime.now());
        return certificateRepository.save(existing);
    }

    public List<CertificateDTO.Certificates> getAllCertificates() {
        return certificateRepository.findAll().stream()
                .map(cert -> new CertificateDTO.Certificates(
                        cert.getTemplateId(),
                        cert.getName(),
                        cert.getDescription(),
                        cert.getTemplateUrl(),
                        cert.getSerialPrefix(),
                        cert.getCreatedAt(),
                        cert.getUpdatedAt()))
                .collect(Collectors.toList());
    }

    public CertificateDTO.Certificates getCertificateById(Long templateId) {
        Certificate cert = certificateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Certificate template not found with ID: " + templateId));
        return new CertificateDTO.Certificates(
                cert.getTemplateId(), cert.getName(), cert.getDescription(),
                cert.getTemplateUrl(), cert.getSerialPrefix(),
                cert.getCreatedAt(), cert.getUpdatedAt());
    }

    @Transactional
    public void deleteCertificate(Long certificateId) {
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Certificate not found with id: " + certificateId));
        deleteStoredFile(certificate.getTemplateUrl());
        certificateRepository.delete(certificate);
    }

    // =========================================================================
    // Issued Certificate Operations
    // =========================================================================

    public List<CertificateDTO.getCertificateIssued> getCertificateByUserId(Long id) {
        return issuedCertificateRepository.fetchAllIssuedCertificates(id);
    }

    public Boolean togglePublishStatus(CertificateDTO.Publish togglePublish) {
        IssuedCertificate cert = issuedCertificateRepository
                .findByCertificateId(togglePublish.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Issued certificate not found"));
        cert.setIsPublished(togglePublish.getIsPublished());
        issuedCertificateRepository.save(cert);
        return true;
    }

    public List<Users> getStudentsByCertificateTemplateId(Long templateId) {
        return issuedCertificateRepository.findStudentsByCertificateTemplateId(templateId);
    }

    public List<CertificateLearnerDTO> getLearnersByCertificateTemplateId(Long templateId) {
        return issuedCertificateRepository.findLearnersByCertificateTemplateId(templateId);
    }

    @Transactional
    public boolean publishCertificate(Long templateId, Long userId) {
        Optional<IssuedCertificate> opt = issuedCertificateRepository
                .findByTemplate_TemplateIdAndUser_Id(templateId, userId);
        if (opt.isPresent()) {
            opt.get().setIsPublished(true);
            issuedCertificateRepository.save(opt.get());
            return true;
        }
        return false;
    }

    @Transactional
    public boolean unpublishCertificate(Long templateId, Long userId) {
        Optional<IssuedCertificate> opt = issuedCertificateRepository
                .findByTemplate_TemplateIdAndUser_Id(templateId, userId);
        if (opt.isPresent()) {
            opt.get().setIsPublished(false);
            issuedCertificateRepository.save(opt.get());
            return true;
        }
        return false;
    }

    @Transactional
    public CertificateDTO.getCertificateIssued updateIssuedCertificate(
            Long templateId, Long userId, IssuedCertificateUpdateRequest request) {

        IssuedCertificate cert = issuedCertificateRepository
                .findByTemplate_TemplateIdAndUser_Id(templateId, userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Certificate not found for template ID: " + templateId
                        + " and user ID: " + userId));

        if (request.getCourseName()     != null) cert.setCourseName(request.getCourseName());
        if (request.getCollegeName()    != null) cert.setCollegeName(request.getCollegeName());
        if (request.getCertificateUrl() != null) cert.setCertificateUrl(request.getCertificateUrl());
        if (request.getIsPublished()    != null) cert.setIsPublished(request.getIsPublished());
        if (request.getIssuedAt()       != null) cert.setIssuedAt(request.getIssuedAt());
        if (request.getStartDate()      != null) cert.setStartDate(request.getStartDate());
        if (request.getEndDate()        != null) cert.setEndDate(request.getEndDate());

        issuedCertificateRepository.save(cert);

        return new CertificateDTO.getCertificateIssued(
                cert.getIssuedAt().toString(),
                cert.getTemplate().getName(),
                cert.getCourseName(),
                cert.getCertificateUrl());
    }

    public CertificateDTO.getCertificateIssuedDetails getIssuedCertificateDetails(
            Long templateId, Long userId) {

        IssuedCertificate cert = issuedCertificateRepository
                .findByTemplate_TemplateIdAndUser_Id(templateId, userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Issued certificate not found for template ID: " + templateId
                        + " and user ID: " + userId));

        String userName = profileRepository.findById(userId)
                .map(Profiles::getName).orElse("Unknown User");

        return new CertificateDTO.getCertificateIssuedDetails(
                userName,
                cert.getCourseName(),
                cert.getCollegeName(),
                cert.getIssuedAt()  != null ? cert.getIssuedAt().toString()  : null,
                cert.getStartDate() != null ? cert.getStartDate().toString() : null,
                cert.getEndDate()   != null ? cert.getEndDate().toString()   : null);
    }

    public List<CertificateDTO.getMyCertificates> getCertificatesForCurrentUser() {
        Long userId = getCurrentUserId();
        List<IssuedCertificate> issued = issuedCertificateRepository.findByUserId(userId);

        List<CertificateDTO.getMyCertificates> result = issued.stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsPublished()))
                .map(c -> new CertificateDTO.getMyCertificates(
                        c.getTemplate() != null ? c.getTemplate().getName() : null,
                        c.getCourseName(),
                        c.getCollegeName(),
                        c.getIssuedAt()  != null ? c.getIssuedAt().toString()  : null,
                        c.getStartDate() != null ? c.getStartDate().toString() : null,
                        c.getEndDate()   != null ? c.getEndDate().toString()   : null))
                .collect(Collectors.toList());

        return result;
    }

    // =========================================================================
    // Bulk Issue — Parallel Processing
    // =========================================================================

    /**
     * Issues certificates for multiple students in parallel.
     * 300 students → 10 threads → ~60s instead of ~600s sequential.
     */
    public List<BulkIssueResponse> bulkIssueCertificates(
            Long templateId, List<StudentRequest> students) {

        Certificate template = certificateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid template ID: " + templateId));

        List<Future<BulkIssueResponse>> futures = students.stream()
                .map(student -> executorService.submit(
                        () -> issueSingleCertificate(template, student)))
                .collect(Collectors.toList());

        List<BulkIssueResponse> responses = new ArrayList<>();
        for (Future<BulkIssueResponse> future : futures) {
            try {
                responses.add(future.get(60, TimeUnit.SECONDS));
            } catch (TimeoutException e) {
                log.error("Certificate issuance timed out");
                responses.add(new BulkIssueResponse(null, "unknown",
                        "TIMEOUT", "Certificate generation timed out"));
            } catch (Exception e) {
                log.error("Error issuing certificate: {}", e.getMessage(), e);
                responses.add(new BulkIssueResponse(null, "unknown",
                        "ERROR", e.getMessage()));
            }
        }
        return responses;
    }

    /**
     * Issues a single certificate.
     * Generates PDF in memory → uploads to Spaces → saves Spaces URL to DB.
     * No local file system involved for the generated PDF.
     */
    private BulkIssueResponse issueSingleCertificate(
            Certificate template, StudentRequest student) {

        DateTimeFormatter formatter = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
        try {
            Users user = usersRepository.findByEmail(student.getEmail())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "User not found for email: " + student.getEmail()));

            // Skip if already issued
            Optional<IssuedCertificate> existing = issuedCertificateRepository
                    .findByTemplate_TemplateIdAndUser_Id(template.getTemplateId(), user.getId());
            if (existing.isPresent()) {
                return new BulkIssueResponse(
                        null, student.getEmail(),
                        existing.get().getSerialNumber(),
                        "Already issued with serial number: "
                                + existing.get().getSerialNumber());
            }

            // 1. Read HTML template (template files remain on local disk)
            String templatePath = Paths.get(baseUploadDir, "certificates",
                    template.getTemplateUrl()).toString();
            if (!Files.exists(Paths.get(templatePath))) {
                throw new IllegalArgumentException(
                        "Template file not found at: " + templatePath);
            }

            // 2. Generate HTML with student data
            String htmlContent = generateCertificateHtml(templatePath, student);

            // 3. Generate PDF in memory (no temp file on disk)
            byte[] pdfBytes = generatePdfBytesFromHtml(htmlContent);

            // 4. Upload PDF directly to DigitalOcean Spaces
            //    Stored at: atoms-lms/certifications/workshop-certifications/{uuid}.pdf
            String certificateUrl = spacesService.uploadCertificate(pdfBytes);
            log.info("Certificate uploaded to Spaces for {}: {}",
                    student.getEmail(), certificateUrl);

            // 5. Save record with Spaces URL
            IssuedCertificate cert = new IssuedCertificate();
            cert.setTemplate(template);
            cert.setUser(user);
            cert.setCourseName(student.getCourseName() != null
                    ? student.getCourseName() : "Workshop Orientation");
            cert.setCollegeName(student.getCollegeName());
            cert.setIsPublished(true);
            cert.setSerialNumber(generateSerialNumber(template.getSerialPrefix()));
            cert.setCertificateUrl(certificateUrl); // Spaces URL in DB
            cert.setIssuedAt(student.getIssuedAt() != null
                    ? OffsetDateTime.parse(student.getIssuedAt(), formatter)
                    : OffsetDateTime.now());
            cert.setStartDate(student.getStartDate() != null
                    ? OffsetDateTime.parse(student.getStartDate(), formatter) : null);
            cert.setEndDate(student.getEndDate() != null
                    ? OffsetDateTime.parse(student.getEndDate(), formatter) : null);

            issuedCertificateRepository.save(cert);

            return new BulkIssueResponse(
                    cert.getCertificateId(),
                    student.getEmail(),
                    cert.getSerialNumber(),
                    cert.getIssuedAt().format(formatter));

        } catch (Exception e) {
            log.error("Error issuing certificate for {}: {}",
                    student.getEmail(), e.getMessage(), e);
            return new BulkIssueResponse(
                    null, student.getEmail(), "ERROR", e.getMessage());
        }
    }

    // =========================================================================
    // Webhook — Register + Issue + Send
    // =========================================================================

    public Map<String, Object> processWebhookPayload(Map<String, Object> payloadMap) {
        Payload payload = new Payload();
        payload.setCollege((String) payloadMap.get("college"));
        payload.setPostAssessmentScore((String) payloadMap.get("postAssessmentScore"));
        payload.setLeadType((String) payloadMap.get("leadType"));
        payload.setWorkshop_interest((String) payloadMap.get("workshop_interest"));
        payload.setImplementation_decision_factores(
                (String) payloadMap.get("implementation_decision_factores"));
        payload.setLeadName((String) payloadMap.get("leadName"));
        payload.set_360_rejection_reason((String) payloadMap.get("_360_rejection_reason"));
        payload.setProgram_implemented((String) payloadMap.get("Program_implemented"));
        payload.setWhatsappNo((String) payloadMap.get("whatsappNo"));
        payload.setMobile((String) payloadMap.get("Mobile"));
        payload.setEmail((String) payloadMap.get("email"));
        payload.setPreAssessmentScore((String) payloadMap.get("preAssessmentScore"));
    
        if (payload.getPreAssessmentScore()  == null || payload.getPreAssessmentScore().isBlank()
        || payload.getPostAssessmentScore() == null || payload.getPostAssessmentScore().isBlank()) {
            return Map.of("success", false,
                    "message", "Pre-assessment and post-assessment scores are required");
        }
    
        // -------------------------------------------------------------------------
        // 1. Register user — or fetch existing one if already registered
        // -------------------------------------------------------------------------
        Long userId;
        Optional<Users> existingUser = usersRepository.findByEmail(payload.getEmail());
        if (existingUser.isPresent()) {
            // User already exists — skip registration, reuse their ID
            log.info("User already registered, skipping registration for email: {}", payload.getEmail());
            userId = existingUser.get().getId();
        } else {
            // New user — register them
            UserDTO.RegistrationRequest registrationRequest = new UserDTO.RegistrationRequest();
            registrationRequest.setName(payload.getLeadName());
            registrationRequest.setEmail(payload.getEmail());
            registrationRequest.setPhoneNumber(payload.getMobile());
            registrationRequest.setPassword("Password@123");
            registrationRequest.setRole("STUDENT");
            UserDTO.UserResponse registeredUser = userService.registerUser(registrationRequest);
            userId = registeredUser.getId();
            log.info("New user registered with ID: {} for email: {}", userId, payload.getEmail());
        }
    
        // -------------------------------------------------------------------------
        // 2. Always issue a NEW certificate (even if one was issued before)
        //    issueSingleCertificate skips duplicates, so we bypass it here and
        //    call the internal helper directly on a fresh IssuedCertificate.
        //    If your business rule is "one certificate per user per template",
        //    remove the deletion block below. If you want a new one every time,
        //    delete any existing record first so issueSingleCertificate proceeds.
        // -------------------------------------------------------------------------
        Long templateId = 1L;
    
        // Delete any prior issued certificate for this user+template so a fresh
        // one is always generated and sent on every webhook call.
        issuedCertificateRepository
                .findByTemplate_TemplateIdAndUser_Id(templateId, userId)
                .ifPresent(old -> {
                    log.info("Removing old certificate (id={}) for user {} before re-issuing",
                            old.getCertificateId(), userId);
                    issuedCertificateRepository.delete(old);
                });
    
        Certificate template = certificateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid template ID: " + templateId));
    
        StudentRequest student = new StudentRequest();
        student.setName(payload.getLeadName());
        student.setEmail(payload.getEmail());
        student.setCourseName("Workshop Orientation");
        student.setCollegeName(payload.getCollege());
        student.setIssuedAt(OffsetDateTime.now().toString());
        student.setStartDate(OffsetDateTime.now().minusDays(30).toString());
        student.setEndDate(OffsetDateTime.now().toString());
    
        BulkIssueResponse issueResult = issueSingleCertificate(template, student);
        Long certificateId = issueResult.getCertificateId();
    
        if (certificateId == null) {
            log.error("Certificate issuance failed for user {}: {}", payload.getEmail(),
                    issueResult.getIssuedAt()); // getIssuedAt() holds error message on failure
            return Map.of("success", false,
                    "message", "Certificate issuance failed: " + issueResult.getIssuedAt());
        }
    
        // -------------------------------------------------------------------------
        // 3. Send via WhatsApp
        // -------------------------------------------------------------------------
        String whatsappNumber = payload.getWhatsappNo();
        if (whatsappNumber == null || whatsappNumber.isBlank()) {
            whatsappNumber = payload.getMobile();
        }
        if (whatsappNumber != null && !whatsappNumber.isBlank()) {
            IssuedCertificate issued = issuedCertificateRepository
                    .findByCertificateId(certificateId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Certificate not found: " + certificateId));
    
            String downloadUrl = spacesService.generateCertificateDownloadUrl(
                    issued.getCertificateUrl());
    
            try {
                sendViaAiSensy(whatsappNumber, downloadUrl,
                        payload.getLeadName(), payload.getEmail(), certificateId);
                log.info("Certificate sent to WhatsApp: {}", whatsappNumber);
            } catch (Exception e) {
                log.error("Failed to send WhatsApp for {}: {}", whatsappNumber, e.getMessage());
            }
        }
    
        return Map.of(
                "success", true,
                "data", Map.of("userId", userId, "certificateId", certificateId),
                "message", "Certificate issued and sent successfully");
    }

    /**
     * Processes multiple webhook payloads in parallel.
     */
    public List<Map<String, Object>> processWebhookPayloadsBulk(
            List<Map<String, Object>> payloadMaps) {

        List<Future<Map<String, Object>>> futures = payloadMaps.stream()
                .map(payloadMap -> executorService.submit(() -> {
                    try {
                        return processWebhookPayload(payloadMap);
                    } catch (Exception e) {
                        return Map.<String, Object>of(
                                "success", false,
                                "message", "Internal server error: " + e.getMessage());
                    }
                }))
                .collect(Collectors.toList());

        List<Map<String, Object>> results = new ArrayList<>();
        for (Future<Map<String, Object>> future : futures) {
            try {
                results.add(future.get(120, TimeUnit.SECONDS));
            } catch (TimeoutException e) {
                results.add(Map.of("success", false, "message", "Processing timed out"));
            } catch (Exception e) {
                results.add(Map.of("success", false, "message", e.getMessage()));
            }
        }
        return results;
    }

    // =========================================================================
    // Resend Certificate
    // =========================================================================

    public Map<String, Object> resendCertificate(String email, String mobile) throws Exception {
        Optional<IssuedCertificate> opt = issuedCertificateRepository
                .findByIsPublishedFalseAndUser_EmailOrUser_PhoneNumber(email, mobile);

        if (opt.isPresent()) {
            IssuedCertificate cert = opt.get();
            Long certificateId     = cert.getCertificateId();

            // Download URL — attachment + 24h expiry for WhatsApp
            String downloadUrl = spacesService.generateCertificateDownloadUrl(
                    cert.getCertificateUrl());

            String whatsappNumber = mobile.replaceAll("[^0-9]", "");
            String name           = getProfileNameByUserId(cert.getUser().getId());
            String userEmail      = cert.getUser().getEmail();

            sendViaAiSensy(whatsappNumber, downloadUrl, name, userEmail, certificateId);

            cert.setIsPublished(true);
            issuedCertificateRepository.save(cert);

            return Map.of(
                    "success", true,
                    "data", Map.of("certificateId", certificateId),
                    "message", "Certificate resent successfully via WhatsApp");
        } else {
            String whatsappNumber = mobile.replaceAll("[^0-9]", "");
            sendNonAttendanceMessage(whatsappNumber, email);
            return Map.of(
                    "success", false,
                    "data", null,
                    "message", "No certificate issued or already sent. "
                            + "You have not attended the workshop.");
        }
    }

    // =========================================================================
    // Download Certificate from Spaces
    // =========================================================================

    /**
     * Downloads certificate bytes from Spaces for the authenticated user.
     */
    public byte[] downloadCertificate(Long certificateId, Long userId) {
        log.info("Downloading certificate — certificateId: {}, userId: {}",
                certificateId, userId);
        IssuedCertificate cert = issuedCertificateRepository
                .findByCertificateIdAndUser_Id(certificateId, userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Certificate not found for certificateId: " + certificateId
                        + " and userId: " + userId));
        return spacesService.downloadCertificate(cert.getCertificateUrl());
    }

    /**
     * Downloads certificate bytes from Spaces — public endpoint (no userId check).
     * Used by the WhatsApp download link.
     */
    public byte[] downloadCertificatePublic(Long certificateId) {
        IssuedCertificate cert = issuedCertificateRepository
                .findByCertificateId(certificateId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Certificate not found for ID: " + certificateId));
        return spacesService.downloadCertificate(cert.getCertificateUrl());
    }

    // =========================================================================
    // Send WhatsApp
    // =========================================================================

    public String sendCertificateToWhatsApp(
            Long certificateId, Long userId, String mobileNumber) {

        IssuedCertificate cert = issuedCertificateRepository
                .findByCertificateIdAndUser_Id(certificateId, userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Certificate not found for certificateId: " + certificateId
                        + " and userId: " + userId));

        // Download URL — attachment + 24h expiry
        String downloadUrl = spacesService.generateCertificateDownloadUrl(
                cert.getCertificateUrl());

        try {
            sendViaAiSensy(mobileNumber, downloadUrl,
                    getProfileNameByUserId(userId),
                    cert.getUser().getEmail(), certificateId);
            return "Certificate sent successfully to " + mobileNumber;
        } catch (Exception e) {
            log.error("Failed to send certificate via WhatsApp: {}", e.getMessage(), e);
            return "Failed to send certificate to " + mobileNumber;
        }
    }

    // =========================================================================
    // AiSensy Integration
    // =========================================================================

    public void sendViaAiSensy(String whatsappNumber, String downloadUrl,
                                String name, String email,
                                Long certificateId) throws Exception {
        String apiUrl = "https://backend.aisensy.com/campaign/t1/api/v2";
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> payload = new HashMap<>();
        payload.put("apiKey", aisensyApiKey);
        payload.put("campaignName", "syntaxtosuccess_certificate");
        payload.put("destination", whatsappNumber);
        payload.put("userName", name);
        payload.put("source", "YOUR_AISENSY_SOURCE");
        payload.put("media", Map.of("url", downloadUrl, "filename", "certificate.pdf"));
        payload.put("templateParams", new String[]{});
        payload.put("tags", new String[]{"certificate_issued"});
        payload.put("attributes", Map.of("EmailAddress", email));

        String jsonPayload = mapper.writeValueAsString(payload);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);
        RestTemplate restTemplate = new RestTemplate();

        int maxAttempts = 3;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            ResponseEntity<String> response =
                    restTemplate.postForEntity(apiUrl, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("AiSensy sent for number: {} on attempt {}", whatsappNumber, attempt);
                log.info("AiSensy api  ", aisensyApiKey);
                return;
            }
            if (attempt < maxAttempts) {
                Thread.sleep(1000L * attempt);
                log.warn("Retry attempt {} failed for: {}", attempt, whatsappNumber);
            } else {
                issuedCertificateRepository.findByCertificateId(certificateId).ifPresent(c -> {
                    c.setIsPublished(false);
                    issuedCertificateRepository.save(c);
                });
                throw new Exception("Failed to send via AiSensy after " + maxAttempts
                        + " attempts: " + response.getBody());
            }
        }
    }

    public void sendNonAttendanceMessage(String whatsappNumber, String email) throws Exception {
        String apiUrl = "https://backend.aisensy.com/campaign/t1/api/v2";
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> payload = new HashMap<>();
        payload.put("apiKey", aisensyApiKey);
        payload.put("campaignName", "non_attendance_campaign");
        payload.put("destination", whatsappNumber);
        payload.put("userName", "System");
        payload.put("source", "YOUR_AISENSY_SOURCE");
        payload.put("templateParams", new String[]{});
        payload.put("tags", new String[]{"non_attendance"});
        payload.put("attributes", Map.of("EmailAddress", email));

        String jsonPayload = mapper.writeValueAsString(payload);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);

        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> response =
                restTemplate.postForEntity(apiUrl, entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new Exception("Failed to send non-attendance message: " + response.getBody());
        }
        log.info("Non-attendance message sent for number: {}", whatsappNumber);
    }

    // =========================================================================
    // File Storage (HTML templates — remain local)
    // =========================================================================

    public String storeFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty.");
        }
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String uniqueFileName   = UUID.randomUUID() + "_" + originalFileName;
        Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
        }
        return uniqueFileName;
    }

    private void deleteStoredFile(String fileName) {
        if (fileName == null || fileName.isBlank()) return;
        try {
            Files.deleteIfExists(
                    this.fileStorageLocation.resolve(fileName).normalize());
        } catch (IOException ex) {
            log.error("Could not delete file: {}", fileName, ex);
        }
    }

    // =========================================================================
    // Private — PDF Generation (in memory)
    // =========================================================================

    private String generateCertificateHtml(
            String templatePath, StudentRequest student) throws IOException {

        String templateContent = Files.readString(Paths.get(templatePath));
        Map<String, String> placeholders = new HashMap<>();
        placeholders.put("student_name",
                StringEscapeUtils.escapeHtml4(student.getName()));
        placeholders.put("college_name",
                StringEscapeUtils.escapeHtml4(student.getCollegeName()));
        placeholders.put("issued_on", student.getIssuedAt() != null
                ? OffsetDateTime.parse(student.getIssuedAt())
                        .format(java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy"))
                : OffsetDateTime.now()
                        .format(java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy")));

        String html = templateContent;
        for (Map.Entry<String, String> entry : placeholders.entrySet()) {
            html = html.replace("%" + entry.getKey() + "%", entry.getValue());
        }
        return html;
    }

    /**
     * Generates PDF bytes entirely in memory — no temp file written to disk.
     * ByteArrayOutputStream holds the PDF in RAM, then uploaded directly to Spaces.
     */
    private byte[] generatePdfBytesFromHtml(String htmlContent) throws Exception {
        ITextRenderer renderer = new ITextRenderer();
        renderer.setDocumentFromString(htmlContent);
        renderer.layout();
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            renderer.createPDF(baos);
            return baos.toByteArray();
        }
    }

    private String generateSerialNumber(String serialPrefix) {
        int number = new Random().nextInt(100000000);
        return serialPrefix + String.format("%08d", number);
    }

    // =========================================================================
    // Private — Auth Helper
    // =========================================================================

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new IllegalArgumentException("No authentication context found");
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof String email) {
            return usersRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "User not found: " + email))
                    .getId();
        } else if (principal instanceof Users u) {
            return u.getId();
        } else if (principal instanceof User u) {
            return usersRepository.findByEmail(u.getUsername())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "User not found: " + u.getUsername()))
                    .getId();
        }
        throw new IllegalArgumentException(
                "Unsupported principal type: " + principal.getClass().getName());
    }

    public String getProfileNameByUserId(Long userId) {
        return profileRepository.findByUserId(userId)
                .map(Profiles::getName)
                .orElse(null);
    }
}