package courses.abc.atoms.features.certificates.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
public class Payload {
    private String college;
    private String postAssessmentScore;
    private String leadType;
    private String workshop_interest;
    private String implementation_decision_factores;
    private String leadName;
    private String _360_rejection_reason;
    private String Program_implemented;
    private String whatsappNo;
    private String Mobile;
    private String email;
    private String preAssessmentScore;

    // Add a no-args constructor with logging
    public Payload() {
        System.out.println("Payload instantiated");
    }
}