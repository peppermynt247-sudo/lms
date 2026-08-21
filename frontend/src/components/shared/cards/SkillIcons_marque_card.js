import Image from 'next/image';
import React from 'react';

const Testimonial_marque_card = ({ image }) => {
  return (
    <div className='w-full h-full flex items-center justify-center rounded-full bg-white shadow-md'>
      <Image 
        src={image} 
        alt='company_img'  
        width={0}  
        height={0} 
        className="w-full h-full object-contain text-center align-middle"  // object-contain ensures the aspect ratio is maintained
      />
    </div>
  );
}


export default Testimonial_marque_card;
