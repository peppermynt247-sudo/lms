"use client"

import React, { useState } from "react"
import Papa from "papaparse"
import Cookies from "js-cookie"
import { toast } from "react-toastify"
import { Users, Phone } from "lucide-react"

const countryOptions = [
  { value: "+91", label: "🇮🇳 +91 (IN)" },
  { value: "+1", label: "🇺🇸 +1 (US)" },
  { value: "+44", label: "🇬🇧 +44 (UK)" },
  { value: "+61", label: "🇦🇺 +61 (AU)" },
  // Add more as needed
]

// Mobile Number Input with Auto-Recommendation
const MobileInputWithSuggestions = ({ value, onChange, placeholder, className, error }) => {
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [allLearners, setAllLearners] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = React.useRef(null)
  const suggestionsRef = React.useRef(null)

  // Fetch all learners on component mount
  React.useEffect(() => {
    const fetchAllLearners = async () => {
      const token = Cookies.get("accessToken")
      if (!token) return

      setLoading(true)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/getstudents`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setAllLearners(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error("Error fetching learners:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllLearners()
  }, [])

  // Filter suggestions based on input value
  React.useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const filtered = allLearners
      .filter((learner) => {
        const phone = learner.phone || learner.mobile || learner.phoneNumber || ""
        return phone.includes(value)
      })
      .slice(0, 5) // Limit to 5 suggestions

    setSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
  }, [value, allLearners])

  // Handle suggestion selection
  const handleSuggestionClick = (learner) => {
    const phone = learner.phone || learner.mobile || learner.phoneNumber || ""
    onChange(phone)
    setShowSuggestions(false)
  }

  // Handle click outside to close suggestions
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="relative">
        <input
          ref={inputRef}
          className={`${className} ${error ? "border-red-500 bg-red-50" : ""}`}
          type="text"
          value={value}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 10)
            onChange(val)
          }}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
          maxLength={10}
          placeholder={placeholder}
          autoComplete="off"
          data-form-type="other"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {suggestions.map((learner, index) => {
            const phone = learner.phone || learner.mobile || learner.phoneNumber || ""
            const name = learner.name || "Unknown"
            const email = learner.email || ""

            return (
              <div
                key={index}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => handleSuggestionClick(learner)}
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{phone}</div>
                    <div className="text-sm text-gray-600">
                      {name} • {email}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function LearnerRegistration() {
  const [registerMode, setRegisterMode] = useState("upload")
  const [learners, setLearners] = useState([
    { id: 1, name: "", email: "", countryCode: "+91", mobile: "", password: "", regNo: "", error: {} },
  ])
  const [csvLearners, setCsvLearners] = useState([])
  const [registrationResults, setRegistrationResults] = useState(null)
  const accessToken = Cookies.get("accessToken")

  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/

  const validateLearner = (learner) => {
    const nameValid = learner.name.trim().length >= 3
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(learner.email)
    const phoneValid = /^\d{10}$/.test(learner.mobile || learner.phone)
    const passwordValid = learner.password === "" || strongPasswordRegex.test(learner.password)

    return nameValid && emailValid && phoneValid && passwordValid
  }

  const validateLearnerAndGetError = (learner) => {
    const error = {}
    if (!learner.name || learner.name.trim().length < 3) {
      error.name = "Name required (min 3 chars)"
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!learner.email || !emailRegex.test(learner.email.trim())) {
      error.email = "Invalid email format."
    }
    if (!learner.mobile || learner.mobile.replace(/\D/g, "").length < 10) {
      error.mobile = "Phone number is required (min 10 digits)"
    }
    if (!learner.password || !strongPasswordRegex.test(learner.password)) {
      error.password =
        "Password must be at least 8 characters, include 1 uppercase, 1 lowercase, 1 digit, and 1 symbol."
    }
    // regNo is optional
    return error
  }

  const addLearner = () => {
    setLearners([
      ...learners,
      {
        id: learners.length + 1,
        name: "",
        email: "",
        countryCode: "+91",
        mobile: "",
        password: "",
        regNo: "",
        error: {},
      },
    ])
  }

  const deleteLearner = (id) => {
    if (learners.length === 1) return
    setLearners(learners.filter((learner) => learner.id !== id))
  }

  const handleInputChange = (id, field, value) => {
    setLearners(
      learners.map((learner) =>
        learner.id === id ? { ...learner, [field]: value, error: { ...learner.error, [field]: undefined } } : learner,
      ),
    )
  }

  const handleCSVFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validRows = []
        const errors = []
        results.data.forEach((row, index) => {
          const learner = {
            name: row["Name"]?.trim() || "",
            email: row["Email"]?.trim() || "",
            mobile: row["Mobile number"]?.trim() || "",
            phone: row["Mobile number"]?.trim() || "",
            password: row["Password"]?.trim() || "",
          }
          const error = validateLearnerAndGetError(learner)
          if (Object.keys(error).length > 0) {
            errors.push(`Row ${index + 2}: ${error.name || error.email || error.mobile || error.password}`) // +2 for header
          } else {
            validRows.push(learner)
          }
        })
        if (errors.length > 0) {
          errors.forEach((msg) => toast.error(msg))
        }
        setCsvLearners(validRows)
        if (validRows.length > 0) {
          toast.success(`${validRows.length} valid learners ready to register.`)
        } else {
          toast.error("No valid learners to register from CSV.")
        }
      },
    })
  }

  function normalizePhone(phone) {
    if (!phone) return phone
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, "")
    // If starts with '91' and is 12 digits, return last 10
    if (digits.startsWith("91") && digits.length === 12) {
      return digits.slice(2)
    }
    // If starts with '91' and is 10 digits after, return last 10
    if (digits.length > 10 && digits.endsWith(digits.slice(-10))) {
      return digits.slice(-10)
    }
    return digits
  }

  const downloadCSV = (data, filename) => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCSVSubmit = async () => {
    if (csvLearners.length === 0) {
      toast.error("No valid learners to register from CSV.")
      return
    }
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/enrollments/bulkregistration`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ learners: csvLearners }),
    })
      .then(async (res) => {
        const text = await res.text()
        let data = {}
        try {
          data = JSON.parse(text)
        } catch {}
        if (!res.ok) {
          toast.error((data && data.message) || text || "Unknown error occurred")
          return
        }

        setRegistrationResults(data)

        // Handle the correct response structure from backend
        if (data && data.successfulRegistrations && data.errors) {
          if (data.successfulRegistrations.length === 0 && data.errors.length > 0) {
            toast.error("No new learners were registered. All users already exist.")
          } else if (data.successfulRegistrations.length > 0) {
            toast.success(`${data.successfulRegistrations.length} learners registered successfully.`)
          }
        } else {
          toast.success("Learners registered successfully!")
        }
        // setCsvLearners([]) // Commented out to preserve data for reports
      })
      .catch((error) => {
        toast.error(error.message || "Registration failed")
      })
  }

  // Helper to check if user exists by email or phone
  async function checkUserExists(email, phone, accessToken) {
    // Check email
    let emailExists = false
    let phoneExists = false
    try {
      const emailRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/enrollments/isemailexist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ email }),
        },
      )
      emailExists = emailRes.ok && (await emailRes.json())?.exists
    } catch {}
    try {
      const phoneRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/enrollments/isnumberexist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ phonenumber: phone }),
        },
      )
      phoneExists = phoneRes.ok && (await phoneRes.json())?.exists
    } catch {}
    return emailExists || phoneExists
  }

  const handleManualSubmit = async () => {
    let hasError = false
    const newLearners = learners.map((l) => {
      const error = validateLearnerAndGetError(l)
      if (Object.keys(error).length > 0) hasError = true
      return { ...l, error }
    })
    setLearners(newLearners)
    if (hasError) {
      toast.error("Please fill all required fields correctly.")
      return
    }

    if (!accessToken) {
      toast.error("No access token found. Please login again.")
      return
    }

    // Existence check for each learner
    const learnersToRegister = []
    for (const l of newLearners) {
      const phone = l.mobile.replace(/\D/g, "").slice(-10)
      const exists = await checkUserExists(l.email.trim(), phone, accessToken)
      if (exists) {
        toast.error(`Already registered: ${l.email} / ${phone}`)
      } else {
        learnersToRegister.push({
          name: l.name.trim(),
          email: l.email.trim(),
          phone,
          password: l.password,
          regNo: l.regNo?.trim() || undefined,
          gender: null,
        })
      }
    }

    if (learnersToRegister.length === 0) {
      toast.error("All learners are already registered.")
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/enrollments/bulkregistration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ learners: learnersToRegister }),
      })
      let resBody = null
      try {
        resBody = await res.json()
      } catch (e) {
        resBody = await res.text()
      }
      if (!res.ok) {
        toast.error(resBody?.message || "Registration failed")
        return
      }

      // Handle the correct response structure from backend
      if (resBody && resBody.successfulRegistrations && resBody.errors) {
        // If no successful registrations and only errors, show a general message
        if (resBody.successfulRegistrations.length === 0 && resBody.errors.length > 0) {
          toast.error("No new learners were registered. All users already exist.")
        } else if (resBody.successfulRegistrations.length > 0) {
          // Show only the number of new users registered
          toast.success(`${resBody.successfulRegistrations.length} learners registered successfully.`)
        }
      } else {
        toast.success("Learners registered successfully!")
      }

      setLearners([{ id: 1, name: "", email: "", countryCode: "+91", mobile: "", password: "", regNo: "", error: {} }])
    } catch (error) {
      toast.error(error.message || "Registration failed")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-6 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-orange-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Learner Registration</h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">
            Register new learners individually or in bulk using CSV upload
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={() => setRegisterMode("upload")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                registerMode === "upload"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Upload CSV File
            </button>
            <button
              onClick={() => setRegisterMode("manual")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                registerMode === "manual"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Enter Manually
            </button>
          </div>

          {registerMode === "upload" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Upload CSV File</label>
                <a
                  href="/sample_learners.csv"
                  download
                  className="text-sm text-orange-600 hover:text-orange-700 underline font-medium"
                >
                  Download Sample File
                </a>
              </div>

              <input
                type="file"
                accept=".csv"
                onChange={handleCSVFileChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2 text-sm">CSV Upload Guidelines</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>
                    <strong>Passwords:</strong> Minimum 4 characters. Leave blank for auto-generated 8-character
                    password.
                  </li>
                  <li>
                    <strong>Date Fields:</strong> Use dd-mm-yyyy format
                  </li>
                  <li>
                    <strong>Dropdowns:</strong> Case-sensitive matching required
                  </li>
                  <li>
                    <strong>Custom Fields:</strong> Use #custom_ prefix (e.g., #custom_native language)
                  </li>
                </ul>
              </div>

              {csvLearners.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 text-sm">Preview ({csvLearners.length} learners)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Phone
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Password
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {csvLearners.map((l, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-900">{l.name || "-"}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{l.email || "-"}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{l.phone || l.mobile || "-"}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {l.password ? "••••••••" : "Auto-generated"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCSVSubmit}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-sm"
                >
                  Register Learners
                </button>

                {registrationResults && (
                  <div className="flex gap-3">
                    {registrationResults.successfulRegistrations?.length > 0 && (
                      <button
                        onClick={() => {
                          const originalLearners = csvLearners.length > 0 ? csvLearners : []
                          const data = registrationResults.successfulRegistrations.map((user) => {
                            const original = originalLearners.find(
                              (l) => l.email.trim().toLowerCase() === user.email.toLowerCase(),
                            )
                            return {
                              name: user.role || (original ? original.name : ""), 
                              email: user.email,
                              phone: original ? original.phone || original.mobile : "",
                              password: original ? original.password : "Password@1234",
                            }
                          })
                          downloadCSV(data, "valid_learners.csv")
                        }}
                        className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                      >
                        Download Valid Learners ({registrationResults.successfulRegistrations.length})
                      </button>
                    )}
                    {registrationResults.errors?.length > 0 && (
                      <button
                        onClick={() => {
                          const data = registrationResults.errors.map((err) => ({
                            Email: err.email,
                            Phone: err.phone,
                            Reason: err.message,
                          }))
                          downloadCSV(data, "invalid_learners.csv")
                        }}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                      >
                        Download Invalid Learners ({registrationResults.errors.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {registerMode === "manual" && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Mobile
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Password
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {learners.map((learner) => (
                      <tr key={learner.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            <input
                              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                                learner.error?.name ? "border-red-300 bg-red-50" : "border-gray-300"
                              }`}
                              type="text"
                              value={learner.name}
                              onChange={(e) => handleInputChange(learner.id, "name", e.target.value)}
                              placeholder="Enter name"
                              autoComplete="off"
                              data-form-type="other"
                            />
                            {learner.error?.name && <p className="text-xs text-red-600">{learner.error.name}</p>}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            <MobileInputWithSuggestions
                              value={learner.mobile}
                              onChange={(value) => handleInputChange(learner.id, "mobile", value)}
                              placeholder="10-digit mobile"
                              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                                learner.error?.mobile ? "border-red-300 bg-red-50" : "border-gray-300"
                              }`}
                              error={learner.error?.mobile}
                            />
                            {learner.error?.mobile && <p className="text-xs text-red-600">{learner.error.mobile}</p>}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            <input
                              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                                learner.error?.email ? "border-red-300 bg-red-50" : "border-gray-300"
                              }`}
                              type="email"
                              value={learner.email}
                              onChange={(e) => handleInputChange(learner.id, "email", e.target.value)}
                              placeholder="Enter email"
                              autoComplete="off"
                              data-form-type="other"
                            />
                            {learner.error?.email && <p className="text-xs text-red-600">{learner.error.email}</p>}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            <input
                              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                                learner.error?.password ? "border-red-300 bg-red-50" : "border-gray-300"
                              }`}
                              type="password"
                              value={learner.password}
                              onChange={(e) => handleInputChange(learner.id, "password", e.target.value)}
                              placeholder="Set password"
                              autoComplete="new-password"
                              data-form-type="other"
                            />
                            {learner.error?.password && (
                              <p className="text-xs text-red-600">{learner.error.password}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => deleteLearner(learner.id)}
                            disabled={learners.length === 1}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 digit, and 1 symbol.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={addLearner}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  + Add Another Learner
                </button>
                <button
                  onClick={handleManualSubmit}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-sm"
                >
                  Register Learners
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
