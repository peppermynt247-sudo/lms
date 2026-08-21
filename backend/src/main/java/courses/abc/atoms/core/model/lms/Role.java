package courses.abc.atoms.core.model.lms;

import java.util.List;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;

import org.hibernate.annotations.GenericGenerator;

import courses.abc.atoms.core.model.core.RoleType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long roleId;

    /*
    * Role name
    */
    private String roleName;
    
    private String createdAt;

    public void setName(String name) {
        this.roleName = name.trim();
    }

    public String getName() { 
        return this.roleName;
    }

    // todo this will likely change as role-based access contorl is implemented/refactored
    public String getFullID() {
        return "ROLE_" + roleName;
    }

}