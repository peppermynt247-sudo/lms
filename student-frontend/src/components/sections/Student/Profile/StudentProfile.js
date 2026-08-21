"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { toast } from "react-toastify"
import Cookies from "js-cookie"
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiHome,
  FiEdit,
  FiSave,
  FiX,
  FiPlus,
  FiTrash2,
  FiUpload,
  FiEye,
  FiBook,
  FiBriefcase,
  FiAward,
  FiFileText,
  FiEdit2,
  FiTrash,
  FiCheck,
} from "react-icons/fi"
import { profileService } from "@/services/profileService"

function EducationDetails({ educations = [], setEducations, profile, setProfile, setFormData }) {
  const [localEducations, setLocalEducations] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [savingSections, setSavingSections] = useState({})

  useEffect(() => {
    setLocalEducations(Array.isArray(educations) ? educations : [])
  }, [educations])

  const levelOptions = ["School", "College", "Under Graduation", "Post Graduation", "Diploma", "Certificate", "Other"]

  const handleFieldChange = (index, name, value) => {
    const updated = [...localEducations]
    updated[index] = { ...updated[index], [name]: value }
    setLocalEducations(updated)
  }

  const handleAddEducation = () => {
    const newEducation = {
      level: "",
      institutionName: "",
      passOfYear: "",
      branch: "",
      board: "",
      courses: "",
      percentage: "",
      rollNo: "",
      startDate: "",
      endDate: "",
      educationType: "",
    }
    setLocalEducations([...localEducations, newEducation])
  }

  const handleRemoveEducation = async (index) => {
    const updated = localEducations.filter((_, i) => i !== index)
    setLocalEducations(updated)
    
    try {
      setIsSaving(true)
      const payload = {
        educations: updated.map(edu => ({
          ...edu,
          passOfYear: edu.passOfYear ? new Date(edu.passOfYear).toISOString().split('T')[0] : null,
          startDate: edu.startDate ? new Date(edu.startDate).toISOString().split('T')[0] : null,
          endDate: edu.endDate ? new Date(edu.endDate).toISOString().split('T')[0] : null,
        }))
      }
      await profileService.updateProfile(payload)
      toast.success("Education record removed")
      
      // Refresh
      const refreshed = await profileService.getProfile()
      const data = refreshed?.data || refreshed
      if (data) {
        setProfile?.(data)
        setEducations?.(data.educations || [])
      }
    } catch (err) {
      toast.error("Failed to remove education record from database")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveRow = async (index) => {
    const edu = localEducations[index]
    if (!edu.level) return toast.error("Level is required")
    if (!edu.institutionName?.trim()) return toast.error("Institution name is required")

    try {
      setIsSaving(true)
      
      // Map all local educations to payload format
      const formattedEducations = localEducations.map(e => ({
        ...e,
        passOfYear: e.passOfYear ? new Date(e.passOfYear).toISOString().split('T')[0] : null,
        startDate: e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : null,
        endDate: e.endDate ? new Date(e.endDate).toISOString().split('T')[0] : null,
      }))

      const payload = {
        educations: formattedEducations
      }

      await profileService.updateProfile(payload)
      toast.success("Education details saved to database")
      
      // Refresh
      const refreshed = await profileService.getProfile()
      const data = refreshed?.data || refreshed
      if (data) {
        setProfile?.(data)
        setEducations?.(data.educations || [])
        // Also sync formData in parent
        const educationData = data.educations && data.educations.length > 0 ? data.educations[0] : {}
        setFormData?.({
          ...data,
          ...educationData,
          phone: data.phoneNumber || data.phone,
        })
      }
    } catch (err) {
      console.error("Failed to save education:", err)
      toast.error(err?.response?.data?.message || "Failed to save education details")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FiBook className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Education Details</h2>
        </div>
        <button
          onClick={handleAddEducation}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <FiPlus className="w-4 h-4" />
          Add Education
        </button>
      </div>

      <div className="space-y-6">
        {localEducations.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border border-dashed rounded-xl">
            <FiBook className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">No Education Records</h3>
            <p className="text-muted-foreground mb-6">Start by adding your academic history.</p>
            <button
              onClick={handleAddEducation}
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium"
            >
              <FiPlus className="w-4 h-4" />
              Add Record
            </button>
          </div>
        ) : (
          localEducations.map((edu, idx) => (
            <div key={idx} className="bg-card border border-border rounded-xl p-6 shadow-sm relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-6">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Record #{idx + 1}</h4>
                <button
                  onClick={() => handleRemoveEducation(idx)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Remove"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    Level <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={edu.level || ""}
                    onChange={(e) => handleFieldChange(idx, "level", e.target.value)}
                    className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Select Level</option>
                    {levelOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Institution Name *</label>
                  <input
                    type="text"
                    value={edu.institutionName || ""}
                    onChange={(e) => handleFieldChange(idx, "institutionName", e.target.value)}
                    className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="e.g. Stanford University"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Education Type</label>
                  <select
                    value={edu.educationType || ""}
                    onChange={(e) => handleFieldChange(idx, "educationType", e.target.value)}
                    className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Select Type</option>
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Distance">Distance</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Board / University</label>
                  <input
                    type="text"
                    value={edu.board || ""}
                    onChange={(e) => handleFieldChange(idx, "board", e.target.value)}
                    className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="e.g. CBSE / VTU"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Branch / Specialization</label>
                  <input
                    type="text"
                    value={edu.branch || ""}
                    onChange={(e) => handleFieldChange(idx, "branch", e.target.value)}
                    className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="e.g. Computer Science"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Year of Passing</label>
                  <input
                    type="date"
                    value={edu.passOfYear || ""}
                    onChange={(e) => handleFieldChange(idx, "passOfYear", e.target.value)}
                    className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    value={edu.startDate || ""}
                    onChange={(e) => handleFieldChange(idx, "startDate", e.target.value)}
                    className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    value={edu.endDate || ""}
                    onChange={(e) => handleFieldChange(idx, "endDate", e.target.value)}
                    className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Percentage / CGPA</label>
                  <input
                    type="text"
                    value={edu.percentage || ""}
                    onChange={(e) => handleFieldChange(idx, "percentage", e.target.value)}
                    className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="e.g. 85% or 9.0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Roll Number</label>
                  <input
                    type="text"
                    value={edu.rollNo || ""}
                    onChange={(e) => handleFieldChange(idx, "rollNo", e.target.value)}
                    className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="e.g. USN / Roll No"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                 <button
                   onClick={() => handleSaveRow(idx)}
                   disabled={isSaving}
                   className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
                 >
                   {isSaving ? (
                     <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                   ) : (
                     <FiSave className="w-4 h-4" />
                   )}
                   Save Changes
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function BasicDetails({ profile, onUpdate, setProfile, setFormData }) {
  const [editing, setEditing] = useState({})
  const [savingSections, setSavingSections] = useState({})
  const [fields, setFields] = useState({
    about: {
      fullName: "",
      dob: "",
      gender: "",
      email: "",
      mobile: "",
      whatsappNumber: "",
      pan: "",
    },
    parent: {
      parentName: "",
      parentContact: "",
      parentEmail: "",
    },
    summary: {
      paragraph: "",
    },
    address: {
      address: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
    },
  })

  useEffect(() => {
    if (!profile) return
    setFields({
      about: {
        fullName: profile.name || "",
        dob: profile.dob || "",
        gender: profile.gender || "",
        email: profile.email || "",
        mobile: profile.phoneNumber || profile.phone || "",
        whatsappNumber: profile.whatsappNumber || "",
        qualification: profile.qualification || "",
        aadhar: profile.aadhar || "",
        pan: profile.pan || "",
        college: profile.college || "",
      },
      parent: {
        parentName: profile.parentName || "",
        parentContact: profile.parentContact || "",
        parentEmail: profile.parentEmail || "",
      },
      summary: {
        paragraph: profile.bio || "",
      },
      address: {
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        country: profile.country || "",
        pincode: profile.pincode || "",
      },
    })
  }, [profile])

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No profile data available</p>
      </div>
    )
  }


  const handleEdit = (section) => {
    setEditing({ ...editing, [section]: true })
  }

  const handleSave = async (section) => {
    try {
      setSavingSections((prev) => ({ ...prev, [section]: true }))

      // Construct payload for back-end update
      const payload = {}
      if (section === "about") {
        payload.name = fields.about.fullName
        payload.dob = fields.about.dob
        payload.gender = fields.about.gender
        payload.email = fields.about.email
        payload.phone = fields.about.mobile
        payload.whatsappNumber = fields.about.whatsappNumber
        payload.qualification = fields.about.qualification
        payload.aadhar = fields.about.aadhar
        payload.pan = fields.about.pan
      } else if (section === "parent") {
        payload.parentName = fields.parent.parentName
        payload.parentContact = fields.parent.parentContact
        payload.parentEmail = fields.parent.parentEmail
      } else if (section === "summary") {
        payload.bio = fields.summary.paragraph
      } else if (section === "address") {
        payload.address = fields.address.address
        payload.city = fields.address.city
        payload.state = fields.address.state
        payload.country = fields.address.country
        payload.pincode = fields.address.pincode
      }

      // Sync local parent state first (optimistic)
      if (onUpdate) {
        onUpdate(fields)
      }

      // Call API
      const res = await profileService.updateProfile(payload)
      if (res?.success === false) {
        toast.error(res?.message || `Failed to update ${section}`)
        return
      }

      toast.success(`${section} saved to database`)
      setEditing((prev) => ({ ...prev, [section]: false }))

      // Refresh full profile from server to ensure everything is in sync
      try {
        const refreshed = await profileService.getProfile()
        const data = refreshed?.data || refreshed
        if (data) {
          setProfile?.(data)
          // Update fields state with refreshed profile data for all sections
          setFields({
            about: {
              fullName: data.name || "",
              dob: data.dob || "",
              gender: data.gender || "",
              email: data.email || "",
              mobile: data.phoneNumber || data.phone || "",
              whatsappNumber: data.whatsappNumber || "",
              qualification: data.qualification || "",
              aadhar: data.aadhar || "",
              pan: data.pan || "",
              college: data.college || "",
            },
            parent: {
              parentName: data.parentName || "",
              parentContact: data.parentContact || "",
              parentEmail: data.parentEmail || "",
            },
            summary: {
              paragraph: data.bio || "",
            },
            address: {
              address: data.address || "",
              city: data.city || "",
              state: data.state || "",
              country: data.country || "",
              pincode: data.pincode || "",
            },
          })
          // Update parent's combined formData as well
          const educationData = data.educations && data.educations.length > 0 ? data.educations[0] : {}
          setFormData?.({
            ...data,
            ...educationData,
            phone: data.phoneNumber || data.phone,
          })
        }
      } catch (refreshErr) {
        console.error("Failed to refresh profile:", refreshErr)
      }
    } catch (err) {
      console.error(`Error saving ${section}:`, err)
      toast.error(err?.response?.data?.message || `Failed to save ${section}`)
    } finally {
      setSavingSections((prev) => ({ ...prev, [section]: false }))
    }
  }

  const handleCancel = (section) => {
    setEditing({ ...editing, [section]: false })
    // Revert fields from current profile
    if (profile) {
      const refreshedSection = {}
      if (section === "about") {
        refreshedSection.about = {
          fullName: profile.name || "",
          dob: profile.dob || "",
          gender: profile.gender || "",
          email: profile.email || "",
          mobile: profile.phoneNumber || profile.phone || "",
          whatsappNumber: profile.whatsappNumber || "",
          qualification: profile.qualification || "",
          aadhar: profile.aadhar || "",
          pan: profile.pan || "",
          college: profile.college || "",
        }
      } else if (section === "parent") {
        refreshedSection.parent = {
          parentName: profile.parentName || "",
          parentContact: profile.parentContact || "",
          parentEmail: profile.parentEmail || "",
        }
      } else if (section === "summary") {
        refreshedSection.summary = {
          paragraph: profile.bio || "",
        }
      } else if (section === "address") {
        refreshedSection.address = {
          address: profile.address || "",
          city: profile.city || "",
          state: profile.state || "",
          country: profile.country || "",
          pincode: profile.pincode || "",
        }
      }
      setFields((prev) => ({ ...prev, ...refreshedSection }))
    }
  }

  const handleFieldChange = (section, field, value) => {
    setFields((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  const renderSection = (title, section, icon, sectionFields) => (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
          <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
        </div>
        {!editing[section] ? (
          <button
            onClick={() => handleEdit(section)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <FiEdit className="w-4 h-4" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => handleSave(section)}
              disabled={savingSections[section]}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingSections[section] ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <FiSave className="w-4 h-4" />
              )}
              {savingSections[section] ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => handleCancel(section)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <FiX className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sectionFields.map(({ label, key, type = "text", options }) => (
          <div key={key} className={type === "textarea" ? "md:col-span-2" : ""}>
            <label className="block text-sm font-medium text-card-foreground mb-2">{label}</label>
            {editing[section] ? (
              type === "select" ? (
                <select
                  value={fields[section]?.[key] || ""}
                  onChange={(e) => handleFieldChange(section, key, e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground"
                >
                  <option value="">Select {label}</option>
                  {options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : type === "textarea" ? (
                <textarea
                  value={fields[section]?.[key] || ""}
                  onChange={(e) => handleFieldChange(section, key, e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground resize-none"
                  placeholder={`Enter ${label.toLowerCase()}`}
                />
              ) : (
                <input
                  type={type}
                  value={fields[section]?.[key] || ""}
                  onChange={(e) => handleFieldChange(section, key, e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground"
                  placeholder={`Enter ${label.toLowerCase()}`}
                />
              )
            ) : (
              <div className="px-3 py-2 bg-muted rounded-lg text-muted-foreground min-h-[40px] flex items-center">
                {fields[section]?.[key] || `No ${label.toLowerCase()} provided`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {renderSection("Personal Information", "about", <FiUser className="w-5 h-5 text-primary" />, [
        { label: "Full Name", key: "fullName" },
        { label: "Date of Birth", key: "dob", type: "date" },
        { label: "Gender", key: "gender", type: "select", options: ["Male", "Female", "Other"] },
        { label: "Email", key: "email", type: "email" },
        { label: "Mobile Number", key: "mobile", type: "tel" },
        { label: "WhatsApp Number", key: "whatsappNumber", type: "tel" },
        { label: "Qualification", key: "qualification" },
        { label: "Aadhar Number", key: "aadhar" },
        { label: "PAN Number", key: "pan" },
      ])}

      {renderSection("Professional Summary", "summary", <FiFileText className="w-5 h-5 text-primary" />, [
        { label: "About Yourself", key: "paragraph", type: "textarea" },
      ])}

      {renderSection("Address Information", "address", <FiMapPin className="w-5 h-5 text-primary" />, [
        { label: "Address", key: "address", type: "textarea" },
        { label: "City", key: "city" },
        { label: "State", key: "state" },
        { label: "Country", key: "country" },
        { label: "Pincode", key: "pincode" },
      ])}

      {renderSection("Parent/Guardian Details", "parent", <FiHome className="w-5 h-5 text-primary" />, [
        { label: "Parent/Guardian Name", key: "parentName" },
        { label: "Parent Contact", key: "parentContact", type: "tel" },
        { label: "Parent Email", key: "parentEmail", type: "email" },
      ])}
    </div>
  )
}

function InternshipDetails({ experiences = [], setExperiences, profile, setProfile }) {
  const [editing, setEditing] = useState(false)
  const [localExperiences, setLocalExperiences] = useState([])
  const [isSavingLocal, setIsSavingLocal] = useState(false)

  useEffect(() => {
    setLocalExperiences(Array.isArray(experiences) ? experiences : [])
  }, [experiences])

  const handleFieldChange = (index, name, value) => {
    const updated = [...localExperiences]
    updated[index] = { ...updated[index], [name]: value }
    setLocalExperiences(updated)
  }

  const handleAdd = () => {
    const newItem = {
      company: "",
      title: "",
      designation: "",
      location: "",
      positionType: "",
      companySector: "",
      startdate: "",
      enddate: "",
      details: "",
    }
    setLocalExperiences([...(localExperiences || []), newItem])
  }

  const handleRemove = async (index) => {
    try {
      const exp = localExperiences[index]
      if (exp?.id) {
        await profileService.deleteMyExperience(exp.id)
        toast.success("Experience removed")
      }
      const updated = [...localExperiences]
      updated.splice(index, 1)
      setLocalExperiences(updated)
      setExperiences?.(updated)
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete experience")
    }
  }

  const handleSave = () => {
    // Exit edit mode; per-row save handles persistence
    setExperiences?.(localExperiences)
    setEditing(false)
  }

  const handleCancel = () => {
    setLocalExperiences(Array.isArray(experiences) ? experiences : [])
    setEditing(false)
  }

  const resolveUserId = () => {
    const fromProfile = profile?.userId || profile?.id
    if (fromProfile) return Number(fromProfile)
    if (typeof window !== "undefined") {
      const ls = window.localStorage.getItem("userId")
      if (ls) return Number(ls)
    }
    return undefined
  }

  const toDateString = (value) => {
    if (!value) return ""
    try {
      const d = value instanceof Date ? value : new Date(value)
      if (Number.isNaN(d.getTime())) return ""
      return d.toISOString().split("T")[0]
    } catch {
      return ""
    }
  }

  const handleSaveOrUpdate = async (index) => {
    const exp = localExperiences[index]
    // Basic validation
    const required = [
      { key: "company", name: "Company" },
      { key: "title", name: "Title" },
      { key: "startdate", name: "Start Date" },
    ]
    for (const { key, name } of required) {
      if (!exp?.[key]) {
        toast.error(`${name} is required`)
        return
      }
    }

    if (exp.startdate && exp.enddate) {
      const s = new Date(exp.startdate)
      const e = new Date(exp.enddate)
      if (s > e) {
        toast.error("Start date must be before end date")
        return
      }
    }

    const userId = resolveUserId()
    const payload = {
      id: userId,
      company: exp.company || "",
      title: exp.title || "",
      startdate: toDateString(exp.startdate),
      enddate: toDateString(exp.enddate),
      location: exp.location || "",
      details: exp.details || "",
      positionType: exp.positionType || "",
      designation: exp.designation || exp.title || "",
      companySector: exp.companySector || "",
    }

    try {
      setIsSavingLocal(true)
      if (exp?.id) {
        const res = await profileService.updateExperience(exp.id, payload)
        if (res?.success === false) return toast.error(res?.message || "Failed to update experience")
        toast.success(res?.message || "Experience updated")
      } else {
        const res = await profileService.addExperience(payload)
        if (res?.success === false) return toast.error(res?.message || "Failed to add experience")
        toast.success(res?.message || "Experience added")
      }
      // Refresh from server to sync ids
      try {
        const refreshed = await profileService.getProfile()
        const data = refreshed?.data || refreshed
        const newExps = data?.experiences || []
        setLocalExperiences(newExps)
        setExperiences?.(newExps)
        setProfile?.(data)
      } catch { }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Operation failed")
    } finally {
      setIsSavingLocal(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FiBriefcase className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Work Experience</h2>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <FiPlus className="w-4 h-4" />
          Add Experience
        </button>
      </div>

      {localExperiences.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <FiBriefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-card-foreground mb-2">No Experience Added</h3>
          <p className="text-muted-foreground mb-4">
            Start building your professional profile by adding your work experience.
          </p>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium mx-auto"
          >
            <FiPlus className="w-4 h-4" />
            Add Your First Experience
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {localExperiences.map((exp, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-card-foreground">{exp.title || "Untitled Position"}</h3>
                  <p className="text-primary font-medium">{exp.company || "Company Name"}</p>
                  <p className="text-sm text-muted-foreground">{exp.location || "Location"}</p>
                </div>
                <button
                  onClick={() => handleRemove(index)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Position Title</label>
                  <input
                    type="text"
                    value={exp.title}
                    onChange={(e) => handleFieldChange(index, "title", e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground"
                    placeholder="e.g. Software Engineer Intern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Company</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => handleFieldChange(index, "company", e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground"
                    placeholder="e.g. Google Inc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Location</label>
                  <input
                    type="text"
                    value={exp.location}
                    onChange={(e) => handleFieldChange(index, "location", e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground"
                    placeholder="e.g. Bangalore, India"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Position Type</label>
                  <select
                    value={exp.positionType}
                    onChange={(e) => handleFieldChange(index, "positionType", e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground"
                  >
                    <option value="">Select Type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Start Date</label>
                  <input
                    type="date"
                    value={exp.startdate}
                    onChange={(e) => handleFieldChange(index, "startdate", e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">End Date</label>
                  <input
                    type="date"
                    value={exp.enddate}
                    onChange={(e) => handleFieldChange(index, "enddate", e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">Description</label>
                <textarea
                  value={exp.details}
                  onChange={(e) => handleFieldChange(index, "details", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground resize-none"
                  placeholder="Describe your responsibilities and achievements..."
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleSaveOrUpdate(index)}
                  disabled={isSavingLocal}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isSavingLocal ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <FiSave className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SkillsLanguagesDetails({ skills = [], setSkills, languages = [], setLanguages, profile, setProfile }) {
  const [newSkill, setNewSkill] = useState({ name: "", level: "" })
  const [editingSkill, setEditingSkill] = useState(null) // { index, id, name, level }
  const [isAddingSkill, setIsAddingSkill] = useState(false)
  const [isUpdatingSkill, setIsUpdatingSkill] = useState(false)
  const [isDeletingSkill, setIsDeletingSkill] = useState(false)

  const [newLanguage, setNewLanguage] = useState({ name: "", proficiency: "" })
  const [editingLanguage, setEditingLanguage] = useState(null) // { index, id, name, proficiency }
  const [isAddingLanguage, setIsAddingLanguage] = useState(false)
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false)
  const [isDeletingLanguage, setIsDeletingLanguage] = useState(false)

  const refreshProfileData = async () => {
    try {
      const response = await profileService.getProfile()
      const profileData = response?.data || response
      setProfile?.(profileData)

      // Standardize skills for UI
      const standardizedSkills = (profileData.skills || []).map(s => ({
        id: s.id,
        name: s.skillName || s.name,
        level: s.proficiencyLevel || s.level
      }))
      setSkills?.(standardizedSkills)

      // Standardize languages for UI
      const standardizedLanguages = (profileData.languages || []).map(l => ({
        id: l.id,
        name: l.languageName || l.name,
        proficiency: l.proficiencyLevel || l.proficiency
      }))
      setLanguages?.(standardizedLanguages)
    } catch (error) {
      console.error("Failed to refresh profile after update:", error)
    }
  }

  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) {
      toast.error("Please enter a skill name")
      return
    }
    if (!newSkill.level) {
      toast.error("Please select a proficiency level")
      return
    }
    try {
      setIsAddingSkill(true)
      const payload = {
        skillName: newSkill.name.trim(),
        proficiencyLevel: newSkill.level
      }
      const res = await profileService.addMySkill(payload)
      if (res?.success === false) return toast.error(res?.message || "Failed to add skill")
      toast.success(res?.message || "Skill added")
      setNewSkill({ name: "", level: "" })
      await refreshProfileData()
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add skill")
    } finally {
      setIsAddingSkill(false)
    }
  }

  const handleUpdateSkill = async () => {
    if (!editingSkill) return
    if (!editingSkill.name.trim() || !editingSkill.level) return
    try {
      setIsUpdatingSkill(true)
      const payload = {
        skillName: editingSkill.name.trim(),
        proficiencyLevel: editingSkill.level
      }
      const skillId = editingSkill.id
      if (!skillId) {
        toast.error("Cannot update skill without ID")
        return
      }
      const res = await profileService.updateMySkill(skillId, payload)
      if (res?.success === false) return toast.error(res?.message || "Failed to update skill")
      toast.success(res?.message || "Skill updated")
      setEditingSkill(null)
      await refreshProfileData()
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update skill")
    } finally {
      setIsUpdatingSkill(false)
    }
  }

  const handleDeleteSkill = async (index) => {
    const skill = skills[index]
    if (!skill?.id) {
      toast.error("Can't delete skill without ID")
      return
    }
    try {
      setIsDeletingSkill(true)
      const res = await profileService.deleteMySkill(skill.id)
      if (res?.success === false) return toast.error(res?.message || "Failed to delete skill")
      toast.success(res?.message || "Skill deleted")
      await refreshProfileData()
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete skill")
    } finally {
      setIsDeletingSkill(false)
    }
  }

  const handleAddLanguage = async () => {
    if (!newLanguage.name.trim()) {
      toast.error("Please enter a language name")
      return
    }
    if (!newLanguage.proficiency) {
      toast.error("Please select a proficiency level")
      return
    }
    try {
      setIsAddingLanguage(true)
      const payload = {
        languageName: newLanguage.name.trim(),
        proficiencyLevel: newLanguage.proficiency
      }
      const res = await profileService.addMyLanguage(payload)
      if (res?.success === false) return toast.error(res?.message || "Failed to add language")
      toast.success(res?.message || "Language added")
      setNewLanguage({ name: "", proficiency: "" })
      await refreshProfileData()
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add language")
    } finally {
      setIsAddingLanguage(false)
    }
  }

  const handleUpdateLanguage = async () => {
    if (!editingLanguage) return
    if (!editingLanguage.name.trim() || !editingLanguage.proficiency) return
    try {
      setIsUpdatingLanguage(true)
      const payload = {
        languageName: editingLanguage.name.trim(),
        proficiencyLevel: editingLanguage.proficiency
      }
      const langId = editingLanguage.id
      if (!langId) {
        toast.error("Cannot update language without ID")
        return
      }
      const res = await profileService.updateMyLanguage(langId, payload)
      if (res?.success === false) return toast.error(res?.message || "Failed to update language")
      toast.success(res?.message || "Language updated")
      setEditingLanguage(null)
      await refreshProfileData()
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update language")
    } finally {
      setIsUpdatingLanguage(false)
    }
  }

  const handleDeleteLanguage = async (index) => {
    const lang = languages[index]
    if (!lang?.id) {
      toast.error("Can't delete language without ID")
      return
    }
    try {
      setIsDeletingLanguage(true)
      const res = await profileService.deleteMyLanguage(lang.id)
      if (res?.success === false) return toast.error(res?.message || "Failed to delete language")
      toast.success(res?.message || "Language deleted")
      await refreshProfileData()
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete language")
    } finally {
      setIsDeletingLanguage(false)
    }
  }

  return (
    <div className="p-6 space-y-10">
      <div>
        <h4 className="flex items-center gap-2 text-lg font-semibold text-secondary mb-6">Skills</h4>

        <div className="flex flex-col md:flex-row items-center gap-3 mb-6 p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50">
          <input
            type="text"
            value={newSkill.name}
            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
            placeholder="Skill name"
            className="w-full md:w-1/3 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <select
            value={newSkill.level}
            onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
            className="w-full md:w-1/3 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Level</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
            <option value="Master">Master</option>
          </select>
          <button
            type="button"
            onClick={handleAddSkill}
            disabled={isAddingSkill}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition md:ml-auto disabled:opacity-50 font-medium shadow-sm"
          >
            {isAddingSkill ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <FiPlus className="w-4 h-4" />
            )}
            Add Skill
          </button>
        </div>

        {!skills || skills.length === 0 ? (
          <div className="text-gray-500 text-sm">No skills added</div>
        ) : (
          <div className="space-y-3">
            {(skills || []).map((skill, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition"
              >
                {editingSkill?.index === index ? (
                  <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                    <input
                      type="text"
                      value={editingSkill.name}
                      onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <select
                      value={editingSkill.level}
                      onChange={(e) => setEditingSkill({ ...editingSkill, level: e.target.value })}
                      className="w-40 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                      <option value="Master">Master</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleUpdateSkill}
                        disabled={isUpdatingSkill}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isUpdatingSkill ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <FiSave className="w-4 h-4" />
                        )}
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSkill(null)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-400 text-white rounded-lg text-sm hover:bg-gray-500"
                      >
                        <FiX className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="font-medium">{skill.name}</div>
                      <div className="text-sm text-gray-600">{skill.level}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingSkill({ index, id: skill.id, name: skill.name, level: skill.level })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20 transition"
                      >
                        <FiEdit2 className="w-4 h-4" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSkill(index)}
                        disabled={isDeletingSkill}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 transition disabled:opacity-50"
                      >
                        {isDeletingSkill ? (
                          <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <FiTrash className="w-4 h-4" />
                        )}
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="flex items-center gap-2 text-lg font-semibold text-secondary mb-6">Languages</h4>

        <div className="flex flex-col md:flex-row items-center gap-3 mb-6 p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50">
          <input
            type="text"
            value={newLanguage.name}
            onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
            placeholder="Language name"
            className="w-full md:w-1/3 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <select
            value={newLanguage.proficiency}
            onChange={(e) => setNewLanguage({ ...newLanguage, proficiency: e.target.value })}
            className="w-full md:w-1/3 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Proficiency</option>
            <option value="Basic">Basic</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Fluent">Fluent</option>
            <option value="Native">Native</option>
          </select>
          <button
            type="button"
            onClick={handleAddLanguage}
            disabled={isAddingLanguage}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition md:ml-auto disabled:opacity-50 font-medium shadow-sm"
          >
            {isAddingLanguage ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <FiPlus className="w-4 h-4" />
            )}
            Add Language
          </button>
        </div>

        {!languages || languages.length === 0 ? (
          <div className="text-gray-500 text-sm">No languages added</div>
        ) : (
          <div className="space-y-3">
            {(languages || []).map((language, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition"
              >
                {editingLanguage?.index === index ? (
                  <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                    <input
                      type="text"
                      value={editingLanguage.name}
                      onChange={(e) => setEditingLanguage({ ...editingLanguage, name: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <select
                      value={editingLanguage.proficiency}
                      onChange={(e) => setEditingLanguage({ ...editingLanguage, proficiency: e.target.value })}
                      className="w-40 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="Basic">Basic</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Fluent">Fluent</option>
                      <option value="Native">Native</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleUpdateLanguage}
                        disabled={isUpdatingLanguage}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isUpdatingLanguage ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <FiSave className="w-4 h-4" />
                        )}
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingLanguage(null)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-400 text-white rounded-lg text-sm hover:bg-gray-500"
                      >
                        <FiX className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="font-medium text-gray-800">{language.name || "-"}</div>
                      <div className="text-sm text-gray-600">{language.proficiency || "-"}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingLanguage({ index, id: language.id, name: language.name, proficiency: language.proficiency })
                        }
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20 transition"
                      >
                        <FiEdit2 className="w-4 h-4" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLanguage(index)}
                        disabled={isDeletingLanguage}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 transition disabled:opacity-50"
                      >
                        {isDeletingLanguage ? (
                          <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <FiTrash className="w-4 h-4" />
                        )}
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ResumeDetails({ profile, setProfile }) {
  const [adding, setAdding] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState(null)

  const handleAddNew = () => setAdding(true)
  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (!selected) return
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowed.includes(selected.type)) {
      toast.error("Unsupported file type. Use PDF or DOC/DOCX")
      return
    }
    setFile(selected)
  }
  const handleCancel = () => {
    setAdding(false)
    setFile(null)
  }
  const handleUpload = async () => {
    if (!file) return toast.error("Please select a resume file")
    try {
      setUploading(true)
      const res = await profileService.uploadResume(file)
      if (res?.success === false) {
        toast.error(res?.message || "Failed to upload resume")
        return
      }
      toast.success(res?.message || "Resume uploaded successfully")
      const uploadedUrl = res?.data?.resumeUrl || res?.resumeUrl || res?.url || res?.data?.url || null
      setProfile?.((p) => ({
        ...(p || {}),
        resume: uploadedUrl || file.name,
        resumeUrl: uploadedUrl || p?.resumeUrl || null,
      }))
      setAdding(false)
      setFile(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to upload resume")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FiFileText className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Resume Management</h2>
      </div>

      {!adding ? (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="text-center py-8">
            <FiUpload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">Upload Your Resume</h3>
            <p className="text-muted-foreground mb-6">Share your latest resume to showcase your qualifications</p>
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium mx-auto"
            >
              <FiUpload className="w-4 h-4" />
              Upload Resume
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-card-foreground mb-4">Upload New Resume</h3>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <FiUpload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <p className="text-xs text-muted-foreground mt-2">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
            </div>

            {file && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FiFileText className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-card-foreground flex-1">{file.name}</span>
                <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FiUpload className="w-4 h-4" />
                    Upload
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors font-medium"
              >
                <FiX className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {profile?.resume && (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-card-foreground mb-4">Current Resume</h3>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <FiFileText className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-card-foreground">{profile.resume}</p>
                <p className="text-sm text-muted-foreground">Uploaded resume</p>
              </div>
            </div>
            {(() => {
              const raw = profile?.resumeUrl || profile?.resume
              let link = null
              if (typeof raw === "string") {
                if (/^https?:\/\//i.test(raw)) link = raw
                else if (raw.startsWith("/")) link = `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL || ""}${raw}`
              }
              return link ? (
                <button
                  onClick={() => window.open(link, "_blank")}
                  className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium"
                >
                  <FiEye className="w-4 h-4" />
                  View
                </button>
              ) : null
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [activeTab, setActiveTab] = useState("Basic Details")
  const [errors, setErrors] = useState({})
  const [educations, setEducations] = useState([])
  const [experiences, setExperiences] = useState([])
  const [skills, setSkills] = useState([])
  const [languages, setLanguages] = useState([])

  const tabs = [
    { id: "Basic Details", label: "Basic Details", icon: FiUser },
    { id: "Education Details", label: "Education", icon: FiBook },
    { id: "Internship", label: "Experience", icon: FiBriefcase },
    { id: "Skills & Languages", label: "Skills", icon: FiAward },
    { id: "Resume", label: "Resume", icon: FiFileText },
  ]

  // Helper function to check if a field is required
  const isFieldRequired = (fieldName) => {
    return !!validationRules[fieldName]
  }

  const tabFields = {
    "Basic Details": [
      { label: "Full Name", name: "name" },
      { label: "Date of Birth", name: "dob", type: "date" },
      { label: "Gender", name: "gender", type: "select", options: ["Male", "Female", "Other"] },
      { label: "Current/Latest College", name: "college" },
      { label: "Email", name: "email" },
      { label: "Mobile Number", name: "phone" },
      { label: "Summary", name: "summary", type: "textarea" },
      { label: "Current Address", name: "address", type: "textarea" },
    ],
    // Removed Parent Details
    "Education Details": [
      {
        label: "Level",
        name: "level",
        type: "select",
        options: ["School", "College", "Under Graduation", "Post Graduation", "Diploma", "Certificate", "Other"],
      },
      { label: "Institution", name: "institutionName" },
      { label: "Year of Passing", name: "passOfYear", type: "date" },
      { label: "Branch", name: "branch" },
      { label: "Board", name: "board" },
      { label: "Courses", name: "courses" },
      { label: "Percentage", name: "percentage" },
      { label: "Roll No", name: "rollNo" },
    ],
    "Contact & Address": [
      { label: "Phone Number", name: "phone" },
      { label: "WhatsApp Number", name: "whatsappNumber" },
      { label: "Address", name: "address", type: "textarea" },
      { label: "City", name: "city" },
      {
        label: "State",
        name: "state",
        type: "select",
        options: [
          "Karnataka",
          "Maharashtra",
          "Tamil Nadu",
          "Telangana",
          "Andhra Pradesh",
          "Kerala",
          "Delhi",
          "Uttar Pradesh",
          "West Bengal",
          "Gujarat",
          "Rajasthan",
          "Madhya Pradesh",
          "Punjab",
          "Haryana",
          "Bihar",
          "Odisha",
          "Assam",
          "Jharkhand",
          "Chhattisgarh",
          "Uttarakhand",
          "Himachal Pradesh",
          "Jammu and Kashmir",
          "Goa",
          "Manipur",
          "Meghalaya",
          "Mizoram",
          "Nagaland",
          "Sikkim",
          "Tripura",
        ],
      },
    ],
  }

  const validationRules = {
    phone: (value) => {
      if (!value) return "Phone number is required"
      if (!/^[0-9]{10}$/.test(value)) return "Must be exactly 10 digits"
      return null
    },
    whatsappNumber: (value) => {
      if (!value) return "WhatsApp number is required"
      if (!/^[0-9]{10}$/.test(value)) return "Must be exactly 10 digits"
      return null
    },
    address: (value) => (!value?.trim() || value.trim().length < 10 ? "Address must be at least 10 characters" : null),
    city: (value) => {
      if (!value?.trim()) return "City is required"
      if (value.trim().length < 2) return "Must be at least 2 characters"
      if (!/^[a-zA-Z\s]+$/.test(value)) return "Only letters and spaces allowed"
      return null
    },
    state: (value) => {
      if (!value?.trim()) return "State is required"
      if (value.trim().length < 2) return "Must be at least 2 characters"
      if (!/^[a-zA-Z\s]+$/.test(value)) return "Only letters and spaces allowed"
      return null
    },
    country: (value) => {
      if (!value?.trim()) return "Country is required"
      if (value.trim().length < 2) return "Must be at least 2 characters"
      if (!/^[a-zA-Z\s]+$/.test(value)) return "Only letters and spaces allowed"
      return null
    },
    pincode: (value) => {
      if (!value) return "Pincode is required"
      if (!/^[0-9]{6}$/.test(value)) return "Must be a valid 6-digit number"
      return null
    },
    qualification: (value) => (!value?.trim() ? "Qualification is required" : null),
    aadhar: (value) => {
      if (!value) return "Aadhar number is required"
      if (!/^[0-9]{4}-[0-9]{4}-[0-9]{4}$/.test(value)) return "Must be in format: XXXX-XXXX-XXXX"
      return null
    },
    pan: (value) => {
      if (!value) return "PAN number is required"
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) return "Must be in format: ABCDE1234F"
      return null
    },
  }

  const updateFormData = (newFields) => {
    setFormData((prev) => ({
      ...prev,
      email: newFields.about?.email !== undefined ? newFields.about.email : prev.email,
      name: newFields.about?.fullName !== undefined ? newFields.about.fullName : prev.name,
      phone: newFields.about?.mobile !== undefined ? newFields.about.mobile : prev.phone,
      dob: newFields.about?.dob !== undefined ? newFields.about.dob : prev.dob,
      gender: newFields.about?.gender !== undefined ? newFields.about.gender : prev.gender,
      whatsappNumber: newFields.about?.whatsappNumber !== undefined ? newFields.about.whatsappNumber : prev.whatsappNumber,
      qualification: newFields.about?.qualification !== undefined ? newFields.about.qualification : prev.qualification,
      aadhar: newFields.about?.aadhar !== undefined ? newFields.about.aadhar : prev.aadhar,
      pan: newFields.about?.pan !== undefined ? newFields.about.pan : prev.pan,
      parentName: newFields.parent?.parentName !== undefined ? newFields.parent.parentName : prev.parentName,
      parentContact: newFields.parent?.parentContact !== undefined ? newFields.parent.parentContact : prev.parentContact,
      parentEmail: newFields.parent?.parentEmail !== undefined ? newFields.parent.parentEmail : prev.parentEmail,
      bio: newFields.summary?.paragraph !== undefined ? newFields.summary.paragraph : prev.bio,
      address: newFields.address?.address !== undefined ? newFields.address.address : prev.address,
      city: newFields.address?.city !== undefined ? newFields.address.city : prev.city,
      state: newFields.address?.state !== undefined ? newFields.address.state : prev.state,
      country: newFields.address?.country !== undefined ? newFields.address.country : prev.country,
      pincode: newFields.address?.pincode !== undefined ? newFields.address.pincode : prev.pincode,
    }))
  }

  const validateField = (name, value) => {
    const rule = validationRules[name]
    return rule ? rule(value) : null
  }

  const validateForm = () => {
    const newErrors = {}
    let isValid = true
    const errorMessages = []

    Object.keys(formData).forEach((fieldName) => {
      const error = validateField(fieldName, formData[fieldName])
      if (error) {
        newErrors[fieldName] = error
        errorMessages.push(error)
        isValid = false
      }
    })

    setErrors(newErrors)

    if (!isValid) {
      errorMessages.forEach((errorMsg) => {
        toast.error(errorMsg)
      })
    }

    return isValid
  }

  // Helper function to get used education levels
  const getUsedEducationLevels = (educations, currentIndex) => {
    return educations
      .filter((_, index) => index !== currentIndex)
      .map((edu) => edu.level)
      .filter((level) => level && level.trim() !== "")
  }

  // Add new education
  useEffect(() => {
    const fetchProfile = async () => {
      const token = Cookies.get("accessToken")
      if (!token) {
        toast.error("User not logged in")
        return
      }
      try {
        const response = await profileService.getProfile()
        const profileData = response?.data || response
        setProfile(profileData)
        const educationData =
          profileData.educations && profileData.educations.length > 0 ? profileData.educations[0] : {}
        setEducations(profileData.educations || [])
        setExperiences(profileData.experiences || [])
        
        // Standardize skills and languages for UI
        const mappedSkills = (profileData.skills || []).map(s => ({
          id: s.id,
          name: s.skillName || s.name,
          level: s.proficiencyLevel || s.level
        }))
        setSkills(mappedSkills)

        const mappedLanguages = (profileData.languages || []).map(l => ({
          id: l.id,
          name: l.languageName || l.name,
          proficiency: l.proficiencyLevel || l.proficiency
        }))
        setLanguages(mappedLanguages)
        const combinedData = {
          ...profileData,
          ...educationData,
          phone: profileData.phoneNumber || profileData.phone,
        }
        setFormData(combinedData)
        setPreviewImage(profileData.profileImageUrl || null)
      } catch (error) {
        console.error("Profile fetch error:", error)
        toast.error("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error while typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error("Image size should be less than 5MB")
      if (!file.type.startsWith("image/")) return toast.error("Please select a valid image file")

      setSelectedImage(file)
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    // Validate education fields
    let hasEducationErrors = false
    educations.forEach((education, index) => {
      // Always required fields
      const requiredFields = ["level", "institutionName", "passOfYear", "board", "percentage"]

      // Check always required fields
      requiredFields.forEach((fieldName) => {
        const error = validateField(fieldName, education[fieldName])
        if (error) {
          hasEducationErrors = true
        }
      })

      // Check conditionally required fields based on education level
      if (education.level === "Under Graduation" || education.level === "Post Graduation") {
        const conditionalFields = ["branch", "courses", "rollNo"]
        conditionalFields.forEach((fieldName) => {
          if (!education[fieldName]?.trim()) {
            hasEducationErrors = true
          }
        })
      }
    })

    if (hasEducationErrors) {
      toast.error("Please fill all required education fields")
      return
    }

    // Additional validation from admin version
    const additionalErrors = []

    if (!/^\d{6}$/.test(formData.pincode)) {
      additionalErrors.push("Pincode must be exactly 6 digits")
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      additionalErrors.push("Phone number must be exactly 10 digits")
    }
    if (formData.whatsappNumber && !/^\d{10}$/.test(formData.whatsappNumber)) {
      additionalErrors.push("WhatsApp number must be exactly 10 digits")
    }
    if (formData.parentContact && !/^\d{10}$/.test(formData.parentContact)) {
      additionalErrors.push("Parent contact must be exactly 10 digits")
    }

    if (additionalErrors.length > 0) {
      additionalErrors.forEach((errorMsg) => {
        toast.error(errorMsg)
      })
      return
    }

    try {
      const updateData = {
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        parentName: formData.parentName,
        parentContact: formData.parentContact,
        parentEmail: formData.parentEmail,
        gender: formData.gender,
        dob: formData.dob,
        bio: formData.bio || formData.summary || "",
        whatsappNumber: formData.whatsappNumber,
        address: formData.address,
        qualification: formData.qualification,
        aadhar: formData.aadhar,
        pan: formData.pan,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pincode: formData.pincode,
        educations: educations.map(edu => ({
          ...edu,
          passOfYear: edu.passOfYear ? new Date(edu.passOfYear).toISOString().split('T')[0] : null
        })),
      }

      console.log("Submitting profile update:", updateData)

      await profileService.updateProfile(updateData)

      if (selectedImage) {
        await profileService.uploadProfileImage(selectedImage)
        toast.success("Profile and image updated successfully")
      } else {
        toast.success("Profile updated successfully")
      }

      const updatedProfile = {
        ...formData,
        educations: educations,
        experiences: experiences,
        skills: skills,
        languages: languages,
      }
      setProfile(updatedProfile)
      setEditMode(false)
      setErrors({})
    } catch (error) {
      console.error("Profile update error:", error)
      const msg = error?.response?.data?.message || error?.message || "Update failed"
      toast.error(msg)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Profile Info */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
                  {previewImage ? (
                    <Image
                      src={previewImage || "/placeholder.svg"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      width={96}
                      height={96}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                      <FiUser className="w-8 h-8" />
                    </div>
                  )}
                </div>
                {editMode && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) return toast.error("Image size should be less than 5MB")
                        if (!file.type.startsWith("image/")) return toast.error("Please select a valid image file")
                        setSelectedImage(file)
                        setPreviewImage(URL.createObjectURL(file))
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                )}
              </div>

              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{profile?.name || "Your Name"}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FiMail className="w-4 h-4" />
                    <span className="text-sm">{profile?.email || "email@example.com"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone className="w-4 h-4" />
                    <span className="text-sm">{profile?.phone || profile?.phoneNumber || "Not provided"}</span>
                  </div>

                </div>
              </div>
            </div>

            {/* Action Buttons 
            <div className="flex gap-3">
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
                >
                  <FiEdit className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
                  >
                    <FiSave className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false)
                      setSelectedImage(null)
                      if (profile?.profileImageUrl) {
                        if (profile.profileImageUrl.startsWith("data:")) {
                          setPreviewImage(profile.profileImageUrl)
                        } else {
                          setPreviewImage(`data:image/jpeg;base64,${profile.profileImageUrl}`)
                        }
                      } else {
                        setPreviewImage(null)
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-3 text-muted-foreground hover:bg-muted rounded-lg transition-colors font-medium"
                  >
                    <FiX className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              )}
            </div>*/}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "Basic Details" && profile && (
          <BasicDetails profile={profile} onUpdate={updateFormData} setProfile={setProfile} setFormData={setFormData} />
        )}
        {activeTab === "Education Details" && (
          <EducationDetails educations={educations} setEducations={setEducations} profile={profile} setProfile={setProfile} setFormData={setFormData} />
        )}
        {activeTab === "Internship" && (
          <InternshipDetails
            experiences={experiences}
            setExperiences={setExperiences}
            profile={profile}
            setProfile={setProfile}
          />
        )}
        {activeTab === "Skills & Languages" && (
          <SkillsLanguagesDetails
            skills={skills}
            setSkills={setSkills}
            languages={languages}
            setLanguages={setLanguages}
            profile={profile}
            setProfile={setProfile}
          />
        )}
        {activeTab === "Resume" && <ResumeDetails profile={profile} setProfile={setProfile} />}
      </div>
    </div>
  )
}
