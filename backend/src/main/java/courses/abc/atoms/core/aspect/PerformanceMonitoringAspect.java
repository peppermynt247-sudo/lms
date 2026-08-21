package courses.abc.atoms.core.aspect;

import courses.abc.atoms.core.util.PerformanceMonitor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StopWatch;

/**
 * Aspect for automatic performance monitoring of service layer methods.
 * Monitors execution times and logs performance warnings.
 */
@Aspect
@Component
public class PerformanceMonitoringAspect {

    private static final Logger logger = LoggerFactory.getLogger(PerformanceMonitoringAspect.class);

    @Autowired
    private PerformanceMonitor performanceMonitor;

    /**
     * Monitor performance of all service methods
     */
    @Around("execution(* courses.abc.atoms.features.*.services.*.*(..))")
    public Object monitorServiceMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().getDeclaringTypeName() + "." + joinPoint.getSignature().getName();
        StopWatch stopWatch = performanceMonitor.startTiming(methodName);

        try {
            Object result = joinPoint.proceed();
            return result;
        } catch (Exception e) {
            logger.error("Exception in method {}: {}", methodName, e.getMessage());
            throw e;
        } finally {
            performanceMonitor.stopTiming(stopWatch);
        }
    }

    /**
     * Monitor performance of repository methods
     */
    @Around("execution(* courses.abc.atoms.features.*.repositories.*.*(..))")
    public Object monitorRepositoryMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = "REPO." + joinPoint.getSignature().getDeclaringTypeName() + "."
                + joinPoint.getSignature().getName();
        StopWatch stopWatch = performanceMonitor.startTiming(methodName);

        try {
            Object result = joinPoint.proceed();
            return result;
        } finally {
            performanceMonitor.stopTiming(stopWatch);
        }
    }

    /**
     * Monitor performance of controller methods
     */
    @Around("execution(* courses.abc.atoms.features.*.controllers.*.*(..))")
    public Object monitorControllerMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = "CTRL." + joinPoint.getSignature().getDeclaringTypeName() + "."
                + joinPoint.getSignature().getName();
        StopWatch stopWatch = performanceMonitor.startTiming(methodName);

        try {
            Object result = joinPoint.proceed();
            return result;
        } catch (Exception e) {
            logger.error("Exception in controller method {}: {}", methodName, e.getMessage());
            throw e;
        } finally {
            performanceMonitor.stopTiming(stopWatch);
        }
    }
}
