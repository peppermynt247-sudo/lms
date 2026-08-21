package courses.abc.atoms.features.sessions.repositories;

import courses.abc.atoms.features.sessions.enums.SessionStatus;
import courses.abc.atoms.features.sessions.model.LiveSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LiveSessionRepository extends JpaRepository<LiveSession, Long> {

    /**
     * Fetches a single session with all detail associations eagerly loaded via JOIN FETCH.
     * Prevents N+1 queries when accessing batch, course, instructor, and createdBy in mappers.
     * Used for detail view, update, and status-change operations.
     */
    @Query("SELECT ls FROM LiveSession ls " +
           "LEFT JOIN FETCH ls.batch " +
           "LEFT JOIN FETCH ls.course " +
           "LEFT JOIN FETCH ls.instructor " +
           "LEFT JOIN FETCH ls.createdBy " +
           "WHERE ls.sessionId = :id")
    Optional<LiveSession> findByIdWithDetails(@Param("id") Long id);

    /**
     * Paginated session list with optional batchId and status filters.
     * Uses a named @EntityGraph (not JOIN FETCH) to eagerly load batch and course — JOIN FETCH
     * inside paginated JPQL forces Hibernate to apply pagination in memory (HHH90003004).
     * The named entity graph produces a SQL JOIN at the query level without that side-effect.
     * A separate countQuery is required to prevent the entity graph joins from inflating the total count.
     */
    @EntityGraph("LiveSession.withBatchAndCourse")
    @Query(value = "SELECT ls FROM LiveSession ls WHERE " +
                   "(:batchId IS NULL OR ls.batch.batchId = :batchId) AND " +
                   "(:status IS NULL OR ls.status = :status) " +
                   "ORDER BY ls.scheduledAt DESC",
           countQuery = "SELECT COUNT(ls) FROM LiveSession ls WHERE " +
                        "(:batchId IS NULL OR ls.batch.batchId = :batchId) AND " +
                        "(:status IS NULL OR ls.status = :status)")
    Page<LiveSession> findWithFilters(@Param("batchId") Long batchId,
                                      @Param("status") SessionStatus status,
                                      Pageable pageable);

    /**
     * Fetches live and upcoming scheduled sessions for a list of batch IDs.
     * JOIN FETCH on batch and course prevents N+1 queries when iterating results in the dashboard mapper.
     * Used for the student home/dashboard endpoint.
     */
    @Query("SELECT ls FROM LiveSession ls " +
           "LEFT JOIN FETCH ls.batch " +
           "LEFT JOIN FETCH ls.course " +
           "WHERE ls.batch.batchId IN :batchIds " +
           "AND (ls.status = :liveStatus OR (ls.status = :scheduledStatus AND ls.scheduledAt >= :now)) " +
           "ORDER BY ls.scheduledAt ASC")
    List<LiveSession> findLiveAndUpcomingForBatches(@Param("batchIds") List<Long> batchIds,
                                                    @Param("now") LocalDateTime now,
                                                    @Param("liveStatus") SessionStatus liveStatus,
                                                    @Param("scheduledStatus") SessionStatus scheduledStatus);

    /**
     * Fetches all sessions for a batch in descending scheduled-time order.
     * JOIN FETCH on batch and course prevents N+1 queries when mapping results to DTOs.
     */
    @Query("SELECT ls FROM LiveSession ls " +
           "LEFT JOIN FETCH ls.batch " +
           "LEFT JOIN FETCH ls.course " +
           "WHERE ls.batch.batchId = :batchId " +
           "ORDER BY ls.scheduledAt DESC")
    List<LiveSession> findByBatchIdOrdered(@Param("batchId") Long batchId);
}
