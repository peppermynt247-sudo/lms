-- Initial data inserts for all tables

-- Users table
INSERT INTO users (user_id, email, password_hash, created_at, updated_at, last_login_at, login_attempts, account_locked_until, user_timezone, deletion_requested_at, is_active, status)
OVERRIDING SYSTEM VALUE
VALUES
(1, 'admin@example.com', '$2a$10$IN9yjlKVUIfwPmsw96/rreIohBUmtls4Wpdl6gQYnRAlZSuNTGUee', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, NULL, 'UTC', NULL, true, 'REGISTERED'),
(2, 'instructor@example.com', '$2a$10$IN9yjlKVUIfwPmsw96/rreIohBUmtls4Wpdl6gQYnRAlZSuNTGUee', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, NULL, 'UTC', NULL, true, 'REGISTERED'),
(3, 'student@example.com', '$2a$10$IN9yjlKVUIfwPmsw96/rreIohBUmtls4Wpdl6gQYnRAlZSuNTGUee', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, NULL, 'UTC', NULL, true, 'ADMITTED');

-- Roles table
INSERT INTO roles (role_id, role_name, created_at)
OVERRIDING SYSTEM VALUE
VALUES
(1, 'ADMIN', CURRENT_TIMESTAMP),
(2, 'INSTRUCTOR', CURRENT_TIMESTAMP),
(3, 'STUDENT', CURRENT_TIMESTAMP);

-- Reset sequences so auto-increment starts after the explicitly inserted seed IDs
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));
SELECT setval('roles_role_id_seq', (SELECT MAX(role_id) FROM roles));

-- User_Roles mapping
INSERT INTO user_roles (user_id, role_id)
VALUES 
(1, 1), -- admin user with admin role
(2, 2), -- instructor user with instructor role
(3, 3); -- student user with student role

-- Profiles table
INSERT INTO profiles (user_id, abc_id, name, gender, bio, dob, phone_number, whatsapp_number, address, city, state, country, pincode, parent_name, parent_contact, parent_email, social_links, updated_at)
VALUES
(1, 'ADM001', 'Admin User', 'Male', 'Admin Bio', '1990-01-01', '+1234567890', '+1234567890', '123 Admin St', 'Admin City', 'Admin State', 'Country', '123456', NULL, NULL, NULL, '{"linkedin": "admin-linkedin", "twitter": "admin-twitter"}', CURRENT_TIMESTAMP),
(2, 'TRN001', 'Instructor User', 'Female', 'Instructor Bio', '1985-01-01', '+1234567891', '+1234567891', '123 Instructor St', 'Instructor City', 'Instructor State', 'Country', '123456', NULL, NULL, NULL, '{"linkedin": "Instructor-linkedin", "twitter": "Instructor-twitter"}', CURRENT_TIMESTAMP),
(3, 'STD001', 'Student User', 'Male', 'Student Bio', '2000-01-01', '+1234567892', '+1234567892', '123 Student St', 'Student City', 'Student State', 'Country', '123456', 'Parent Name', '+1234567893', 'parent@example.com', '{"linkedin": "student-linkedin"}', CURRENT_TIMESTAMP);

-- Auth_Tokens table
INSERT INTO auth_tokens (user_id, refresh_token, expires_at, created_at)
VALUES 
(1, 'refresh_token_admin_123', CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP),
(2, 'refresh_token_instructor_123', CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP),
(3, 'refresh_token_student_123', CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP);

-- Categories table
INSERT INTO categories (name, description, icon_url, is_active)
VALUES 
('Programming', 'Programming and Development Courses', 'programming-icon.png', true),
('Data Science', 'Data Science and Analytics', 'data-science-icon.png', true),
('Web Development', 'Web Development Courses', 'web-dev-icon.png', true);

-- Course_Bundles table
INSERT INTO course_bundles (title, description, thumbnail_image, price, discount_percentage, is_featured, created_at, updated_at, created_by, is_published, enrollment_limit, enrollment_start_date, enrollment_end_date)
VALUES 
('Web Development Complete', 'Complete Web Development Bundle', NULL, 299.99, 10.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, true, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '6 months'),
('Data Science Pro', 'Professional Data Science Bundle', NULL, 399.99, 15.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, true, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '6 months');

-- Courses table
INSERT INTO courses (instructor_id, title, pretty_name, subtitle, description, thumbnail_url, version, difficulty_level, estimated_hours, completion_criteria, prerequisites, syllabus_url, featured_rank, price, enrollment_limit, enrollment_start_date, enrollment_end_date, created_at, updated_at, is_published, is_featured, is_archived)
VALUES
(2, 'Introduction to Programming', 'intro-programming', 'Learn Programming Basics', 'A comprehensive introduction to programming concepts', NULL, '1.0', 'Beginner', 40, '{"min_score": 70, "completion_percentage": 80}', '{"required": []}', 'syllabus/intro-prog.pdf', 1, 49.99, 200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true, true, false),
(2, 'Advanced Web Development', 'advanced-web-dev', 'Master Modern Web Development', 'Advanced concepts in web development', NULL, '1.0', 'Advanced', 60, '{"min_score": 75, "completion_percentage": 85}', '{"required": ["intro-programming"]}', 'syllabus/adv-web.pdf', 2, 79.99, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true, true, false);

-- Bundle_Courses table
INSERT INTO bundle_courses (bundle_id, course_id, sequence_order)
VALUES 
(1, 1, 1),
(1, 2, 2);

-- Course_Categories table
INSERT INTO course_categories (course_id, category_id)
VALUES 
(1, 1), -- Intro to Programming in Programming category
(2, 3); -- Advanced Web Dev in Web Development category

-- No metrics tables in schema - removed dashboard metrics inserts

-- Activity Logs
INSERT INTO activity_logs (user_id, activity_type, entity_type, entity_id, details, ip_address, user_agent, created_at)
VALUES 
(1, 'LOGIN', 'USER', 1, '{"browser": "Chrome", "platform": "Windows"}', '192.168.1.1', 'Mozilla/5.0', CURRENT_TIMESTAMP),
(2, 'COURSE_VIEW', 'COURSE', 1, '{"course_id": 1, "section": "introduction"}', '192.168.1.2', 'Mozilla/5.0', CURRENT_TIMESTAMP);

-- Content Similarities
INSERT INTO content_similarities (content_id, similar_content_id, similarity_score, similarity_type, last_calculated_at)
VALUES 
(1, 2, 0.85, 'TOPIC', CURRENT_TIMESTAMP),
(2, 3, 0.75, 'SKILL_LEVEL', CURRENT_TIMESTAMP);

-- Coding Exercises table - eLab entries
INSERT INTO coding_exercises (title,coding_question,description,instructions,difficulty_level,starter_code,solution_code,time_limit_minutes,max_attempts,supported_languages,created_at,updated_at
)
VALUES 
(
    'eLab - Python Basic Syntax',
    'Write a Python program to print "Hello, World!" to standard output.',
    'This eLab tests your understanding of basic Python syntax.',
    'Write a complete Python program that prints Hello, World!',
    'BEGINNER',
    '# TODO: Write your code below\n',
    'print("Hello, World!")',
    30,
    3,
    'python',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'eLab - Reverse a List',
    'Write a Python function `reverse_list(lst)` that returns the list in reversed order without using built-in reverse methods.',
    'This eLab evaluates your understanding of list manipulation in Python.',
    'Implement the function and return the reversed list.',
    'INTERMEDIATE',
    '# TODO: Implement reverse_list function\ndef reverse_list(lst):\n    pass',
    'def reverse_list(lst):\n    return lst[::-1]',
    45,
    3,
    'python',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Cohorts table
INSERT INTO cohorts (name, description, start_date, end_date, course_id, created_at)
VALUES 
('Spring 2025 Programming', 'Spring 2025 Programming Cohort', '2025-01-01', '2025-06-30', 1, CURRENT_TIMESTAMP),
('Summer 2025 Web Dev', 'Summer 2025 Web Development Cohort', '2025-06-01', '2025-12-31', 2, CURRENT_TIMESTAMP);

-- Cohort Analytics
INSERT INTO cohort_analytics (cohort_id, date, active_users, engagement_minutes, completion_rate, dropout_count, average_progress)
VALUES 
(1, CURRENT_DATE, 150, 4500, 0.75, 25, 0.68),
(2, CURRENT_DATE, 200, 5200, 0.80, 20, 0.72);

-- Exercise Attempts
-- First create the questionbank
-- INSERT INTO questionbank (question_bank_id, name, description, questions_type, created_at)
-- VALUES 
-- (1, 'Programming Exercises', 'Basic programming exercises and quizzes', 'MIXED', CURRENT_TIMESTAMP);

-- Then create the exercises
-- INSERT INTO exercise (exercise_id, question_bank_id, title, description, instructions, exercise_type, created_at)
-- VALUES 
-- (1, 1, 'Python Basic Syntax', 'Basic Python syntax exercise', 'Complete the missing code blocks', 'CODING', CURRENT_TIMESTAMP),
-- (2, 1, 'Data Structures Quiz', 'Quiz on basic data structures', 'Answer all questions', 'QUIZ', CURRENT_TIMESTAMP);

-- Now we can properly reference the exercises in exercise_attempts
-- INSERT INTO exercise_attempts (user_id, exercise_id, content_item_id, score, max_score, percentage, passed, started_at, completed_at, time_spent_seconds, attempt_number)
-- VALUES 
-- (3, 1, 1, 85.5, 100, 85.5, true, CURRENT_TIMESTAMP - INTERVAL '1 HOUR', CURRENT_TIMESTAMP, 3600, 1),
-- (3, 2, 2, 92.0, 100, 92.0, true, CURRENT_TIMESTAMP - INTERVAL '2 HOUR', CURRENT_TIMESTAMP - INTERVAL '1 HOUR', 3600, 1);

-- Notifications
INSERT INTO notifications (user_id, notification_type, subject, message, entity_type, entity_id, deep_link, status, send_email, send_push, sent_at, read_at)
VALUES 
(3, 'COURSE_REMINDER', 'Complete your course', 'Your course deadline is approaching', 'COURSE', 1, '/course/1', 'UNREAD', true, true, CURRENT_TIMESTAMP, NULL),
(3, 'ASSIGNMENT_DUE', 'Assignment Due Tomorrow', 'Your assignment is due tomorrow', 'ASSIGNMENT', 1, '/assignment/1', 'UNREAD', true, true, CURRENT_TIMESTAMP, NULL);

-- System Metrics
INSERT INTO system_metrics (metric_name, metric_value, dimensions, recorded_at)
VALUES 
('CPU_USAGE', 45.5, '{"server": "prod-1", "zone": "us-east"}', CURRENT_TIMESTAMP),
('MEMORY_USAGE', 75.2, '{"server": "prod-1", "zone": "us-east"}', CURRENT_TIMESTAMP);

-- Analytics Hourly
INSERT INTO analytics_hourly (datetime, metric_type, metric_name, entity_type, entity_id, value, dimensions)
VALUES 
(CURRENT_TIMESTAMP, 'ENGAGEMENT', 'active_users', 'PLATFORM', 1, 250.0, '{"platform": "web"}'),
(CURRENT_TIMESTAMP, 'PERFORMANCE', 'page_load_time', 'PLATFORM', 1, 1.5, '{"page": "home"}');

-- Analytics Daily
INSERT INTO analytics_daily (date, metric_type, metric_name, entity_type, entity_id, value, dimensions)
VALUES 
(CURRENT_DATE, 'REVENUE', 'total_sales', 'PLATFORM', 1, 5000.0, '{"currency": "USD"}'),
(CURRENT_DATE, 'USERS', 'new_signups', 'PLATFORM', 1, 75.0, '{"source": "organic"}');

-- User Notes
INSERT INTO user_notes (user_id, content_type, content_id, note_text, timestamp_seconds, created_at, updated_at)
VALUES 
(3, 'VIDEO', 1, 'Important concept about data structures', 360, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'DOCUMENT', 2, 'Key points about algorithms', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Admin Actions
INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details, ip_address, created_at)
VALUES 
(1, 'USER_BLOCK', 'USER', 4, '{"reason": "spam activity"}', '192.168.1.1', CURRENT_TIMESTAMP),
(1, 'COURSE_APPROVE', 'COURSE', 2, '{"status": "approved"}', '192.168.1.1', CURRENT_TIMESTAMP);

-- Videos table
INSERT INTO videos (
    title,
    description,
    vdo_cipher_id,
    upload_status,
    video_url,
    thumbnail_url,
    duration_seconds,
    transcript,
    watermark_text,
    allow_download,
    created_at,
    updated_at
) VALUES 
(
    'Demo Video 1',
    'Test video 1 description.',
    'vdocipher-id-001',
    'PENDING',
    'https://example.com/video1.mp4',
    'https://example.com/thumb1.jpg',
    300,
    'Transcript 1',
    'Watermark 1',
    true,
    '2025-07-17 14:00:00',
    '2025-07-17 14:00:00'
),
(
    'Demo Video 2',
    'Test video 2 description.',
    'vdocipher-id-002',
    'UPLOADED',
    'https://example.com/video2.mp4',
    'https://example.com/thumb2.jpg',
    420,
    'Transcript 2',
    'Watermark 2',
    false,
    '2025-07-17 14:30:00',
    '2025-07-17 14:30:00'
);

-- User Engagement Metrics
INSERT INTO user_engagement_metrics (user_id, date, total_time_spent_seconds, content_interactions, social_interactions, assessment_completions, video_watch_time_seconds, reading_time_seconds, quiz_time_seconds)
VALUES 
(3, CURRENT_DATE, 7200, 25, 10, 5, 3600, 2400, 1200),
(2, CURRENT_DATE, 5400, 20, 8, 4, 2700, 1800, 900);

-- Video Analytics
-- INSERT INTO video_analytics (video_id, date, views, complete_views, average_watch_time_seconds, drop_off_points)
-- VALUES 
-- (1, CURRENT_DATE, 150, 120, 540, '{"30": 0.95, "60": 0.85, "90": 0.75}'),
-- (2, CURRENT_DATE, 200, 160, 480, '{"30": 0.90, "60": 0.80, "90": 0.70}');

-- Question Analytics
-- INSERT INTO question_analytics (question_id, date, attempts, correct_count, incorrect_count, skipped_count, average_time_seconds)
-- VALUES 
-- (1, CURRENT_DATE, 100, 75, 20, 5, 45),
-- (2, CURRENT_DATE, 150, 120, 25, 5, 30);

-- Retention Analytics
-- INSERT INTO retention_analytics (cohort_start_date, days_since_start, user_count, retention_rate, course_id, bundle_id)
-- VALUES 
-- ('2025-01-01', 30, 1000, 0.85, 1, 1),
-- ('2025-01-01', 60, 950, 0.80, 1, 1);

-- Search Index
INSERT INTO search_index (entity_type, entity_id, title, content, keywords, search_vector, last_indexed_at)
VALUES 
('COURSE', 1, 'Python Programming Basics', 'Learn Python programming from scratch', 'python,programming,beginners', NULL, CURRENT_TIMESTAMP),
('COURSE', 2, 'Data Structures and Algorithms', 'Master DSA concepts', 'dsa,algorithms,programming', NULL, CURRENT_TIMESTAMP);

-- Test Cases
INSERT INTO test_cases (coding_exercise_id, input, expected_output, explanation, is_hidden, test_order)
VALUES 
(1, '15', 'FizzBuzz', 'Test case for number divisible by both 3 and 5', false, 1),
(1, '3', 'Fizz', 'Test case for number divisible by 3', false, 2),
(1, '[1,2,3,4,5], 3', '2', 'Test case for finding element 3 in sorted array', false, 1);

-- Course Analytics
-- INSERT INTO course_analytics (course_id, date, views, enrollments, completions, average_rating, revenue, engagement_minutes, dropout_count)
-- VALUES 
-- (1, CURRENT_DATE, 500, 100, 75, 4.5, 5000.00, 15000, 25),
-- (2, CURRENT_DATE, 400, 80, 60, 4.2, 4000.00, 12000, 20);

-- Revenue Analytics
-- INSERT INTO revenue_analytics (date, revenue_type, entity_id, entity_type, gross_amount, tax_amount, discount_amount, net_amount, transaction_count)
-- VALUES 
-- (CURRENT_DATE, 'COURSE_SALE', 1, 'COURSE', 1000.00, 100.00, 50.00, 850.00, 10),
-- (CURRENT_DATE, 'SUBSCRIPTION', 1, 'PLAN', 5000.00, 500.00, 0.00, 4500.00, 50);

-- User Recommendations
INSERT INTO user_recommendations (user_id, content_type, content_id, score, reason, created_at)
VALUES 
(3, 'COURSE', 2, 0.95, 'BASED_ON_HISTORY', CURRENT_TIMESTAMP),
(3, 'COURSE', 3, 0.85, 'SIMILAR_USERS', CURRENT_TIMESTAMP);

-- Course Reviews
INSERT INTO course_reviews (course_id, user_id, rating, comment, created_at, updated_at)
VALUES 
(1, 3, 5, 'Excellent course, very well explained!', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 3, 4, 'Great content, could use more examples', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Course Progress
-- INSERT INTO course_progress (user_id, course_id, content_item_id, progress_percentage, last_accessed_at, completed_at)
-- VALUES 
-- (3, 1, 1, 25.0, CURRENT_TIMESTAMP, NULL),
-- (3, 2, 3, 15.0, CURRENT_TIMESTAMP, NULL);

-- Course Prerequisites
-- INSERT INTO course_prerequisites (course_id, prerequisite_course_id, created_at)
-- VALUES 
-- (2, 1, CURRENT_TIMESTAMP);

-- Course Tags
-- INSERT INTO course_tags (course_id, tag_name, created_at)
-- VALUES 
-- (1, 'python', CURRENT_TIMESTAMP),
-- (1, 'programming', CURRENT_TIMESTAMP),
-- (2, 'data-structures', CURRENT_TIMESTAMP);

-- -- Discussion Forums
-- INSERT INTO discussion_forums (course_id, title, description, forum_type, created_at, is_active)
-- VALUES 
-- (1, 'Python Discussion', 'General discussion about Python course', 'COURSE_GENERAL', CURRENT_TIMESTAMP, true),
-- (2, 'DSA Discussion', 'Discussion about data structures', 'COURSE_GENERAL', CURRENT_TIMESTAMP, true);

-- -- Forum Topics
-- INSERT INTO forum_topics (forum_id, user_id, title, content, created_at, is_pinned, is_locked)
-- VALUES 
-- (1, 3, 'Python Installation Help', 'Need help installing Python on Windows', CURRENT_TIMESTAMP, false, false),
-- (2, 3, 'Data Structures Question', 'Question about implementing BST', CURRENT_TIMESTAMP, false, false);

-- -- Forum Replies
-- INSERT INTO forum_replies (topic_id, user_id, parent_reply_id, content)
-- VALUES 
-- (1, 3, NULL, 'How do I install Python on Windows?'),
-- (1, 2, 1, 'You can download Python from python.org');

-- Quizzes
-- INSERT INTO quizzes (content_item_id, title, description, time_limit_minutes, passing_score, max_attempts, shuffle_questions, created_at, updated_at)
-- VALUES 
-- (1, 'Python Basics Quiz', 'Test your Python knowledge', 30, 70, 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- (2, 'DSA Concepts Quiz', 'Test your DSA understanding', 45, 75, 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Certificates
INSERT INTO certificates (name, description, template_url, serial_prefix, created_at, updated_at)
        VALUES
        ('Workshop Completion Certificate', 'Certificate for Python Basics', '/templates/python-cert-template.pdf', 'ABCP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('Course Completion Certificate', 'Certificate for DSA Concepts', '/templates/dsa-cert-template.pdf', 'ABCC',CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('Internship Completion Certificate', 'Certificate for DSA Concepts', '/templates/dsa-cert-template.pdf', 'ABCI',CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Certificate Issued
INSERT INTO certificate_issued (template_id, user_id, course_name, college_name, certificate_url, is_published, serial_number, issued_at, start_date, end_date)
        VALUES
        (1, 1, 'Python Course', 'PES College', '/certificates/CERT-PY-001.pdf', true, '654321', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (2, 1, 'DSA Course', 'PES College', '/certificates/CERT-DSA-001.pdf', false, '987654', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Payment Plans
INSERT INTO payment_plans (name, description, billing_cycle, is_active, created_at, updated_at)
VALUES 
('Monthly Basic', 'Basic monthly subscription', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Annual Pro (2-Month Installments)', 'Professional yearly subscription with payment every 2 months', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

--Batches
-- Batches
INSERT INTO batches (course_id, bundle_id, batch_manager_id, batch_name, start_date, end_date, status, created_at, updated_at, accommodation, additional_batch_manager_id) VALUES
(1, 1, 1, 'Spring 2025 Data Science Cohort', '2025-03-01', '2025-06-30', 'ACTIVE', '2025-01-15 10:00:00', '2025-01-15 10:00:00', false, NULL),
(1, NULL, 2, 'Fall 2025 Web Development Batch', '2025-09-01', '2025-12-15', 'ACTIVE', '2025-06-10 14:30:00', '2025-06-10 14:30:00', false, NULL);



--Batch-users
INSERT INTO batch_users (batch_id, user_id, joined_at) VALUES
(1, 1, '2025-02-01 08:30:00'),
(1, 2, '2025-02-02 09:00:00'),
(1, 3, '2025-02-03 10:15:00');


-- Subscriptions
INSERT INTO subscriptions (user_id, plan_id, start_date, end_date, status, created_at, updated_at)
VALUES 
(3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 MONTH', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 YEAR', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);



INSERT INTO payments (
    user_id, amount, currency, payment_status, payment_method,
    transaction_id, payment_gateway, course_id, bundle_id, plan_id,
    coupon_id, created_at
) VALUES
(1, 4999, 'INR', 'SUCCESS', 'CARD', 'TXN123456', 'PayPal', 2, NULL, 2, NULL, NOW()),   
(2, 9999, 'INR', 'SUCCESS', 'UPI', 'TXN987654', 'Razorpay', NULL, 1, 1, NULL, NOW()),  
(3, 1999, 'INR', 'FAILED', 'CASH', 'TXNFAIL01', 'Stripe', 1, NULL, 1, NULL,  NOW());    



INSERT INTO installments (user_id, course_id, payment_id, status,amount, due_date) 
VALUES 
(1, 1, 1, 'PAID',500, '2025-06-24'),
(2, 2, 2, 'PARTIAL',500, '2025-07-24'),
(2, 2, 2, 'PENDING',400, '2025-09-24');


INSERT INTO course_access_controls (user_id, course_id, bundle_id, installment_id, access_granted, active_by)
VALUES 
(1, 1, 1, 1, true, '2025-06-24'),
(2, 2, 2, 2, true, '2025-07-24');



INSERT INTO referrals (referral_id, user_id, wallet, referrer_id)
VALUES 
('REF1001', 1, 100, NULL),         -- User 1 joined without referral
('REF1002', 2, 150, 1),            -- User 2 referred by User 1
('REF1003', 3, 200, 1);            -- User 3 referred by User 1


-- Invoices
-- INSERT INTO invoices...

-- Invoices
-- INSERT INTO invoices (payment_id, user_id, invoice_number, amount, tax_amount, discount_amount, total_amount, invoice_date, due_date, status)
-- VALUES 
-- (1, 3, 'INV-2025-001', 79.99, 8.00, 0.00, 87.99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'PAID'),
-- (2, 3, 'INV-2025-002', 249.99, 25.00, 50.00, 224.99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'PAID');

-- Coupons
-- INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, used_count, valid_from, valid_until, is_active)
-- VALUES 
-- ('WELCOME25', 'Welcome discount 25% off', 'PERCENTAGE', 25.00, 100, 45, CURRENT_TIMESTAMP - INTERVAL '1 MONTH', CURRENT_TIMESTAMP + INTERVAL '2 MONTH', true),
-- ('SUMMER50', 'Summer sale flat $50 off', 'FIXED', 50.00, 200, 75, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '3 MONTH', true);

-- Wishlist
-- INSERT INTO wishlist (user_id, course_id, added_at)
-- VALUES 
-- (3, 2, CURRENT_TIMESTAMP),
-- (3, 3, CURRENT_TIMESTAMP);

-- Cart Items
-- INSERT INTO cart_items (user_id, course_id, bundle_id, added_at)
-- VALUES 
-- (3, 3, NULL, CURRENT_TIMESTAMP),
-- (3, NULL, 2, CURRENT_TIMESTAMP);

-- Live Sessions
-- INSERT INTO live_sessions (course_id, instructor_id, title, description, start_time, end_time, meeting_url, max_participants, created_at)
-- VALUES 
-- (1, 2, 'Python Q&A Session', 'Live Q&A session for Python course', CURRENT_TIMESTAMP + INTERVAL '1 DAY', CURRENT_TIMESTAMP + INTERVAL '1 DAY 2 HOUR', 'https://meet.example.com/python-qa', 50, CURRENT_TIMESTAMP),
-- (2, 2, 'DSA Problem Solving', 'Live problem solving session', CURRENT_TIMESTAMP + INTERVAL '2 DAY', CURRENT_TIMESTAMP + INTERVAL '2 DAY 2 HOUR', 'https://meet.example.com/dsa-problems', 30, CURRENT_TIMESTAMP);

-- Session Registrations
-- INSERT INTO session_registrations (session_id, user_id, registration_time, attendance_status, feedback)
-- VALUES 
-- (1, 3, CURRENT_TIMESTAMP, 'REGISTERED', NULL),
-- (2, 3, CURRENT_TIMESTAMP, 'REGISTERED', NULL);

-- Support Tickets
-- INSERT INTO support_tickets (user_id, subject, description, ticket_type, priority, status, assigned_to, created_at, updated_at)
-- VALUES 
-- (3, 'Cannot access course', 'Unable to access Python course videos', 'TECHNICAL', 'HIGH', 'OPEN', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- (3, 'Billing inquiry', 'Question about subscription billing', 'BILLING', 'MEDIUM', 'OPEN', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Ticket Responses
-- INSERT INTO ticket_responses (ticket_id, responder_id, response_text, created_at)
-- VALUES 
-- (1, 1, 'Please clear your browser cache and try again', CURRENT_TIMESTAMP),
-- (2, 1, 'I have checked your billing details', CURRENT_TIMESTAMP);

-- -- Course Assignments
-- INSERT INTO course_assignments (course_id, title, description, due_date, max_score, created_at, updated_at)
-- VALUES 
-- (1, 'Python Project', 'Build a simple Python application', CURRENT_TIMESTAMP + INTERVAL '14 DAY', 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- (2, 'DSA Implementation', 'Implement a balanced binary tree', CURRENT_TIMESTAMP + INTERVAL '7 DAY', 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- -- Assignment Submissions
-- INSERT INTO assignment_submissions (user_id, assignment_id, content_item_id, submission_url, notes, submitted_at, attempt_number)
-- VALUES 
-- (3, 1, 1, '/submissions/python-project.zip', 'First submission', CURRENT_TIMESTAMP, 1),
-- (3, 2, 2, '/submissions/bst-implementation.zip', 'First submission', CURRENT_TIMESTAMP, 1);

-- -- Course Resources
-- INSERT INTO course_resources (course_id, title, resource_type, resource_url, created_at)
-- VALUES 
-- (1, 'Python Cheat Sheet', 'PDF', '/resources/python-cheatsheet.pdf', CURRENT_TIMESTAMP),
-- (2, 'DSA Study Guide', 'PDF', '/resources/dsa-guide.pdf', CURRENT_TIMESTAMP);

-- -- Keep existing curriculum entries from above

-- -- Questions table
-- INSERT INTO questions (quiz_id, question_type, question_text, explanation, points, difficulty_level, question_order, media_url)
-- VALUES 
-- (1, 'MULTIPLE_CHOICE', 'What is a variable?', 'A variable is a storage location with a name', 10, 'EASY', 1, NULL),
-- (1, 'MULTIPLE_CHOICE', 'What is a function?', 'A function is a reusable block of code', 10, 'MEDIUM', 2, NULL);

-- -- Question_Options table
-- INSERT INTO question_options (question_id, option_text, is_correct, explanation, option_order)
-- VALUES 
-- (1, 'A named storage location', true, 'Correct! Variables are named storage locations', 1),
-- (1, 'A loop structure', false, 'Incorrect. This describes a different programming concept', 2),
-- (2, 'A reusable block of code', true, 'Correct! Functions are reusable code blocks', 1),
-- (2, 'A data type', false, 'Incorrect. This describes a different programming concept', 2);

-- -- Videos table already inserted above

-- -- Coding_Exercises table
-- INSERT INTO coding_exercises (title, description, instructions, difficulty_level, starter_code, solution_code, time_limit_minutes, max_attempts, supported_languages, created_at, updated_at)
-- VALUES 
-- ('FizzBuzz Implementation', 'Implement the classic FizzBuzz problem', 'Write a program that prints numbers from 1 to n', 'EASY',
-- 'def fizzbuzz(n):\n    # Your code here\n    pass', 
-- 'def fizzbuzz(n):\n    for i in range(1, n + 1):\n        if i % 15 == 0: print("FizzBuzz")\n        elif i % 3 == 0: print("Fizz")\n        elif i % 5 == 0: print("Buzz")\n        else: print(i)',
-- 30, 3, 'python,javascript', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- -- Removing duplicate coupons insert as it was already defined above

-- -- Email Templates
-- INSERT INTO email_templates (name, subject, body, template_type, variables, is_active, created_at, updated_at)
-- VALUES 
-- ('WELCOME_EMAIL', 'Welcome to AtomLMS', 'Dear {name}, Welcome to AtomLMS!', 'notification', '{"name": "string"}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('PASSWORD_RESET', 'Password Reset Request', 'Click here to reset your password: {reset_link}', 'notification', '{"reset_link": "string"}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);