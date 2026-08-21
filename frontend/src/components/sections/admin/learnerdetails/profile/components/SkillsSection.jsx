'use client'
import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { Wrench, PlusCircle, Save, X, Edit3, Trash2 } from 'lucide-react'

const SkillsSection = ({ editProfile, userId, refreshProfileData }) => {
  const [newSkill, setNewSkill] = useState({ name: '', level: '' });
  const [editingSkill, setEditingSkill] = useState(null);

  // ✅ Add Skill
  const handleAddSkill = async () => {
    if (!newSkill.name.trim() || !newSkill.level) {
      toast.error('Enter both skill name and level');
      return;
    }
    try {
      const payload = { 
        id: Number(userId), 
        skillName: newSkill.name.trim(), 
        proficiencyLevel: newSkill.level 
      };
      const token = Cookies.get('accessToken');
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/skill/add`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.data?.success) return toast.error(res.data?.message || 'Failed to add skill');
      toast.success('Skill added successfully');
      setNewSkill({ name: '', level: '' });
      await refreshProfileData?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add skill');
    }
  };

  // ✅ Update Skill
  const handleUpdateSkill = async (skillId) => {
    if (!editingSkill.name.trim() || !editingSkill.level) {
      toast.error('Enter both skill name and level');
      return;
    }
    try {
      const payload = { 
        id: Number(userId), 
        skillName: editingSkill.name.trim(), 
        proficiencyLevel: editingSkill.level 
      };
      const token = Cookies.get('accessToken');
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/skill/update/${skillId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.data?.success) return toast.error(res.data?.message || 'Failed to update skill');
      toast.success('Skill updated successfully');
      setEditingSkill(null);
      await refreshProfileData?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update skill');
    }
  };

  // ✅ Delete Skill
  const handleDeleteSkill = async (skillId) => {
    try {
      const token = Cookies.get('accessToken');
      const res = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/skill/delete/${skillId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.data?.success) return toast.error(res.data?.message || 'Failed to delete skill');
      toast.success('Skill deleted successfully');
      await refreshProfileData?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete skill');
    }
  };

  return (
    <div className="mb-12">
      {/* Section Title */}
      <h4 className="flex items-center gap-2 text-lg font-semibold text-secondary mb-6">
        <Wrench className="w-5 h-5 text-primary" /> Skills
      </h4>

      {/* Add Skill Row */}
      <div className="flex flex-col md:flex-row items-center gap-3 mb-6 p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50">
        <input
          type="text"
          value={newSkill.name}
          onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
          placeholder="Skill name"
          className="w-full md:w-1/3 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <select
          value={newSkill.level}
          onChange={e => setNewSkill({ ...newSkill, level: e.target.value })}
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition md:ml-auto"
        >
          <PlusCircle className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Skills List */}
      {(!editProfile.skills || editProfile.skills.length === 0) ? (
        <div className="text-gray-500 text-sm">No skills added</div>
      ) : (
        <div className="space-y-3">
          {editProfile.skills.map(skill => (
            <div
              key={skill.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition"
            >
              {editingSkill?.id === skill.id ? (
                <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                  <input
                    type="text"
                    value={editingSkill.name}
                    onChange={e => setEditingSkill({ ...editingSkill, name: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <select
                    value={editingSkill.level}
                    onChange={e => setEditingSkill({ ...editingSkill, level: e.target.value })}
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
                      onClick={() => handleUpdateSkill(skill.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSkill(null)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-400 text-white rounded-lg text-sm hover:bg-gray-500"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="font-medium">{skill.skillName}</div>
                    <div className="text-sm text-gray-600">{skill.proficiencyLevel}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingSkill({ id: skill.id, name: skill.skillName, level: skill.proficiencyLevel })
                      }
                      className="flex items-center gap-1 px-3 py-1.5 bg-primaryColor/10 text-primary rounded-lg text-sm hover:bg-primaryColor/20 transition"
                    >
                      <Edit3 className="w-4 h-4" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(skill.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 transition"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillsSection;
