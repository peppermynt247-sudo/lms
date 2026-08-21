package courses.abc.atoms.core.model.request;

public class NotificationsRequest {

    private String userId;
    private String body;
    private Long id;
    private String sockJsClientUrl;
    private String message;
    private String linkedTo;
    private boolean preserveForOffline;

    public NotificationsRequest(Long id) {
        this.id = id;
    }

    public NotificationsRequest(String userId, String body) {
        this.userId = userId;
        this.body = body;
    }

    public NotificationsRequest(String userId, String sockJsClientUrl, String message, String linkedTo, boolean preserveForOffline) {
        this.userId = userId;
        this.sockJsClientUrl = sockJsClientUrl;
        this.message = message;
        this.linkedTo = linkedTo;
        this.preserveForOffline = preserveForOffline;
    }        

    public String getUserId() {
        return this.userId;
    }

    public String getBody() {
        return this.body;
    }

    public Long getId() {
        return this.id;
    }

    public String getSockJsClientUrl() {
        return this.sockJsClientUrl;
    }

    public String getMessage() {
        return this.message;
    }

    public String getLinkedTo() {
        return this.linkedTo;
    }

    public boolean getPreserveForOffline() {
        return this.preserveForOffline;
    }
}
