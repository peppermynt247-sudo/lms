package courses.abc.atoms.core.model.core;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Profiles {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long profileId;
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private Users user;
    private String abcId;
    private String name ;
    private String gender;
    @Column(name = "profile_image_url", length = 512)
    private String profileImageUrl;
    private String bio;
    private LocalDate dob;
    private String phoneNumber;
    private String whatsappNumber;
    private String address;
    private String qualification;
    private String aadhar;
    private String pan;
    private String city;
    private String state;
    private String country;
    private String pincode;
    private String parentName;
    private String parentContact;
    private String parentEmail;
    @Column(columnDefinition = "TEXT")
    private String socialLinks;
    private LocalDateTime updatedAt;
    private String resume;
}
