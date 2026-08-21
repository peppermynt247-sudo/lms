package courses.abc.atoms.features.course.dto;

import courses.abc.atoms.features.course.model.ContentItem;
import lombok.Data;
import java.util.Collections;
import java.util.List;
import java.util.Map;

// This is the main response DTO when fetching a section's content
@Data
public class SectionContentDTO {
    // The raw list of ContentItem wrappers
    private List<ContentItem> contentItems;

    // A map for each content type for easy lookup on the frontend
    private Map<Integer, ExerciseDTO.SummaryResponse> exercises = Collections.emptyMap();
    
    // For the future, you would add more maps here
    private Map<Integer, CodingExerciseDTO.SummaryResponse> elabs;

    private Map<Integer, VideoDTO.SummaryResponse> videos = Collections.emptyMap();

    private Map<Long, EbookDTO.SummaryResponse> ebooks = Collections.emptyMap();
    
}