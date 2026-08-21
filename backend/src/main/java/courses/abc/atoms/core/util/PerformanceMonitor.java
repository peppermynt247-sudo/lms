package courses.abc.atoms.core.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StopWatch;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Performance monitoring utility for tracking method execution times
 * and database query performance.
 */
@Component
public class PerformanceMonitor {

    private static final Logger logger = LoggerFactory.getLogger(PerformanceMonitor.class);

    private final ConcurrentHashMap<String, AtomicLong> executionCounts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AtomicLong> totalExecutionTimes = new ConcurrentHashMap<>();

    /**
     * Start timing a method execution
     */
    public StopWatch startTiming(String methodName) {
        StopWatch stopWatch = new StopWatch(methodName);
        stopWatch.start();
        return stopWatch;
    }

    /**
     * Stop timing and log performance metrics
     */
    public void stopTiming(StopWatch stopWatch) {
        stopWatch.stop();
        String taskName = stopWatch.getId();
        long executionTime = stopWatch.getTotalTimeMillis();

        // Update counters
        executionCounts.computeIfAbsent(taskName, k -> new AtomicLong(0)).incrementAndGet();
        totalExecutionTimes.computeIfAbsent(taskName, k -> new AtomicLong(0)).addAndGet(executionTime);

        // Log performance warning if execution is slow
        if (executionTime > 1000) { // More than 1 second
            logger.warn("Slow execution detected: {} took {}ms", taskName, executionTime);
        } else if (executionTime > 500) { // More than 500ms
            logger.info("Performance notice: {} took {}ms", taskName, executionTime);
        } else {
            logger.debug("Execution time: {} took {}ms", taskName, executionTime);
        }
    }

    /**
     * Get average execution time for a method
     */
    public double getAverageExecutionTime(String methodName) {
        AtomicLong count = executionCounts.get(methodName);
        AtomicLong totalTime = totalExecutionTimes.get(methodName);

        if (count == null || totalTime == null || count.get() == 0) {
            return 0.0;
        }

        return (double) totalTime.get() / count.get();
    }

    /**
     * Log performance summary for all tracked methods
     */
    public void logPerformanceSummary() {
        logger.info("=== Performance Summary ===");
        executionCounts.forEach((method, count) -> {
            double avgTime = getAverageExecutionTime(method);
            logger.info("Method: {}, Executions: {}, Avg Time: {:.2f}ms",
                    method, count.get(), avgTime);
        });
        logger.info("=== End Performance Summary ===");
    }

    /**
     * Reset all performance counters
     */
    public void reset() {
        executionCounts.clear();
        totalExecutionTimes.clear();
        logger.info("Performance monitoring counters reset");
    }

    /**
     * Check if a method is performing poorly
     */
    public boolean isPerformingPoorly(String methodName, double thresholdMs) {
        return getAverageExecutionTime(methodName) > thresholdMs;
    }
}
