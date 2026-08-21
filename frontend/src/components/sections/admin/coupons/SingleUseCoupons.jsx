import { useMemo, useState } from "react"
import CouponTable from "./CouponTable"
import CouponPagination from "./CouponPagination"
import CouponSearch from "./CouponSearch"

export default function SingleUseCoupons({ 
  coupons, 
  loading, 
  error, 
  onEditCoupon 
}) {
  const [query, setQuery] = useState("")
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter coupons for single use only
  const filtered = useMemo(() => {
    return coupons
      .filter((c) => c.couponType === "SINGLE")
      .filter((c) => (query ? (c.code + c.description).toLowerCase().includes(query.toLowerCase()) : true))
  }, [coupons, query])

  const totalRows = filtered.length
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

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
    <div className="overflow-hidden">
      <CouponTable
        coupons={paginated}
        loading={loading}
        error={error}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onEditCoupon={onEditCoupon}
      />
    </div>
  )
} 