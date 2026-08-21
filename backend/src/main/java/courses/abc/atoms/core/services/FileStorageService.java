package courses.abc.atoms.core.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path baseUploadDir;

    public FileStorageService(@Value("${file.upload-dir}") String baseUploadDir) {
        this.baseUploadDir = Paths.get(baseUploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.baseUploadDir);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create the base directory where uploaded files will be stored.", ex);
        }
    }

    public String storeFile(MultipartFile file, String subDirectory) {
        try {
            Path subDirPath = Paths.get(baseUploadDir.toString(), subDirectory).toAbsolutePath().normalize();
            Files.createDirectories(subDirPath);

            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename != null ? originalFilename.substring(originalFilename.lastIndexOf(".")) : ".pdf";
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;

            Path targetLocation = subDirPath.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), targetLocation);

            return Paths.get(subDirectory, uniqueFileName).toString(); // Relative path for storage
        } catch (IOException ex) {
            throw new RuntimeException("Could not store the file. Error: " + ex.getMessage(), ex);
        }
    }
}
