package courses.abc.atoms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Performance monitoring configuration
 * 
 * This configuration provides basic performance monitoring.
 * For production use with advanced metrics, enable the Actuator endpoints.
 */
@Configuration
public class PerformanceMonitoringConfig {

    /**
     * Basic performance monitoring filter
     */
    @Bean
    public OncePerRequestFilter basicPerformanceFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                    FilterChain filterChain) throws ServletException, IOException {
                long startTime = System.currentTimeMillis();

                try {
                    filterChain.doFilter(request, response);
                } finally {
                    long duration = System.currentTimeMillis() - startTime;
                }
            }
        };
    }

    /*
     * PRODUCTION-READY VERSION WITH MICROMETER METRICS
     * 
     * To enable advanced metrics, add these imports:
     * import io.micrometer.core.instrument.MeterRegistry;
     * import io.micrometer.core.instrument.Timer;
     * import io.micrometer.core.aop.TimedAspect;
     * 
     * Then uncomment this section:
     * 
     * @Bean
     * public OncePerRequestFilter micrometerPerformanceFilter(MeterRegistry
     * meterRegistry) {
     * return new OncePerRequestFilter() {
     * 
     * @Override
     * protected void doFilterInternal(HttpServletRequest request,
     * HttpServletResponse response,
     * FilterChain filterChain) throws ServletException, IOException {
     * Timer.Sample sample = Timer.start(meterRegistry);
     * 
     * try {
     * filterChain.doFilter(request, response);
     * } finally {
     * sample.stop(Timer.builder("http.request.duration")
     * .tag("method", request.getMethod())
     * .tag("status", String.valueOf(response.getStatus()))
     * .tag("uri", request.getRequestURI())
     * .register(meterRegistry));
     * }
     * }
     * };
     * }
     */
}
