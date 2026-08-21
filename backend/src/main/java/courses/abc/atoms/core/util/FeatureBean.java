package courses.abc.atoms.core.util;

import java.util.List;

import lombok.Data;

@Data
public class FeatureBean {

    String id;
    String scope;
    String name;
    String description;
    String additionalInfo;
    String version;
    String supportedVersions;
    boolean enableManagerRole;
    List<RoleBean> roles;
}

