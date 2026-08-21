"use client"
import { useState } from "react"
import { toast } from "react-toastify"
import { LockKeyhole, ShieldCheck, Save, Eye, EyeOff, Shield, AlertCircle, CheckCircle2 } from "lucide-react"
import Cookies from "js-cookie" // Still need Cookies for client-side token management
import { settingsService } from "@/services/settingsService" // Import your service

export default function AccountSettings() {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [logoutOtherDevices, setLogoutOtherDevices] = useState(false) // New state
  const [keepLoggedIn, setKeepLoggedIn] = useState(true) // New state, default to true
  const [isLoading, setIsLoading] = useState(false)

  // Password strength validation
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: "", color: "" }

    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    const levels = [
      { strength: 0, label: "", color: "" },
      { strength: 1, label: "Very Weak", color: "bg-red-500" },
      { strength: 2, label: "Weak", color: "bg-orange-500" },
      { strength: 3, label: "Fair", color: "bg-yellow-500" },
      { strength: 4, label: "Good", color: "bg-blue-500" },
      { strength: 5, label: "Strong", color: "bg-green-500" },
    ]

    return levels[strength] || levels[0]
  }

  const passwordStrength = getPasswordStrength(newPassword)
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (passwordStrength.strength < 3) {
      toast.error("Please choose a stronger password")
      return
    }

    setIsLoading(true)

    try {
      const response = await settingsService.updatePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      })
      toast.success(response?.message || response || "Password updated successfully!")

      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")

      // Handle "Keep me logged in" logic
      if (!keepLoggedIn) {
        Cookies.remove("accessToken") // Remove the current session's token
        toast.info("You have been logged out. Please log in again.")
        setTimeout(() => {
          window.location.href = "/login" // Redirect to login page
        }, 1000)
        return // Stop further execution
      }
    } catch (error) {
      console.error("Error changing password:", error)
      const errorData = error?.response?.data
      
      // Helper to strip "fieldName: " prefix if present
      const cleanMsg = (m) => (typeof m === 'string' && m.includes(': ')) ? m.split(': ')[1] : m

      const errorMessage = 
        (errorData?.messages && Array.isArray(errorData.messages) 
          ? errorData.messages.map(cleanMsg).join(", ") 
          : cleanMsg(errorData?.messages)) ||
        cleanMsg(errorData?.message) || 
        (errorData?.errors && typeof errorData.errors === 'object' 
          ? Object.values(errorData.errors).flat().map(cleanMsg).join(", ") 
          : cleanMsg(errorData?.errors)) ||
        errorData?.error || 
        error?.message || 
        "Failed to change password"

      toast.error(errorMessage)
    } finally {

      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-secondary mb-2">My Settings</h1>

      <div className="flex justify-center mb-6">
        <span className="block w-24 h-1 rounded-full bg-orange shadow-md"></span>
      </div>

      <div className="w-full bg-white rounded-lg shadow-lg p-6">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-secondary rounded-lg shadow-sm">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-secondary">Change Password</h2>
              <p className="text-gray-600 text-sm mt-1">Update your account password and security settings</p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Password Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockKeyhole className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showOld ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-gray-900 placeholder-gray-500"
                    placeholder="Enter your current password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowOld(!showOld)}
                  >
                    {showOld ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                    }}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-gray-900 placeholder-gray-500"
                    placeholder="Enter your new password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Password Strength</span>
                      <span
                        className={`text-sm font-medium ${passwordStrength.strength >= 4
                            ? "text-green-600"
                            : passwordStrength.strength >= 3
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary transition-colors text-gray-900 placeholder-gray-500 ${confirmPassword && !passwordsMatch
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-300 focus:border-primary"
                      }`}
                    placeholder="Confirm your new password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {confirmPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    {passwordsMatch ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={isLoading || !passwordsMatch || passwordStrength.strength < 3}
                  className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-base shadow-md"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {isLoading ? "Updating Password..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Password Requirements */}
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 h-fit lg:-mt-16">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-lg font-medium text-blue-900">Password Requirements</h4>
                  <p className="text-sm text-blue-700 mt-1">Follow these guidelines for a strong password</p>
                </div>
              </div>
              <ul className="text-sm text-blue-800 space-y-3">
                <li className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${newPassword.length >= 8 ? "bg-green-500" : "bg-gray-300"}`}></div>
                  <span className={newPassword.length >= 8 ? "text-green-700 font-medium" : "text-blue-700"}>
                    At least 8 characters long
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${/[A-Z]/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`}></div>
                  <span className={/[A-Z]/.test(newPassword) ? "text-green-700 font-medium" : "text-blue-700"}>
                    Contains uppercase letter (A-Z)
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${/[a-z]/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`}></div>
                  <span className={/[a-z]/.test(newPassword) ? "text-green-700 font-medium" : "text-blue-700"}>
                    Contains lowercase letter (a-z)
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${/[0-9]/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`}></div>
                  <span className={/[0-9]/.test(newPassword) ? "text-green-700 font-medium" : "text-blue-700"}>
                    Contains number (0-9)
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${/[^A-Za-z0-9]/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`}></div>
                  <span className={/[^A-Za-z0-9]/.test(newPassword) ? "text-green-700 font-medium" : "text-blue-700"}>
                    Contains special character (!@#$%^&*)
                  </span>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">💡 Tips for Strong Passwords:</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use a mix of letters, numbers, and symbols</li>
                  <li>• Avoid common words or personal information</li>
                  <li>• Consider using a passphrase for better memorability</li>
                  <li>• Never share your password with anyone</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
