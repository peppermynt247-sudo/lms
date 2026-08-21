package courses.abc.atoms.features.course.model;

import lombok.Data;
import java.io.Serializable;
import java.util.Objects;

@Data
public class CoursePlanId implements Serializable {
    private Long courseId;
    private Long planId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CoursePlanId that = (CoursePlanId) o;
        return Objects.equals(courseId, that.courseId) && Objects.equals(planId, that.planId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(courseId, planId);
    }
}