package courses.abc.atoms.core.controller;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Profile("dev")
@RestController
@RequestMapping("/api/dummy")
public class InsertDummyDataController {
    
    @GetMapping("insert")
    public String generateDummayData(@RequestParam String param) {
        // This is a dummy implementation for demonstration purposes.
        // In a real application, you would insert data into the database or perform some other action.
        return "Dummy data inserted with parameter: " + param;
    }
    
    @GetMapping("insertAll")
    public String insertAllDummyData() {
        StringBuilder sb = new StringBuilder();

        sb.append("-- Account\n");
        sb.append("INSERT INTO account (userid, accounttype, provider, provideraccountid) VALUES (1, 'basic', 'google', 'google-uid-1');\n\n");

        sb.append("-- Asset\n");
        sb.append("INSERT INTO asset (courseid, lecturename, assetzip, createdat, updatedat) VALUES (1, 'Lecture 1', 'lecture1.zip', NOW(), NOW());\n\n");

        sb.append("-- Category\n");
        sb.append("INSERT INTO category (name, slug, createdat, updatedat) VALUES ('Programming', 'programming', NOW(), NOW());\n\n");

        sb.append("-- Coupon\n");
        sb.append("INSERT INTO coupon (code, discount, expdate, status, deletedat, activeforfullsite, createdat) VALUES ('WELCOME10', 10.0, NULL, TRUE, NULL, FALSE, NOW());\n\n");

        sb.append("-- Course\n");
        sb.append("INSERT INTO course (userid, catid, title, slug, overview, regularprice, beforeprice, isfree, lessons, duration, image, accesstime, requirements, whatyouwilllearn, whoisthiscoursefor, approved, inhomepage, isclass, createdat, updatedat)\n");
        sb.append("VALUES (1, 1, 'Intro to Java', 'intro-to-java', 'Learn Java basics', 100.0, 120.0, FALSE, '10', '5h', 'java.jpg', 'Lifetime', 'None', 'Java basics', 'Beginners', TRUE, TRUE, FALSE, NOW(), NOW());\n\n");

        sb.append("-- Earning\n");
        sb.append("INSERT INTO earning (cost, userid, courseid, status, createdat, updatedat) VALUES (50.0, 1, 1, 'Due', NOW(), NOW());\n\n");

        sb.append("-- Enrollment\n");
        sb.append("INSERT INTO enrollment (userid, courseid, ordernumber, price, paymentid, paymentstatus, status, paymentvia, createdat)\n");
        sb.append("VALUES (1, 1, 'ORD-1001', 100, 'PAY-1001', 'PENDING', 'PENDING', 'Stripe', NOW());\n\n");

        sb.append("-- Favourite\n");
        sb.append("INSERT INTO favourite (userid, courseid, createdat) VALUES (1, 1, NOW());\n\n");

        sb.append("-- Partner\n");
        sb.append("INSERT INTO partner (name, image, createdat, updatedat) VALUES ('Partner1', 'partner1.png', NOW(), NOW());\n\n");

        sb.append("-- Profile\n");
        sb.append("INSERT INTO profile (userid, designation, bio, location, phone, website, twitter, facebook, linkedin, youtube)\n");
        sb.append("VALUES (1, 'Developer', 'Bio here', 'City', '1234567890', 'https://website.com', 'https://twitter.com', 'https://facebook.com', 'https://linkedin.com', 'https://youtube.com');\n\n");

        sb.append("-- Progress\n");
        sb.append("INSERT INTO progress (finished, userid, courseid, videoid, createdat) VALUES (TRUE, 1, 1, 1, NOW());\n\n");

        sb.append("-- Review\n");
        sb.append("INSERT INTO review (rating, comment, userid, courseid, createdat, updatedat) VALUES (5, 'Great course!', 1, 1, NOW(), NOW());\n\n");

        sb.append("-- Subscription\n");
        sb.append("INSERT INTO subscription (email, isactive, createdat) VALUES ('user@example.com', TRUE, NOW());\n\n");

        sb.append("-- Testimonial\n");
        sb.append("INSERT INTO testimonial (name, image, designation, description, createdat, updatedat)\n");
        sb.append("VALUES ('John Doe', 'john.jpg', 'Student', 'This is a testimonial.', NOW(), NOW());\n\n");

        sb.append("-- Users\n");
        sb.append("INSERT INTO users (name, email, password, image, role, gender, isinstructor, emailconfirmed, emailconfirmedat, isactive, createdat, updatedat, phone, registrationnumber, status)\n");
        sb.append("VALUES ('Jane Doe', 'jane@example.com', '$2a$10$IN9yjlKVUIfwPmsw96/rreIohBUmtls4Wpdl6gQYnRAlZSuNTGUee', 'jane.jpg', 'STUDENT', 'Female', FALSE, TRUE, NOW(), TRUE, NOW(), NOW(), 1234567890, 'REG123', 'ACTIVE');\n\n");

        sb.append("-- Video\n");
        sb.append("INSERT INTO video (courseid, groupname, title, thumbimage, videourl, videolength, ispreview, shortid, createdat, updatedat)\n");
        sb.append("VALUES (1, 'Group 1', 'Intro Video', 'thumb.jpg', 'video.mp4', '10m', TRUE, 1, NOW(), NOW());\n\n");

        sb.append("-- applicationconfiguration\n");
        sb.append("INSERT INTO applicationconfiguration (authenticationstrategy, availableversion, firstapplicationstart, installedversion, pathurl, setupcomplete)\n");
        sb.append("VALUES (1, '1.0.0', TRUE, '1.0.0', '/app', FALSE);\n\n");

        sb.append("-- features\n");
        sb.append("INSERT INTO features (id, additionalinfo, availableversion, description, enablemanagerrole, installedversion, name, scope, supportedversions)\n");
        sb.append("VALUES ('feature-1', 'Info', '1.0.0', 'Feature description', TRUE, '1.0.0', 'FeatureName', 'global', '1.0.0');\n");

        return sb.toString();
    }
}
