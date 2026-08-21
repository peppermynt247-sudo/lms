package courses.abc.atoms.features.course.model;

import jakarta.persistence.*;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "question_options")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionOptions {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long optionId;
    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private Question questionId;
    private String optionText;
    private Boolean isCorrect;
    private String explanation;
    private Integer optionOrder;
}