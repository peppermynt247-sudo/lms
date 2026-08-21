package courses.abc.atoms.features.course.model;

import java.io.Serializable;

public class CurriculumCourseId implements Serializable {

    private Integer curriculumId;
    private Integer courseId;

    // Default constructor required by JPA
    public CurriculumCourseId() {
    }

    // Constructor with parameters
    public CurriculumCourseId(Integer curriculumId, Integer courseId) {
        this.curriculumId = curriculumId;
        this.courseId = courseId;
    }

    // Getters and Setters
    public Integer getCurriculumId() {
        return curriculumId;
    }

    public void setCurriculumId(Integer curriculumId) {
        this.curriculumId = curriculumId;
    }

    public Integer getCourseId() {
        return courseId;
    }

    public void setCourseId(Integer courseId) {
        this.courseId = courseId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;

        CurriculumCourseId that = (CurriculumCourseId) o;

        if (curriculumId != null ? !curriculumId.equals(that.curriculumId) : that.curriculumId != null)
            return false;
        return courseId != null ? courseId.equals(that.courseId) : that.courseId == null;
    }

    @Override
    public int hashCode() {
        int result = curriculumId != null ? curriculumId.hashCode() : 0;
        result = 31 * result + (courseId != null ? courseId.hashCode() : 0);
        return result;
    }
}
