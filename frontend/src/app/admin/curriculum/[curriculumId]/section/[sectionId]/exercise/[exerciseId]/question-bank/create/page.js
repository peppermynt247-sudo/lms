"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";

const Stepper = () => (
  <div className="flex items-center gap-8 mb-8">
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-full bg-blue text-white flex items-center justify-center font-bold text-lg shadow">
        1
      </div>
      <span className="font-semibold text-sm text-blue-700 mt-2">
        Create Question Bank
      </span>
    </div>
    <div className="flex-1 h-1 bg-blue-200 rounded" />
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shadow">
        2
      </div>
      <span className="font-semibold text-sm text-blue-700 mt-2">
        Add Questions
      </span>
    </div>
  </div>
);

const Breadcrumbs = ({ course, section, exercise }) => (
  <div className="text-gray-500 text-sm mb-6">
    {course} &gt; {section} &gt; {exercise}
  </div>
);

const CreateQuestionBankPage = () => {
  const router = useRouter();
  const params = useParams();

  const [course, setCourse] = useState("");
  const [section, setSection] = useState("");
  const [exercise, setExercise] = useState("");
  const [loading, setLoading] = useState(true);
  const [linkedQuestionBanks, setLinkedQuestionBanks] = useState([]);

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [exam, setExam] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");

  useEffect(() => {
    const fetchSectionDetails = async () => {
      try {
        const res = await fetch(
          `/api/curriculums/${params.curriculumId}/sections/${params.sectionId}/exercises/${params.exerciseId}`
        );
        if (!res.ok) throw new Error("Failed to fetch details");
        const data = await res.json();
        const secData = data.data || data;

        setCourse(secData.courseName || "N/A");
        setSection(secData.sectionName || "N/A");
        setExercise(secData.exerciseName || `Exercise #${params.exerciseId}`);
      } catch (err) {
        toast.error("Failed to load section details");
      } finally {
        setLoading(false);
      }
    };
    fetchSectionDetails();
  }, [params]);

  const handleCancel = () => router.back();

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a Question Bank Name.");
      return;
    }

    const payload = {
      name,
      questionType: type,
      exam,
      subject,
      topic,
      difficultyLevel: difficulty,
    };

    try {
      const res = await fetch(`/api/question-banks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create question bank");

      const created = await res.json();
      toast.success("Question Bank created successfully!");

      router.push(
        `/admin/curriculum/${params.curriculumId}/section/${params.sectionId}/exercise/${params.exerciseId}/question-bank/${created.id}/add-questions`
      );
    } catch (err) {
      toast.error("Failed to create Question Bank");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white py-12 px-2 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-10">
        <div className="flex items-center justify-between mb-8">
          <div className="text-2xl font-extrabold text-blue-800">
            Create Question Bank
          </div>
          <button
            className="text-gray-400 text-2xl font-bold"
            onClick={handleCancel}
          >
            &times;
          </button>
        </div>
        <Stepper />
        <Breadcrumbs course={course} section={section} exercise={exercise} />

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            Question Bank Name
          </label>
          <input
            className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:ring-2 focus:ring-blue-500"
            placeholder="Please enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Question Type
            </label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Select question type</option>
              <option value="MCQ">MCQ</option>
              <option value="Short">Short Answer</option>
              <option value="Long">Long Answer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Exam</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={exam}
              onChange={(e) => setExam(e.target.value)}
            >
              <option value="">Select exam</option>
              <option value="JEE">JEE</option>
              <option value="NEET">NEET</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">Select subject</option>
              <option value="Math">Math</option>
              <option value="Physics">Physics</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Topic</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              <option value="">Select topic</option>
              <option value="Algebra">Algebra</option>
              <option value="Calculus">Calculus</option>
            </select>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium mb-1">
            Difficulty Level
          </label>
          <div className="flex gap-2">
            {["Easy", "Medium", "Hard"].map((level) => (
              <button
                key={level}
                className={`px-4 py-2 rounded font-bold border ${
                  difficulty === level
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
                style={
                  difficulty === level
                    ? { backgroundColor: "#2563eb", color: "white" }
                    : {}
                }
                onClick={() => setDifficulty(level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            className="px-4 py-2 border rounded text-gray-700 bg-gray-100 hover:bg-gray-200"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded font-bold ${
              name.trim()
                ? "bg-blue-600 text-white"
                : "border text-gray-700 bg-gray-100"
            }`}
            disabled={!name.trim()}
            onClick={handleSave}
          >
            Save and Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateQuestionBankPage;