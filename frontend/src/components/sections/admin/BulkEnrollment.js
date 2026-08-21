"use client"
import React, { useState, useEffect, useCallback, useRef } from "react"
import { Trash2, PlusCircle, UploadCloud } from "lucide-react"
import { toast } from "react-toastify"
import Cookies from "js-cookie"
import "react-phone-input-2/lib/style.css"
import Select from "react-select"
import Papa from "papaparse"

// Helper functions for GST calculations
const calcPreGST = (amount) => +(amount / 1.18).toFixed(2)
const calcGST = (amount) => +(amount - calcPreGST(amount)).toFixed(2)

// Helper to add months to a date string (yyyy-mm-dd)
function addMonths(dateStr, months) {
  const date = new Date(dateStr)
  date.setMonth(date.getMonth() + months)
  // Handle month overflow (e.g., Jan 31 + 1 month = Mar 3)
  if (date.getDate() !== new Date(dateStr).getDate()) {
    date.setDate(0) // Go to last day of previous month
  }
  return date.toISOString().slice(0, 10)
}

function addDays(dateStr, days) {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const StableInput = React.memo(({ value, onChange, placeholder, className, type = "text" }) => {
  const inputRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)
  const [caretPosition, setCaretPosition] = useState(0)
  const [internalValue, setInternalValue] = useState(value || "")

  useEffect(() => {
    if (inputRef.current && isFocused && type !== "date") {
      inputRef.current.setSelectionRange(caretPosition, caretPosition)
    }
  })

  useEffect(() => {
    if (!isFocused) {
      setInternalValue(value || "")
    }
  }, [value, isFocused])

  const handleChange = (e) => {
    const newValue = e.target.value
    setInternalValue(newValue)
    setCaretPosition(e.target.selectionStart)
    onChange(newValue)
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    onChange(internalValue)
  }

  return (
    <input
      ref={inputRef}
      type={type}
      value={internalValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white ${className}`}
    />
  )
})

function InstallmentsTable({
  installments,
  onDueDateChange,
  setInstallments,
  selectedCourseId,
  handleEnroll,
  loading,
}) {
  const [saving, setSaving] = useState(false)

  const handleAddInstallment = useCallback(() => {
    const newInstallment = {
      id: Date.now(),
      name: `Installment ${installments.length + 1}`,
      amount: "",
      dueDate: "",
      status: "PENDING",
    }
    setInstallments((prev) => [...prev, newInstallment])
  }, [installments.length, setInstallments])

  const handleDeleteInstallment = useCallback(
    (index) => {
      setInstallments((prev) => prev.filter((_, i) => i !== index))
    },
    [setInstallments],
  )

  const handleAmountChange = useCallback(
    (index, value) => {
      const sanitizedValue = value.replace(/[^0-9.]/g, "")
      setInstallments((prev) => {
        const newInstallments = [...prev]
        if (newInstallments[index] && newInstallments[index].amount !== sanitizedValue) {
          newInstallments[index] = { ...newInstallments[index], amount: sanitizedValue }
          return newInstallments
        }
        return prev
      })
    },
    [setInstallments],
  )

  const handleNameChange = useCallback(
    (index, value) => {
      setInstallments((prev) => {
        const newInstallments = [...prev]
        if (newInstallments[index] && newInstallments[index].name !== value) {
          newInstallments[index] = { ...newInstallments[index], name: value }
          return newInstallments
        }
        return prev
      })
    },
    [setInstallments],
  )

  const handleSaveToBackend = async () => {
    if (!selectedCourseId || installments.length === 0) {
      toast.error("Please select a course and add installments first")
      return
    }
    toast.info("Installments will be saved during enrollment")
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 max-w-full mx-auto mt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">Payment Installments</h3>
          <p className="text-gray-600 text-sm">Manage and customize payment schedules</p>
        </div>
      </div>

      {/* Installments Container */}
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
        {/* Desktop Table Header - Hidden on mobile */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-3 mb-3 px-3 py-2 bg-white rounded-lg shadow-sm">
          <div className="col-span-1">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">#</span>
          </div>
          <div className="col-span-3">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Name</span>
          </div>
          <div className="col-span-2">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Amount (₹)</span>
          </div>
          <div className="col-span-2">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Pre-GST</span>
          </div>
          <div className="col-span-2">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">GST (18%)</span>
          </div>
          <div className="col-span-2">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Due Date</span>
          </div>
        </div>

        {/* Installment Rows */}
        <div className="space-y-3">
          {installments.map((inst, idx) => (
            <div
              key={inst.id || `installment-${idx}`}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 sm:p-4 hover:shadow-md transition-all duration-200"
            >
              {/* Mobile Layout */}
              <div className="lg:hidden space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Installment Name</label>
                      <StableInput
                        value={inst.name}
                        onChange={(value) => handleNameChange(idx, value)}
                        placeholder="Enter name"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteInstallment(idx)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 ml-2"
                    title="Delete installment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
                    <StableInput
                      value={inst.amount || ""}
                      onChange={(value) => handleAmountChange(idx, value)}
                      placeholder="0.00"
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={inst.dueDate || ""}
                      onChange={(e) => onDueDateChange(idx, e.target.value)}
                      min={
                        idx > 0 && installments[idx - 1]?.dueDate
                          ? addDays(installments[idx - 1].dueDate, 1)
                          : undefined
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-xs font-medium text-gray-600">Pre-GST</span>
                    <div className="text-sm font-semibold text-gray-700">
                      ₹{((Number.parseFloat(inst.amount) || 0) / 1.18).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-600">GST (18%)</span>
                    <div className="text-sm font-semibold text-orange-600">
                      ₹
                      {((Number.parseFloat(inst.amount) || 0) - (Number.parseFloat(inst.amount) || 0) / 1.18).toFixed(
                        2,
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-3 items-center">
                <div className="col-span-1">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                </div>
                <div className="col-span-3">
                  <StableInput
                    value={inst.name}
                    onChange={(value) => handleNameChange(idx, value)}
                    placeholder="Enter name"
                  />
                </div>
                <div className="col-span-2">
                  <StableInput
                    value={inst.amount || ""}
                    onChange={(value) => handleAmountChange(idx, value)}
                    placeholder="0.00"
                    type="text"
                  />
                </div>
                <div className="col-span-2">
                  <span className="text-sm font-semibold text-gray-700">
                    ₹{((Number.parseFloat(inst.amount) || 0) / 1.18).toFixed(2)}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm font-semibold text-orange-600">
                    ₹{((Number.parseFloat(inst.amount) || 0) - (Number.parseFloat(inst.amount) || 0) / 1.18).toFixed(2)}
                  </span>
                </div>
                                                                                                                                       <div className="col-span-2 flex justify-end">
                      <div className="flex items-stretch w-full max-w-[12rem] min-w-0 border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <input
                    type="date"
                    value={inst.dueDate || ""}
                    onChange={(e) => onDueDateChange(idx, e.target.value)}
                    min={
                      idx > 0 && installments[idx - 1]?.dueDate ? addDays(installments[idx - 1].dueDate, 1) : undefined
                    }
                          className="flex-1 min-w-0 px-2 py-2 text-xs sm:text-sm focus:ring-0 focus:border-0 border-0 outline-none bg-white"
                        />
                        <button
                          onClick={() => handleDeleteInstallment(idx)}
                          className="shrink-0 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 border-l border-gray-200"
                          title="Delete installment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add Installment Button */}
          <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
            <div className="flex justify-center">
              <button
                onClick={handleAddInstallment}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg text-sm font-medium"
              >
                <PlusCircle className="w-4 h-4" />
                Add Installment
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {installments.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusCircle className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-gray-500 text-sm font-medium">No installments configured yet</p>
            <p className="text-gray-400 text-xs">Click "Add Installment" to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}

const BulkEnrollment = () => {
  const [csvLearners, setCsvLearners] = useState([])
  const [enrollmentType, setEnrollmentType] = useState("bundle")
  const [courses, setCourses] = useState([])
  const [bundles, setBundles] = useState([])
  const [batches, setBatches] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [selectedBundleId, setSelectedBundleId] = useState("")
  const [selectedBatchId, setSelectedBatchId] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [installments, setInstallments] = useState([])
  const [paymentPlans, setPaymentPlans] = useState([])
  const [pricingDetails, setPricingDetails] = useState(null)
  const today = new Date().toISOString().slice(0, 10)
  const [paymentFields, setPaymentFields] = useState({
    date: today,
    currency: "INR",
    feesScheme: "",
    place: "Karnataka",
  })

  const token = Cookies.get("accessToken")

  // ... existing useEffect and handler functions ...

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "40px",
      fontSize: "0.875rem",
      borderRadius: "0.5rem",
      borderColor: state.isFocused ? "#f97316" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(249, 115, 22, 0.2)" : "none",
      "&:hover": {
        borderColor: "#f97316",
      },
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
      borderRadius: "0.5rem",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#f97316" : state.isFocused ? "#fed7aa" : "white",
      color: state.isSelected ? "white" : "#374151",
      fontSize: "0.875rem",
    }),
  }

  // Fetch all courses (auth required)
  useEffect(() => {
    if (!token) {
      toast.error("No access token found. Please login again.")
      return
    }

    // Try legacy endpoint first (no pagination)
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses/legacy`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          // If legacy fails, try paginated endpoint
          return fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })
        }
        return res
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch courses: ${res.status} - ${res.statusText}`)
        }
        return res.json()
      })
      .then((data) => {
        let arr = []
        // Handle different response structures
        if (data.data && Array.isArray(data.data.content)) {
          arr = data.data.content
        } else if (data.data && Array.isArray(data.data)) {
          arr = data.data
        } else if (Array.isArray(data)) {
          arr = data
        }
        setCourses(arr)
      })
      .catch((error) => {
        toast.error(`Failed to fetch courses: ${error.message}`)
      })
  }, [])

  // Fetch all bundles (auth required)
  useEffect(() => {
    if (!token) {
      return
    }

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/course-bundles`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch bundles: ${res.status} - ${res.statusText}`)
        }
        return res.json()
      })
      .then((data) => {
        let arr = []
        // Backend returns direct array, not wrapped in data field
        if (Array.isArray(data)) {
          arr = data
        } else if (data.data && Array.isArray(data.data)) {
          arr = data.data
        }
        setBundles(arr)
      })
      .catch((error) => {
        toast.error(`Failed to fetch bundles: ${error.message}`)
      })
  }, [])

  // Function to fetch batches for a specific course or bundle
  const fetchBatchesForCourse = async (courseId, bundleId) => {
    if (!token || (!courseId && !bundleId)) {
      setBatches([])
      setSelectedBatchId("")
      return
    }
    setLoadingBatches(true)
    try {
      let endpoint = ""
      if (courseId) {
        endpoint = `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses/${courseId}/batches`
      } else if (bundleId) {
        endpoint = `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/course-bundles/${bundleId}/batches`
      }

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch batches: ${response.status} - ${response.statusText}`)
      }
      const data = await response.json()
      let batchesArray = []
      // Handle different response structures
      if (data.data && Array.isArray(data.data)) {
        batchesArray = data.data
      } else if (Array.isArray(data)) {
        batchesArray = data
      }
      setBatches(batchesArray)
      // Automatically select the first batch if available
      if (batchesArray.length > 0) {
        const firstBatch = batchesArray[0]
        const firstBatchId = firstBatch.batchId || firstBatch.batch_id || firstBatch.id
        setSelectedBatchId(firstBatchId)
      } else {
        setSelectedBatchId("")
      }
    } catch (error) {
      toast.error(`Failed to fetch batches: ${error.message}`)
      setBatches([])
      setSelectedBatchId("")
    } finally {
      setLoadingBatches(false)
    }
  }

  // Handle course selection
  const handleCourseSelection = (selectedOption) => {
    const courseId = selectedOption ? selectedOption.value : ""
    setSelectedCourseId(courseId)

    if (courseId) {
      // Fetch batches for the selected course
      fetchBatchesForCourse(courseId, null)
    } else {
      // Clear batches if no course is selected
      setBatches([])
      setSelectedBatchId("")
    }
  }

  // Handle bundle selection
  const handleBundleSelection = (selectedOption) => {
    const bundleId = selectedOption ? selectedOption.value : ""
    setSelectedBundleId(bundleId)

    if (bundleId) {
      // Fetch batches for the selected bundle
      fetchBatchesForCourse(null, bundleId)
    } else {
      // Clear batches if no bundle is selected
      setBatches([])
      setSelectedBatchId("")
    }
  }

  // Reset selections when enrollment type changes
  useEffect(() => {
    setSelectedCourseId("")
    setSelectedBundleId("")
    setBatches([])
    setSelectedBatchId("")
  }, [enrollmentType])

  // Handle CSV file upload
  const handleCSVFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size should be less than 2MB")
      return
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error("Error parsing CSV file")
          return
        }

        // Debug: Log the first few rows to see the structure

        const learners = results.data
          .map((row, index) => {
            // Clean and format phone number
            let phone =
              row.phone ||
              row.Phone ||
              row.phoneNumber ||
              row.PhoneNumber ||
              row.mobile ||
              row.Mobile ||
              row.mobileNumber ||
              row.MobileNumber ||
              row["Mobile number"] ||
              row["mobile number"] ||
              row["Phone number"] ||
              row["phone number"] ||
              ""

            // Remove all non-digit characters and ensure it's a string
            if (phone) {
              phone = phone.toString().replace(/\D/g, "")
              // If it starts with country code (91), remove it to get 10 digits
              if (phone.length > 10 && phone.startsWith("91")) {
                phone = phone.substring(2)
              }
              // If it's still more than 10 digits, take last 10
              if (phone.length > 10) {
                phone = phone.substring(phone.length - 10)
              }
            }

            return {
              name: row.name || row.Name || "",
              email: row.email || row.Email || "",
              phone: phone,
              password: row.password || row.Password || "",
              id: index + 1,
            }
          })
          .filter((learner) => learner.name || learner.email || learner.phone)

        if (learners.length === 0) {
          toast.error("No valid learners found in CSV")
          return
        }

        // Validate phone numbers
        const invalidLearners = learners.filter((learner) => learner.phone && learner.phone.length !== 10)
        if (invalidLearners.length > 0) {
          console.warn("Learners with invalid phone numbers:", invalidLearners)
          toast.warning(`${invalidLearners.length} learners have invalid phone numbers (should be 10 digits)`)
        }

        setCsvLearners(learners)
        toast.success(`${learners.length} learners loaded from CSV`)
      },
      error: (error) => {
        toast.error("Error reading CSV file")
      },
    })
  }

  // Handle bulk enrollment
  const handleEnroll = async () => {
    if (loading) return // Prevent double call
    setLoading(true)
    try {
      // 1. Validate required fields
      const missingFields = []
      if (!selectedCourseId && !selectedBundleId) missingFields.push("Course/Bundle")
      if (!selectedBatchId) missingFields.push("Batch")
      if (!paymentFields.date) missingFields.push("Date of enrollment")
      if (!paymentFields.feesScheme) missingFields.push("Fees scheme")
      if (csvLearners.length === 0) missingFields.push("CSV learners")

      // Additional validation to ensure either course or bundle is selected
      if (enrollmentType === "course" && !selectedCourseId) {
        toast.error("Please select a course")
        setLoading(false)
        return
      }
      if (enrollmentType === "bundle" && !selectedBundleId) {
        toast.error("Please select a bundle")
        setLoading(false)
        return
      }

      // Validate that all learners have phone numbers
      const learnersWithoutPhone = csvLearners.filter((learner) => !learner.phone || learner.phone.trim() === "")
      if (learnersWithoutPhone.length > 0) {
        toast.error(`${learnersWithoutPhone.length} learners are missing phone numbers. Please check your CSV file.`)
        setLoading(false)
        return
      }

      if (missingFields.length > 0) {
        const msg = `Please fill all required fields: ${missingFields.join(", ")}`
        toast.error(msg)
        setLoading(false)
        return
      }

      // 2. Ensure a valid installmentsList
      let coursePrice = 0
      let bundlePrice = 0
      let selectedCourseOrBundle = null

      if (selectedCourseId) {
        const selectedCourse = courses.find((c) => (c.courseId || c.course_id || c.id) === selectedCourseId)
        if (selectedCourse && selectedCourse.price) coursePrice = Number(selectedCourse.price)
        selectedCourseOrBundle = selectedCourse
      } else if (selectedBundleId) {
        const selectedBundle = bundles.find((b) => b.bundleId === selectedBundleId)
        if (selectedBundle && selectedBundle.price) bundlePrice = Number(selectedBundle.price)
        selectedCourseOrBundle = selectedBundle
      }

      let safeInstallments = Array.isArray(installments) ? installments : []
      if (safeInstallments.length === 0 && (coursePrice > 0 || bundlePrice > 0)) {
        if (coursePrice > 0) {
          safeInstallments = [{ amount: coursePrice, dueDate: paymentFields.date, status: "PENDING" }]
        } else if (bundlePrice > 0) {
          safeInstallments = [{ amount: bundlePrice, dueDate: paymentFields.date, status: "PENDING" }]
        }
      }
      if (!Array.isArray(safeInstallments)) safeInstallments = []
      // Require due date for each installment
      const hasMissingDueDate = safeInstallments.some((inst) => !inst.dueDate)
      if (hasMissingDueDate) {
        toast.error("Please select a due date for all installments")
        setLoading(false)
        return
      }

      // 3. Prepare bulk registration request
      const formattedInstallments = safeInstallments.map((inst) => ({
        ...inst,
        dueDate: inst.dueDate && inst.dueDate.length === 10 ? `${inst.dueDate}T00:00:00` : inst.dueDate,
      }))

      // Debug: Log the learners data before sending

      const bulkEnrollmentRequest = csvLearners.map((learner) => ({
        email: learner.email,
        name: learner.name || "",
        password: learner.password || "",
        courseId: enrollmentType === "course" ? Number.parseInt(selectedCourseId) : null,
        bundleId: enrollmentType === "bundle" ? Number.parseInt(selectedBundleId) : null,
        batchId: Number.parseInt(selectedBatchId),
        paymentStatus: "PENDING",
        phone: learner.phone || "",
        currency: "INR",
        planId: paymentFields.feesScheme ? Number.parseInt(paymentFields.feesScheme) : null,
        place: paymentFields.place || "Karnataka",
        installments: formattedInstallments.map((inst) => ({
          amount: Number.parseFloat(inst.amount) || 0,
          status: inst.status || "PENDING",
          dueDate: inst.dueDate ? inst.dueDate : null,
        })),
      }))

      // 4. Call bulk enrollment endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/enrollments/bulkenroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bulkEnrollmentRequest),
      })

      if (!response.ok) {
        const errorMsg = await response.text()
        toast.error(errorMsg || "Bulk enrollment failed")
        setLoading(false)
        return
      }

      const data = await response.json()

      // 5. Handle response
      if (response.ok) {
        if (data.alreadyEnrolledUsers && data.alreadyEnrolledUsers.length > 0) {
          toast.warning(`Enrollment completed. ${data.alreadyEnrolledUsers.length} users were already enrolled.`)
        } else {
          toast.success("All learners enrolled successfully!")
        }
      } else {
        toast.error(data.message || "Bulk enrollment failed")
      }

      // 6. Clear CSV data after successful enrollment
      setCsvLearners([])
    } catch (e) {
      toast.error(e.message || "Bulk enrollment failed")
    }
    setLoading(false)
  }

  // --- Installments logic (replace old logic) ---
  useEffect(() => {
    if (!selectedCourseId && !selectedBundleId) {
      setInstallments([])
      return
    }

    let price = 0
    let selectedCourseOrBundle = null

    if (selectedCourseId) {
      const selectedCourse = courses.find((c) => (c.courseId || c.course_id || c.id) === selectedCourseId)
      if (selectedCourse && selectedCourse.price) price = Number(selectedCourse.price)
      selectedCourseOrBundle = selectedCourse
    } else if (selectedBundleId) {
      const selectedBundle = bundles.find((b) => b.bundleId === selectedBundleId)
      if (selectedBundle && selectedBundle.price) price = Number(selectedBundle.price)
      selectedCourseOrBundle = selectedBundle
    }

    if (!price) {
      setInstallments([])
      return
    }

    const endpoint =
      enrollmentType === "course"
        ? `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses/${selectedCourseId}/pricing-details`
        : `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/course-bundles/${selectedBundleId}/pricing-details`

    fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPricingDetails(data)
        const plan = Array.isArray(data.data?.plans)
          ? data.data.plans.find((p) => p.planId === paymentFields.feesScheme)
          : null
        if (plan && Array.isArray(plan.rules) && plan.rules.length > 0 && price > 0) {
          setInstallments(
            plan.rules.map((rule) => {
              const baseDate = new Date(paymentFields.date)
              baseDate.setMonth(baseDate.getMonth() + (rule.interval || 0))
              return {
                amount: Math.round((price * rule.weightage) / 100),
                dueDate: baseDate.toISOString().slice(0, 10),
                status: "PENDING",
                name: `Installment ${rule.installment}`,
                weightage: rule.weightage,
                interval: rule.interval,
              }
            }),
          )
        } else {
          setInstallments([])
        }
      })
      .catch(() => {
        setInstallments([])
      })
  }, [selectedCourseId, selectedBundleId, paymentFields.feesScheme, paymentFields.date, token])

  // --- Table rendering (replace old table) ---
  const handleDueDateChange = (idx, date) => {

    // Validation: Ensure due date is not earlier than or equal to previous installment
    if (idx > 0) {
      const previousInstallment = installments[idx - 1]
      if (previousInstallment.dueDate && date <= previousInstallment.dueDate) {
        toast.error(`Due date must be at least 1 day after the previous installment (${previousInstallment.dueDate})`)
        return
      }
    }

    // Validation: Ensure due date is not later than or equal to next installment (if exists)
    if (idx < installments.length - 1) {
      const nextInstallment = installments[idx + 1]
      if (nextInstallment.dueDate && date >= nextInstallment.dueDate) {
        toast.error(`Due date must be at least 1 day before the next installment (${nextInstallment.dueDate})`)
        return
      }
    }

    setInstallments((insts) => insts.map((inst, i) => (i === idx ? { ...inst, dueDate: date } : inst)))
  }

  // Fetch payment plans when course changes
  useEffect(() => {
    if (!selectedCourseId && !selectedBundleId) {
      setPaymentPlans([])
      setPaymentFields((f) => ({ ...f, feesScheme: "" }))
      return
    }

    let price = 0
    let selectedCourseOrBundle = null

    if (selectedCourseId) {
      const selectedCourse = courses.find((c) => (c.courseId || c.course_id || c.id) === selectedCourseId)
      if (selectedCourse && selectedCourse.price) price = Number(selectedCourse.price)
      selectedCourseOrBundle = selectedCourse
    } else if (selectedBundleId) {
      const selectedBundle = bundles.find((b) => b.bundleId === selectedBundleId)
      if (selectedBundle && selectedBundle.price) price = Number(selectedBundle.price)
      selectedCourseOrBundle = selectedBundle
    }

    if (!price) {
      setPaymentPlans([])
      setPaymentFields((f) => ({ ...f, feesScheme: "" }))
      return
    }

    const endpoint =
      enrollmentType === "course"
        ? `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses/${selectedCourseId}/pricing-details`
        : `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/course-bundles/${selectedBundleId}/pricing-details`

    fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        let plans = []
        if (data.data && Array.isArray(data.data.plans)) {
          plans = data.data.plans
        }
        setPaymentPlans(plans)
        // Reset feesScheme if current is not in new plans
        if (!plans.some((p) => p.planId === paymentFields.feesScheme)) {
          setPaymentFields((f) => ({ ...f, feesScheme: "" }))
        }
      })
      .catch(() => setPaymentPlans([]))
  }, [selectedCourseId, selectedBundleId, token])

  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-6 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Bulk Enrollment</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Enroll multiple learners at once by uploading a CSV file.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Course & Enrollment Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enrollment Type <span className="text-red-500">*</span>
              </label>
              <Select
                classNamePrefix="react-select"
                options={[
                  { value: "bundle", label: "Bundle" },
                  { value: "course", label: "Course" },
                ]}
                value={
                  [
                    { value: "bundle", label: "Bundle" },
                    { value: "course", label: "Course" },
                  ].find((opt) => opt.value === enrollmentType) || null
                }
                onChange={(opt) => setEnrollmentType(opt ? opt.value : "bundle")}
                placeholder="Select enrollment type"
                isClearable={false}
                styles={customSelectStyles}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {enrollmentType === "bundle" ? "Bundle" : "Course"} <span className="text-red-500">*</span>
              </label>
              <Select
                classNamePrefix="react-select"
                options={
                  enrollmentType === "bundle"
                    ? bundles.map((b) => ({ value: b.bundleId, label: b.title || "Unknown Bundle" }))
                    : courses.map((c) => ({
                        value: c.courseId || c.course_id || c.id,
                        label: c.title || c.name || "Unknown Course",
                      }))
                }
                value={
                  enrollmentType === "bundle"
                    ? bundles
                        .map((b) => ({ value: b.bundleId, label: b.title || "Unknown Bundle" }))
                        .find((opt) => opt.value === selectedBundleId) || null
                    : courses
                        .map((c) => ({
                          value: c.courseId || c.course_id || c.id,
                          label: c.title || c.name || "Unknown Course",
                        }))
                        .find((opt) => opt.value === selectedCourseId) || null
                }
                onChange={enrollmentType === "bundle" ? handleBundleSelection : handleCourseSelection}
                placeholder={
                  enrollmentType === "bundle"
                    ? bundles.length > 0
                      ? "Select bundle"
                      : "No bundles"
                    : courses.length > 0
                      ? "Select course"
                      : "No courses"
                }
                isDisabled={!enrollmentType}
                isClearable={enrollmentType === "bundle" ? bundles.length > 0 : courses.length > 0}
                styles={customSelectStyles}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch <span className="text-red-500">*</span>
              </label>
              <Select
                classNamePrefix="react-select"
                options={batches.map((b) => ({
                  value: b.batchId || b.batch_id || b.id,
                  label: b.batchName || b.batch_name || b.name || "Unknown Batch",
                }))}
                value={
                  batches
                    .map((b) => ({
                      value: b.batchId || b.batch_id || b.id,
                      label: b.batchName || b.batch_name || b.name || "Unknown Batch",
                    }))
                    .find((opt) => opt.value === selectedBatchId) || null
                }
                onChange={(opt) => setSelectedBatchId(opt ? opt.value : "")}
                placeholder={
                  selectedCourseId || selectedBundleId
                    ? batches.length > 0
                      ? "Select batch"
                      : "No batches"
                    : "Select course/bundle first"
                }
                isDisabled={!selectedCourseId && !selectedBundleId}
                isClearable={batches.length > 0}
                styles={customSelectStyles}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fees Scheme <span className="text-red-500">*</span>
              </label>
              <Select
                classNamePrefix="react-select"
                options={paymentPlans.map((plan) => ({ value: plan.planId, label: plan.name }))}
                value={
                  paymentPlans
                    .map((plan) => ({ value: plan.planId, label: plan.name }))
                    .find((opt) => opt.value === paymentFields.feesScheme) || null
                }
                onChange={(opt) => setPaymentFields((f) => ({ ...f, feesScheme: opt ? opt.value : "" }))}
                placeholder={
                  selectedCourseId || selectedBundleId
                    ? paymentPlans.length > 0
                      ? "Select fees scheme"
                      : "No plans"
                    : "Select course/bundle first"
                }
                isDisabled={!selectedCourseId && !selectedBundleId}
                isClearable={paymentPlans.length > 0}
                styles={customSelectStyles}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white"
                type="date"
                value={paymentFields.date}
                onChange={(e) => setPaymentFields((f) => ({ ...f, date: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Place</label>
              <Select
                classNamePrefix="react-select"
                options={[
                  { value: "Karnataka", label: "Karnataka" },
                  { value: "Maharashtra", label: "Maharashtra" },
                  { value: "Delhi", label: "Delhi" },
                  { value: "Other", label: "Other" },
                ]}
                value={
                  [
                    { value: "Karnataka", label: "Karnataka" },
                    { value: "Maharashtra", label: "Maharashtra" },
                    { value: "Delhi", label: "Delhi" },
                    { value: "Other", label: "Other" },
                  ].find((opt) => opt.value === paymentFields.place) || null
                }
                onChange={(opt) => setPaymentFields((f) => ({ ...f, place: opt ? opt.value : "" }))}
                placeholder="Select place"
                isClearable
                styles={customSelectStyles}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upload Learners CSV</h2>
            <a
              href="/sample_learners.csv"
              download
              className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm font-medium hover:underline transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              Download Sample File
            </a>
          </div>

          <label
            htmlFor="csv-upload-input"
            className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-dashed border-orange-300 rounded-xl flex flex-col items-center justify-center py-8 sm:py-12 cursor-pointer hover:from-orange-100 hover:to-orange-200 hover:border-orange-400 transition-all duration-200"
          >
            <UploadCloud className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500 mb-3" />
            <div className="font-semibold text-gray-800 text-sm sm:text-base mb-1">
              Drag & drop or click to upload a CSV file
            </div>
            <div className="text-gray-600 text-xs sm:text-sm">Max. file size supported is 2MB</div>
            <input id="csv-upload-input" type="file" accept=".csv" onChange={handleCSVFileChange} className="hidden" />
          </label>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="font-semibold text-blue-900 text-sm mb-2">📋 CSV Upload Guidelines</div>
            <ul className="text-blue-800 text-xs sm:text-sm space-y-1">
              <li>
                <strong>Passwords:</strong> Minimum 4 characters. Leave blank for auto-generated 8-character passwords.
              </li>
              <li>
                <strong>Date Fields:</strong> Use dd-mm-yyyy format.
              </li>
              <li>
                <strong>Dropdowns:</strong> Case sensitive (John Smith ≠ john smith).
              </li>
              <li>
                <strong>Custom Fields:</strong> Prefix column names with #custom_
              </li>
            </ul>
          </div>
        </div>

        {csvLearners.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Preview Learners ({csvLearners.length})</h3>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                {csvLearners.length} learners ready
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Phone</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Password</th>
                  </tr>
                </thead>
                <tbody>
                  {csvLearners.map((l, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 border-b text-gray-900">{l.name ?? ""}</td>
                      <td className="px-4 py-3 border-b text-gray-700">{l.email ?? ""}</td>
                      <td className="px-4 py-3 border-b text-gray-700">{l.phone ?? ""}</td>
                      <td className="px-4 py-3 border-b text-gray-700 font-mono text-xs">{l.password ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Installments Table */}
        {(selectedCourseId || selectedBundleId) && paymentFields.feesScheme && (
          <>
          <InstallmentsTable
            installments={installments}
            onDueDateChange={handleDueDateChange}
            setInstallments={setInstallments}
            selectedCourseId={selectedCourseId}
            handleEnroll={handleEnroll}
            loading={loading}
          />
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={handleEnroll}
                disabled={loading || csvLearners.length === 0}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  "Enroll Learners"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default BulkEnrollment
