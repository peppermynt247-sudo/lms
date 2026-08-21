package courses.abc.atoms.core.repositories;

import java.util.Optional;

import courses.abc.atoms.core.model.lms.Feature;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FeatureRepository extends JpaRepository<Feature, String> {
    Optional<Feature> findById(String id);
}