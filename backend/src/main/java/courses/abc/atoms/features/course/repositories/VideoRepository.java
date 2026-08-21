package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.features.course.model.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VideoRepository extends JpaRepository<Video, Integer> {

    /**
     * Finds a video by its unique Videocipher ID.
     *
     * @param vdoCipherId The unique ID provided by Videocipher.
     * @return An Optional containing the Video if found.
     */
    Optional<Video> findByVdoCipherId(String vdoCipherId);


    /**
     * Finds a video by its unique ID.
     *
     * @param videoId The unique ID of the video.
     * @return An Optional containing the Video if found.
     */
    Optional<Video> findByVideoId(Integer videoId);
}
