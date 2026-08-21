package courses.abc.atoms.core.util;

import courses.abc.atoms.core.services.UserService;
import courses.abc.atoms.features.course.model.CourseAccessControl;
import courses.abc.atoms.features.course.repositories.CourseAccessControlRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AccessControlScheduler {

    private static final Logger log = LoggerFactory.getLogger(AccessControlScheduler.class);

    @Autowired
    private CourseAccessControlRepository courseAccessControlRepository;

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void revokeExpiredAccess() {


        LocalDateTime currentTime = LocalDateTime.now();

        try {

            int updatedCount = courseAccessControlRepository.revokeExpiredAccess(currentTime);

            if (updatedCount > 0) {
                log.info("Successfully revoked access for {} entities", updatedCount);
            } else {
                log.info("No expired entities found to update");
            }

        } catch (Exception e) {
            log.error("Error occurred while revoking expired access: {}", e.getMessage(), e);
        }
    }



}
