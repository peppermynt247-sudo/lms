package courses.abc.atoms.core.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleDTO {
    private String id;

    private String type;

    private String name;  

    private String description;

    public void setName(String name) {
        this.name = name.trim();
    }
}