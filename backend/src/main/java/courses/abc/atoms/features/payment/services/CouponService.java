package courses.abc.atoms.features.payment.services;




import courses.abc.atoms.core.exception.ResourceNotFoundException;
import courses.abc.atoms.features.payment.dto.CouponDTO;
import courses.abc.atoms.features.payment.model.Coupon;
import courses.abc.atoms.features.payment.repositories.CouponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class CouponService {

    @Autowired
    private CouponRepository couponRepository;


    public String createCoupon(CouponDTO.Coupon coupon){

        try{

            if("SINGLE".equals(coupon.getCouponType()) || "MULTIPLE".equals(coupon.getCouponType())){
                throw new IllegalArgumentException("Coupon Type must be only SINGLE or MULTIPLE");
            }

            Coupon coupon1 =new Coupon();
            coupon1.setCode(coupon.getCode());
            coupon1.setDescription(coupon.getDescription());
            coupon1.setDiscountPercentage(coupon.getDiscountPercentage());
            coupon1.setMinPurchaseAmount(coupon.getMinPurchaseAmount());
            coupon1.setStartDate(coupon.getStartDate());
            coupon1.setExpiresAt(coupon.getExpiresAt());
            coupon1.setIsActive(coupon.getIsActive() != null ? coupon.getIsActive() :true);
            coupon1.setCouponType(coupon.getCouponType());
            coupon1.setUpdateAt(LocalDateTime.now());
            coupon1.setCreatedAt(LocalDateTime.now());

            couponRepository.save(coupon1);


            return "Coupon code added successfully";
        } catch (Exception e) {
            throw e;
        }

    }


    public List<CouponDTO.GetCoupons> getAllCoupons(){
        try{
            List<Coupon> coupons = couponRepository.findAll();
            List<CouponDTO.GetCoupons> coupons1 =new ArrayList<>();

            for(Coupon coupon :coupons){
                CouponDTO.GetCoupons coupons2 =new CouponDTO.GetCoupons();

                coupons2.setCouponId(coupon.getCouponId());
                coupons2.setCode(coupon.getCode());
                coupons2.setDescription(coupon.getDescription());
                coupons2.setDiscountPercentage(coupon.getDiscountPercentage());
                coupons2.setMinPurchaseAmount(coupon.getMinPurchaseAmount());
                coupons2.setStartDate(coupon.getStartDate());
                coupons2.setExpiresAt(coupon.getExpiresAt());
                coupons2.setIsActive(coupon.getIsActive());
                coupons2.setCouponType(coupon.getCouponType());
                coupons2.setCreatedAt(coupon.getCreatedAt());

                coupons1.add(coupons2);
            }

            return coupons1;
        } catch (Exception e) {
            throw e;
        }
    }


    public String updateCoupon(CouponDTO.UpdateCoupon couponDto){
        try{

            Coupon coupon = couponRepository.findById(couponDto.getCouponId())
                    .orElseThrow(() -> new ResourceNotFoundException("Coupon ID " + couponDto.getCouponId() + " not found"));

            if (couponDto.getCode() != null) coupon.setCode(couponDto.getCode());
            if (couponDto.getDescription() != null) coupon.setDescription(couponDto.getDescription());
            if (couponDto.getDiscountPercentage() != null) coupon.setDiscountPercentage(couponDto.getDiscountPercentage());
            if (couponDto.getMinPurchaseAmount() != null) coupon.setMinPurchaseAmount(couponDto.getMinPurchaseAmount());
            if (couponDto.getStartDate() != null) coupon.setStartDate(couponDto.getStartDate());
            if (couponDto.getExpiresAt() != null) coupon.setExpiresAt(couponDto.getExpiresAt());
            if (couponDto.getIsActive() != null) coupon.setIsActive(couponDto.getIsActive());
            if (couponDto.getCouponType() != null) coupon.setCouponType(couponDto.getCouponType());

            coupon.setUpdateAt(LocalDateTime.now());
            couponRepository.save(coupon);

            return "Successfully updated the coupon code";
        } catch (Exception e) {
            throw e;
        }
    }
}
