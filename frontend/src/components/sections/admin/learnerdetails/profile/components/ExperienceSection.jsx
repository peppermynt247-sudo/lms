'use client'

import React from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { toast } from 'react-toastify'
import { PlusCircle, Save, Trash2, Calendar } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

const ExperienceSection = ({ editProfile, setEditProfile, userId, refreshProfileData, editingEnabled }) => {
  const handleSaveOrUpdate = async (experience, index) => {
    try {
      // Validation for required fields
      const requiredFields = [
        { field: 'company', name: 'Company' },
        { field: 'title', name: 'Title' },
        { field: 'designation', name: 'Designation' },
        { field: 'startdate', name: 'Start Date' },
      ]

      for (const { field, name } of requiredFields) {
        if (!experience[field]) {
          toast.error(`${name} is required`)
          return
        }
      }

      if (experience.startdate && experience.enddate && new Date(experience.startdate) > new Date(experience.enddate)) {
        toast.error('Start date must be before end date')
        return
      }

      const payload = {
        id: Number(userId),
        company: experience.company || '',
        title: experience.title || '',
        startdate: experience.startdate ? new Date(experience.startdate).toISOString().split('T')[0] : '',
        enddate: experience.enddate ? new Date(experience.enddate).toISOString().split('T')[0] : '',
        location: experience.location || '',
        details: experience.details || '',
        positionType: experience.positionType || '',
        designation: experience.designation || '',
        companySector: experience.companySector || '',
        experienceCertificate: experience.experienceCertificate || ''
      }

      const token = Cookies.get('accessToken')

      if (experience.id) {
        const res = await axios.put(
          `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/experience/update/${experience.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        )
        if (!res.data?.success) return toast.error(res.data?.message || 'Failed to update experience')
        toast.success('Experience updated')
      } else {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/experience/add`,
          payload,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        )
        if (!res.data?.success) return toast.error(res.data?.message || 'Failed to add experience')
        toast.success('Experience added')
      }

      await refreshProfileData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Operation failed')
    }
  }

  const handleRemove = async (experience, index) => {
    try {
      if (!experience.id) {
        const updated = (editProfile.experiences || []).filter((_, i) => i !== index)
        setEditProfile((p) => ({ ...p, experiences: updated }))
        return
      }
      const token = Cookies.get('accessToken')
      const res = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/experience/delete/${experience.id}/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.data?.success) return toast.error(res.data?.message || 'Failed to delete experience')
      toast.success('Experience removed')
      await refreshProfileData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete experience')
    }
  }

  const handleExperienceChange = (index, field, value) => {
    const updatedExperiences = [...(editProfile.experiences || [])]
    updatedExperiences[index] = { ...updatedExperiences[index], [field]: value }
    setEditProfile((p) => ({ ...p, experiences: updatedExperiences }))
  }

  return (
    <div className="space-y-6">
      {(editProfile.experiences || []).map((experience, index) => (
        <div
          key={index}
          className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-gray-800">Experience {index + 1}</div>
            {editingEnabled && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRemove(experience, index)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Company', key: 'company' },
              { label: 'Title', key: 'title' },
              { label: 'Designation', key: 'designation' },
              { label: 'Position Type', key: 'positionType' },
              { label: 'Location', key: 'location' },
              { label: 'Company Sector', key: 'companySector' },
            ].map(({ label, key }) => (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium text-foreground">{label}</label>
                <input
                  type="text"
                  value={experience[key] || ''}
                  onChange={(e) => handleExperienceChange(index, key, e.target.value)}
                  className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    editingEnabled ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-500'
                  }`}
                  placeholder={`Enter ${label.toLowerCase()}`}
                  disabled={!editingEnabled}
                />
              </div>
            ))}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Start Date</label>
              <div className="relative">
                <DatePicker
                  selected={experience.startdate ? new Date(experience.startdate) : null}
                  onChange={(date) => handleExperienceChange(index, 'startdate', date)}
                  dateFormat="yyyy-MM-dd"
                  className={`w-full px-4 pr-10 py-3 border border-gray-200 rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    editingEnabled ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-500'
                  }`}
                  wrapperClassName="w-full"
                  placeholderText="Select start date"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  maxDate={new Date()}
                  disabled={!editingEnabled}
                  popperPlacement="bottom-start"
                />
                <Calendar
                  className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 ${
                    editingEnabled ? 'text-gray-500' : 'text-gray-400'
                  } pointer-events-none`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">End Date</label>
              <div className="relative">
                <DatePicker
                  selected={experience.enddate ? new Date(experience.enddate) : null}
                  onChange={(date) => handleExperienceChange(index, 'enddate', date)}
                  dateFormat="yyyy-MM-dd"
                  className={`w-full px-4 pr-10 py-3 border border-gray-200 rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    editingEnabled ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-500'
                  }`}
                  wrapperClassName="w-full"
                  placeholderText="Select end date"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  maxDate={new Date()}
                  disabled={!editingEnabled}
                  popperPlacement="bottom-start"
                />
                <Calendar
                  className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 ${
                    editingEnabled ? 'text-gray-500' : 'text-gray-400'
                  } pointer-events-none`}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">Details</label>
              <textarea
                value={experience.details || ''}
                onChange={(e) => handleExperienceChange(index, 'details', e.target.value)}
                className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none ${
                  editingEnabled ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-500'
                }`}
                rows={3}
                placeholder="Describe your responsibilities and achievements"
                disabled={!editingEnabled}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">Experience Certificate</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) {
                    handleExperienceChange(index, 'experienceCertificate', file.name)
                  }
                }}
                className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  editingEnabled ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-500'
                }`}
                disabled={!editingEnabled}
              />
              <div className="text-sm text-muted-foreground">Supported formats: PDF, DOC, DOCX</div>
            </div>
          </div>
        </div>
      ))}

      {editingEnabled && (
        <button
          onClick={() => {
            const newExperience = {
              company: '',
              title: '',
              designation: '',
              positionType: '',
              startdate: '',
              enddate: '',
              location: '',
              companySector: '',
              details: '',
              experienceCertificate: ''
            }
            setEditProfile((p) => ({ ...p, experiences: [...(p.experiences || []), newExperience] }))
          }}
          className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-primary transition"
        >
          <PlusCircle className="w-5 h-5" /> Add Experience
        </button>
      )}
    </div>
  )
}

export default ExperienceSection