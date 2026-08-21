package courses.abc.atoms.core.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a user is authenticated but does not have permission
 * to access a specific resource.
 *
 * This will be handled by the GlobalExceptionHandler to return a 403 Forbidden status.
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class UnauthorizedAccessException extends RuntimeException {

    public UnauthorizedAccessException(String message) {
        super(message);
    }
}