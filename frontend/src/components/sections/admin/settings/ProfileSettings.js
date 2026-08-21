"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Mail, Phone, User, MapPin, RefreshCw, Save, AlertCircle } from "lucide-react"
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import Cookies from 'js-cookie'

// Removed mocks; using real API

export default function ProfileSettings() {
  const [profile, setProfile] = useState({
    userId: "",
    name: "",
    email: "",
    phoneNumber: "",
    parentName: "",
    parentContact: "",
    parentEmail: "",
    gender: "",
    dob: null,
    whatsappNumber: "",
    address: "",
    qualification: "",
    aadhar: "",
    pan: "",
    city: "",
    state: "",
    country: "",
    pincode: ""
  })
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [error, setError] = useState(null)
  const [touchedFields, setTouchedFields] = useState(new Set())
  const [validationErrors, setValidationErrors] = useState({})

  // Compact input styles
  const inputBase = "h-10 bg-slate-50 border border-gray-200 rounded-lg px-3 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 focus-visible:outline-none text-sm placeholder:text-gray-400 placeholder:text-xs";
  const textareaBase = "w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none placeholder:text-gray-400 placeholder:text-xs";

  const validateField = (name, value) => {
    // Handle null, undefined, or empty values for optional fields
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      // Only name, email, and phoneNumber are required
      if (['name', 'email', 'phoneNumber'].includes(name)) {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`
      }
      return "" // Empty value is valid for optional fields
    }

    switch (name) {
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email format"
        return ""
      case "name":
        if (value.length < 2) return "Name must be at least 2 characters"
        return ""
      case "phoneNumber":
        // Remove all non-digits and check length
        const cleanPhone = value.toString().replace(/\D/g, '')
        if (cleanPhone.length < 10) return "Phone number must be at least 10 digits"
        if (cleanPhone.length > 15) return "Phone number too long"
        return ""
      case "whatsappNumber":
        if (value && value.toString().replace(/\D/g, '').length > 0 && value.toString().replace(/\D/g, '').length < 10) {
          return "WhatsApp number must be at least 10 digits"
        }
        return ""
      case "parentContact":
        if (value && value.toString().replace(/\D/g, '').length > 0 && value.toString().replace(/\D/g, '').length < 10) {
          return "Parent contact must be at least 10 digits"
        }
        return ""
      case "parentEmail":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email format"
        return ""
      case "pincode":
        if (value && value.toString().replace(/\D/g, '').length > 0 && value.toString().replace(/\D/g, '').length !== 6) {
          return "Pincode must be exactly 6 digits"
        }
        return ""
      case "aadhar":
        if (value && !/^\d{4}-?\d{4}-?\d{4}$/.test(value)) return "Invalid Aadhar format"
        return ""
      case "pan":
        if (value && !/^[A-Z]{5}\d{4}[A-Z]$/.test(value)) return "Invalid PAN format"
        return ""
      default:
        return ""
    }
  }

  const handleFieldChange = (name, value) => {
    setProfile((prev) => ({ ...prev, [name]: value }))

    // Add field to touched fields
    setTouchedFields((prev) => new Set(prev).add(name))

    // Validate field
    const error = validateField(name, value)
    setValidationErrors((prev) => ({
      ...prev,
      [name]: error,
    }))
  }

  const validateAllFields = () => {
    const errors = {}
    let isValid = true

    // Only validate required fields
    const requiredFields = {
      name: profile.name,
      email: profile.email,
      phoneNumber: profile.phoneNumber
    }

    // Validate required fields
    Object.entries(requiredFields).forEach(([key, value]) => {
      const error = validateField(key, value)
      if (error) {
        errors[key] = error
        isValid = false
      }
    })

    // Validate optional fields only if they have values
    const optionalFields = {
      whatsappNumber: profile.whatsappNumber,
      parentContact: profile.parentContact,
      parentEmail: profile.parentEmail,
      pincode: profile.pincode,
      aadhar: profile.aadhar,
      pan: profile.pan
    }

    Object.entries(optionalFields).forEach(([key, value]) => {
      if (value && (typeof value !== 'string' || value.trim() !== '')) {
        const error = validateField(key, value)
        if (error) {
          errors[key] = error
          isValid = false
        }
      }
    })

    
    setValidationErrors(errors)
    return isValid
  }

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = Cookies.get('accessToken')
      const userId = Cookies.get('userId')
      if (!token || !userId) {
        throw new Error('Not authenticated')
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        throw new Error('Failed to load profile')
      }
      const json = await res.json()
      const data = json?.data || {}
      setProfile({
        userId: data.userId || "",
        name: data.name || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        parentName: data.parentName || "",
        parentContact: data.parentContact || "",
        parentEmail: data.parentEmail || "",
        gender: data.gender || "",
        dob: data.dob ? new Date(data.dob) : null,
        whatsappNumber: data.whatsappNumber || "",
        address: data.address || "",
        qualification: data.qualification || "",
        aadhar: data.aadhar || "",
        pan: data.pan || "",
        city: data.city || "",
        state: data.state || "",
        country: data.country || "",
        pincode: data.pincode || "",
        profileImageUrl: data.profileImageUrl || "",
      })
    } catch (err) {
      setError("Could not load profile.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const refreshProfileData = async () => {
    try {
      await loadProfile()
      showToast("Profile data refreshed successfully!", "success")
    } catch (error) {
      showToast("Failed to refresh profile data", "error")
    }
  }

  const handleSaveProfile = async () => {
    
    if (!validateAllFields()) {
      showToast("Please fix all validation errors before saving.", "error")
      return
    }

    setSavingProfile(true)

    try {
      const token = Cookies.get('accessToken')
      const userId = Cookies.get('userId')
      
      if (!token || !userId) {
        throw new Error('Not authenticated')
      }
      
      const updateData = {
        email: profile.email,
        name: profile.name,
        phone: profile.phoneNumber,
        parentName: profile.parentName,
        parentContact: profile.parentContact,
        parentEmail: profile.parentEmail,
        gender: profile.gender,
        dob: profile.dob ? profile.dob.toISOString().split('T')[0] : "",
        whatsappNumber: profile.whatsappNumber,
        address: profile.address,
        qualification: profile.qualification,
        aadhar: profile.aadhar,
        pan: profile.pan,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        pincode: profile.pincode,
        educations: []
      }
      

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/updateprofile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updateData)
      })
      
      
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Failed to update profile')
      }

      const responseText = await res.text()
      
      showToast("Profile updated successfully!", "success")
      
      await loadProfile()
    } catch (err) {
      showToast(`Failed to update profile: ${err.message}`, "error")
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getFieldError = (fieldName) => {
    return touchedFields.has(fieldName) ? validationErrors[fieldName] : ""
  }

  const showToast = (message, type = "info") => {
    const toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      const newToastContainer = document.createElement("div");
      newToastContainer.id = "toast-container";
      newToastContainer.style.position = "fixed";
      newToastContainer.style.top = "20px";
      newToastContainer.style.right = "20px";
      newToastContainer.style.zIndex = "9999";
      newToastContainer.style.display = "flex";
      newToastContainer.style.flexDirection = "column";
      newToastContainer.style.gap = "10px";
      document.body.appendChild(newToastContainer);
    }

    const toastElement = document.createElement("div");
    toastElement.className = `toast ${type}`;
    toastElement.innerHTML = `
      <div class="toast-content">
        <span class="toast-message">${message}</span>
      </div>
    `;

    toastElement.addEventListener("click", () => {
      toastElement.remove();
    });

    toastElement.addEventListener("transitionend", () => {
      toastElement.remove();
    });

    toastContainer.appendChild(toastElement);

    setTimeout(() => {
      toastElement.classList.add("show");
    }, 10);

    setTimeout(() => {
      toastElement.classList.remove("show");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 lg:p-8">
      <style jsx>{`
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .toast {
          padding: 12px 20px;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transform: translateX(100%);
          transition: transform 0.3s ease-in-out;
          min-width: 300px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .toast.show {
          transform: translateX(0);
        }
        
        .toast.success {
          background-color: #10b981;
        }
        
        .toast.error {
          background-color: #ef4444;
        }
        
        .toast.info {
          background-color: #3b82f6;
        }
        
        .toast-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .toast-message {
          flex: 1;
        }
      `}</style>
      
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Profile Summary Card */}
        <Card className="border shadow-sm bg-white">
          <CardHeader className="pb-4 px-4">
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
                  {profile.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-gray-900">{profile.name || "No Name"}</h1>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      {profile.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-500" />
                      {profile.phoneNumber}
            </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-500" />
                      {profile.city}, {profile.state}
            </div>
          </div>
        </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button 
                  onClick={refreshProfileData} 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Profile Form - Single Form */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Details
            </CardTitle>
            <CardDescription>Update your personal information and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-4 pb-4">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    className={`${inputBase} ${getFieldError("name") ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    placeholder="Enter your full name"
                  />
                  {getFieldError("name") && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError("name")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    className={`${inputBase} ${getFieldError("email") ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    placeholder="Enter your email"
                  />
                  {getFieldError("email") && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError("email")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    value={profile.phoneNumber}
                    onChange={(e) => {
                      // Allow any characters but clean them for validation
                      const val = e.target.value
                      handleFieldChange("phoneNumber", val)
                    }}
                    className={`${inputBase} ${getFieldError("phoneNumber") ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    placeholder="Enter phone number (10+ digits)"
                    maxLength={15}
                  />
                  {getFieldError("phoneNumber") && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError("phoneNumber")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-sm font-medium">
                    WhatsApp Number
                  </Label>
                  <Input
                    id="whatsapp"
                    value={profile.whatsappNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10)
                      handleFieldChange("whatsappNumber", val)
                    }}
                    className={`${inputBase} ${getFieldError("whatsappNumber") ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    placeholder="10-digit WhatsApp number"
                    maxLength={10}
                  />
                  {getFieldError("whatsappNumber") && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError("whatsappNumber")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Gender</Label>
                  <Select value={profile.gender} onValueChange={(value) => handleFieldChange("gender", value)}>
                    <SelectTrigger className="h-10 bg-slate-50 border border-gray-200 rounded-lg">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date of Birth</Label>
                  <div className="relative">
                    <input
                      type="date"
                      value={profile.dob ? profile.dob.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : null
                        handleFieldChange("dob", date)
                      }}
                      className="h-10 bg-slate-50 border border-gray-200 rounded-lg px-3 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 focus-visible:outline-none text-sm w-full appearance-none"
                      placeholder="Select date of birth"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Parent Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parentName" className="text-sm font-medium">
                    Parent Name
                  </Label>
                  <Input 
                    id="parentName" 
                    value={profile.parentName} 
                    onChange={(e) => handleFieldChange("parentName", e.target.value)} 
                    placeholder="Enter parent's name"
                    className={inputBase}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentContact" className="text-sm font-medium">Parent Contact</Label>
                  <Input 
                    id="parentContact" 
                    value={profile.parentContact} 
                    onChange={(e) => { const val = e.target.value.replace(/\D/g, "").slice(0, 10); handleFieldChange("parentContact", val); }} 
                    className={getFieldError("parentContact") ? "border-red-500 focus-visible:ring-red-500" : inputBase} 
                    placeholder="10-digit contact number" 
                    maxLength={10} 
                  />
                  {getFieldError("parentContact") && (<p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{getFieldError("parentContact")}</p>)}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="parentEmail" className="text-sm font-medium">Parent Email</Label>
                  <Input 
                    id="parentEmail" 
                    type="email" 
                    value={profile.parentEmail} 
                    onChange={(e) => handleFieldChange("parentEmail", e.target.value)} 
                    className={getFieldError("parentEmail") ? "border-red-500 focus-visible:ring-red-500" : inputBase} 
                    placeholder="Enter parent's email" 
                  />
                  {getFieldError("parentEmail") && (<p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{getFieldError("parentEmail")}</p>)}
                </div>
              </div>
            </div>

            {/* Address & Other Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Address & Other Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                  <textarea 
                    id="address" 
                    value={profile.address} 
                    onChange={(e) => handleFieldChange("address", e.target.value)} 
                    placeholder="Enter your complete address" 
                    rows={3} 
                    className={textareaBase} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qualification" className="text-sm font-medium">Qualification</Label>
                  <Input 
                    id="qualification" 
                    value={profile.qualification} 
                    onChange={(e) => handleFieldChange("qualification", e.target.value)} 
                    placeholder="e.g., B.Tech, M.Tech"
                    className={inputBase}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">City</Label>
                  <Input 
                    id="city" 
                    value={profile.city} 
                    onChange={(e) => handleFieldChange("city", e.target.value)} 
                    placeholder="Enter your city"
                    className={inputBase}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">State</Label>
                  <Select value={profile.state} onValueChange={(value) => handleFieldChange("state", value)}>
                    <SelectTrigger className={inputBase}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Karnataka">Karnataka</SelectItem>
                      <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                      <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                      <SelectItem value="Telangana">Telangana</SelectItem>
                      <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                      <SelectItem value="Kerala">Kerala</SelectItem>
                      <SelectItem value="Delhi">Delhi</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Country</Label>
                  <Select value={profile.country} onValueChange={(value) => handleFieldChange("country", value)}>
                    <SelectTrigger className={inputBase}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode" className="text-sm font-medium">Pincode</Label>
                  <Input 
                    id="pincode" 
                    value={profile.pincode} 
                    onChange={(e) => { const val = e.target.value.replace(/\D/g, "").slice(0, 6); handleFieldChange("pincode", val); }} 
                    className={getFieldError("pincode") ? "border-red-500 focus-visible:ring-red-500" : inputBase} 
                    placeholder="6-digit pincode" 
                    maxLength={6} 
                  />
                  {getFieldError("pincode") && (<p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{getFieldError("pincode")}</p>)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aadhar" className="text-sm font-medium">Aadhar Number</Label>
                  <Input 
                    id="aadhar" 
                    value={profile.aadhar} 
                    onChange={(e) => handleFieldChange("aadhar", e.target.value)} 
                    className={getFieldError("aadhar") ? "border-red-500 focus-visible:ring-red-500" : inputBase} 
                    placeholder="1234-5678-9012" 
                  />
                  {getFieldError("aadhar") && (<p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{getFieldError("aadhar")}</p>)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan" className="text-sm font-medium">PAN Number</Label>
                  <Input 
                    id="pan" 
                    value={profile.pan} 
                    onChange={(e) => handleFieldChange("pan", e.target.value.toUpperCase())} 
                    className={getFieldError("pan") ? "border-red-500 focus-visible:ring-red-500" : inputBase} 
                    placeholder="ABCDE1234F" 
                  />
                  {getFieldError("pan") && (<p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{getFieldError("pan")}</p>)}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={handleSaveProfile} 
                disabled={savingProfile} 
                size="lg" 
                className={`gap-2 min-w-[120px] transition-all duration-200 ${
                  savingProfile 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow'
                }`}
              >
                {savingProfile ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
        <div id="toast-container" className="toast-container"></div>
    </div>
  )
}
