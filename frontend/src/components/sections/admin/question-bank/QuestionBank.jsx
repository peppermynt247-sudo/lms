"use client";

import React, { useState } from "react";
import { Plus, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@utils/api";
import { toast } from 'react-toastify';

const QuestionBank = ({ questionbanks, onAddQuestionBank, onEditQuestionBank }) => {
  const router = useRouter();
  const [dropdownId, setDropdownId] = useState(null);

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/api/question-banks/${id}`);
      if (response.status === 200) {
        toast.success("Question bank deleted successfully");
        window.location.reload();
      }
    } catch (error) {
      toast.error("Failed to delete question bank");
    }
  };

  const handleEditClick = async (id) => {
    try {
      const res = await api.get(`/api/question-banks/${id}`);
      const qb = res.data.data;
      const formatted = {
        id: qb.questionBankId,
        name: qb.name,
        description: qb.description,
        questionsType: qb.questionsType,
        difficultyLevel: qb.difficultyLevel,
      };
      onEditQuestionBank(formatted);
      setDropdownId(null);
    } catch (err) {
      toast.error("Failed to fetch question bank details");
    }
  };
  const handleRowClick = (id) => {
    router.push(`/admin/question-bank/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-contentColor2">All Question Banks</span>
          <span className="bg-whitegrey2 text-contentColor2 px-2 py-1 rounded text-sm">
            {questionbanks.length.toString().padStart(2, "0")}
          </span>
        </div>
        <button
          onClick={onAddQuestionBank}
          className="flex items-center space-x-2 text-blue hover:text-blue-light font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Add Question Banks</span>
        </button>
      </div>

      <div className="bg-whiteColor rounded-xl shadow-sm border border-borderColor overflow-hidden">
        <table className="w-full">
          <thead className="bg-whitegrey2 border-b border-borderColor">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium">Sr.</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Name</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Type</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Level</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Description</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {questionbanks.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-contentColor2">
                  No question banks added yet.
                </td>
              </tr>
            ) : (
              questionbanks.map((qb, index) => (
                
                <tr
                  key={qb.id}
                  onClick={() => handleRowClick(qb.id)}
                  className="border-b border-borderColor hover:bg-whitegrey2/50"
                >
                  <td className="px-6 py-4">{(index + 1).toString().padStart(2, "0")}</td>
                  <td className="px-6 py-4">{qb.title}</td>
                  <td className="px-6 py-4">{qb.questionsType}</td>
                  <td className="px-6 py-4">{qb.difficultyLevel}</td>
                  <td className="px-6 py-4">{qb.description}</td>
                  <td className="relative px-6 py-4">
                    <button
                      className="text-contentColor2 hover:text-headingColor"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownId(dropdownId === qb.id ? null : qb.id);
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {dropdownId === qb.id && (
                      <div className={`absolute right-6 ${index >= questionbanks.length - 2 ? 'bottom-12' : 'top-12'} bg-white border rounded-lg shadow z-10`}>
                        <button
                          className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(qb.id);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(qb.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuestionBank;
