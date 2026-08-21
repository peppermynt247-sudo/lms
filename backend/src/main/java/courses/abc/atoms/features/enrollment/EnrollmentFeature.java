package courses.abc.atoms.features.enrollment;

import org.springframework.stereotype.Component;

import courses.abc.atoms.core.services.FeatureManagerService;
import courses.abc.atoms.core.util.LMSFeature;

@Component
public class EnrollmentFeature extends LMSFeature {
    
    public EnrollmentFeature(FeatureManagerService featureManagerService) {
        super(featureManagerService);
    }
}