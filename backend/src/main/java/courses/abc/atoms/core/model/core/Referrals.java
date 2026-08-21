package courses.abc.atoms.core.model.core;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Data
@NoArgsConstructor
public class Referrals {
    @Id
    private String referralId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private BigDecimal wallet;

    private Long referrerId;

}
