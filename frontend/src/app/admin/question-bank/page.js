"use client";

import React, { useEffect, useState } from "react";
import AddQuestionBankModal from "@/components/sections/admin/question-bank/Components/AddQuestionBankModal";
import QuestionBank from "@/components/sections/admin/question-bank/QuestionBank";
import api from "@utils/api";
import { toast } from 'react-toastify';

const QuestionBankPage = () => {
  const [questionBanks, setQuestionBanks] = useState([]);
  const [modalData, setModalData] = useState({ isOpen: false, mode: "create", data: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestionBanks = async () => {
      try {
        const response = await api.get("/api/question-banks");
        const data = response.data.data || []; 

        const formatted = Array.isArray(data)
          ? data.map((qb, index) => ({
              id: qb.questionBankId || index + 1,
              title: qb.name,
              description: qb.description,
              questionsType: qb.questionsType,
              difficultyLevel: qb.difficultyLevel || qb.difficultyLevel ,
              sectionCount: 0,
            }))
          : [];

        setQuestionBanks(formatted);
      } catch (error) {
        toast.error("Failed to load question banks");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionBanks();
  }, []);

  const handleAddQuestionBank = () => {
    setModalData({ isOpen: true, mode: "create", data: null });
  };

  const handleEditQuestionBank = (qb) => {
    setModalData({ isOpen: true, mode: "edit", data: qb });
  };

  const handleCreateOrUpdate = (updatedBank) => {
    setQuestionBanks((prev) => {
      const bankId = updatedBank.questionBankId || updatedBank.id;
      const exists = prev.some((qb) => qb.id === bankId);
      if (exists) {
        return prev.map((qb) =>
          qb.id === bankId
            ? {
                ...qb,
                title: updatedBank.name,
                description: updatedBank.description,
                questionsType: updatedBank.questionsType,
                difficultyLevel: updatedBank.difficultyLevel || "EASY",
              }
            : qb
        );
      } else {
        return [
          ...prev,
          {
            id: bankId,
            title: updatedBank.name,
            description: updatedBank.description,
            questionsType: updatedBank.questionsType,
            difficultyLevel: updatedBank.difficultyLevel,
            sectionCount: 0,
          },
        ];
      }
    });
    setModalData({ isOpen: false, mode: "create", data: null });
  };

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Question Banks</h1>
            <p className="text-gray-600">Manage Question Banks to be used across Assessments</p>
          </div>
          <button
            onClick={handleAddQuestionBank}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Question Bank
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <QuestionBank
            questionbanks={questionBanks}
            onAddQuestionBank={handleAddQuestionBank}
            onEditQuestionBank={handleEditQuestionBank}
          />
        )}
      </div>

      <AddQuestionBankModal
        isOpen={modalData.isOpen}
        onClose={() => setModalData({ isOpen: false, mode: "create", data: null })}
        mode={modalData.mode}
        initialData={modalData.data}
        onCreateOrUpdate={handleCreateOrUpdate}
      />
    </>
  );
};

export default QuestionBankPage;