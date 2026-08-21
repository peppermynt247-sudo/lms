package courses.abc.atoms.features.course.repositories;

import courses.abc.atoms.features.course.model.CourseAccessControl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CourseAccessControlRepository extends JpaRepository<CourseAccessControl,Long> {

    CourseAccessControl  findByUser_IdAndCourse_CourseId(Long userId,Long CourseId);
    CourseAccessControl  findByUser_IdAndBundle_BundleId(Long userId,Long BundleId);


    @Modifying
    @Query("UPDATE CourseAccessControl e SET e.accessGranted = false WHERE e.activeBy < :currentDate AND e.accessGranted = true")
    int revokeExpiredAccess(@Param("currentDate") LocalDateTime currentDate);




    @Query("SELECT e FROM CourseAccessControl e WHERE e.activeBy < :currentDate AND e.accessGranted = true")
    List<CourseAccessControl> findExpiredEntities(@Param("currentDate") LocalDateTime currentDate);

}
