package courses.abc.atoms.core.model.core;

import com.fasterxml.jackson.annotation.JsonValue;
public enum RoleType {
    ADMIN("ADMIN"),
    FEATURE("FEATURE"), 
    INSTRUCTOR("INSTRUCTOR"),
    STUDENT("STUDENT"),
    TECH_SUPPORT("TECH_SUPPORT");
    private final String role;
    
    RoleType(String role) {
        this.role = role;
    }
    @JsonValue
    public String getRole() {
        return role;
    }

}
