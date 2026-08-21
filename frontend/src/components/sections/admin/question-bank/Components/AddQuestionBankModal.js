"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "@utils/api";
import { toast } from 'react-toastify';

const AddQuestionBankModal = ({ isOpen, onClose, mode, initialData, onCreateOrUpdate }) => {
  const [questionBankName, setQuestionBankName] = useState("");
  const [description, setDescription] = useState("");
  const [difficultyLevel, setdifficultyLevel] = useState("");
  const [questionsType, setQuestionsType] = useState("");
  const [id, setId] = useState("");

  useEffect(() => {
    if (initialData) {
      setQuestionBankName(initialData.name || "");
      setDescription(initialData.description || "");
      setdifficultyLevel(initialData.difficultyLevel || "");
      setQuestionsType(initialData.questionsType || "");
      setId(initialData.questionBankId || "");
    } else {
      setQuestionBankName("");
      setDescription("");
      setdifficultyLevel("");
      setQuestionsType("");
      setId("");
    }
  }, [initialData, isOpen]);

  const handleSubmit = async () => {
    if (!questionBankName.trim()) return toast.warn("Name cannot be blank");
    if (!questionsType) return toast.warn("Select question type");
    if (!difficultyLevel) return toast.warn("Select difficulty level");

    const payload = {
      name: questionBankName.trim(),
      description: description?.trim() || "",
      questionsType,
      difficultyLevel: difficultyLevel.toUpperCase(),
    };

    try {
      let response;
      if (mode === "edit" && initialData?.id) {
        response = await api.put(`/api/question-banks/${initialData.id}`, payload);
        toast.success("Question bank updated successfully");
      } else {
        response = await api.post("/api/question-banks", payload);
        toast.success("Question bank created successfully");
      }

      onCreateOrUpdate(response.data.data);
      onClose();
    } catch (err) {
      console.error("Failed to submit question bank:", err);
      toast.error("An error occurred.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white p-6 rounded-xl shadow-xl z-50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {mode === "edit" ? "Edit" : "Add"} Question Bank
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium mb-1">Question Type</label>
              <select
                value={questionsType}
                onChange={(e) => setQuestionsType(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select type</option>
                <option value="MCQ">MCQ</option>
                <option value="TRUE_FALSE">True/False</option>
                <option value="MULTIPLE_CORRECT">MCQ Multi-Correct</option>
                <option value="ONE_WORD">One word</option>
                <option disabled style={{color:'#808080 '}} value="Coding_Questions">Coding Question</option>
                <option value="MIXED">Mixed Question</option>
              </select>
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium mb-1">Difficulty Level</label>
              <select
                value={difficultyLevel}
                onChange={(e) => setdifficultyLevel(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select level</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={questionBankName}
              onChange={(e) => setQuestionBankName(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg"
              placeholder="Enter question bank name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg"
              placeholder="Enter description"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue"
          >
            {mode === "edit" ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddQuestionBankModal;