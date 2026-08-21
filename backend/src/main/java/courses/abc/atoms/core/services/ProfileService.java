package courses.abc.atoms.core.services;

import courses.abc.atoms.core.model.core.Profiles;
import courses.abc.atoms.core.repositories.ProfileRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ProfileService {

    @Autowired
    private ProfileRepository profileRepository;

    public Optional<Profiles> getProfileByUserId(Long userId) {
        return profileRepository.findByUserId(userId);
    }

    public Profiles saveProfile(Profiles profile) {
        return profileRepository.save(profile);
    }

    public Optional<Profiles> getProfileByPhoneNumber(String phonenumber){
        return profileRepository.findByPhoneNumber(phonenumber);
    }
}
