package courses.abc.atoms.features.course.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;

import courses.abc.atoms.features.course.dto.ContentProgressDTO;
import courses.abc.atoms.features.course.services.ContentProgressService;



@RestController 
@RequestMapping("/api/content-progress")
@PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR', 'STUDENT')")
public class ContentProgressController {

    @Autowired
    private ContentProgressService contentProgressService;
    

    @PostMapping("/update")
    public ResponseEntity<String> updateContentProgress(@RequestBody ContentProgressDTO.ContentProgressRequest request) {
        try {
            contentProgressService.saveContentProgress(request);
            return ResponseEntity.status(HttpStatus.OK).body("Content progress updated successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred: " + e.getMessage());
        }
    }
    

}
