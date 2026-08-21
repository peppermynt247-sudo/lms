package courses.abc.atoms.core.util;


import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class OtpStorage{

    private final Map<String, String> otpStore = new HashMap<>();
    private final Map<String, Long> otpExpiry = new HashMap<>();

    public void storeOpt(String email,String otp){
        otpStore.put(email,otp);
        otpExpiry.put(email,System.currentTimeMillis() + 300000);  //expiry after 5 min
    }

    public boolean verifyOtp(String email,String otp){
        if(System.currentTimeMillis() > otpExpiry.getOrDefault(email,0L)){
            otpStore.remove(email);
            otpExpiry.remove(email);
            return false;
        }

        return otp.equals(otpStore.get(email));
    }

    public void clearOtp(String email){
        otpStore.remove(email);
        otpExpiry.remove(email);
    }

}