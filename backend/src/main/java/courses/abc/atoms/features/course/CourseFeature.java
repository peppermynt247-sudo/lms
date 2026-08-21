package courses.abc.atoms.features.course;

import org.springframework.stereotype.Component;

import courses.abc.atoms.core.services.FeatureManagerService;
import courses.abc.atoms.core.util.LMSFeature;

@Component
public class CourseFeature extends LMSFeature {
    
    public CourseFeature(FeatureManagerService featureManagerService) {
        super(featureManagerService);
    }
}