"use client"
import { useEffect, useState, useRef } from "react"
import {
  MoreVertical, Search, ChevronDown, Download, X, Lock, Plus, Users, Filter,
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import ReactDOM from "react-dom"
import axios from "axios"
import Cookies from "js-cookie"
import { toast } from "react-toastify"

function ActionDropdownMenu({ anchorRef, open, onClose, children }) {
  const [menuStyle, setMenuStyle] = useState({})
  const menuRef = useRef()

  useEffect(() => {
    if (!open || !anchorRef.current) return

    const rect = anchorRef.current.getBoundingClientRect()
    const menuWidth = 180
    const margin = 8
    let left = rect.left + margin
    const top = rect.bottom + 4

    if (left + menuWidth > window.innerWidth) {
      left = rect.right - menuWidth - margin
      if (left < margin) left = margin
    }

    setMenuStyle({
      position: "fixed",
      top,
      left,
      zIndex: 9999,
      background: "white",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      borderRadius: 8,
      minWidth: menuWidth,
      border: "1px solid #e5e7eb",
      padding: "4px 0",
    })
  }, [open, anchorRef])

  if (!open || !anchorRef.current) return null

  return ReactDOM.createPortal(
    <div ref={menuRef} style={menuStyle} onClick={onClose}>
      {children}
    </div>,
    document.body,
  )
}

export default function AdminInstructor() {
  const [users, setUsers] = useState([])
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("Active Users")
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const router = useRouter()
  const actionDropdownRefs = useRef([])
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetPasswordEmail, setResetPasswordEmail] = useState("")
  const [resetNewPassword, setResetNewPassword] = useState("")
  const [loadingResetPassword, setLoadingResetPassword] = useState(false)
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false)
  const [changeRoleUser, setChangeRoleUser] = useState(null)
  const [selectedRole, setSelectedRole] = useState("")
  const [loadingChangeRole, setLoadingChangeRole] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  const fetchUsers = async () => {
    const token = Cookies.get("accessToken")
    if (!token) {
      return
    }

    axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/getadminsandinstructors`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => setUsers(res.data))
      .catch((err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          toast.error("You are not authorized to access this data.");
        }
      });
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/getadminsandinstructors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setUsers(res.data)
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert("You are not authorized to access this data.")
      }
    }
  }

  useEffect(() => {
    fetchUsers()
    
    // Add focus event listener to refresh data when page comes into focus
    const handleFocus = () => {
      fetchUsers()
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Check if we're returning from add user page and show success message
  useEffect(() => {
    const currentPath = window.location.pathname
    
    if (currentPath === '/admin/users/admin-instructors' && sessionStorage.getItem('instructorAdded')) {
      setShowSuccessMessage(true)
      sessionStorage.removeItem('instructorAdded')
      fetchUsers() // Refresh the list
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)
    }
  }, [])

  // Additional check on component mount
  useEffect(() => {
    const instructorAdded = sessionStorage.getItem('instructorAdded');
    if (instructorAdded) {
      setShowSuccessMessage(true);
      sessionStorage.removeItem('instructorAdded');
      fetchUsers();
      
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }
  }, []);

  const getRoleBadge = (role) => {
    const base = "px-2.5 py-1 rounded-md text-xs font-medium"
    if (role === "ADMIN")
      return <span className={`${base} bg-orange-50 text-orange-700 border border-orange-200`}>Admin</span>
    if (role === "SUPER ADMIN")
      return <span className={`${base} bg-purple-50 text-purple-700 border border-purple-200`}>Super Admin</span>
    if (role === "INSTRUCTOR")
      return <span className={`${base} bg-green-50 text-green-700 border border-green-200`}>Instructor</span>
    return <span className={`${base} bg-gray-50 text-gray-700 border border-gray-200`}>{role ?? "Unknown"}</span>
  }

  const filteredUsers = users.filter((user) => {
    const keyword = searchTerm.toLowerCase()
    const name = typeof user.name === "string" ? user.name.toLowerCase() : ""
    const email = typeof user.email === "string" ? user.email.toLowerCase() : ""
    const phone = user.phone ? String(user.phone) : ""

    const isActive = user.status !== "ARCHIVED"
    const statusMatch = filterType === "Active Users" ? isActive : !isActive

    return statusMatch && (name.includes(keyword) || email.includes(keyword) || phone.includes(keyword))
  })

  const handleExport = () => {
    if (filteredUsers.length === 0) {
      toast.warn('No data to export');
      return;
    }

    const exportData = filteredUsers.map((user, index) => ({
      "Serial No.": String(index + 1).padStart(2, "0"),
      Name: user.name || "N/A",
      Role: user.role || "N/A",
      Email: user.email || "N/A",
      Phone: user.phone || "N/A",
      "Date Added": user.dateAdded ? new Date(user.dateAdded).toLocaleDateString() : "N/A",
      Branch: user.branch || "N/A",
      Status: user.status || "N/A",
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Admin & Instructors")
    XLSX.writeFile(wb, "admin_instructors_export.xlsx")
  }

  const handleArchiveUser = async (userId) => {
    const token = Cookies.get("accessToken")
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/bulkarchive`,
        { userIds: [userId] },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setUsers((users) => users.map((u) => (u.id === userId ? { ...u, status: "ARCHIVED" } : u)))
    } catch (err) {
      toast.error('Failed to archive user');
    }
  }

  const handleUnarchiveUser = async (userId) => {
    const token = Cookies.get("accessToken")
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/bulkunarchive`,
        { userIds: [userId] },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setUsers((users) => users.map((u) => (u.id === userId ? { ...u, status: "ACTIVE" } : u)))
    } catch (err) {
      toast.error('Failed to unarchive user');
    }
  }

  const handleResetPassword = (email) => {
    setResetPasswordEmail(email)
    setShowResetPasswordModal(true)
    setResetNewPassword("")
  }

  const submitResetPassword = async (e) => {
    e.preventDefault()
    setLoadingResetPassword(true)
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/user/resetpassword`, null, {
        params: { email: resetPasswordEmail, newPassword: resetNewPassword },
      })
      toast.success("Password reset successful!")
      setShowResetPasswordModal(false)
      setResetPasswordEmail("")
      setResetNewPassword("")
    } catch (err) {
      toast.error("Failed to reset password")
    }
    setLoadingResetPassword(false)
  }

  const handleChangeRole = (user) => {
    setChangeRoleUser(user)
    setSelectedRole(user.role === "ADMIN" ? "Admin" : "Instructor")
    setShowChangeRoleModal(true)
  }

  const submitChangeRole = async (e) => {
    e.preventDefault()
    if (!changeRoleUser) return
    setLoadingChangeRole(true)
    const token = Cookies.get("accessToken")
    try {
      if (selectedRole === "Admin") {
        await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/setuserasadmin`, null, {
          params: { email: changeRoleUser.email },
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/setuserasinstructor`, null, {
          params: { email: changeRoleUser.email },
          headers: { Authorization: `Bearer ${token}` },
        })
      }
      setUsers((users) =>
        users.map((u) => (u.id === changeRoleUser.id ? { ...u, role: selectedRole.toUpperCase() } : u)),
      )
      toast.success("Role updated successfully!")
      setShowChangeRoleModal(false)
      setChangeRoleUser(null)
    } catch (err) {
      toast.error("Failed to update role")
    }
    setLoadingChangeRole(false)
  }

  // Calculate paginated data
  const totalRows = filteredUsers.length
  const totalPages = Math.ceil(totalRows / rowsPerPage)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  // Reset to page 1 if filters or rowsPerPage change
  useEffect(() => {
    setCurrentPage(1)
  }, [rowsPerPage, searchTerm, filterType])

  useEffect(() => {
    if (openDropdownIndex === null) return
    function handleScroll() {
      setOpenDropdownIndex(null)
    }
    window.addEventListener("scroll", handleScroll, true)
    return () => {
      window.removeEventListener("scroll", handleScroll, true)
    }
  }, [openDropdownIndex])

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Admins & Instructors</h1>
              <p className="text-gray-600 text-sm mt-1">Manage users with administrative and instructional roles</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">
                  Instructor added successfully! The list has been refreshed.
                </p>
              </div>
            </div>
          </div>
        )}

                 {/* Controls */}
         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
           <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-center lg:justify-between gap-4">
             <div className="flex flex-col sm:flex-row gap-4 flex-1">
               <div className="relative min-w-[220px]">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 flex-shrink-0" />
                 <input
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   placeholder="Search by name, email, or phone..."
                   className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                 />
               </div>

                             <div className="relative min-w-[160px]">
                 <button
                   onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                   className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                 >
                   <Filter className="w-4 h-4 flex-shrink-0" />
                   {filterType}
                   <ChevronDown className="w-4 h-4 flex-shrink-0" />
                 </button>
                {showFilterDropdown && (
                  <div className="absolute z-10 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {["Active Users", "Archived Users"].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setFilterType(option)
                          setShowFilterDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                  {filteredUsers.length}
                </span>
              </div>
            </div>

                         <div className="flex gap-3">
               <button
                 onClick={handleExport}
                 disabled={filteredUsers.length === 0}
                 className="min-w-[120px] flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 <Download className="w-4 h-4 flex-shrink-0" />
                 Export
               </button>
               <button
                 onClick={() => router.push("/admin/users/admin-instructors/adduser")}
                 className="min-w-[140px] flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
               >
                 <Plus className="w-4 h-4 flex-shrink-0" />
                 Add Instructor
               </button>
             </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedUsers.map((user, index) => (
                  <tr
                    key={index + (currentPage - 1) * rowsPerPage}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={(e) => {
                      if (e.target.closest(".actions-cell")) return
                      router.push(
                        `/admin/users/admin-instructors/${user.id ?? index + 1 + (currentPage - 1) * rowsPerPage}`,
                      )
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {String(index + 1 + (currentPage - 1) * rowsPerPage).padStart(2, "0")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name ?? "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email ?? "N/A"}</div>
                      <div className="text-sm text-gray-500">{user.phone ?? "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap actions-cell">
                      <div ref={(el) => (actionDropdownRefs.current[index] = el)} className="inline-block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenDropdownIndex(openDropdownIndex === index ? null : index)
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <ActionDropdownMenu
                          anchorRef={{ current: actionDropdownRefs.current[index] }}
                          open={openDropdownIndex === index}
                          onClose={() => setOpenDropdownIndex(null)}
                        >
                          <div className="py-1">
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleResetPassword(user.email)
                                setOpenDropdownIndex(null)
                              }}
                            >
                              Reset Password
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleChangeRole(user)
                                setOpenDropdownIndex(null)
                              }}
                            >
                              Change Role
                            </button>
                            {user.status !== "ARCHIVED" ? (
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleArchiveUser(user.id)
                                  setOpenDropdownIndex(null)
                                }}
                              >
                                Archive
                              </button>
                            ) : (
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleUnarchiveUser(user.id)
                                  setOpenDropdownIndex(null)
                                }}
                              >
                                Unarchive
                              </button>
                            )}
                          </div>
                        </ActionDropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Show</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[10, 20, 50, 100].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-700">entries</span>
                </div>
                <div className="text-sm text-gray-700">
                  Showing {totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to{" "}
                  {Math.min(currentPage * rowsPerPage, totalRows)} of {totalRows} results
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalRows === 0}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Password Modal */}
        {showResetPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                               <div className="flex items-center justify-between p-6 border-b border-gray-200">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                       <Lock className="w-5 h-5 text-blue-600" />
                     </div>
                     <h2 className="text-lg font-semibold text-gray-900">Reset Password</h2>
                   </div>
                <button
                  onClick={() => setShowResetPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submitResetPassword} className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    minLength={8}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowResetPasswordModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingResetPassword}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loadingResetPassword ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Role Modal */}
        {showChangeRoleModal && changeRoleUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Change User Role</h2>
                <button
                  onClick={() => setShowChangeRoleModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submitChangeRole} className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Role for {changeRoleUser.name}
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="Admin">Admin</option>
                    <option value="Instructor">Instructor</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowChangeRoleModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingChangeRole}
                    className="px-4 py-2 bg-orange text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loadingChangeRole ? "Updating..." : "Update Role"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
