package courses.abc.atoms.features.certificates.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
public class WebhookTrigger {
    @JsonProperty("payload")
    private Payload payload;

    // Add a no-args constructor with logging for debugging
    public WebhookTrigger() {
        System.out.println("WebhookTrigger instantiated with payload: " + this.payload);
    }
}