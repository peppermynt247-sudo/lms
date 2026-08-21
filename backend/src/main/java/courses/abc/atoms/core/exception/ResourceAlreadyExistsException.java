package courses.abc.atoms.core.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when attempting to create a resource that already exists.
 * This maps to HTTP 409 (Conflict) in REST responses.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class ResourceAlreadyExistsException extends RuntimeException {
    
    /**
     * Creates a new ResourceAlreadyExistsException with the specified message.
     * 
     * @param message the detail message
     */
    public ResourceAlreadyExistsException(String message) {
        super(message);
    }
    
    /**
     * Creates a new ResourceAlreadyExistsException with the specified message and cause.
     * 
     * @param message the detail message
     * @param cause the cause of the exception
     */
    public ResourceAlreadyExistsException(String message, Throwable cause) {
        super(message, cause);
    }
}