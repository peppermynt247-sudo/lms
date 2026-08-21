import BundleMain from '@/components/layout/main/BundleMain/BundleMain'
import React from 'react'

const page = async ({ params }) => {
  const { bundleId } = await params;
 
  return (
    <div>
        <BundleMain bundleId={bundleId} />
    </div>
  )
}

export default page