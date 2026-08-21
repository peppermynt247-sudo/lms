package courses.abc.atoms.core.config;

import courses.abc.atoms.core.security.JwtAuthenticationFilter;
import courses.abc.atoms.core.security.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;

import java.time.LocalDateTime;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            )
            .authorizeHttpRequests(authorize -> 
                authorize
                    .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                    .requestMatchers("/api/user/register", "/api/user/login", "/api/user/checkuserexist", "/api/user/checknumberexist", "/api/user/forgotpassword", "/api/user/verifyotp", "/api/user/resetpassword", "/api/video/webhook","/api/payment/createorder","/api/payment/verifypayment","/api/payment/webhook","/api/courses/{courseId}/pricing-details", "/api/course-bundles/{bundleId}/pricing-details", "/api/certificates/download/{certificateId}", "/api/certificates/registerissueandsendcertificate", "/api/certificates/resendcertificate").permitAll()
                    .requestMatchers("/api/user/myprofile", "/api/user/myprofile/update").hasAnyRole("STUDENT", "ADMIN", "INSTRUCTOR")
                    .requestMatchers("/api/admin/**").hasRole("ADMIN")
                    .requestMatchers("/api/instructor/**").hasAnyRole("ADMIN", "INSTRUCTOR")
                    .anyRequest().authenticated()
            )
            .exceptionHandling(exception -> exception
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    String path = request.getRequestURI();
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.setContentType("application/json");
                    if (path.startsWith("/api/admin")) {
                        response.getWriter().write(
                            "{ \"status\": 403, \"message\": \"You don't have permission to access ADMIN resources\", \"timestamp\": \"" +
                            LocalDateTime.now() + "\" }"
                        );
                    } else if (path.startsWith("/api/user/myprofile") || path.startsWith("/api/user/myprofile/update")) {
                        response.getWriter().write(
                            "{ \"status\": 403, \"message\": \"You don't have permission to access this profile resource\", \"timestamp\": \"" +
                            LocalDateTime.now() + "\" }"
                        );
                    } else {
                        response.getWriter().write(
                            "{ \"status\": 403, \"message\": \"Access denied to this resource\", \"timestamp\": \"" +
                            LocalDateTime.now() + "\" }"
                        );
                    }
                })
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}