package courses.abc.atoms.features.student.repositories;

import courses.abc.atoms.features.course.model.Course;
import courses.abc.atoms.features.student.model.UserCourseProgress;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import courses.abc.atoms.core.model.core.Users;

public interface UserCourseProgressRepository extends JpaRepository<UserCourseProgress,Long> {
    UserCourseProgress findByUserAndCourse(Users user, Course course);
    // Optional<UserCourseProgress> findByUser_IdAndCourse_CourseId(Long userId, Long courseId);
}
