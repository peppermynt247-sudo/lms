package courses.abc.atoms.core.util;

import java.util.List;

import lombok.Data;

@Data
public class RoleBean {

    String role;
    String description;
    List<String> permissions;
    
}
