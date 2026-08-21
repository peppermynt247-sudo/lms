package courses.abc.atoms.core.services;

import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.geometry.Positions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class SpacesService {

    private static final Logger logger = LoggerFactory.getLogger(SpacesService.class);

    private final S3Client s3Client;
    private final S3Presigner presigner;

    @Value("${digitalocean.spaces.bucket}")
    private String bucket;

    @Value("${digitalocean.spaces.endpoint}")
    private String endpoint;

    @Value("${digitalocean.spaces.cdn-endpoint}")
    private String cdnEndpoint;

    @Value("${image.max-input-bytes}")
    private long maxInputBytes;

    @Value("${image.thumbnail.max-width}")
    private int thumbnailMaxWidth;

    @Value("${image.thumbnail.max-height}")
    private int thumbnailMaxHeight;

    @Value("${image.thumbnail.webp-quality}")
    private double thumbnailWebpQuality;

    @Value("${image.profile.size}")
    private int profileSize;

    @Value("${image.profile.webp-quality}")
    private double profileWebpQuality;

    @Value("${image.allowed-types}")
    private String allowedTypesRaw;

    private static final String EBOOKS_FOLDER       = "atoms-lms/ebooks";
    private static final String COVER_IMAGES_FOLDER = "atoms-lms/ebooks/cover-images";
    private static final String THUMBNAILS_FOLDER   = "atoms-lms/images/course-thumbnails";
    private static final String PROFILES_FOLDER     = "atoms-lms/images/profile-photos";
    private static final String CERTIFICATES_FOLDER = "atoms-lms/certifications/workshop-certifications";

    private static final int VIEW_URL_EXPIRY_SECONDS       = 900;    // 15 min — ebook viewing
    private static final int CERTIFICATE_URL_EXPIRY_SECONDS = 86400; // 24 hours — WhatsApp delivery

    public SpacesService(@Qualifier("spacesS3Client") S3Client s3Client,
                         @Qualifier("spacesS3Presigner") S3Presigner presigner) {
        this.s3Client = s3Client;
        this.presigner = presigner;
    }

    // ─── Public image uploads (CDN-served) ───────────────────────────────────

    public String uploadCourseThumbnail(MultipartFile file) throws IOException {
        validateImage(file);
        byte[] webpBytes = convertToWebP(file, thumbnailMaxWidth, thumbnailMaxHeight, false);
        String key = THUMBNAILS_FOLDER + "/" + UUID.randomUUID() + ".webp";
        uploadPublicImage(key, webpBytes, "public, max-age=31536000, immutable");
        logger.info("Uploaded course thumbnail to Spaces: {}", key);
        return buildCdnUrl(key);
    }

    public String uploadProfilePhoto(MultipartFile file) throws IOException {
        validateImage(file);
        byte[] webpBytes = convertToWebP(file, profileSize, profileSize, true);
        String key = PROFILES_FOLDER + "/" + UUID.randomUUID() + ".webp";
        uploadPublicImage(key, webpBytes, "public, max-age=86400");
        logger.info("Uploaded profile photo to Spaces: {}", key);
        return buildCdnUrl(key);
    }

    // ─── Private document uploads (presigned URL access) ─────────────────────

    /**
     * Uploads an ebook file (PDF, PPT, PPTX).
     * Stored at: atoms-lms/ebooks/{courseSlug}/{curriculumSlug}/{uuid}.{ext}
     * ACL: private
     *
     * @return Permanent Spaces origin URL (used for presigned URL generation)
     */
    public String uploadEbookFile(MultipartFile file,
                                  String courseName,
                                  String curriculumName) throws IOException {
        String courseSlug     = toSlug(courseName);
        String curriculumSlug = toSlug(curriculumName);

        ensureFolderExists(EBOOKS_FOLDER + "/" + courseSlug);
        ensureFolderExists(EBOOKS_FOLDER + "/" + courseSlug + "/" + curriculumSlug);

        String key = EBOOKS_FOLDER + "/" + courseSlug + "/" + curriculumSlug
                + "/" + UUID.randomUUID() + getExtension(file);

        uploadPrivateToSpaces(key, file);
        logger.info("Uploaded ebook file to Spaces: {}", key);
        return buildOriginUrl(key);
    }

    public String uploadCoverImage(MultipartFile file,
                                   String courseName,
                                   String curriculumName) throws IOException {
        String courseSlug     = toSlug(courseName);
        String curriculumSlug = toSlug(curriculumName);

        ensureFolderExists(COVER_IMAGES_FOLDER + "/" + courseSlug);
        ensureFolderExists(COVER_IMAGES_FOLDER + "/" + courseSlug + "/" + curriculumSlug);

        String key = COVER_IMAGES_FOLDER + "/" + courseSlug + "/" + curriculumSlug
                + "/" + UUID.randomUUID() + getExtension(file);

        uploadPrivateToSpaces(key, file);
        logger.info("Uploaded cover image to Spaces: {}", key);
        return buildOriginUrl(key);
    }

    // ─── Certificate uploads (NEW) ────────────────────────────────────────────

    /**
     * Uploads a generated certificate PDF (byte array) to DigitalOcean Spaces.
     * Stored at: atoms-lms/certifications/workshop-certifications/{uuid}.pdf
     * ACL: private — accessed via presigned download URLs.
     *
     * @param pdfBytes  the generated PDF as a byte array
     * @return permanent Spaces origin URL stored in DB
     */
    public String uploadCertificate(byte[] pdfBytes) {
        ensureFolderExists(CERTIFICATES_FOLDER);
        String key = CERTIFICATES_FOLDER + "/" + UUID.randomUUID() + ".pdf";
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType("application/pdf")
                        // attachment → forces download in browser and WhatsApp
                        .contentDisposition("attachment; filename=\"certificate.pdf\"")
                        .acl(ObjectCannedACL.PRIVATE)
                        .build(),
                RequestBody.fromBytes(pdfBytes)
        );
        logger.info("Uploaded certificate to Spaces: {}", key);
        return buildOriginUrl(key);
    }

    /**
     * Generates a presigned GET URL for a certificate PDF.
     * Expires in 24 hours — long enough for WhatsApp delivery.
     * Content-Disposition: attachment forces download (required for WhatsApp).
     *
     * @param storedUrl  the permanent Spaces origin URL stored in DB
     * @return presigned download URL valid for 24 hours
     */
    public String generateCertificateDownloadUrl(String storedUrl) {
        String key = extractKey(storedUrl);

        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                // attachment → WhatsApp and browsers treat this as a downloadable file
                .responseContentDisposition("attachment; filename=\"certificate.pdf\"")
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(CERTIFICATE_URL_EXPIRY_SECONDS))
                .getObjectRequest(getRequest)
                .build();

        PresignedGetObjectRequest presigned = presigner.presignGetObject(presignRequest);
        return presigned.url().toString();
    }

    /**
     * Downloads a certificate from Spaces and returns its raw bytes.
     * Used by the certificate download API endpoints.
     *
     * @param storedUrl  the permanent Spaces origin URL stored in DB
     * @return PDF bytes
     */
    public byte[] downloadCertificate(String storedUrl) {
        String key = extractKey(storedUrl);
        return s3Client.getObjectAsBytes(
                GetObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .build()
        ).asByteArray();
    }

    // ─── Presigned URL (ebooks) ───────────────────────────────────────────────

    public String generateViewPresignedUrl(String storedUrl) {
        String key = extractKey(storedUrl);

        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .responseContentDisposition("inline")
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(VIEW_URL_EXPIRY_SECONDS))
                .getObjectRequest(getRequest)
                .build();

        PresignedGetObjectRequest presigned = presigner.presignGetObject(presignRequest);
        return presigned.url().toString();
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    public void deleteFile(String storedUrl) {
        if (storedUrl == null || storedUrl.isBlank()) return;
        String key = extractKey(storedUrl);
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build());
            logger.info("Deleted from Spaces: {}", key);
        } catch (Exception e) {
            logger.warn("Failed to delete Spaces object {}: {}", key, e.getMessage());
        }
    }

    // ─── Image Processing ─────────────────────────────────────────────────────

    private void validateImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("Image file is empty.");
        }
        if (file.getSize() > maxInputBytes) {
            throw new IOException(
                    String.format("Image exceeds maximum allowed size of %d MB.",
                            maxInputBytes / (1024 * 1024)));
        }
        String contentType = file.getContentType();
        List<String> allowed = Arrays.asList(allowedTypesRaw.split(","));
        if (contentType == null || !allowed.contains(contentType.trim())) {
            throw new IOException(
                    "Unsupported image type: " + contentType + ". Allowed: " + allowedTypesRaw);
        }
    }

    private byte[] convertToWebP(MultipartFile file, int maxWidth, int maxHeight,
                                  boolean cropToSquare) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try {
            if (cropToSquare) {
                Thumbnails.of(file.getInputStream())
                        .size(maxWidth, maxHeight)
                        .crop(Positions.CENTER)
                        .outputFormat("webp")
                        .outputQuality(profileWebpQuality)
                        .toOutputStream(baos);
            } else {
                Thumbnails.of(file.getInputStream())
                        .size(maxWidth, maxHeight)
                        .keepAspectRatio(true)
                        .outputFormat("webp")
                        .outputQuality(thumbnailWebpQuality)
                        .toOutputStream(baos);
            }
        } catch (IOException e) {
            throw new IOException("Failed to convert image to WebP: " + e.getMessage(), e);
        }
        return baos.toByteArray();
    }

    // ─── S3 Upload Helpers ────────────────────────────────────────────────────

    private void uploadPublicImage(String key, byte[] imageBytes, String cacheControl) {
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType("image/webp")
                        .cacheControl(cacheControl)
                        .acl(ObjectCannedACL.PUBLIC_READ)
                        .build(),
                RequestBody.fromBytes(imageBytes)
        );
    }

    private void uploadPrivateToSpaces(String key, MultipartFile file) throws IOException {
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(file.getContentType())
                        .contentDisposition("inline")
                        .acl(ObjectCannedACL.PRIVATE)
                        .build(),
                RequestBody.fromBytes(file.getBytes())
        );
    }

    private void ensureFolderExists(String folderPath) {
        String folderKey = folderPath.endsWith("/") ? folderPath : folderPath + "/";
        try {
            s3Client.headObject(HeadObjectRequest.builder()
                    .bucket(bucket)
                    .key(folderKey)
                    .build());
            logger.debug("Folder already exists in Spaces: {}", folderKey);
        } catch (S3Exception e) {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(folderKey)
                            .contentLength(0L)
                            .acl(ObjectCannedACL.PRIVATE)
                            .build(),
                    RequestBody.empty()
            );
            logger.info("Created folder in Spaces: {}", folderKey);
        }
    }

    // ─── URL Helpers ──────────────────────────────────────────────────────────

    private String buildCdnUrl(String key) {
        return cdnEndpoint + "/" + key;
    }

    private String buildOriginUrl(String key) {
        return endpoint.replace("https://", "https://" + bucket + ".") + "/" + key;
    }

    private String extractKey(String url) {
        if (url.startsWith(cdnEndpoint)) {
            return url.replace(cdnEndpoint + "/", "");
        }
        String originBase = endpoint.replace("https://", "https://" + bucket + ".");
        return url.replace(originBase + "/", "");
    }

    private String toSlug(String name) {
        return name.trim()
                .replaceAll("[^a-zA-Z0-9\\s-]", "")
                .replaceAll("\\s+", "-");
    }

    private String getExtension(MultipartFile file) {
        String original = file.getOriginalFilename();
        if (original != null && original.contains(".")) {
            return original.substring(original.lastIndexOf('.'));
        }
        return "";
    }
}