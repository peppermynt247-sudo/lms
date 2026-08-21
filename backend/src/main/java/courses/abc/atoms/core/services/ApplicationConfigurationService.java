package courses.abc.atoms.core.services;

import java.util.Optional;

import jakarta.transaction.Transactional;

import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.core.model.lms.ApplicationConfiguration;
import courses.abc.atoms.core.repositories.ApplicationConfigurationRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ApplicationConfigurationService {

    @Autowired
    private ApplicationConfigurationRepository applicationConfigurationRepository;

    /*
     * Creates the initial application configuration. Only one of these exists, and
     * this is only created on the first call. Subsequent calls return the existing
     * application configuration.
     *
     * return ApplicationConfiguration
     */
    @Transactional
    public ApplicationConfiguration createApplicationConfiguration() {
        // check to see if an application configuration exists currently
        // only one ever exists with the id of 0, so we query by that Id
        Optional<ApplicationConfiguration> applicationConfigurationRep = applicationConfigurationRepository
                .findById(0L);

        ApplicationConfiguration applicationConfiguration;
        if (applicationConfigurationRep.isPresent()) {
            // it exists already, return this object
            applicationConfiguration = applicationConfigurationRep.get();
        } else {
            // it doesn't exist yet, this is the first call of this method, let's create the
            // initial application configuration
            ApplicationConfiguration newApplicationConfiguration = new ApplicationConfiguration();
            newApplicationConfiguration.setId(0L);

            applicationConfiguration = applicationConfigurationRepository.save(newApplicationConfiguration);
        }

        return applicationConfiguration;
    }

    public Optional<ApplicationConfiguration> getApplicationConfiguration() {
        return applicationConfigurationRepository.findById(0L);
    }

    @Transactional
    public ApplicationConfiguration setSetupComplete() {
        Optional<ApplicationConfiguration> applicationConfigurationRep = getApplicationConfiguration();

        if (applicationConfigurationRep.isPresent()) {
            // update existing one
            ApplicationConfiguration existingApplicationConfiguration = applicationConfigurationRep.get();

            existingApplicationConfiguration.setSetupComplete(true);

            return applicationConfigurationRepository.save(existingApplicationConfiguration);
        } else {
            throw new ResourceNotFoundException("Application configuration not found");
        }
    }

    @Transactional
    public ApplicationConfiguration updateApplicationConfiguration(ApplicationConfiguration applicationConfiguration) {
        Optional<ApplicationConfiguration> applicationConfigurationRep = getApplicationConfiguration();

        if (applicationConfigurationRep.isPresent()) {
            // update existing one
            ApplicationConfiguration existingApplicationConfiguration = applicationConfigurationRep.get();

            existingApplicationConfiguration
                    .setFirstApplicationStart(applicationConfiguration.isFirstApplicationStart());
            existingApplicationConfiguration.setSetupComplete(applicationConfiguration.isSetupComplete());
            existingApplicationConfiguration.setInstalledVersion(applicationConfiguration.getInstalledVersion());
            existingApplicationConfiguration.setAvailableVersion(applicationConfiguration.getAvailableVersion());

            return applicationConfigurationRepository.save(existingApplicationConfiguration);
        } else {
            throw new ResourceNotFoundException("Application configuration not found");
        }
    }
}
