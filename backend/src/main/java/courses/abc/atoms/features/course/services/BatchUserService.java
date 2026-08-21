package courses.abc.atoms.features.course.services;

import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.features.course.dto.BatchDTO;
import courses.abc.atoms.features.course.dto.BatchDTO.BatchUserDTO;
import courses.abc.atoms.features.course.model.Batches;
import courses.abc.atoms.features.course.repositories.BatchRepository;
import courses.abc.atoms.features.course.repositories.BatchUserRepository;
import org.hibernate.engine.jdbc.batch.spi.Batch;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BatchUserService {

    @Autowired
    private  BatchUserRepository batchUserRepository;

    @Autowired
    private BatchRepository batchRepository;

   

    public List<BatchDTO.BatchUserDTO> getBatchUsersByBatchId(Long batchId) {


       try {

           Optional<Batches> batches= batchRepository.findByBatchId(batchId);

           if(batches.isEmpty()){
               throw new ResourceNotFoundException("Batch Not found");
           }

           List<Object[]> results = batchUserRepository.findBatchUsersByBatchId(batchId);
           return results.stream().map(obj -> {
               Long userid =obj[0] != null ? (((Number)obj[0]).longValue()):null;
               String name = obj[1] != null ? obj[1].toString() : null;
               String phonenumber = obj[2] != null ? obj[2].toString() : null;
               String email = obj[3] != null ? obj[3].toString() : null;
               String coursename = obj[4] != null ? obj[4].toString() : null;
               LocalDateTime enrolled = obj[5] != null ? ((Timestamp) obj[5]).toLocalDateTime() : null;
               BigDecimal progress = obj[6] != null ? (BigDecimal) obj[6] : null;
               BatchDTO.BatchUserDTO batchUserDTO =new BatchDTO.BatchUserDTO();
               batchUserDTO.setUserId(userid);
               batchUserDTO.setName(name);
               batchUserDTO.setPhoneNumber(phonenumber);
               batchUserDTO.setEmail(email);
               batchUserDTO.setTitle(coursename);
               batchUserDTO.setEnrolled(enrolled);
               batchUserDTO.setProgress(progress);
               return batchUserDTO;

           }).collect(Collectors.toList());
       }catch (Exception e){
           throw e;
       }
    }
}
