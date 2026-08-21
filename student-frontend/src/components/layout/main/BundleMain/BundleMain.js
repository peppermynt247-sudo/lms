import Bundles from '@/components/sections/Student/Bundles/Bundles'
import React from 'react'

const BundleMain = ({ bundleId }) => {
  return (
    <div>
        <Bundles bundleId={bundleId} />
    </div>
  )
}

export default BundleMain