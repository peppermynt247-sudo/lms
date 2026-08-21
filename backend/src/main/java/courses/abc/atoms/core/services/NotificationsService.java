package courses.abc.atoms.core.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import courses.abc.atoms.core.model.core.Users;
import courses.abc.atoms.core.model.request.NotificationsRequest;
import courses.abc.atoms.core.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class NotificationsService {


    @Autowired
    private UserRepository userRepository;
     /**
  * This method will add notificaiton for all users.
  * @param notificationsRequest
  */
    public void sendNotificationForAllUser() {
        List<Users> userList = this.userRepository.findAll();
        for (Users users : userList) {
            //Do to Notification to all users
        }
    }
     public Object sendNotificationsToUser(String email) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'sendNotificationsToUser'");
     }
}