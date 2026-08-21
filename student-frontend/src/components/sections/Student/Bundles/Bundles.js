"use client"
import { useEffect, useState } from "react"
import BundleServices from "@/services/BundleSerive"
import LevelCard from "@/components/shared/Cards/CourseBundleCard"
import { Trophy, Target, Zap, MapPin, BookOpen } from "lucide-react"

export default function Bundles({ bundleId }) {
  const [bundleData, setBundleData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBundles = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await BundleServices.getBundleById(bundleId)

        setBundleData(response.bundle)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching bundles:", error)
        setError(error.message || "Failed to load bundle data")
        setLoading(false)
      }
    }
    
    if (bundleId) {
      fetchBundles()
    } else {
      setError("No bundle ID provided")
      setLoading(false)
    }
  }, [bundleId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-[#f1f5f9] to-slate-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#FF5B00] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span className="text-gray-600 text-lg">Loading your learning path...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-[#f1f5f9] to-slate-50">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Target className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Unable to load bundle</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-[#FF5B00] text-white rounded-lg hover:bg-[#FF5B00]/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const courses = bundleData?.courses || []

  return (
    <div className="min-h-screen bg-[#f0f6ff]">
      {/* Levels Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-8 bg-[#FF5B00] rounded-full"></div>
          <h2 className="text-3xl font-bold text-[#1a2b4e]">{bundleData?.bundleName}</h2>
        </div>

        {/* Course Cards */}
        {courses.length > 0 ? (
          <div className="space-y-8">
            {courses.map((course, index) => (
              <div key={course.courseId || index} className="relative">
                <LevelCard 
                  item={{
                    ...course
                  }} 
                  levelNumber={index + 1} 
                  isUnlocked={true} 
                />

                {/* Connection Line Between Cards */}
                {index < courses.length - 1 && (
                  <div className="flex justify-center py-4">
                    <div className="w-1 h-8 bg-gradient-to-b from-gray-300 to-gray-200 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Courses Available</h3>
              <p className="text-gray-500">
                  This bundle doesn&apos;t contain any courses yet. Please check back later or contact support.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
