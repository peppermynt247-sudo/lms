'use client'
import React, { useState } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { toast } from 'react-toastify'
import { Languages, PlusCircle, Save, X, Edit3, Trash2 } from 'lucide-react'

const LanguageSection = ({ editProfile, userId, refreshProfileData }) => {
  const [newLanguageName, setNewLanguageName] = useState('')
  const [newLanguageLevel, setNewLanguageLevel] = useState('')
  const [editingLanguageId, setEditingLanguageId] = useState(null)
  const [editLanguageName, setEditLanguageName] = useState('')
  const [editLanguageLevel, setEditLanguageLevel] = useState('')

  const handleAddLanguage = async () => {
    if (!newLanguageName || !newLanguageLevel) {
      toast.error('Enter language and proficiency')
      return
    }
    try {
      const payload = { id: Number(userId), languageName: newLanguageName, proficiencyLevel: newLanguageLevel }
      const token = Cookies.get('accessToken')
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/language/add`,
        payload,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      )
      if (!res.data?.success) return toast.error(res.data?.message || 'Failed to add language')
      toast.success('Language added successfully')
      setNewLanguageName('')
      setNewLanguageLevel('')
      await refreshProfileData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add language')
    }
  }

  const handleUpdateLanguage = async () => {
    try {
      const payload = { id: Number(userId), languageName: editLanguageName, proficiencyLevel: editLanguageLevel }
      const token = Cookies.get('accessToken')
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/language/update`,
        payload,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      )
      if (!res.data?.success) return toast.error(res.data?.message || 'Failed to update language')
      toast.success('Language updated successfully')
      setEditingLanguageId(null)
      await refreshProfileData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update language')
    }
  }

  const handleDeleteLanguage = async (id) => {
    try {
      const token = Cookies.get('accessToken')
      const res = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/language/delete/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.data?.success) return toast.error(res.data?.message || 'Failed to delete language')
      toast.success('Language deleted successfully')
      await refreshProfileData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete language')
    }
  }

  return (
    <div className="mb-12">
      {/* Section Title */}
      <h4 className="flex items-center gap-2 text-lg font-semibold text-secondary mb-6">
        <Languages className="w-5 h-5 text-primary" /> Languages
      </h4>

      {/* Add Language Row */}
      <div className="flex flex-col md:flex-row items-center gap-3 mb-6 p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50">
        <input
          type="text"
          value={newLanguageName}
          onChange={(e) => setNewLanguageName(e.target.value)}
          placeholder="Language name"
          className="w-full md:w-1/3 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <select
          value={newLanguageLevel}
          onChange={(e) => setNewLanguageLevel(e.target.value)}
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition md:ml-auto"
        >
          <PlusCircle className="w-4 h-4" /> Add
        </button>
      </div>

      {/* List of Languages */}
      {(!editProfile.languages || editProfile.languages.length === 0) ? (
        <div className="text-gray-500 text-sm">No languages added</div>
      ) : (
        <div className="space-y-3">
          {(editProfile.languages || []).map((language) => {
            const isEditing = editingLanguageId === language.id
            return (
              <div
                key={language.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition"
              >
                {isEditing ? (
                  <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                    <input
                      type="text"
                      value={editLanguageName}
                      onChange={(e) => setEditLanguageName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <select
                      value={editLanguageLevel}
                      onChange={(e) => setEditLanguageLevel(e.target.value)}
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
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
                      >
                        <Save className="w-4 h-4" /> Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingLanguageId(null)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-400 text-white rounded-lg text-sm hover:bg-gray-500"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="font-medium text-gray-800">{language.languageName || '-'}</div>
                      <div className="text-sm text-gray-600">{language.proficiencyLevel || '-'}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLanguageId(language.id)
                          setEditLanguageName(language.languageName)
                          setEditLanguageLevel(language.proficiencyLevel)
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primaryColor/10 text-primary rounded-lg text-sm hover:bg-primaryColor/20 transition"
                      >
                        <Edit3 className="w-4 h-4" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLanguage(language.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 transition"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LanguageSection
