import Image from 'next/image';
import React from 'react';

const Testimonial_marque_card = ({ image }) => {
  return (
    <div className="w-[120px] mx-3 h-[80px] md:w-[150px] md:h-[100px] bg-white rounded-lg p-2 flex items-center justify-center">
      <div className="relative w-full h-full">
        <Image
          src={image || "/placeholder.svg"}
          alt={"img"}
          fill
          sizes="(max-width: 768px) 120px, 150px"
          className="object-contain"
        />
      </div>
    </div>
  );
}


export default Testimonial_marque_card;
