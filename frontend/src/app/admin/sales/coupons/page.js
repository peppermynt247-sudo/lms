"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Search } from "lucide-react"
import Cookies from "js-cookie"
import MultipleUseCoupons from "@/components/sections/admin/coupons/MultipleUseCoupons"
import SingleUseCoupons from "@/components/sections/admin/coupons/SingleUseCoupons"
import CouponPagination from "@/components/sections/admin/coupons/CouponPagination"
import CouponEditDrawer from "@/components/sections/admin/coupons/CouponEditDrawer"
import CouponCreateDrawer from "@/components/sections/admin/coupons/CouponCreateDrawer"

// Export to CSV function
const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return
  
  // Define CSV headers
  const headers = [
    'Code',
    'Description', 
    'Discount %',
    'Min Purchase Amount',
    'Start Date',
    'Expiry Date',
    'Status',
    'Coupon Type',
    'Created Date'
  ]
  
  // Convert data to CSV format
  const csvContent = [
    headers.join(','),
    ...data.map(coupon => [
      `"${coupon.code || ''}"`,
      `"${coupon.description || ''}"`,
      coupon.discountPercentage || 0,
      coupon.minPurchaseAmount || 0,
      coupon.startDate ? new Date(coupon.startDate).toLocaleDateString('en-GB') : '',
      coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('en-GB') : '',
      coupon.isActive ? 'Active' : 'Inactive',
      coupon.couponType || '',
      coupon.createdAt ? new Date(coupon.createdAt).toLocaleDateString('en-GB') : ''
    ].join(','))
  ].join('\n')
  
  // Create and download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up the URL object
  URL.revokeObjectURL(url)
  
  // Show success message
}

export default function CouponsPage() {
  const [activeTab, setActiveTab] = useState("MULTIPLE") // MULTIPLE | SINGLE
  const [query, setQuery] = useState("")
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

  // Fetch coupons from API
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true)
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL || 'http://localhost:8080';
        const response = await fetch(`${backendUrl}/api/coupon/get`, {
          headers: {
            'Authorization': `Bearer ${Cookies.get('accessToken')}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch coupons')
        }
        
        const data = await response.json()
        if (data.success) {
          const couponData = data.Data || []
          setCoupons(couponData)
        } else {
          throw new Error(data.message || 'Failed to fetch coupons')
        }
      } catch (err) {
        setError(err.message)
        console.error('Error fetching coupons:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCoupons()
  }, [])

  // Filter coupons based on active tab and search query
  const filtered = useMemo(() => {
    return coupons
      .filter((c) => c.couponType === activeTab)
      .filter((c) => (query ? (c.code + c.description).toLowerCase().includes(query.toLowerCase()) : true))
  }, [activeTab, query, coupons])

  const totalRows = filtered.length
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon)
    setEditOpen(true)
  }

  const handleQueryChange = (newQuery) => {
    setQuery(newQuery)
    setCurrentPage(1)
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage)
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Coupons</h1>
              <p className="text-base text-gray-600 max-w-2xl">
                Create and manage single and multiple use coupon codes to offer discounts to your customers
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white bg-[#ff5e04] hover:bg-[#e85400] shadow-md hover:shadow-lg transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5e04]"
              aria-label="Create Coupon"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Create Coupon
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 mb-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <button
                className={`px-6 py-3 text-sm font-medium transition-colors duration-200 rounded-t-lg ${
                  activeTab === "MULTIPLE"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
                onClick={() => {
                  setActiveTab("MULTIPLE")
                  setCurrentPage(1)
                }}
              >
                Multiple Use Coupons
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium transition-colors duration-200 rounded-t-lg ${
                  activeTab === "SINGLE"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
                onClick={() => {
                  setActiveTab("SINGLE")
                  setCurrentPage(1)
                }}
              >
                Single Use Coupons
              </button>
            </div>
            
            <div className="relative w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="Search coupons by name or code..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-hidden">
            {activeTab === "MULTIPLE" ? (
              <MultipleUseCoupons
                coupons={paginated}
                loading={loading}
                error={error}
                currentPage={currentPage}
                rowsPerPage={rowsPerPage}
                onEditCoupon={handleEditCoupon}
              />
            ) : (
              <SingleUseCoupons
                coupons={paginated}
                loading={loading}
                error={error}
                currentPage={currentPage}
                rowsPerPage={rowsPerPage}
                onEditCoupon={handleEditCoupon}
              />
            )}
          </div>
        </div>

        <CouponPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRows={totalRows}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
        <CouponEditDrawer
          open={editOpen}
          coupon={editingCoupon}
          onClose={() => setEditOpen(false)}
          onUpdated={(updated) => {
            setCoupons((prev) => prev.map((c) => (c.couponId === updated.couponId ? { ...c, ...updated } : c)))
          }}
        />
        <CouponCreateDrawer
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={async () => {
            // Refresh list after creation
            try {
              setLoading(true)
              const backendUrl = process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL || 'http://localhost:8080';
              const response = await fetch(`${backendUrl}/api/coupon/get`, {
                headers: {
                  'Authorization': `Bearer ${Cookies.get('accessToken')}`,
                  'Content-Type': 'application/json'
                }
              })
              const data = await response.json()
              if (data.success) setCoupons(data.Data || [])
            } finally {
              setLoading(false)
            }
          }}
        />
      </div>
    </div>
  )
}
 