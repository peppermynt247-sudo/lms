"use client"
import DatePicker from "react-datepicker"
import { useState, useEffect } from "react"
import { PlusCircle, User, GraduationCap, Briefcase, Code, FileText, Edit3, Save, XCircle, Trash2, Calendar } from "lucide-react"
import axios from "axios"
import Cookies from "js-cookie"
import { toast } from "react-toastify"
import "react-datepicker/dist/react-datepicker.css"
import LanguageSection from "./components/LanguageSection"
import SkillsSection from "./components/SkillsSection"
import ExperienceSection from "./components/ExperienceSection"

const Profile = ({ editProfile, setEditProfile, userId }) => {
  const [savingProfile, setSavingProfile] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [resumeFile, setResumeFile] = useState(null)
  const [resumePreviewUrl, setResumePreviewUrl] = useState("")
  const [resumeMimeType, setResumeMimeType] = useState("")
  const [editingSections, setEditingSections] = useState({
    basic: false,
    education: false,
    internship: false,
    skills: false,
    resume: false,
  })

  useEffect(() => {
    if (userId) {
      refreshProfileData()
    }
  }, [userId])

  const toggleEditSection = (section) => {
    setEditingSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const saveSection = async (section) => {
    setSavingProfile(true)
    try {
      let payload = {}
      const token = Cookies.get("accessToken") || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null)

      switch (section) {
        case "basic":
          const requiredFields = [
            {
              field: "email",
              name: "Email",
              validation: (value) =>
                !value
                  ? "Email is required"
                  : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                    ? "Invalid email format"
                    : null,
            },
            {
              field: "name",
              name: "Name",
              validation: (value) =>
                !value ? "Name is required" : value.length < 2 ? "Name must be at least 2 characters" : null,
            },
            {
              field: "phone",
              name: "Phone Number",
              validation: (value) =>
                !value
                  ? "Phone number is required"
                  : !/^\d{10}$/.test(value)
                    ? "Phone number must be exactly 10 digits"
                    : null,
            },
            { field: "gender", name: "Gender", validation: (value) => (!value ? "Gender is required" : null) },
            {
              field: "dob",
              name: "Date of Birth",
              validation: (value) => (!value ? "Date of birth is required" : null),
            },
            {
              field: "qualification",
              name: "Qualification",
              validation: (value) => (!value ? "Qualification is required" : null),
            },
            {
              field: "parentName",
              name: "Parent Name",
              validation: (value) => (!value ? "Parent name is required" : null),
            },
            {
              field: "parentContact",
              name: "Parent Contact",
              validation: (value) =>
                !value
                  ? "Parent contact is required"
                  : !/^\d{10}$/.test(value)
                    ? "Parent contact must be exactly 10 digits"
                    : null,
            },
            {
              field: "parentEmail",
              name: "Parent Email",
              validation: (value) =>
                !value
                  ? "Parent email is required"
                  : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                    ? "Invalid parent email format"
                    : null,
            },
            { field: "address", name: "Address", validation: (value) => (!value ? "Address is required" : null) },
            { field: "city", name: "City", validation: (value) => (!value ? "City is required" : null) },
            { field: "state", name: "State", validation: (value) => (!value ? "State is required" : null) },
            { field: "country", name: "Country", validation: (value) => (!value ? "Country is required" : null) },
            {
              field: "pincode",
              name: "Pincode",
              validation: (value) =>
                !value ? "Pincode is required" : !/^\d{6}$/.test(value) ? "Pincode must be exactly 6 digits" : null,
            },
            {
              field: "aadhar",
              name: "Aadhar",
              validation: (value) =>
                !value
                  ? "Aadhar is required"
                  : !/^\d{4}-?\d{4}-?\d{4}$/.test(value)
                    ? "Invalid Aadhar format (should be 12 digits with optional hyphens)"
                    : null,
            },
            {
              field: "pan",
              name: "PAN",
              validation: (value) =>
                !value
                  ? "PAN is required"
                  : !/^[A-Z]{5}\d{4}[A-Z]$/.test(value)
                    ? "Invalid PAN format (should be 10 characters: 5 letters + 4 digits + 1 letter)"
                    : null,
            },
          ]

          for (const field of requiredFields) {
            const error = field.validation(editProfile[field.field])
            if (error) {
              toast.error(`${field.name}: ${error}`)
              setSavingProfile(false)
              return
            }
          }

          if (editProfile.whatsappNumber && !/^\d{10}$/.test(editProfile.whatsappNumber)) {
            toast.error("WhatsApp number must be exactly 10 digits")
            setSavingProfile(false)
            return
          }

          payload = {
            email: editProfile.email,
            name: editProfile.name,
            phone: editProfile.phone,
            parentName: editProfile.parentName,
            parentContact: editProfile.parentContact,
            parentEmail: editProfile.parentEmail,
            gender: editProfile.gender,
            dob: editProfile.dob ? editProfile.dob.toISOString().split("T")[0] : null,
            whatsappNumber: editProfile.whatsappNumber,
            address: editProfile.address,
            qualification: editProfile.qualification,
            aadhar: editProfile.aadhar,
            pan: editProfile.pan,
            city: editProfile.city,
            state: editProfile.state,
            country: editProfile.country,
            pincode: editProfile.pincode,
            educations: editProfile.educations,
          }
          break

        case "education":
          payload = { educations: editProfile.educations }
          break

        case "internship":
          payload = { experiences: editProfile.experiences }
          break

        case "skills":
          payload = {
            skills: editProfile.skills,
            languages: editProfile.languages,
          }
          break

        case "resume":
          if (!resumeFile) {
            toast.error("Please select a resume file to upload")
            setSavingProfile(false)
            return
          }

          try {
            const formData = new FormData()
            formData.append("file", resumeFile)

            const uploadRes = await axios.post(
              `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/user/uploadmyresume`,
              formData,
              {
                headers: {
                  Authorization: token ? `Bearer ${token}` : undefined,
                  "Content-Type": "multipart/form-data",
                },
              },
            )

            if (uploadRes.data?.success) {
              toast.success(uploadRes.data?.message || "Resume uploaded successfully")
              await refreshProfileData()
              setEditingSections((prev) => ({ ...prev, resume: false }))
            } else {
              toast.error(uploadRes.data?.message || "Failed to upload resume")
            }
          } catch (err) {
            console.error("resume upload error:", err?.response?.data || err)
            toast.error("Failed to upload resume")
          } finally {
            setSavingProfile(false)
          }
          return
      }

      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/updateprofile/${userId}`,
        payload,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            "Content-Type": "application/json",
          },
        },
      )

      if (res.data.success) {
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully`)
        await refreshProfileData()
        setEditingSections((prev) => ({ ...prev, [section]: false }))
      } else {
        toast.error(res.data.message || "Update failed")
      }
    } catch (err) {
      console.error(`${section} update error:`, err?.response?.data || err)
      toast.error(`Failed to update ${section}`)
    } finally {
      setSavingProfile(false)
    }
  }

  const getUsedEducationLevels = (educations, currentIndex) => {
    return (educations || [])
      .map((edu, idx) => ({ level: edu.level, index: idx }))
      .filter((item) => item.level && item.index !== currentIndex)
      .map((item) => item.level)
  }

  const refreshProfileData = async () => {
    if (!userId) return
    const token = Cookies.get("accessToken") || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null)
    if (!token) return

    try {
      const profileRes = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/profile/${userId}`,
        { headers: { Authorization: token ? `Bearer ${token}` : undefined } },
      )

      if (profileRes.data?.success && profileRes.data?.data) {
        const profileData = profileRes.data.data
        setEditProfile({
          email: profileData.email || "",
          name: profileData.name || "",
          userId: profileData.userId || userId || "",
          phone: profileData.phoneNumber || "",
          parentName: profileData.parentName || "",
          parentContact: profileData.parentContact || "",
          parentEmail: profileData.parentEmail || "",
          gender: profileData.gender || "",
          dob: profileData.dob ? new Date(profileData.dob) : null,
          whatsappNumber: profileData.whatsappNumber || "",
          address: profileData.address || "",
          qualification: profileData.qualification || "",
          aadhar: profileData.aadhar || "",
          pan: profileData.pan || "",
          city: profileData.city || "",
          state: profileData.state || "",
          country: profileData.country || "",
          pincode: profileData.pincode || "",
          resume: profileData.resume || null,
          educations: profileData.educations || [],
          experiences: profileData.experiences || [],
          skills: profileData.skills || [],
          languages: profileData.languages || [],
        })

        // Build an auth-friendly blob URL for resume preview if backend path is present
        try {
          const resumePath = profileData.resume
          if (resumePath) {
            const token = Cookies.get("accessToken") || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null)
            const base = process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL || ""
            const absolute = /^https?:\/\//i.test(resumePath)
            const url = absolute ? resumePath : `${base}${resumePath.startsWith("/") ? resumePath : `/${resumePath}`}`
            const resp = await axios.get(url, {
              responseType: "blob",
              headers: { Authorization: token ? `Bearer ${token}` : undefined },
            })
            const blob = new Blob([resp.data], { type: resp.headers["content-type"] || "application/octet-stream" })
            const blobUrl = URL.createObjectURL(blob)
            setResumePreviewUrl(blobUrl)
            setResumeMimeType(resp.headers["content-type"] || "")
          } else {
            setResumePreviewUrl("")
            setResumeMimeType("")
          }
        } catch (e) {
          setResumePreviewUrl("")
          setResumeMimeType("")
        }
      }
    } catch (error) {}
  }

  const tabs = [
    { id: "basic", label: "Basic Details", icon: User },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "internship", label: "Experience", icon: Briefcase },
    { id: "skills", label: "Skills & Languages", icon: Code },
    { id: "resume", label: "Resume", icon: FileText },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "basic":
        return (
          <div className="space-y-8">
            <div className="bg-whiteColor">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-size-25 font-semibold text-headingColor flex items-center gap-3">
                  <User className="w-6 h-6 text-blue" /> Personal Details
                </h2>
                <div className="flex gap-3">
                  {!editingSections.basic ? (
                    <button
                      onClick={() => toggleEditSection("basic")}
                      className="flex items-center gap-2 px-3 py-1 bg-primaryColor text-whiteColor rounded-5px hover:bg-primaryColor/90 transition duration-200"
                    >
                      <Edit3 className="w-4 h-4" /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => saveSection("basic")}
                        disabled={savingProfile}
                        className="flex items-center gap-2 px-3 py-1 bg-primaryColor text-whiteColor rounded-5px hover:bg-primaryColor/90 transition duration-200 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" /> {savingProfile ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => toggleEditSection("basic")}
                        className="flex items-center gap-2 px-3 py-1 bg-whitegrey2 text-contentColor rounded-5px hover:bg-whitegrey1 transition duration-200"
                      >
                        <XCircle className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-size-13 font-medium text-contentColor mb-2">
                    Email Address <span className="text-secondaryColor2">*</span>
                  </label>
                  <input
                    type="email"
                    value={editProfile.email}
                    onChange={(e) => setEditProfile((p) => ({ ...p, email: e.target.value }))}
                    className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                      editingSections.basic ? "bg-whiteColor" : "bg-whitegrey2"
                    }`}
                    placeholder="Enter your email address"
                    required
                    disabled={!editingSections.basic}
                  />
                </div>

                <div>
                  <label className="block text-size-13 font-medium text-contentColor mb-2">
                    Full Name <span className="text-secondaryColor2">*</span>
                  </label>
                  <input
                    type="text"
                    value={editProfile.name}
                    onChange={(e) => setEditProfile((p) => ({ ...p, name: e.target.value }))}
                    className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                      editingSections.basic ? "bg-whiteColor" : "bg-whitegrey2"
                    }`}
                    placeholder="Enter your full name"
                    required
                    disabled={!editingSections.basic}
                  />
                </div>

                <div>
                  <label className="block text-size-13 font-medium text-contentColor mb-2">
                    Phone Number <span className="text-secondaryColor2">*</span>
                  </label>
                  <input
                    type="text"
                    value={editProfile.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10)
                      setEditProfile((p) => ({ ...p, phone: val }))
                    }}
                    maxLength={10}
                    className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                      editingSections.basic ? "bg-whiteColor" : "bg-whitegrey2"
                    }`}
                    placeholder="10-digit phone number"
                    required
                    disabled={!editingSections.basic}
                  />
                </div>

                <div>
                  <label className="block text-size-13 font-medium text-contentColor mb-2">WhatsApp Number</label>
                  <input
                    type="text"
                    value={editProfile.whatsappNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10)
                      setEditProfile((p) => ({ ...p, whatsappNumber: val }))
                    }}
                    maxLength={10}
                    className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                      editingSections.basic ? "bg-whiteColor" : "bg-whitegrey2"
                    }`}
                    placeholder="10-digit WhatsApp number"
                    disabled={!editingSections.basic}
                  />
                </div>

                <div>
                  <label className="block text-size-13 font-medium text-contentColor mb-2">
                    Gender <span className="text-secondaryColor2">*</span>
                  </label>
                  <select
                    value={editProfile.gender}
                    onChange={(e) => setEditProfile((p) => ({ ...p, gender: e.target.value }))}
                    className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                      editingSections.basic ? "bg-whiteColor" : "bg-whitegrey2"
                    }`}
                    required
                    disabled={!editingSections.basic}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-size-13 font-medium text-contentColor mb-2">
                    Date of Birth <span className="text-secondaryColor2">*</span>
                  </label>
                  <div className="relative">
                    <DatePicker
                      selected={editProfile.dob}
                      onChange={(date) => setEditProfile((p) => ({ ...p, dob: date }))}
                      dateFormat="yyyy-MM-dd"
                      className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                        editingSections.basic ? "bg-whiteColor" : "bg-whitegrey2"
                      }`}
                      wrapperClassName="w-full"
                      placeholderText="Select date of birth"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      maxDate={new Date()}
                      disabled={!editingSections.basic}
                      popperPlacement="bottom-start"
                    />
                    <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-whitegrey pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-size-13 font-medium text-contentColor mb-2">
                    Qualification <span className="text-secondaryColor2">*</span>
                  </label>
                  <input
                    type="text"
                    value={editProfile.qualification}
                    onChange={(e) => setEditProfile((p) => ({ ...p, qualification: e.target.value }))}
                    className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                      editingSections.basic ? "bg-whiteColor" : "bg-whitegrey2"
                    }`}
                    placeholder="e.g. B.Tech, M.Tech, MBA"
                    required
                    disabled={!editingSections.basic}
                  />
                </div>

                <div>
                  <label className="block text-size-13 font-medium text-contentColor mb-2">
                    Aadhar Number <span className="text-secondaryColor2">*</span>
                  </label>
                  <input
                    type="text"
                    value={editProfile.aadhar}
                    onChange={(e) => setEditProfile((p) => ({ ...p, aadhar: e.target.value }))}
                    className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                      editingSections.basic ? "bg-whiteColor" : "bg-whitegrey2"
                    }`}
                    placeholder="1234-5678-9012"
                    required
                    disabled={!editingSections.basic}
                  />
                </div>

                <div>
                  <label className="block text-size-13 font-medium text-contentColor mb-2">
                    PAN Number <span className="text-secondaryColor2">*</span>
                  </label>
                  <input
                    type="text"
                    value={editProfile.pan}
                    onChange={(e) => setEditProfile((p) => ({ ...p, pan: e.target.value }))}
                    className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                      editingSections.basic ? "bg-whiteColor" : "bg-whitegrey2"
                    }`}
                    placeholder="ABCDE1234F"
                    required
                    disabled={!editingSections.basic}
                  />
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-size-19 font-semibold text-headingColor mb-4">Parent/Guardian Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-size-13 font-medium text-contentColor mb-2">
                      Parent Name <span className="text-secondaryColor2">*</span>
                    </label>
                    <input
                      type="text"
                      value={editProfile.parentName}
                      onChange={(e) => setEditProfile((p) => ({ ...p, parentName: e.target.value }))}
                      className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                        editingSections.basic ? "bg-whiteColor" : "bg-whitegrey2"
                      }`}
                      placeholder="Parent's full name"
                      required
                      disabled={!editingSections.basic}
                    />
                  </div>

                  <div>
                    <label className="block text-size-13 font-medium text-contentColor mb-2">
                      Parent Contact <span className="text-secondaryColor2">*</span>
                    </label>
                    <input
                      type="text"
                      value={editProfile.parentContact}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10)
                        setEditProfile((p) => ({ ...p, parentContact: val }))
                      }}
                      maxLength={10}
                      className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                        editingSections.basic ? "bg-whiteColor" : "bg-whitegrey2"
                      }`}
                      placeholder="Parent's phone number"
                      required
                      disabled={!editingSections.basic}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-size-13 font-medium text-contentColor mb-2">
                      Parent Email <span className="text-secondaryColor2">*</span>
                    </label>
                    <input
                      type="email"
                      value={editProfile.parentEmail}
                      onChange={(e) => setEditProfile((p) => ({ ...p, parentEmail: e.target.value }))}
                      className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                        editingSections.basic ? "bg-whiteColor" : "bg-whitegrey2"
                      }`}
                      placeholder="Parent's email address"
                      required
                      disabled={!editingSections.basic}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-size-19 font-semibold text-headingColor mb-4">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-size-13 font-medium text-contentColor mb-2">
                      Street Address <span className="text-secondaryColor2">*</span>
                    </label>
                    <textarea
                      value={editProfile.address}
                      onChange={(e) => setEditProfile((p) => ({ ...p, address: e.target.value }))}
                      className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 resize-none ${
                        editingSections.basic ? "bg-whiteColor" : "bg-whitegrey2"
                      }`}
                      rows={3}
                      placeholder="Enter your complete address"
                      required
                      disabled={!editingSections.basic}
                    />
                  </div>

                  <div>
                    <label className="block text-size-13 font-medium text-contentColor mb-2">
                      City <span className="text-secondaryColor2">*</span>
                    </label>
                    <input
                      type="text"
                      value={editProfile.city}
                      onChange={(e) => setEditProfile((p) => ({ ...p, city: e.target.value }))}
                      className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                        editingSections.basic ? "bg-whiteColor" : "bg-whitegrey2"
                      }`}
                      placeholder="Enter your city"
                      required
                      disabled={!editingSections.basic}
                    />
                  </div>

                  <div>
                    <label className="block text-size-13 font-medium text-contentColor mb-2">
                      State <span className="text-secondaryColor2">*</span>
                    </label>
                    <select
                      value={editProfile.state}
                      onChange={(e) => setEditProfile((p) => ({ ...p, state: e.target.value }))}
                      className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                        editingSections.basic ? "bg-whiteColor" : "bg-whitegrey2"
                      }`}
                      required
                      disabled={!editingSections.basic}
                    >
                      <option value="">Select State</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Bihar">Bihar</option>
                      <option value="Odisha">Odisha</option>
                      <option value="Assam">Assam</option>
                      <option value="Jharkhand">Jharkhand</option>
                      <option value="Chhattisgarh">Chhattisgarh</option>
                      <option value="Uttarakhand">Uttarakhand</option>
                      <option value="Himachal Pradesh">Himachal Pradesh</option>
                      <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                      <option value="Goa">Goa</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-size-13 font-medium text-contentColor mb-2">
                      Country <span className="text-secondaryColor2">*</span>
                    </label>
                    <select
                      value={editProfile.country}
                      onChange={(e) => setEditProfile((p) => ({ ...p, country: e.target.value }))}
                      className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                        editingSections.basic ? "bg-whiteColor" : "bg-whitegrey2"
                      }`}
                      required
                      disabled={!editingSections.basic}
                    >
                      <option value="">Select Country</option>
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Japan">Japan</option>
                      <option value="China">China</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-size-13 font-medium text-contentColor mb-2">
                      PIN Code <span className="text-secondaryColor2">*</span>
                    </label>
                    <input
                      type="text"
                      value={editProfile.pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6)
                        setEditProfile((p) => ({ ...p, pincode: val }))
                      }}
                      maxLength={6}
                      className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                        editingSections.basic ? "bg-whiteColor" : "bg-whitegrey2"
                      }`}
                      placeholder="6-digit PIN code"
                      required
                      disabled={!editingSections.basic}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case "education":
        return (
          <div className="bg-whiteColor">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-size-25 font-semibold text-headingColor flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-blue" /> Education
              </h2>
              <div className="flex gap-3">
                {!editingSections.education ? (
                  <button
                    onClick={() => toggleEditSection("education")}
                    className="flex items-center gap-2 px-3 py-1 bg-primaryColor text-whiteColor rounded-5px hover:bg-primaryColor/90 transition duration-200"
                  >
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => saveSection("education")}
                      disabled={savingProfile}
                      className="flex items-center gap-2 px-3 py-1 bg-primaryColor text-whiteColor rounded-5px hover:bg-primaryColor/90 transition duration-200 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> {savingProfile ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => toggleEditSection("education")}
                      className="flex items-center gap-2 px-3 py-1 bg-whitegrey2 text-contentColor rounded-5px hover:bg-whitegrey1 transition duration-200"
                    >
                      <XCircle className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {(editProfile.educations || []).map((education, index) => (
                <div key={index} className="p-4 rounded-lg bg-white border border-borderColor">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-size-17 font-semibold text-headingColor">Education {index + 1}</h3>
                    {editingSections.education && (
                      <button
                        onClick={() => {
                          const updatedEducations = (editProfile.educations || []).filter((_, i) => i !== index)
                          setEditProfile((p) => ({ ...p, educations: updatedEducations }))
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-size-13 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 transition duration-200"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-size-13 font-medium text-contentColor mb-2">Level</label>
                      <select
                        value={education.level || ""}
                        onChange={(e) => {
                          const updatedEducations = [...(editProfile.educations || [])]
                          updatedEducations[index] = { ...education, level: e.target.value }
                          setEditProfile((p) => ({ ...p, educations: updatedEducations }))
                        }}
                        className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                          editingSections.education ? "bg-whiteColor" : "bg-whitegrey2"
                        }`}
                        disabled={!editingSections.education}
                      >
                        <option value="">Select Level</option>
                        {["School", "College", "University", "Diploma", "Certificate", "Other"].map((level) => {
                          const usedLevels = getUsedEducationLevels(editProfile.educations, index)
                          const isDisabled = usedLevels.includes(level) && education.level !== level
                          return (
                            <option key={level} value={level} disabled={isDisabled}>
                              {level}
                              {isDisabled ? " (Already selected)" : ""}
                            </option>
                          )
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-size-13 font-medium text-contentColor mb-2">Institution Name</label>
                      <input
                        type="text"
                        value={education.institutionName || ""}
                        onChange={(e) => {
                          const updatedEducations = [...(editProfile.educations || [])]
                          updatedEducations[index] = { ...education, institutionName: e.target.value }
                          setEditProfile((p) => ({ ...p, educations: updatedEducations }))
                        }}
                        className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                          editingSections.education ? "bg-whiteColor" : "bg-whitegrey2"
                        }`}
                        placeholder="Enter institution name"
                        disabled={!editingSections.education}
                      />
                    </div>

                    <div>
                      <label className="block text-size-13 font-medium text-contentColor mb-2">Year of Passing</label>
                      <input
                        type="date"
                        value={education.passOfYear || ""}
                        onChange={(e) => {
                          const updatedEducations = [...(editProfile.educations || [])]
                          updatedEducations[index] = { ...education, passOfYear: e.target.value }
                          setEditProfile((p) => ({ ...p, educations: updatedEducations }))
                        }}
                        className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                          editingSections.education ? "bg-whiteColor" : "bg-whitegrey2"
                        }`}
                        disabled={!editingSections.education}
                      />
                    </div>

                    {education.level === "University" && (
                      <div>
                        <label className="block text-size-13 font-medium text-contentColor mb-2">Branch</label>
                        <input
                          type="text"
                          value={education.branch || ""}
                          onChange={(e) => {
                            const updatedEducations = [...(editProfile.educations || [])]
                            updatedEducations[index] = { ...education, branch: e.target.value }
                            setEditProfile((p) => ({ ...p, educations: updatedEducations }))
                          }}
                          className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                            editingSections.education ? "bg-whiteColor" : "bg-whitegrey2"
                          }`}
                          placeholder="e.g. Computer Science"
                          disabled={!editingSections.education}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-size-13 font-medium text-contentColor mb-2">Board</label>
                      <input
                        type="text"
                        value={education.board || ""}
                        onChange={(e) => {
                          const updatedEducations = [...(editProfile.educations || [])]
                          updatedEducations[index] = { ...education, board: e.target.value }
                          setEditProfile((p) => ({ ...p, educations: updatedEducations }))
                        }}
                        className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                          editingSections.education ? "bg-whiteColor" : "bg-whitegrey2"
                        }`}
                        placeholder="e.g. CBSE, State Board"
                        disabled={!editingSections.education}
                      />
                    </div>

                    {education.level === "University" && (
                      <div>
                        <label className="block text-size-13 font-medium text-contentColor mb-2">Courses</label>
                        <input
                          type="text"
                          value={education.courses || ""}
                          onChange={(e) => {
                            const updatedEducations = [...(editProfile.educations || [])]
                            updatedEducations[index] = { ...education, courses: e.target.value }
                            setEditProfile((p) => ({ ...p, educations: updatedEducations }))
                          }}
                          className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                            editingSections.education ? "bg-whiteColor" : "bg-whitegrey2"
                          }`}
                          placeholder="e.g. B.Tech, M.Tech"
                          disabled={!editingSections.education}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-size-13 font-medium text-contentColor mb-2">Percentage</label>
                      <input
                        type="text"
                        value={education.percentage || ""}
                        onChange={(e) => {
                          const updatedEducations = [...(editProfile.educations || [])]
                          updatedEducations[index] = { ...education, percentage: e.target.value }
                          setEditProfile((p) => ({ ...p, educations: updatedEducations }))
                        }}
                        className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                          editingSections.education ? "bg-whiteColor" : "bg-whitegrey2"
                        }`}
                        placeholder="e.g. 85%"
                        disabled={!editingSections.education}
                      />
                    </div>

                    {education.level === "University" && (
                      <div>
                        <label className="block text-size-13 font-medium text-contentColor mb-2">USN</label>
                        <input
                          type="text"
                          value={education.rollNo || ""}
                          onChange={(e) => {
                            const updatedEducations = [...(editProfile.educations || [])]
                            updatedEducations[index] = { ...education, rollNo: e.target.value }
                            setEditProfile((p) => ({ ...p, educations: updatedEducations }))
                          }}
                          className={`w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200 ${
                            editingSections.education ? "bg-whiteColor" : "bg-whitegrey2"
                          }`}
                          placeholder="Roll Number"
                          disabled={!editingSections.education}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {editingSections.education && (
                <button
                  onClick={() => {
                    const newEducation = {
                      level: "",
                      institutionName: "",
                      passOfYear: "",
                      branch: "",
                      board: "",
                      courses: "",
                      percentage: "",
                      rollNo: "",
                    }
                    setEditProfile((p) => ({ ...p, educations: [...(p.educations || []), newEducation] }))
                  }}
                  className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-borderColor text-contentColor rounded-lg hover:bg-whitegrey2 transition duration-200"
                >
                  <PlusCircle className="w-5 h-5" /> Add Education
                </button>
              )}
            </div>
          </div>
        )
      case "internship":
        return (
          <div className="bg-whiteColor">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-size-25 font-semibold text-headingColor flex items-center gap-3">
                <Briefcase className="w-6 h-6 text-blue" /> Experience
              </h2>
              <div className="flex gap-3">
                {!editingSections.internship ? (
                  <button
                    onClick={() => toggleEditSection("internship")}
                    className="flex items-center gap-2 px-3 py-1 bg-primaryColor text-whiteColor rounded-5px hover:bg-primaryColor/90 transition duration-200"
                  >
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => saveSection("internship")}
                      disabled={savingProfile}
                      className="flex items-center gap-2 px-3 py-1 bg-primaryColor text-whiteColor rounded-5px hover:bg-primaryColor/90 transition duration-200 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> {savingProfile ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => toggleEditSection("internship")}
                      className="flex items-center gap-2 px-3 py-1 bg-whitegrey2 text-contentColor rounded-5px hover:bg-whitegrey1 transition duration-200"
                    >
                      <XCircle className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
            <ExperienceSection
              editProfile={editProfile}
              setEditProfile={setEditProfile}
              userId={userId}
              refreshProfileData={refreshProfileData}
              editingEnabled={editingSections.internship}
            />
          </div>
        )
      case "skills":
        return (
          <div className="bg-whiteColor">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-size-25 font-semibold text-headingColor flex items-center gap-3">
                <Code className="w-6 h-6 text-blue" /> Skills & Languages
              </h2>
              <div className="flex gap-3">
                {!editingSections.skills ? (
                  <button
                    onClick={() => toggleEditSection("skills")}
                    className="flex items-center gap-2 px-3 py-1 bg-primaryColor text-whiteColor rounded-5px hover:bg-primaryColor/90 transition duration-200"
                  >
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => saveSection("skills")}
                      disabled={savingProfile}
                      className="flex items-center gap-2 px-3 py-1 bg-primaryColor text-whiteColor rounded-5px hover:bg-primaryColor/90 transition duration-200 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> {savingProfile ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => toggleEditSection("skills")}
                      className="flex items-center gap-2 px-3 py-1 bg-whitegrey2 text-contentColor rounded-5px hover:bg-whitegrey1 transition duration-200"
                    >
                      <XCircle className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
            <SkillsSection
              editProfile={editProfile}
              userId={userId}
              refreshProfileData={refreshProfileData}
              editingEnabled={editingSections.skills}
            />
            <LanguageSection
              editProfile={editProfile}
              userId={userId}
              refreshProfileData={refreshProfileData}
              editingEnabled={editingSections.skills}
            />
          </div>
        )
      case "resume":
        return (
          <div className="bg-whiteColor">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-size-25 font-semibold text-headingColor flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue" /> Resume
              </h2>
              <div className="flex gap-3">
                {!editingSections.resume ? (
                  <button
                    onClick={() => toggleEditSection("resume")}
                    className="flex items-center gap-2 px-3 py-1 bg-primaryColor text-whiteColor rounded-5px hover:bg-primaryColor/90 transition duration-200"
                  >
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => saveSection("resume")}
                      disabled={savingProfile}
                      className="flex items-center gap-2 px-3 py-1 bg-primaryColor text-whiteColor rounded-5px hover:bg-primaryColor/90 transition duration-200 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> {savingProfile ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => toggleEditSection("resume")}
                      className="flex items-center gap-2 px-3 py-1 bg-whitegrey2 text-contentColor rounded-5px hover:bg-whitegrey1 transition duration-200"
                    >
                      <XCircle className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {editingSections.resume ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-size-13 font-medium text-contentColor mb-2">Resume File</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (!file) return
                      setResumeFile(file)
                      setEditProfile((p) => ({ ...p, resume: file.name }))

                      // Auto-upload on selection
                      const token = Cookies.get("accessToken") || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null)
                      const formData = new FormData()
                      formData.append("file", file)
                      setSavingProfile(true)
                      axios
                        .post(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/user/uploadmyresume`, formData, {
                          headers: {
                            Authorization: token ? `Bearer ${token}` : undefined,
                            "Content-Type": "multipart/form-data",
                          },
                        })
                        .then(async (uploadRes) => {
                          if (uploadRes.data?.success) {
                            toast.success(uploadRes.data?.message || "Resume uploaded successfully")
                            await refreshProfileData()
                            setEditingSections((prev) => ({ ...prev, resume: false }))
                          } else {
                            toast.error(uploadRes.data?.message || "Failed to upload resume")
                          }
                        })
                        .catch((err) => {
                          console.error("resume upload error:", err?.response?.data || err)
                          toast.error("Failed to upload resume")
                        })
                        .finally(() => setSavingProfile(false))
                    }}
                    className="w-full p-3 border border-borderColor rounded-lg text-size-13 focus:ring-2 focus:ring-blue-light1 focus:border-blue transition duration-200"
                  />
                </div>
                <div className="text-size-12 text-whitegrey">Supported formats: PDF, DOC, DOCX</div>
              </div>
            ) : (
              <div className="space-y-3">
                {editProfile.resume ? (
                  <>
                    {(() => {
                      const raw = editProfile.resume || ""
                      const hasBlob = Boolean(resumePreviewUrl)
                      const isPdf = (resumeMimeType || "").includes("pdf") || raw.toLowerCase().endsWith(".pdf")
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-size-13 text-contentColor break-all">{raw}</div>
                            {hasBlob && (
                              <button
                                className="px-3 py-1.5 border rounded text-primaryColor border-primaryColor hover:bg-primaryColor hover:text-whiteColor transition text-sm"
                                onClick={() => window.open(resumePreviewUrl, "_blank")}
                              >
                                View
                              </button>
                            )}
                          </div>
                          {isPdf && hasBlob && (
                            <div className="border border-borderColor rounded-lg overflow-hidden">
                              <iframe src={resumePreviewUrl} title="Resume Preview" className="w-full" style={{ height: 300 }} />
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </>
                ) : (
                  <div className="text-size-13 text-whitegrey">No resume uploaded</div>
                )}
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-w-screen bg-bodyBg py-5">
      <div className="mx-auto">
        <div className="bg-whiteColor overflow-hidden">
          <div className="border-b border-borderColor">
            <div className="flex flex-wrap gap-2 p-4">
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-5px text-size-13 font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-primaryColor text-whiteColor"
                        : "bg-whitegrey2 text-contentColor hover:bg-whitegrey1 hover:text-primaryColor"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="p-6">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  )
}

export default Profile