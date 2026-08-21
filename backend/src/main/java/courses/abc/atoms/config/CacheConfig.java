package courses.abc.atoms.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import java.util.Arrays;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;

/**
 * Comprehensive Performance and Cache configuration for the LMS application.
 * Combines caching, async processing, and thread pool management for optimal performance.
 */
@Configuration
@EnableCaching
@EnableAsync
@EnableTransactionManagement
public class CacheConfig {

    // ========================================
    // CACHE CONFIGURATION
    // ========================================

    /**
     * Primary cache manager with general caching policy
     */
    @Bean
    @Primary
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();

        // Configure general cache policy for most data types
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(30, TimeUnit.MINUTES)
                .recordStats());

        // Set cache names - enhanced for performance optimizations
        cacheManager.setCacheNames(Arrays.asList(
            "courses", 
            "course-thumbnails", 
            "content-items",
            "curriculums",
            "featured-courses",
            "instructor-courses",
            "enrollments", 
            "users",
            "exercises",
            "questions",
            "sections"
        ));

        return cacheManager;
    }

    /**
     * Specialized cache manager for course data with longer TTL
     */
    @Bean("courseCacheManager")
    public CacheManager courseCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("courses");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(1, TimeUnit.HOURS)
                .expireAfterAccess(30, TimeUnit.MINUTES)
                .recordStats());
        return cacheManager;
    }

    /**
     * Specialized cache manager for thumbnail images with extended TTL
     */
    @Bean("thumbnailCacheManager")
    public CacheManager thumbnailCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("course-thumbnails");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(200)
                .expireAfterWrite(2, TimeUnit.HOURS)
                .expireAfterAccess(1, TimeUnit.HOURS)
                .recordStats());
        return cacheManager;
    }

    /**
     * Fast cache for frequently accessed content items
     */
    @Bean("contentCacheManager")
    public CacheManager contentCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("content-items");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(800)
                .expireAfterWrite(45, TimeUnit.MINUTES)
                .expireAfterAccess(15, TimeUnit.MINUTES)
                .recordStats());
        return cacheManager;
    }

    // ========================================
    // ASYNC PROCESSING CONFIGURATION
    // ========================================

    /**
     * Primary async executor for general background tasks
     */
    @Bean(name = "taskExecutor")
    @Primary
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("LMS-Async-");
        executor.setKeepAliveSeconds(60);
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }

    /**
     * Specialized executor for image processing and thumbnail generation
     */
    @Bean(name = "imageExecutor")
    public Executor imageExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("Image-Processing-");
        executor.setKeepAliveSeconds(30);
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(15);
        executor.initialize();
        return executor;
    }

    /**
     * Dedicated executor for Judge0 API calls and code execution tasks
     */
    @Bean(name = "judge0Executor")
    public Executor judge0Executor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(3);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(25);
        executor.setThreadNamePrefix("Judge0-API-");
        executor.setKeepAliveSeconds(45);
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(20);
        executor.initialize();
        return executor;
    }

    /**
     * High-priority executor for real-time operations (notifications, etc.)
     */
    @Bean(name = "realTimeExecutor")
    public Executor realTimeExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(3);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(20);
        executor.setThreadNamePrefix("RealTime-");
        executor.setKeepAliveSeconds(30);
        executor.setWaitForTasksToCompleteOnShutdown(false); // Don't wait for real-time tasks
        executor.setAwaitTerminationSeconds(5);
        executor.initialize();
        return executor;
    }
}
