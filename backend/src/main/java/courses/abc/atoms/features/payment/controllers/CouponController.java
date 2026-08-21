package courses.abc.atoms.features.payment.controllers;



import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.features.payment.repositories.CouponRepository;
import courses.abc.atoms.features.payment.services.CouponService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import courses.abc.atoms.features.payment.dto.CouponDTO;


import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coupon")
@PreAuthorize("hasRole('ADMIN')")
public class CouponController {

    @Autowired
    private CouponService couponService;

    private static final Logger logger = LoggerFactory.getLogger(CouponController.class);


    @PostMapping("/create")
    public ResponseEntity<Map<String,Object>> createCouponCode(@RequestBody CouponDTO.Coupon coupon){
        try{
            String data = couponService.createCoupon(coupon);
            Map<String,Object> response = new HashMap<>();
            logger.info("Coupon code successfully created");
            response.put("success", true);
            response.put("Data",data);
            response.put("message", "Coupon code successfully created");
            return new ResponseEntity<>(response, HttpStatus.OK);
        }catch (DataIntegrityViolationException e){
            Map<String,Object> response = new HashMap<>();
            response.put("success", false);
            logger.error("A Coupon with the same 'code' may already exist.");
            response.put("message", "A Coupon with the same 'code' may already exist.");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }catch (IllegalArgumentException e){
            logger.error(e.getMessage());
            Map<String,Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());

            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        catch (Exception e) {
            e.printStackTrace();
            logger.error(e.getMessage());
            Map<String,Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Unable to create the coupon code");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/get")
    public ResponseEntity<Map<String,Object>> getCouponCode(){
        try{
            List<CouponDTO.GetCoupons> data = couponService.getAllCoupons();
            logger.info("Coupon code successfully retrieved");
            Map<String,Object> response = new HashMap<>();
            response.put("success", true);
            response.put("Data",data);
            response.put("message", "Coupon code successfully retrieved");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            logger.error(e.getMessage());
            Map<String,Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Unable to get the coupon code");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PatchMapping("/update")
    public ResponseEntity<Map<String,Object>> updateCoupon(@RequestBody CouponDTO.UpdateCoupon coupon){
        try{
            String data = couponService.updateCoupon(coupon);
            logger.info("Coupon code updated successfully");
            Map<String,Object> response = new HashMap<>();
            response.put("success", true);
            response.put("Data",data);
            response.put("message", "Coupon code updated successfully");
            return new ResponseEntity<>(response, HttpStatus.OK);
        }catch (ResourceNotFoundException e){
            e.printStackTrace();
            logger.error(e.getMessage());
            Map<String,Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.CONFLICT);
        }catch (DataIntegrityViolationException e){
            e.printStackTrace();
            logger.error(e.getMessage());
            Map<String,Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "A Coupon with the same 'code' may already exist.");
            return new ResponseEntity<>(response, HttpStatus.CONFLICT);
        } catch (Exception e) {
            e.printStackTrace();
            logger.error(e.getMessage());
            Map<String,Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Unable to update the coupon code");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


}
