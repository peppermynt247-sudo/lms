package courses.abc.atoms.features.certificates.controllers;

import courses.abc.atoms.core.exception.ResourceAlreadyExistsException;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.features.certificates.dto.CertificateDTO;
import courses.abc.atoms.features.certificates.dto.CertificateDTO.BulkIssueRequest;
import courses.abc.atoms.features.certificates.dto.CertificateDTO.BulkIssueResponse;
import courses.abc.atoms.features.certificates.dto.CertificateDTO.IssuedCertificateUpdateRequest;
import courses.abc.atoms.features.certificates.dto.CertificateLearnerDTO;
import courses.abc.atoms.features.certificates.model.Certificate;
import courses.abc.atoms.features.certificates.model.IssuedCertificate;
import courses.abc.atoms.features.certificates.repositories.IssuedCertificateRepository;
import courses.abc.atoms.features.certificates.services.CertificateService;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/certificates")
public class CertificateController {

    private static final Logger logger = LoggerFactory.getLogger(CertificateController.class);

    @Autowired
    private CertificateService certificateService;

    @Autowired
    private IssuedCertificateRepository issuedCertificateRepository;

    // =========================================================================
    // Certificate Template CRUD
    // =========================================================================

    @GetMapping("/getcertificates")
    public ResponseEntity<Map<String, Object>> getAllCertificates() {
        try {
            List<CertificateDTO.Certificates> certificates = certificateService.getAllCertificates();
            return ok("Certificates retrieved successfully", certificates);
        } catch (Exception e) {
            return error("Unable to retrieve Certificates");
        }
    }

    @GetMapping("/{templateId}")
    public ResponseEntity<Map<String, Object>> getCertificateById(@PathVariable Long templateId) {
        try {
            CertificateDTO.Certificates certificate = certificateService.getCertificateById(templateId);
            return ok("Certificate template retrieved successfully", certificate);
        } catch (IllegalArgumentException e) {
            return notFound(e.getMessage());
        } catch (Exception e) {
            return error("Internal server error: " + e.getMessage());
        }
    }

    @PostMapping(value = "/createcertificate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> createCertificate(
            @RequestParam("name")         String name,
            @RequestParam("description")  String description,
            @RequestParam("templateUrl")  String templateUrl,
            @RequestParam("serialPrefix") String serialPrefix,
            @RequestParam("htmlFile") @NotNull MultipartFile htmlFile) {
        try {
            if (htmlFile.isEmpty()) {
                throw new IllegalArgumentException("HTML file is required and cannot be empty");
            }
            String fileUrl = certificateService.storeFile(htmlFile);
            CertificateDTO.Certificate certificate = new CertificateDTO.Certificate();
            certificate.setName(name);
            certificate.setDescription(description);
            certificate.setTemplateUrl(fileUrl);
            certificate.setSerialPrefix(serialPrefix);

            Certificate created = certificateService.createCertificate(certificate);
            return ok("Certificate created successfully", created);
        } catch (ResourceAlreadyExistsException e) {
            return conflict("Serial prefix already in use by another certificate");
        } catch (IllegalArgumentException e) {
            return error(e.getMessage());
        } catch (IOException e) {
            return error("Unable to save HTML file");
        } catch (Exception e) {
            return error("Unable to create certificate");
        }
    }

    @PatchMapping(value = "/updatecertificate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> updateCertificate(
            @RequestParam("templateId")                          Long templateId,
            @RequestParam(value = "name",          required = false) String name,
            @RequestParam(value = "description",   required = false) String description,
            @RequestParam(value = "templateUrl",   required = false) String templateUrl,
            @RequestParam(value = "serialPrefix",  required = false) String serialPrefix,
            @RequestParam("htmlFile") @NotNull MultipartFile htmlFile) {
        try {
            if (htmlFile.isEmpty()) throw new IllegalArgumentException("HTML file is required");
            String newFileUrl = certificateService.storeFile(htmlFile);
            CertificateDTO.updateCertificate certificate = new CertificateDTO.updateCertificate();
            certificate.setTemplateId(templateId);
            certificate.setName(name);
            certificate.setDescription(description);
            certificate.setTemplateUrl(newFileUrl);
            certificate.setSerialPrefix(serialPrefix);

            Certificate updated = certificateService.updateCertificate(certificate);
            return ok("Certificate updated successfully", updated);
        } catch (ResourceAlreadyExistsException e) {
            return conflict("Serial prefix already in use by another certificate");
        } catch (ResourceNotFoundException e) {
            return notFound("Unable to update certificate");
        } catch (IllegalArgumentException e) {
            return badRequest(e.getMessage());
        } catch (IOException e) {
            return error("Unable to save HTML file");
        } catch (Exception e) {
            return error("Unable to update certificate");
        }
    }

    @DeleteMapping("/deletecertificate")
    public ResponseEntity<Map<String, Object>> deleteCertificate(@RequestParam Long certificateid) {
        try {
            certificateService.deleteCertificate(certificateid);
            return ok("Successfully deleted the certificate", null);
        } catch (ResourceNotFoundException e) {
            return notFound("Unable to find the certificate");
        } catch (Exception e) {
            return error("Unable to delete the certificate");
        }
    }

    // =========================================================================
    // Issued Certificate Operations
    // =========================================================================

    @GetMapping("user")
    public ResponseEntity<Map<String, Object>> getCertificatesIssued(@RequestParam Long userid) {
        try {
            List<CertificateDTO.getCertificateIssued> result =
                    certificateService.getCertificateByUserId(userid);
            if (result.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "No certificates issued to this user.");
                response.put("data", result);
                return ResponseEntity.ok(response);
            }
            return ok("Certificates issued successfully", result);
        } catch (Exception e) {
            return error("Unable to retrieve the user certificates");
        }
    }

    @PatchMapping("/togglepublish")
    public ResponseEntity<Map<String, Object>> togglePublishStatus(
            @RequestBody CertificateDTO.Publish togglePublish) {
        try {
            boolean newStatus = certificateService.togglePublishStatus(togglePublish);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", togglePublish.getIsPublished() ? "Certificate published" : "Certificate unpublished",
                    "published", newStatus));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Certificate not found"));
        } catch (Exception e) {
            return error("Unable to publish certificate");
        }
    }

    @GetMapping("/students/{templateId}")
    public ResponseEntity<Map<String, Object>> getStudentsByCertificate(@PathVariable Long templateId) {
        try {
            List<Users> students = certificateService.getStudentsByCertificateTemplateId(templateId);
            return ok("Students retrieved successfully", students);
        } catch (Exception e) {
            return badRequest(e.getMessage());
        }
    }

    @GetMapping("/learners/{templateId}")
    public ResponseEntity<Map<String, Object>> getLearnersByCertificate(@PathVariable Long templateId) {
        try {
            List<CertificateLearnerDTO> learners =
                    certificateService.getLearnersByCertificateTemplateId(templateId);
            return ok("Learners retrieved successfully", learners);
        } catch (Exception e) {
            return badRequest(e.getMessage());
        }
    }

    @PostMapping("/publish/{templateId}/{userId}")
    public ResponseEntity<Map<String, Object>> publishCertificate(
            @PathVariable Long templateId, @PathVariable Long userId) {
        try {
            boolean success = certificateService.publishCertificate(templateId, userId);
            return ResponseEntity.ok(Map.of(
                    "success", success,
                    "message", success ? "Certificate published successfully"
                            : "Certificate not found for the given template and user"));
        } catch (Exception e) {
            return badRequest(e.getMessage());
        }
    }

    @PostMapping("/unpublish/{templateId}/{userId}")
    public ResponseEntity<Map<String, Object>> unpublishCertificate(
            @PathVariable Long templateId, @PathVariable Long userId) {
        try {
            boolean success = certificateService.unpublishCertificate(templateId, userId);
            return ResponseEntity.ok(Map.of(
                    "success", success,
                    "message", success ? "Certificate unpublished successfully"
                            : "Certificate not found for the given template and user"));
        } catch (Exception e) {
            return error(e.getMessage());
        }
    }

    @PostMapping("/issue/bulk")
    public ResponseEntity<Map<String, Object>> bulkIssueCertificates(@RequestBody BulkIssueRequest request) {
        try {
            List<BulkIssueResponse> results = certificateService.bulkIssueCertificates(
                    request.getTemplateId(), request.getStudents());
            return ok("Certificates issued successfully", results);
        } catch (Exception e) {
            return error(e.getMessage());
        }
    }

    @PutMapping("/updateissuedcertificate/{templateId}/{userId}")
    public ResponseEntity<Map<String, Object>> updateIssuedCertificate(
            @PathVariable Long templateId,
            @PathVariable Long userId,
            @RequestBody IssuedCertificateUpdateRequest request) {
        try {
            CertificateDTO.getCertificateIssued updated =
                    certificateService.updateIssuedCertificate(templateId, userId, request);
            return ok("Certificate updated successfully", updated);
        } catch (Exception e) {
            return error(e.getMessage());
        }
    }

    @GetMapping("/getissuedcertificatedetails/{templateId}/{userId}")
    public ResponseEntity<Map<String, Object>> getIssuedCertificateDetails(
            @PathVariable Long templateId, @PathVariable Long userId) {
        try {
            CertificateDTO.getCertificateIssuedDetails details =
                    certificateService.getIssuedCertificateDetails(templateId, userId);
            return ok("Issued certificate details retrieved successfully", details);
        } catch (Exception e) {
            return error("Issued certificate not found for template ID: " + templateId
                    + " and user ID: " + userId);
        }
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('STUDENT')")
    @GetMapping("/getmycertificates")
    public ResponseEntity<Map<String, Object>> getCertificatesForCurrentUser() {
        try {
            List<CertificateDTO.getMyCertificates> details =
                    certificateService.getCertificatesForCurrentUser();
            return ok("Certificates retrieved successfully", details);
        } catch (Exception e) {
            return error("Internal server error");
        }
    }

    // =========================================================================
    // Download — now fetches from DigitalOcean Spaces
    // =========================================================================

    @PreAuthorize("hasRole('ADMIN') or hasRole('STUDENT')")
    @GetMapping("/download/{certificateId}/{userId}")
    public ResponseEntity<ByteArrayResource> downloadCertificate(
            @PathVariable Long certificateId,
            @PathVariable Long userId) {
        try {
            // Fetches bytes directly from Spaces — no local file system
            byte[] pdfBytes = certificateService.downloadCertificate(certificateId, userId);
            ByteArrayResource resource = new ByteArrayResource(pdfBytes);
            HttpHeaders headers = new HttpHeaders();
            headers.add("Content-Disposition", "attachment; filename=certificate.pdf");
            headers.add("Cache-Control", "no-cache, no-store, must-revalidate");
            return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(pdfBytes.length)
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(resource);
        } catch (Exception e) {
            logger.error("Error downloading certificate: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * Public download endpoint used by WhatsApp links.
     * No userId required — used by AiSensy to serve the certificate.
     */
    @PreAuthorize("permitAll()")
    @GetMapping("/download/{certificateId}")
    public ResponseEntity<byte[]> downloadCertificatePublic(
            @PathVariable Long certificateId) {
        try {
            byte[] bytes = certificateService.downloadCertificatePublic(certificateId);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", "certificate_" + certificateId + ".pdf");
            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error downloading certificate {}: {}", certificateId, e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // =========================================================================
    // WhatsApp Send
    // =========================================================================

    @PostMapping("/send-whatsapp/{certificateId}/{userId}")
    public ResponseEntity<Map<String, Object>> sendCertificateToWhatsApp(
            @PathVariable Long certificateId,
            @PathVariable Long userId,
            @RequestParam String mobileNumber) {
        try {
            String result = certificateService.sendCertificateToWhatsApp(
                    certificateId, userId, mobileNumber);
            return ok(result, null);
        } catch (IllegalArgumentException e) {
            return notFound(e.getMessage());
        } catch (Exception e) {
            return error("Internal server error");
        }
    }

    // =========================================================================
    // Webhook — Register + Issue + Send
    // =========================================================================

    /**
     * Webhook endpoint — processes 300 students in parallel.
     * All logic moved to CertificateService.processWebhookPayloadsBulk().
     * Certificates stored in DigitalOcean Spaces, not local disk.
     */
    @PreAuthorize("permitAll()")
    @PostMapping("/registerissueandsendcertificate")
    public ResponseEntity<Map<String, Object>> registerIssueAndSendCertificate(
            @RequestBody List<Map<String, Object>> requestBodies) {

        logger.info("Webhook received: {} requests", requestBodies.size());

        // Extract payload maps from each request body
        List<Map<String, Object>> payloadMaps = new ArrayList<>();
        List<Map<String, Object>> preValidationErrors = new ArrayList<>();

        for (Map<String, Object> requestBody : requestBodies) {
            Map<String, Object> payloadMap;
            if (requestBody.containsKey("webhookTrigger")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> webhookTriggerMap =
                        (Map<String, Object>) requestBody.get("webhookTrigger");
                if (webhookTriggerMap == null) {
                    preValidationErrors.add(Map.of("success", false,
                            "message", "webhookTrigger is null"));
                    continue;
                }
                @SuppressWarnings("unchecked")
                Map<String, Object> extracted =
                        (Map<String, Object>) webhookTriggerMap.get("payload");
                if (extracted == null) {
                    preValidationErrors.add(Map.of("success", false,
                            "message", "payload is null within webhookTrigger"));
                    continue;
                }
                payloadMap = extracted;
            } else {
                payloadMap = requestBody;
            }
            payloadMaps.add(payloadMap);
        }

        // Process all valid payloads in parallel
        List<Map<String, Object>> results = certificateService
                .processWebhookPayloadsBulk(payloadMaps);

        // Combine pre-validation errors with processing results
        results.addAll(0, preValidationErrors);

        boolean hasFailures = results.stream()
                .anyMatch(r -> Boolean.FALSE.equals(r.get("success")));

        Map<String, Object> response = new HashMap<>();
        response.put("success", !hasFailures);
        response.put("data", results);
        response.put("message", hasFailures
                ? "Some operations failed, check data for details"
                : "All operations completed successfully");

        return ResponseEntity.ok(response);
    }

    @PreAuthorize("permitAll()")
    @PostMapping("/resendcertificate")
    public ResponseEntity<Map<String, Object>> resendCertificate(
            @RequestParam String email,
            @RequestParam String mobile) {
        logger.info("Resend request — email: {}, mobile: {}", email, mobile);

        if (email == null || email.trim().isEmpty()
                || mobile == null || mobile.trim().isEmpty()) {
            return badRequest("Email and mobile number are required");
        }

        try {
            Map<String, Object> result = certificateService.resendCertificate(email, mobile);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return error("Internal server error: " + e.getMessage());
        }
    }

    @PreAuthorize("permitAll()")
    @PutMapping("/{certificateId}")
    public ResponseEntity<Map<String, Object>> updateCertificatePublished(
            @PathVariable Long certificateId,
            @RequestBody Map<String, Object> updateData) {
        logger.info("Update published status — certificateId: {}", certificateId);

        if (updateData == null || updateData.isEmpty()) {
            return badRequest("Update data is required");
        }

        try {
            Optional<IssuedCertificate> opt = issuedCertificateRepository
                    .findByCertificateId(certificateId);
            if (!opt.isPresent()) {
                return notFound("Certificate not found");
            }

            IssuedCertificate issuedCertificate = opt.get();
            if (updateData.containsKey("isPublished")) {
                Boolean isPublished = Boolean.valueOf(updateData.get("isPublished").toString());
                issuedCertificate.setIsPublished(isPublished);
                issuedCertificateRepository.save(issuedCertificate);
            }
            return ok("Certificate updated successfully",
                    Map.of("certificateId", certificateId));
        } catch (Exception e) {
            logger.error("Error updating certificate: {}", e.getMessage());
            return error("Internal server error: " + e.getMessage());
        }
    }

    // =========================================================================
    // Private — Response Helpers
    // =========================================================================

    private ResponseEntity<Map<String, Object>> ok(String message, Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    private ResponseEntity<Map<String, Object>> error(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        response.put("data", null);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    private ResponseEntity<Map<String, Object>> notFound(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        response.put("data", null);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    private ResponseEntity<Map<String, Object>> badRequest(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        response.put("data", null);
        return ResponseEntity.badRequest().body(response);
    }

    private ResponseEntity<Map<String, Object>> conflict(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        response.put("data", null);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }
}