package courses.abc.atoms.features.course.services;

import courses.abc.atoms.features.course.dto.CurriculumSectionsDTO;
import courses.abc.atoms.features.course.model.Curriculum;
import courses.abc.atoms.features.course.model.CurriculumSection;
import courses.abc.atoms.features.course.repositories.CurriculumRepository;
import courses.abc.atoms.features.course.repositories.CurriculumSectionsRepository;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CurriculumSectionsService {

    @Autowired
    private CurriculumRepository curriculumRepository;

    @Autowired
    private CurriculumSectionsRepository curriculumSectionsRepository;

    private CurriculumSectionsDTO.CurriculumSectionResponse convertToCurriculumSectionResponse(CurriculumSection section) {
        return new CurriculumSectionsDTO.CurriculumSectionResponse(
            section.getSectionId(),
            section.getCurriculumId().getCurriculumId(),
            section.getTitle(),
            section.getDescription(),
            section.getSectionOrder(),
            section.getIsPublished(),
            section.getReleaseDate(),
            section.getDripDaysAfterEnrollment(),
            section.getDripSpecificDate(),
            section.getPrerequisiteSection() != null ? section.getPrerequisiteSection().getSectionId() : null,
            section.getPrerequisiteCondition(),
            section.getCreatedAt(),
            section.getUpdatedAt()
        );
    }

    @Transactional
    public CurriculumSectionsDTO.CurriculumSectionResponse createCurriculumSection(
            Integer curriculumId,
            CurriculumSectionsDTO.CurriculumSectionCreateRequest request) {


        // Validate curriculum exists
        Curriculum curriculum = curriculumRepository.findById(curriculumId)
                .orElseThrow(() -> new IllegalArgumentException("Curriculum not found with ID: " + curriculumId));

        if (curriculumSectionsRepository.findByTitleAndCurriculumId(request.getTitle(), curriculum).isPresent()) {
            throw new DataIntegrityViolationException("A curriculum section with the title '" + request.getTitle() + "' already exists in this curriculum.");
        }

        // Determine section order
        Integer maxOrder = curriculumSectionsRepository.findMaxSectionOrderByCurriculum(curriculumId);
        int sectionOrder = (maxOrder != null ? maxOrder + 1 : 1);

        // Create new section
        CurriculumSection section = new CurriculumSection();
        section.setCurriculumId(curriculum);
        section.setTitle(request.getTitle());
        section.setDescription(request.getDescription());
        section.setSectionOrder(sectionOrder);
        section.setIsPublished(request.getIsPublished() != null ? request.getIsPublished() : false);

        // Set all other fields to null (except sectionOrder)
        section.setReleaseDate(null);
        section.setDripDaysAfterEnrollment(null);
        section.setDripSpecificDate(null);
        section.setPrerequisiteSection(null);
        section.setPrerequisiteCondition(null);

        // Save the section
        CurriculumSection savedSection = curriculumSectionsRepository.save(section);

        // Map to response DTO
        return convertToCurriculumSectionResponse(savedSection);
    }

    public List<CurriculumSectionsDTO.CurriculumSectionResponse> getCurriculumSectionsByCurriculumId(Integer curriculumId) {
        // Validate curriculum exists
        curriculumRepository.findById(curriculumId)
                .orElseThrow(() -> new IllegalArgumentException("Curriculum not found with ID: " + curriculumId));

        // Fetch sections and map to response DTO
        List<CurriculumSection> sections = curriculumSectionsRepository.findByCurriculumIdCurriculumId(curriculumId);
        return sections.stream()
                .map(this::convertToCurriculumSectionResponse)
                .collect(Collectors.toList());
    }

        public CurriculumSectionsDTO.CurriculumSectionResponse getCurriculumSectionById(Integer sectionId) {
        CurriculumSection section = curriculumSectionsRepository.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("Curriculum section not found with ID: " + sectionId));
        return convertToCurriculumSectionResponse(section);
    }

    @Transactional
    public CurriculumSectionsDTO.CurriculumSectionResponse updateCurriculumSection(
            Integer sectionId,
            CurriculumSectionsDTO.CurriculumSectionUpdateRequest request) {

        // Validate section exists
        CurriculumSection section = curriculumSectionsRepository.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("Curriculum section not found with ID: " + sectionId));

        // Dynamically update fields if they are provided in the request
        if (request.getTitle() != null) {
            section.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            section.setDescription(request.getDescription());
        }
        if (request.getIsPublished() != null) {
            section.setIsPublished(request.getIsPublished());
        }
        if (request.getSectionOrder() != null) {
            section.setSectionOrder(request.getSectionOrder());
        }
        if (request.getReleaseDate() != null) {
            section.setReleaseDate(request.getReleaseDate());
        }
        if (request.getDripDaysAfterEnrollment() != null) {
            section.setDripDaysAfterEnrollment(request.getDripDaysAfterEnrollment());
        }
        if (request.getDripSpecificDate() != null) {
            section.setDripSpecificDate(request.getDripSpecificDate());
        }
        if (request.getPrerequisiteSectionId() != null) {
            CurriculumSection prerequisiteSection = curriculumSectionsRepository.findById(request.getPrerequisiteSectionId())
                    .orElseThrow(() -> new IllegalArgumentException("Prerequisite section not found with ID: " + request.getPrerequisiteSectionId()));
            section.setPrerequisiteSection(prerequisiteSection);
        }
        if (request.getPrerequisiteCondition() != null) {
            section.setPrerequisiteCondition(request.getPrerequisiteCondition());
        }

        // Save the updated section
        CurriculumSection updatedSection = curriculumSectionsRepository.save(section);

        // Map to response DTO
        return convertToCurriculumSectionResponse(updatedSection);
    }

    @Transactional
    public void deleteCurriculumSection(Integer sectionId) {
        // Validate section exists
        CurriculumSection section = curriculumSectionsRepository.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("Curriculum section not found with ID: " + sectionId));

        // Delete the section
        curriculumSectionsRepository.delete(section);
    }

}