package courses.abc.atoms.features.course.controllers;

import courses.abc.atoms.core.dto.ApiResponse;
import courses.abc.atoms.core.dto.PageResponse;
import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.services.UserService;
import courses.abc.atoms.features.course.dto.CourseDTO;
import courses.abc.atoms.features.course.dto.CurriculumDTO;
import courses.abc.atoms.features.course.services.CourseService;
import courses.abc.atoms.features.course.services.CurriculumService;
import courses.abc.atoms.features.payment.model.PaymentPlans;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @Autowired
    private UserService userService;

    @Autowired
    private CurriculumService curriculumService;

    /**
     * POST /api/courses : Create a new course.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_OCTET_STREAM_VALUE })
    public ResponseEntity<ApiResponse<CourseDTO.CourseResponse>> createCourse(
            @Valid @RequestPart("course") CourseDTO.CourseCreateRequest courseRequest,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) {
        try {
            Long instructorId = userService.getCurrentUser().getId();
            CourseDTO.CourseResponse createdCourse = courseService.createCourse(courseRequest, imageFile, instructorId);
            return new ResponseEntity<>(ApiResponse.success(createdCourse, "Course created successfully"),
                    HttpStatus.CREATED);
        } catch (IOException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Failed to process image file. Please check the file and try again."));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("A course with the same 'prettyName' may already exist."));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while creating the course."));
        }
    }

    /**
     * GET /api/courses : Get all courses with pagination.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR', 'STUDENT')")
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CourseDTO.CourseResponse>>> getAllCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "false") boolean archived) {
        try {
            Page<CourseDTO.CourseResponse> courses = courseService.getAllCourses(page, size, archived);
            PageResponse<CourseDTO.CourseResponse> pageResponse = PageResponse.of(courses);
            return ResponseEntity.ok(ApiResponse.success(pageResponse, "Courses retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while retrieving courses."));
        }
    }

    /**
     * GET /api/courses/archived : Get all archived courses with pagination.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @GetMapping("/archived")
    public ResponseEntity<ApiResponse<PageResponse<CourseDTO.CourseResponse>>> getArchivedCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Page<CourseDTO.CourseResponse> courses = courseService.getAllCourses(page, size, true);
            PageResponse<CourseDTO.CourseResponse> pageResponse = PageResponse.of(courses);
            return ResponseEntity.ok(ApiResponse.success(pageResponse, "Archived courses retrieved successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Invalid page or size parameter."));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while retrieving archived courses."));
        }
    }

    /**
     * GET /api/courses/legacy : Legacy endpoint for backward compatibility.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR', 'STUDENT')")
    @GetMapping("/legacy")
    public ResponseEntity<ApiResponse<List<CourseDTO.CourseResponse>>> getAllCoursesLegacy() {
        try {
            List<CourseDTO.CourseResponse> courses = courseService.getAllCourses();
            return ResponseEntity.ok(ApiResponse.success(courses, "Courses retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while retrieving courses."));
        }
    }

    /**
     * GET /api/courses/instructor/{instructorId} : Get courses by instructor with
     * pagination.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @GetMapping("/instructor/{instructorId}")
    public ResponseEntity<ApiResponse<PageResponse<CourseDTO.CourseResponse>>> getCoursesByInstructor(
            @PathVariable Long instructorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Page<CourseDTO.CourseResponse> courses = courseService.getCoursesByInstructor(instructorId, page, size);
            PageResponse<CourseDTO.CourseResponse> pageResponse = PageResponse.of(courses);
            return ResponseEntity.ok(ApiResponse.success(pageResponse, "Instructor courses retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while retrieving instructor courses."));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/bundle/{bundleId}")
    public ResponseEntity<ApiResponse<List<CourseDTO.CourseResponse>>> getCoursesByBundleId(
            @PathVariable Long bundleId
    ) {
        try {
            List<CourseDTO.CourseResponse> courses = courseService.getCoursesByBundleId(bundleId);
            return ResponseEntity.ok(ApiResponse.success(courses, "Bundle courses retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while retrieving bundle courses."));
        }
    }

    /**
     * GET /api/courses/featured : Get featured courses.
     */
    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<CourseDTO.CourseResponse>>> getFeaturedCourses() {
        try {
            List<CourseDTO.CourseResponse> courses = courseService.getFeaturedCourses();
            return ResponseEntity.ok(ApiResponse.success(courses, "Featured courses retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while retrieving featured courses."));
        }
    }

    /**
     * PUT /api/courses/bulk-archive : Bulk archive/unarchive courses.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/bulk-archive")
    public ResponseEntity<ApiResponse<String>> bulkUpdateArchiveStatus(
            @RequestBody List<Long> courseIds,
            @RequestParam boolean archived) {
        try {
            int updatedCount = courseService.bulkUpdateArchiveStatus(courseIds, archived);
            String message = String.format("Successfully updated archive status for %d courses", updatedCount);
            return ResponseEntity.ok(ApiResponse.success(message, message));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred during bulk archive operation."));
        }
    }

    /**
     * GET /api/courses/{id} : Get a single course by its ID.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR', 'STUDENT')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseDTO.CourseResponse>> getCourseById(@PathVariable Long id) {
        try {
            CourseDTO.CourseResponse course = courseService.getCourseById(id);
            return ResponseEntity.ok(ApiResponse.success(course, "Course retrieved successfully"));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while retrieving the course."));
        }
    }

    /**
     * PUT /api/courses/{id} : Update an existing course.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<CourseDTO.CourseResponse>> updateCourse(
            @PathVariable Long id,
            @Valid @RequestPart("course") CourseDTO.CourseUpdateRequest courseRequest,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) {
        try {
            CourseDTO.CourseResponse updatedCourse = courseService.updateCourse(id, courseRequest, imageFile);
            return ResponseEntity.ok(ApiResponse.success(updatedCourse, "Course updated successfully"));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Failed to process image file. Please check the file and try again."));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while updating the course."));
        }
    }

    /**
     * PATCH /api/courses/{id}/archive : Archive or unarchive a course.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @PatchMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<CourseDTO.CourseResponse>> archiveCourse(
            @PathVariable Long id,
            @Valid @RequestBody CourseDTO.ArchiveStatusRequest request) {
        try {
            CourseDTO.CourseResponse updatedCourse = courseService.setArchiveStatus(id, request.isArchived());
            return ResponseEntity.ok(ApiResponse.success(updatedCourse, "Course archive status updated successfully"));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while updating the archive status."));
        }
    }

    /**
     * DELETE /api/courses/{id} : Delete a course.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable Long id) {
        try {
            courseService.deleteCourse(id);
            return ResponseEntity.ok(ApiResponse.success("Course deleted successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while deleting the course."));
        }
    }


    /**
     * POST /api/courses/{courseId}/curriculums/{curriculumId} : Link a curriculum to a course.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @PostMapping("/{courseId}/curriculums/{curriculumId}")
    public ResponseEntity<ApiResponse<CourseDTO.CourseResponse>> linkCurriculum(
            @PathVariable Long courseId,
            @PathVariable Integer curriculumId) {
        try {
            CourseDTO.CourseResponse updatedCourse = courseService.linkCurriculumToCourse(courseId, curriculumId);
            return ResponseEntity.ok(ApiResponse.success(updatedCourse, "Curriculum linked successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while linking the curriculum."));
        }
    }

    /**
     * DELETE /api/courses/{courseId}/curriculums/{curriculumId} : Unlink a curriculum from a course.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @DeleteMapping("/{courseId}/curriculums/{curriculumId}")
    public ResponseEntity<ApiResponse<CourseDTO.CourseResponse>> unlinkCurriculum(
            @PathVariable Long courseId,
            @PathVariable Integer curriculumId) {
        try {
            CourseDTO.CourseResponse updatedCourse = courseService.unlinkCurriculumFromCourse(courseId, curriculumId);
            return ResponseEntity.ok(ApiResponse.success(updatedCourse, "Curriculum unlinked successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while unlinking the curriculum."));
        }
    }

    /**
     * PUT /api/courses/{courseId}/curriculums/{curriculumId}/set-default : Set default curriculum for a course.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @PutMapping("/{courseId}/curriculums/{curriculumId}/set-default")
    public ResponseEntity<ApiResponse<CourseDTO.CourseResponse>> setDefaultCurriculum(
            @PathVariable Long courseId,
            @PathVariable Integer curriculumId) {
        try {
            CourseDTO.CourseResponse updatedCourse = courseService.setDefaultCurriculum(courseId, curriculumId);
            return ResponseEntity.ok(ApiResponse.success(updatedCourse, "Default curriculum updated successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while updating default curriculum."));
        }
    }

    /**
     * Associates a payment plan with a course.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @PostMapping("/{courseId}/plans")
    public ResponseEntity<ApiResponse<Void>> addPlanToCourse(
            @PathVariable Long courseId,
            @Valid @RequestBody CourseDTO.PlanRequest planRequest) {

        try {
            courseService.addPlanToCourse(courseId, planRequest.getPlanId());
            String message = String.format("Payment plan successfully added to course %d.", courseId);
            return ResponseEntity.ok(ApiResponse.success(null, message));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred."));
        }
    }

    @GetMapping("/{courseId}/plans")
    public ResponseEntity<ApiResponse<List<PaymentPlans>>> getPlansForCourse(@PathVariable Long courseId) {
        List<PaymentPlans> plans = courseService.getPlansForCourse(courseId);
        return ResponseEntity.ok(ApiResponse.success(plans, "Plans retrieved successfully"));
    }

    /**
     * Updates the pricing and validity for a specific course.
     */
    @PutMapping("/{courseId}/pricing")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<ApiResponse<Void>> updateCoursePricing(
            @PathVariable Long courseId,
            @RequestBody CourseDTO.PricingRequest pricingRequest) {

        courseService.updateCoursePricing(courseId, pricingRequest);
        return ResponseEntity.ok(ApiResponse.success("Course pricing updated successfully."));
    }

    /**
     * Updates the publish status for a specific course.
     */
    @PatchMapping("/{courseId}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<ApiResponse<Void>> setPublishStatus(
            @PathVariable Long courseId,
            @Valid @RequestBody CourseDTO.PublishRequest request) {

        courseService.setPublishStatus(courseId, request.getIsPublished());
        return ResponseEntity.ok(ApiResponse.success("Course publish status updated successfully."));
    }

    @GetMapping("/{courseId}/pricing-details")
    public ResponseEntity<ApiResponse<CourseDTO.PricingAndPlansResponses>> getCoursePricingDetails(@PathVariable Long courseId) {
        try {
            CourseDTO.PricingAndPlansResponses response = courseService.getCoursePricingAndPlans(courseId);
            return ResponseEntity.ok(ApiResponse.success(response, "Pricing details retrieved successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /api/courses/{courseId}/header : Gets the context for the student course view page.
     */
    @GetMapping("/{courseId}/header")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<ApiResponse<CourseDTO.CourseContextResponse>> getCourseHeader(@PathVariable Long courseId) {
        try {
            Long userId = userService.getCurrentUser().getId();
            CourseDTO.CourseContextResponse response = courseService.getCourseContextForStudent(courseId, userId);
            return ResponseEntity.ok(ApiResponse.success(response, "Course header context retrieved successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /api/courses/{courseId}/curriculums/{curriculumId}/student-view : Gets the detailed view of a curriculum.
     */
    @GetMapping("/{courseId}/curriculums/{curriculumId}/student-view")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<ApiResponse<CurriculumDTO.CurriculumViewResponse>> getStudentCurriculumView(
            @PathVariable Long courseId,
            @PathVariable Integer curriculumId) {
        try {
            Long userId = userService.getCurrentUser().getId();
            CurriculumDTO.CurriculumViewResponse response = curriculumService.getCurriculumViewForStudent(curriculumId, userId);
            return ResponseEntity.ok(ApiResponse.success(response, "Curriculum view retrieved successfully."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/learners")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<Map<String,Object>> getAllLearners( @RequestParam Long courseId, @RequestParam(required = false) Long batchId){
        try{
            List<CourseDTO.AllLearners> learners =courseService.getAllLearners(courseId,batchId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "All learners successfully retrieve");
            response.put("data", learners);

            return new ResponseEntity<>(response, HttpStatus.OK);
        }catch (ResourceNotFoundException e){
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "course not found"+e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Unable retrieve the learners"+e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
