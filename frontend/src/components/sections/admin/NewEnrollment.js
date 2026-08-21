'use client';
import React, { useState, useEffect } from "react";
import BulkEnrollment from "./BulkEnrollment";
import SingleEnrollment from "./SingleEnrollment";
import LearnerRegistration from "./LearnerRegistration";
import { useSearchParams } from 'next/navigation';

export default function NewEnrollment() {
  const [activeTab, setActiveTab] = useState("bulk");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const emailParam = searchParams.get('email');
  const phoneParam = searchParams.get('phone');

  useEffect(() => {
    if (tabParam === 'single') {
      setActiveTab('single');
    }
  }, [tabParam]);

  const tabClass = (tab) =>
    activeTab === tab
      ? "text-blue border-b-2 border-blue px-4 py-2"
      : "text-gray-600 hover:text-blue px-4 py-2";

  return (
    <div className="p-6 bg-white rounded-xl">
      <h1 className="text-2xl font-semibold">New Enrollment</h1>
      <p className="text-sm text-gray-500 mt-1">
        Add and enroll learners manually or <a href="#" className="text-blue">Import in Bulk with CSVs</a>.
      </p>

      <div className="mt-6 border-b border-gray-200">
        <nav className="flex space-x-2">
          <button className={tabClass("bulk")} onClick={() => setActiveTab("bulk")}>Bulk Enrollment</button>
          <button className={tabClass("single")} onClick={() => setActiveTab("single")}>Single Enrollment</button>
          <button className={tabClass("register")} onClick={() => setActiveTab("register")}>Learner Registration</button>
        </nav>
      </div>

      <div className="text-[0.95rem]">
      {activeTab === "bulk" && <BulkEnrollment />}
      {activeTab === "single" && <SingleEnrollment prefillEmail={emailParam} prefillPhone={phoneParam} />}
      {activeTab === "register" && <LearnerRegistration />}
      </div>
    </div>
  );
}