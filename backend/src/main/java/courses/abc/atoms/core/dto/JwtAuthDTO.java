package courses.abc.atoms.core.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class JwtAuthDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JwtAuthenticationResponse {
        private String accessToken;
        private String tokenType = "Bearer";
        private Long userId;
        // private String name;
        private String email;
        private List<String> role;
        private String sessionId; // Add session ID field
    }
}