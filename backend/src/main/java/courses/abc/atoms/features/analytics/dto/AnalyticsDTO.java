package courses.abc.atoms.features.analytics.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class AnalyticsDTO {
    private long numberOfCourses;
    private long numberOfBundles;
    private long numberOfBatches;
    private long numberOfStudents;
    private long numberOfEnrolledStudents;
    private BigDecimal totalRevenue;
}