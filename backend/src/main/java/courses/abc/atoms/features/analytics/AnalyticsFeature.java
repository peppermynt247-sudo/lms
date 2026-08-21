package courses.abc.atoms.features.analytics;

import courses.abc.atoms.core.services.FeatureManagerService;
import courses.abc.atoms.core.util.LMSFeature;
import org.springframework.stereotype.Component;

@Component
public class AnalyticsFeature extends LMSFeature {

    public AnalyticsFeature(FeatureManagerService featureManagerService) {
        super(featureManagerService);
    }
}