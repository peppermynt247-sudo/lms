package courses.abc.atoms.core.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import courses.abc.atoms.core.model.lms.ApplicationConfiguration;

public interface ApplicationConfigurationRepository extends JpaRepository<ApplicationConfiguration, Long> {
}