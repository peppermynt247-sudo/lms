import { MoreHorizontal, Percent, IndianRupee, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

// Formatting helpers
const formatPercent = (num) => `${Number(num || 0).toFixed(0)}%`
const formatCurrency = (num) => `₹${Number(num || 0).toLocaleString("en-IN")}`
const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"

function StatusPill({ status }) {
  const classes =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : status === "SCHEDULED"
        ? "bg-blue-50 text-blue-700 border border-blue-200"
        : "bg-red-50 text-red-700 border border-red-200"
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${classes}`}>{status}</span>
  )
}

export default function CouponTable({ 
  coupons, 
  loading, 
  error, 
  currentPage, 
  rowsPerPage, 
  onEditCoupon 
}) {
  const [openMenuIndex, setOpenMenuIndex] = useState(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [isClient, setIsClient] = useState(false)
  useEffect(() => setIsClient(true), [])
  const toggleMenu = (idx, event) => {
    setOpenMenuIndex((prev) => (prev === idx ? null : idx))
    if (event?.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect()
      setMenuPosition({ top: rect.bottom + 6, left: rect.right - 128 }) // 128px menu width
    }
  }
  const closeMenu = () => setOpenMenuIndex(null)
  useEffect(() => {
    if (openMenuIndex === null) return
    const onAny = () => closeMenu()
    window.addEventListener("scroll", onAny, true)
    window.addEventListener("resize", onAny)
    window.addEventListener("click", onAny)
    return () => {
      window.removeEventListener("scroll", onAny, true)
      window.removeEventListener("resize", onAny)
      window.removeEventListener("click", onAny)
    }
  }, [openMenuIndex])

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <div className="w-6 h-6 text-gray-400 animate-spin border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Loading coupons...</h3>
        <p className="text-gray-500">Please wait while we fetch your coupon data</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <div className="w-6 h-6 text-red-400">✕</div>
        </div>
        <h3 className="text-lg font-medium text-red-900 mb-2">Error loading coupons</h3>
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  if (coupons.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Search className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No coupons found</h3>
        <p className="text-gray-500">Try adjusting your search or create a new coupon</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      {/* Desktop table header */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
        <div className="col-span-1">#</div>
        <div className="col-span-2">Code & Description</div>
        <div className="col-span-1 text-center">Discount</div>
        <div className="col-span-2 text-center">Min Purchase</div>
        <div className="col-span-2 text-center">Validity Period</div>
        <div className="col-span-1 text-center">Status</div>
        <div className="col-span-2 text-center">Created</div>
        <div className="col-span-1 text-center">Action</div>
      </div>

      <div className="divide-y divide-gray-200">
        {coupons.map((c, idx) => (
          <div key={c.CouponId || `coupon-${idx}`} className="group hover:bg-gray-50/50 transition-colors duration-200">
            {/* Desktop layout */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 items-center">
              <div className="col-span-1">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                  {String((currentPage - 1) * rowsPerPage + idx + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="col-span-2">
                <div className="space-y-1">
                  <div className="font-semibold text-gray-900 text-sm uppercase tracking-wide">{c.code}</div>
                  <div className="text-sm text-gray-600 line-clamp-2">{c.description}</div>
                </div>
              </div>
              <div className="col-span-1 text-center">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                  <Percent className="w-3 h-3" />
                  {formatPercent(c.discountPercentage)}
                </div>
              </div>
              <div className="col-span-2 text-center">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  {formatCurrency(c.minPurchaseAmount)}
                </div>
              </div>
              <div className="col-span-2 text-center">
                <div className="space-y-1">
                  <div className="text-sm text-gray-900 font-medium">{formatDate(c.startDate)}</div>
                  <div className="text-xs text-gray-500">to {formatDate(c.expiresAt)}</div>
                </div>
              </div>
              <div className="col-span-1 text-center">
                <StatusPill status={c.isActive ? "ACTIVE" : "INACTIVE"} />
              </div>
              <div className="col-span-2 text-center">
                <div className="text-xs text-gray-500">{formatDate(c.createdAt)}</div>
              </div>
              <div className="col-span-1 text-center">
                <div className="relative inline-block text-left">
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleMenu(idx, e)
                    }}
                    title="Actions"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {isClient && openMenuIndex === idx
                    ? createPortal(
                        <div
                          style={{ position: "fixed", top: menuPosition.top, left: menuPosition.left, width: 128 }}
                          className="z-[1000]"
                        >
                          <div className="origin-top-right w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  closeMenu()
                                  onEditCoupon(c)
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>,
                        document.body
                      )
                    : null}
                </div>
              </div>
            </div>

            {/* Mobile/Tablet layout */}
            <div className="lg:hidden p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-semibold text-gray-900 uppercase tracking-wide">{c.code}</div>
                  <div className="text-sm text-gray-600 line-clamp-2">{c.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={c.isActive ? "ACTIVE" : "INACTIVE"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    <Percent className="w-3 h-3" />
                    {formatPercent(c.discountPercentage)} off
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    {formatCurrency(c.minPurchaseAmount)} min
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm text-gray-900 font-medium">{formatDate(c.startDate)}</div>
                  <div className="text-xs text-gray-500">to {formatDate(c.expiresAt)}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 text-center">
                Created: {formatDate(c.createdAt)}
              </div>
              <div className="flex justify-center">
                <div className="relative inline-block text-left">
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleMenu(idx, e)
                    }}
                    title="Actions"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {isClient && openMenuIndex === idx
                    ? createPortal(
                        <div
                          style={{ position: "fixed", top: menuPosition.top, left: menuPosition.left, width: 128 }}
                          className="z-[1000]"
                        >
                          <div className="origin-top-right w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  closeMenu()
                                  onEditCoupon(c)
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>,
                        document.body
                      )
                    : null}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 