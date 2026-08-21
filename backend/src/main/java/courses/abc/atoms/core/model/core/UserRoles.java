package courses.abc.atoms.core.model.core;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.io.Serializable;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@Table(name = "\"User_Roles\"") // Use double quotes for case-sensitive table name in PostgreSQL
public class UserRoles {

    @EmbeddedId
    private UserRoleId id;

    public UserRoles(Long userId, Long roleId) {
        this.id = new UserRoleId(userId, roleId);
    }

    public String getRole() {
        return String.valueOf(id.getRoleId());
    }

    @Embeddable
    @Data
    @NoArgsConstructor
    public static class UserRoleId implements Serializable {
        private Long userId;

        private Long roleId;

        public UserRoleId(Long userId, Long roleId) {
            this.userId = userId;
            this.roleId = roleId;
        }
    }
}

