package courses.abc.atoms.core.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import courses.abc.atoms.core.model.request.NotificationsRequest;
import courses.abc.atoms.core.services.NotificationsService;
import lombok.extern.slf4j.Slf4j;

@RestController
@Slf4j
public class NotificationsController {
    @Autowired
    private NotificationsService notificationsService;
    
    public NotificationsController(NotificationsService notificationsService) {
        this.notificationsService = notificationsService;
    }

    /**
     * This method will fetch all the message of user.
     * @param user
     * @return
     */
    // (Security: any authenticated user is allowed to call this method)
    @GetMapping("/api/notifications/{email}")
    protected ResponseEntity<?> getNotifications(@PathVariable("email") String email) {
        log.debug("GET - /api/notifications/" + email);
        return ResponseEntity.ok().body(this.notificationsService.sendNotificationsToUser(email));
    }

    /**
     * This method will add notificaiton for all users.
     * @param body = { "message": "<notification message>", "linkedTo": "</admin/main - path of linked utility>", "type": "<user OR stomp>" }
     * @return
     */
    // (Security: any authenticated user is allowed to call this method)
    @PostMapping("/api/notification/allusers")
    public ResponseEntity<?> addNotificationForAllUser(@Valid @RequestBody String body) {
        log.debug("POST - /api/notification/allusers");
        this.notificationsService.sendNotificationForAllUser();

        return ResponseEntity.accepted().build();
    }
}