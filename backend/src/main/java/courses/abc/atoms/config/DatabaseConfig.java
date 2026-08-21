package courses.abc.atoms.config;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * Database performance optimization configuration.
 * Configures JPA settings for better performance.
 */
@Configuration
@EnableJpaRepositories(basePackages = {
    "courses.abc.atoms.features.*.repositories",
    "courses.abc.atoms.core.repositories"
})
@EntityScan(basePackages = {
    "courses.abc.atoms.features.*.model", 
    "courses.abc.atoms.core.model.core",
    "courses.abc.atoms.core.model.lms"
})
@EnableTransactionManagement
public class DatabaseConfig {

    /**
     * Transaction manager optimized for read-heavy workloads
     */
    @Bean
    public PlatformTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(entityManagerFactory);

        // Optimize for performance
        transactionManager.setDefaultTimeout(30); // 30 second timeout
        transactionManager.setRollbackOnCommitFailure(true);

        return transactionManager;
    }
}
