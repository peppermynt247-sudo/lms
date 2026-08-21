package courses.abc.atoms.features.analytics.services;

import courses.abc.atoms.features.analytics.dto.AnalyticsDTO;
import courses.abc.atoms.features.analytics.repositories.AnalyticsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class AnalyticsService {

    @Autowired
    private AnalyticsRepository analyticsRepository;

    @Transactional(readOnly = true)
    public AnalyticsDTO getOverviewAnalytics() {
        long courseCount = analyticsRepository.countCourses();
        long bundleCount = analyticsRepository.countBundles();
        long batchCount = analyticsRepository.countBatches();
        long studentCount = analyticsRepository.countStudents();
        long enrollmentCount = analyticsRepository.countEnrollments();
        BigDecimal totalRevenue = analyticsRepository.sumTotalRevenue();

        return AnalyticsDTO.builder()
                .numberOfCourses(courseCount)
                .numberOfBundles(bundleCount)
                .numberOfBatches(batchCount)
                .numberOfStudents(studentCount)
                .numberOfEnrolledStudents(enrollmentCount)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .build();
    }
}