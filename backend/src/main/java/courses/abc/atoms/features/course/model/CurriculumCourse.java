package courses.abc.atoms.features.course.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CurriculumCourse {

    @EmbeddedId
    private CurriculumCourseId id = new CurriculumCourseId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("curriculumId")
    @JoinColumn(name = "curriculum_id")
    private Curriculum curriculum;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("courseId")
    @JoinColumn(name = "course_id")
    private Course course;

    private Integer sequenceOrder;
}
