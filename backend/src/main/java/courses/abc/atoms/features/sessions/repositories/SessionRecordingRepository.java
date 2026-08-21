package courses.abc.atoms.features.sessions.repositories;

import courses.abc.atoms.features.sessions.model.SessionRecording;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRecordingRepository extends JpaRepository<SessionRecording, Long> {

    List<SessionRecording> findBySession_SessionId(Long sessionId);

    List<SessionRecording> findBySession_SessionIdAndVisible(Long sessionId, boolean visible);

    /**
     * Fetches a recording only if it belongs to the given session.
     * Used in update operations to combine existence + ownership into a single query.
     */
    Optional<SessionRecording> findByRecordingIdAndSession_SessionId(Long recordingId, Long sessionId);

    /**
     * Efficient ownership check — avoids lazy-loading the parent LiveSession
     * just to verify a recording belongs to a specific session.
     * Used in delete operations to check ownership on the happy path.
     */
    boolean existsByRecordingIdAndSession_SessionId(Long recordingId, Long sessionId);
}
