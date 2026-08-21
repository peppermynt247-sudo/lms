"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import { UserPlus, Trash2, Upload, FileText, ArrowLeft, Users, AlertCircle, CheckCircle, X, Plus } from "lucide-react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import Cookies from "js-cookie"
import * as XLSX from "xlsx"
import { useRouter } from "next/navigation"

export default function AddInstructorPage() {
  const router = useRouter()
  const [mode, setMode] = useState("manual")
  const [branches, setBranches] = useState([])
  const [instructors, setInstructors] = useState([])
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "" })
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [file, setFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [previewData, setPreviewData] = useState([])
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    setLoadingBranches(true)
    axios
      .get("/api/branches")
      .then((res) => setBranches(res.data))
      .catch(() => setBranches([]))
      .finally(() => setLoadingBranches(false))
  }, [])

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddInstructor = () => {
    if (!form.name || !form.email || !form.mobile || !form.password) return

    // Validate the form data
    if (!form.name.trim() || !form.email.trim() || !form.mobile.trim() || !form.password.trim()) {
      toast.error("Please fill in all required fields.")
      return
    }

    // Check if email already exists in the list
    const emailExists = instructors.some((instructor) => instructor.email === form.email)
    if (emailExists) {
      toast.error("An instructor with this email already exists in the list.")
      return
    }

    setInstructors((prev) => [...prev, form])
    setForm({ name: "", email: "", mobile: "", password: "" })
    toast.success("Instructor added to the list!")
  }

  const removeRow = (idx) => {
    setInstructors((prev) => prev.filter((_, i) => i !== idx))
    toast.info("Instructor removed from list")
  }

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      const fileExt = selectedFile.name.split(".").pop().toLowerCase()
      if (fileExt === "csv" || fileExt === "xlsx") {
        setFile(selectedFile)
        // Automatically process and preview the file
        await processFile(selectedFile)
      } else {
        toast.error("Please select a CSV or XLSX file")
      }
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      const fileExt = droppedFile.name.split(".").pop().toLowerCase()
      if (fileExt === "csv" || fileExt === "xlsx") {
        setFile(droppedFile)
        // Automatically process and preview the file
        await processFile(droppedFile)
      } else {
        toast.error("Please upload a CSV or XLSX file")
      }
    }
  }

  const isFormValid = form.name && form.email && form.mobile && form.password

  const handleRegister = async () => {
    if (!isFormValid) return

    const payload = {
      instructors: [
        {
          name: form.name,
          email: form.email,
          phone: Number(form.mobile),
          password: form.password,
        },
      ],
    }

    const token = Cookies.get("accessToken")
    setIsSubmitting(true)

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/instructorregistration`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      )
      toast.success("Instructor registered successfully!")
      sessionStorage.setItem("instructorAdded", "true")
      setForm({ name: "", email: "", mobile: "", password: "" })
      router.push("/admin/users/admin-instructors")
    } catch (err) {
      toast.error("Failed to register instructor.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegisterAll = async () => {
    if (instructors.length === 0) {
      toast.error("No instructors to register.")
      return
    }

    // Validate all instructors before sending
    const invalidInstructors = instructors.filter(
      (instructor) => !instructor.name || !instructor.email || !instructor.mobile || !instructor.password,
    )

    if (invalidInstructors.length > 0) {
      toast.error("Some instructors have missing required fields. Please check all entries.")
      return
    }

    const payload = {
      instructors: instructors.map((instructor) => ({
        name: instructor.name,
        email: instructor.email,
        phone: Number(instructor.mobile),
        password: instructor.password,
      })),
    }

    const token = Cookies.get("accessToken")
    setIsSubmitting(true)

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/instructorregistration`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      )
      toast.success(`${instructors.length} instructor(s) registered successfully!`)
      sessionStorage.setItem("instructorAdded", "true")
      setInstructors([]) // Clear the list
      router.push("/admin/users/admin-instructors")
    } catch (err) {
      if (err.response) {
        toast.error(`Failed to register instructors: ${err.response.data?.message || err.response.statusText}`)
      } else if (err.request) {
        toast.error("Network error. Please check your connection.")
      } else {
        toast.error("Failed to register instructors. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const processFile = async (fileToProcess) => {
    if (!fileToProcess) return

    setIsSubmitting(true)
    const fileExt = fileToProcess.name.split(".").pop().toLowerCase()
    let parsedInstructors = []

    try {
      if (fileExt === "csv") {
        const text = await fileToProcess.text()
        const lines = text.split(/\r?\n/).filter(Boolean)
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
        parsedInstructors = lines.slice(1).map((line) => {
          const values = line.split(",")
          const obj = {}
          headers.forEach((h, i) => {
            obj[h] = values[i] ? values[i].trim() : ""
          })
          return {
            name: obj.name,
            email: obj.email,
            phone: Number(obj.phone),
            password: obj.password,
          }
        })
      } else if (fileExt === "xlsx") {
        const data = await fileToProcess.arrayBuffer()
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        const headers = json[0].map((h) => String(h).trim().toLowerCase())
        parsedInstructors = json.slice(1).map((row) => {
          const obj = {}
          headers.forEach((h, i) => {
            obj[h] = row[i] ? String(row[i]).trim() : ""
          })
          return {
            name: obj.name,
            email: obj.email,
            phone: Number(obj.phone),
            password: obj.password,
          }
        })
      }

      if (parsedInstructors.length === 0) {
        toast.error("No valid instructor data found in file.")
        return
      }

      setPreviewData(parsedInstructors)
      setShowPreview(true)
      toast.success(`${parsedInstructors.length} instructors found in file. Review the data below before submitting.`)

    } catch (err) {
      toast.error("Failed to process file. Please check the file format.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileRegister = async () => {
    if (previewData.length === 0) {
      toast.error("No instructors to register from preview.")
      return
    }

    // Validate all instructors before sending
    const invalidInstructors = previewData.filter(
      (instructor) => !instructor.name || !instructor.email || !instructor.phone || !instructor.password,
    )

    if (invalidInstructors.length > 0) {
      toast.error("Some instructors have missing required fields in preview. Please check all entries.")
      return
    }

    const payload = {
      instructors: previewData.map((instructor) => ({
        name: instructor.name,
        email: instructor.email,
        phone: Number(instructor.phone),
        password: instructor.password,
      })),
    }

    const token = Cookies.get("accessToken")
    setIsSubmitting(true)

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/instructorregistration`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      )
      toast.success(`${previewData.length} instructor(s) registered successfully!`)
      sessionStorage.setItem("instructorAdded", "true")
      setPreviewData([]) // Clear the preview
      setShowPreview(false)
      setFile(null) // Clear the file
      router.push("/admin/users/admin-instructors")
    } catch (err) {
      if (err.response) {
        toast.error(`Failed to register instructors: ${err.response.data?.message || err.response.statusText}`)
      } else if (err.request) {
        toast.error("Network error. Please check your connection.")
      } else {
        toast.error("Failed to register instructors. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }



  const handleClearPreview = () => {
    setPreviewData([])
    setShowPreview(false)
    setFile(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin/users/admin-instructors")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Instructors List
          </button>

          <div className="flex items-center gap-4 mb-2">            
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Add Instructors</h1>
              <p className="text-gray-600 text-sm mt-1">
                Add new instructors to your platform manually or via file upload
              </p>
            </div>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Choose Registration Method</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <label
               className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all duration-200 ${
                 mode === "manual"
                   ? "border-orange-600 bg-orange-50 shadow-sm"
                   : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"
               }`}
             >
              <input
                type="radio"
                name="registration-mode"
                value="manual"
                checked={mode === "manual"}
                onChange={() => setMode("manual")}
                className="sr-only"
              />
              <div className="flex items-start gap-4">
                                 <div
                   className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 mt-0.5 ${
                     mode === "manual" ? "border-orange-600 bg-orange-600" : "border-gray-300"
                   }`}
                 >
                   {mode === "manual" && <div className="w-2 h-2 bg-white rounded-full" />}
                 </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <div className="font-semibold text-lg text-gray-900">Manual Entry</div>
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    Add instructors one by one using form fields. Perfect for adding individual instructors with
                    detailed validation.
                  </div>
                </div>
              </div>
            </label>

                         <label
               className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all duration-200 ${
                 mode === "file"
                   ? "border-orange-600 bg-orange-50 shadow-sm"
                   : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"
               }`}
             >
              <input
                type="radio"
                name="registration-mode"
                value="file"
                checked={mode === "file"}
                onChange={() => setMode("file")}
                className="sr-only"
              />
              <div className="flex items-start gap-4">
                                 <div
                   className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 mt-0.5 ${
                     mode === "file" ? "border-orange-600 bg-orange-600" : "border-gray-300"
                   }`}
                 >
                   {mode === "file" && <div className="w-2 h-2 bg-white rounded-full" />}
                 </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Upload className="w-5 h-5 text-gray-600" />
                    <div className="font-semibold text-lg text-gray-900">File Upload</div>
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    Import multiple instructors from CSV or Excel files. Ideal for bulk registration and data migration.
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Content based on mode */}
        {mode === "manual" ? (
          <div className="space-y-8">
            {/* Manual Entry Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Instructor Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                                     <input
                     type="text"
                     value={form.name}
                     onChange={(e) => handleFormChange("name", e.target.value)}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 placeholder-gray-400"
                     placeholder="Enter full name"
                   />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                                     <input
                     type="email"
                     value={form.email}
                     onChange={(e) => handleFormChange("email", e.target.value)}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 placeholder-gray-400"
                     placeholder="Enter email address"
                   />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                                     <input
                     type="tel"
                     value={form.mobile}
                     onChange={(e) => handleFormChange("mobile", e.target.value)}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 placeholder-gray-400"
                     placeholder="Enter mobile number"
                   />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                                     <input
                     type="password"
                     value={form.password}
                     onChange={(e) => handleFormChange("password", e.target.value)}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 placeholder-gray-400"
                     placeholder="Enter password"
                   />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleAddInstructor}
                  disabled={!isFormValid || isSubmitting}
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add to List
                </button>
                                 <button
                   onClick={handleRegister}
                   disabled={!isFormValid || isSubmitting}
                   className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                 >
                   {isSubmitting ? (
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                   ) : (
                     <CheckCircle className="w-4 h-4" />
                   )}
                   {isSubmitting ? "Registering..." : "Register Single"}
                 </button>
                <button
                  onClick={() => setForm({ name: "", email: "", mobile: "", password: "" })}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  <X className="w-4 h-4" />
                  Clear Form
                </button>
              </div>
            </div>

            {/* Register All Button */}
            {instructors.length > 0 && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Ready to Register</h4>
                    <p className="text-sm text-gray-600">
                      {instructors.length} instructor{instructors.length > 1 ? "s" : ""} ready for bulk registration
                    </p>
                  </div>
                                     <button
                     onClick={handleRegisterAll}
                     disabled={isSubmitting}
                     className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                   >
                     {isSubmitting ? (
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                     ) : (
                       <UserPlus className="w-4 h-4" />
                     )}
                     {isSubmitting ? "Processing..." : `Register All (${instructors.length})`}
                   </button>
                </div>
              </div>
            )}

            {/* Instructors List */}
            {instructors.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900">Instructors Queue ({instructors.length})</h3>
                  <p className="text-sm text-gray-600 mt-1">Review and manage instructors before registration</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                                         <thead className="bg-[#1a2b4e] text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">Mobile</th>
                        <th className="px-6 py-4 text-center text-sm font-medium uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {instructors.map((instructor, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {instructor.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{instructor.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{instructor.mobile}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => removeRow(idx)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove instructor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Upload Instructor File</h3>

            {/* File Upload Area */}
            <div className="mb-8">
              <div
                className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
                  dragActive
                    ? "border-gray-400 bg-gray-50"
                    : file
                      ? "border-gray-400 bg-gray-50"
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {file ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-gray-100 rounded-full">
                      <FileText className="w-12 h-12 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-gray-900 mb-2">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {showPreview ? "File processed - preview available below" : "File ready for upload"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null)
                        setPreviewData([])
                        setShowPreview(false)
                      }}
                      className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      <X className="w-4 h-4" />
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-gray-100 rounded-full">
                      <Upload className="w-12 h-12 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-gray-900 mb-2">
                        Drop your file here, or click to browse
                      </p>
                      <p className="text-sm text-gray-600">Supports CSV and XLSX files up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* File Format Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">File Format Requirements</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      File must contain columns: <strong>name, email, phone, password</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      First row should contain column headers
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      Phone numbers should be numeric values
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      Email addresses must be valid format
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            

            {/* Preview Section */}
            {showPreview && (
              <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                 <div className="mb-6">
                   <h3 className="text-xl font-semibold text-gray-900">Preview of Uploaded Data</h3>
                 </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#1a2b4e] text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">Mobile</th>
                        <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">Password</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {previewData.map((instructor, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{instructor.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{instructor.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{instructor.phone}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{instructor.password}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                                 <div className="mt-6 flex justify-between items-center">
                   <button
                     onClick={handleClearPreview}
                     className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                   >
                     <X className="w-4 h-4" />
                     Clear Preview
                   </button>
                   <button
                     onClick={handleFileRegister}
                     disabled={isSubmitting}
                     className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                   >
                     {isSubmitting ? (
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                     ) : (
                       <CheckCircle className="w-4 h-4" />
                     )}
                     {isSubmitting ? "Registering..." : "Register All from Preview"}
                   </button>
                 </div>
              </div>
            )}
          </div>
        )}

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </div>
  )
}
