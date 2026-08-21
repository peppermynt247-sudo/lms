import { Search } from "lucide-react"

export default function CouponSearch({ query, onQueryChange }) {
  return (
    <div className="relative w-80">
      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
        placeholder="Search coupons by name or code..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
    </div>
  )
} 