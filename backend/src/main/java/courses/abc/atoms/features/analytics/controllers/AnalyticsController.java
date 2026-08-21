package courses.abc.atoms.features.analytics.controllers;

import courses.abc.atoms.core.dto.ApiResponse;
import courses.abc.atoms.features.analytics.dto.AnalyticsDTO;
import courses.abc.atoms.features.analytics.services.AnalyticsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
public class AnalyticsController {

    private static final Logger logger = LoggerFactory.getLogger(AnalyticsController.class);

    @Autowired
    private AnalyticsService analyticsService;

    /**
     * Retrieves an overview of key LMS metrics.
     *
     * @return ResponseEntity with analytics data and appropriate HTTP status
     */
    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<AnalyticsDTO>> getAnalyticsOverview() {
        logger.info("API hit: GET /api/analytics/overview");
        try {
            AnalyticsDTO analytics = analyticsService.getOverviewAnalytics();
            logger.info("Successfully retrieved analytics overview.");
            return ResponseEntity.ok(ApiResponse.success(analytics, "Analytics overview retrieved successfully."));
        } catch (Exception e) {
            logger.error("An unexpected error occurred while retrieving the analytics overview: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred while fetching analytics."));
        }
    }
}