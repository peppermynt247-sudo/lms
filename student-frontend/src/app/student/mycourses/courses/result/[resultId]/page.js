"use client";
import { useEffect, useState } from "react";
import ResultPage from "@/components/sections/Student/MyCourses/Result";
import { getAttemptResult, assignmentData } from "@/services/courseService";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";

function ResultSkeleton() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header skeleton */}
      <div className="sk h-14 rounded-2xl mb-6" style={{ background: "rgba(26,43,78,0.12)" }} />

      <div className="grid grid-cols-12 gap-6">
        {/* Left */}
        <div className="col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3"
               style={{ boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" }}>
            <div className="sk h-5 w-40 rounded" />
            <div className="sk h-3.5 w-64 rounded" />
            <div className="sk h-3 w-48 rounded" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5"
               style={{ boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" }}>
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="text-center space-y-2">
                  <div className="sk h-7 w-16 rounded mx-auto" />
                  <div className="sk h-3 w-20 rounded mx-auto" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2"
               style={{ boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" }}>
            {[1,2,3,4,5].map(i => <div key={i} className="sk h-3.5 rounded" style={{ width: `${60 + i * 6}%` }} />)}
          </div>
        </div>
        {/* Right */}
        <div className="col-span-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3"
               style={{ boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" }}>
            <div className="sk h-4 w-28 rounded" />
            <div className="flex gap-2">
              {[1,2,3].map(i => <div key={i} className="sk h-7 w-20 rounded-full" />)}
            </div>
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => <div key={i} className="sk h-10 rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Result() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { resultId } = useParams();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!resultId || !userId) { setLoading(false); return; }

    const fetchData = async () => {
      try {
        const res = await getAttemptResult(resultId, userId);
        const attemptData = res.data.data;
        
        // Fetch exercise data for numQuestions and randomizeQuestions
        if (attemptData?.exerciseId) {
          const exercise = await assignmentData(attemptData.exerciseId);
          if (exercise) {
            attemptData.exerciseMetadata = exercise;
          }
        }
        
        setData(attemptData);
      } catch (err) {
        console.error("Error fetching result:", err);
        toast.error("Failed to load result. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resultId]);

  if (loading) return <ResultSkeleton />;

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-400">Result not found.</p>
        </div>
      </div>
    );
  }

  return <ResultPage data={data} />;
}
