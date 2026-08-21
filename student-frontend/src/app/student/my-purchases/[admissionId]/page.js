"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import myPurchasesService from "../../../../services/mypurchasesService";

export default function AdmissionDetailsNestedPage() {
  const { admissionId } = useParams();
  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const admissionsResponse = await myPurchasesService.getAdmissions(userId);
        const admissions = admissionsResponse.Data || [];
        if (!Array.isArray(admissions)) {
          setError("Admissions data is not an array");
          setAdmission(null);
          return;
        }
        const found = admissions.find(a => String(a.id) === String(admissionId));
        if (!found) {
          setError("Admission not found");
          setAdmission(null);
        } else {
          setAdmission(found);
          setError("");
        }
      } catch (err) {
        setError(err.message || "Failed to load admission details");
        setAdmission(null);
        console.error("Admission details fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [admissionId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!admission) return <p>No details found</p>;

  // Debug: log admission data to see what's available
  console.log('Admission data:', admission);

  const totalCost =
    admission.fees != null
      ? admission.fees
      : (admission.installments || []).reduce(
          (sum, inst) => sum + (inst.amount || 0),
          0
        );
  const paidAmount = (admission.installments || [])
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + (i.amount || 0), 0);
  const pendingAmount = Math.max(0, totalCost - paidAmount);

  return (
    <div className="px-4 py-6 md:px-8">
      {/* Breadcrumbs */}
      <nav className="text-sm mb-6 text-gray-500">
        <Link href="/student/my-purchases" className="hover:text-gray-700">My Purchases</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 font-medium">{admission.courseName || admission.title || "Admission"}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center shadow-sm">
          {admission.courseImage ? (
            <Image
              src={admission.courseImage}
              alt={admission.courseName || admission.title || "Course"}
              width={200}
              height={200}
              className="w-full h-full object-cover"
            />

          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            {admission.courseName || admission.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-3 py-1">
              Enrolled {new Date(admission.enrolledAt).toLocaleDateString()}
            </span>
            {admission.paymentStatus && (
              <span className={`inline-flex items-center rounded-full px-3 py-1 ${admission.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {admission.paymentStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Total Fee</div>
          <div className="text-lg font-semibold text-gray-900">₹{Number(totalCost || 0).toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Paid</div>
          <div className="text-lg font-semibold text-emerald-700">₹{Number(paidAmount || 0).toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Pending</div>
          <div className="text-lg font-semibold text-amber-700">₹{Number(pendingAmount || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline (Installments) */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-white p-4 md:p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Payment Schedule</h2>
              <p className="text-sm text-gray-500">Upcoming and completed installments</p>
            </div>

            <ol className="relative border-s-2 border-gray-100 pl-4 space-y-6">
              {(admission.installments || []).map((inst, idx) => {
                const isPaid = inst.status === "PAID";
                const badgeClasses = isPaid ? "bg-emerald-600" : "bg-amber-500";
                
                // Check if this is the first pending installment
                const previousInstallments = (admission.installments || []).slice(0, idx);
                const allPreviousPaid = previousInstallments.every(prev => prev.status === "PAID");
                const isFirstPending = !isPaid && (idx === 0 || allPreviousPaid);
                
                return (
                  <li key={inst.installmentId || idx} className="ms-2">
                    <span className={`absolute -start-[9px] mt-1 w-4 h-4 rounded-full ${badgeClasses}`}></span>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg bg-gray-50 p-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Installment #{inst.installmentId || idx + 1}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Due {inst.dueDate ? new Date(inst.dueDate).toLocaleDateString() : "-"}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Amount</div>
                          <div className="text-sm font-semibold text-gray-900">₹{Number(inst.amount || 0).toLocaleString()}</div>
                        </div>
                        {isFirstPending ? (
                          <button 
                            className="inline-flex items-center rounded-full px-4 py-2 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            onClick={() => setIsContactModalOpen(true)}
                          >
                            Pay Now
                          </button>
                        ) : (
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {inst.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            {(admission.installments || []).length === 0 && (
              <div className="text-sm text-gray-500">No installment information available.</div>
            )}
          </div>
        </div>

        {/* Side Card: Course summary */}
        <aside className="lg:col-span-1">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Course Summary</h3>
            <dl className="space-y-3 text-sm">
              {admission.courseName && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Course</dt>
                  <dd className="text-gray-900 font-medium">{admission.courseName}</dd>
                </div>
              )}
              {admission.curriculumName && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Curriculum</dt>
                  <dd className="text-gray-900 font-medium">{admission.curriculumName}</dd>
                </div>
              )}
              {admission.courseId && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Course ID</dt>
                  <dd className="text-gray-900 font-medium">{admission.courseId}</dd>
                </div>
              )}
              {admission.paymentStatus && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Payment Status</dt>
                  <dd className={`font-medium ${admission.paymentStatus === "PAID" ? "text-emerald-700" : "text-amber-700"}`}>
                    {admission.paymentStatus}
                  </dd>
                </div>
              )}
              <div className="pt-3 mt-3 border-t text-xs text-gray-500">
                Last updated on {new Date().toLocaleDateString()}
              </div>
            </dl>
          </div>
        </aside>
      </div>

      {/* Contact Info Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Get in Touch</h3>
              <p className="text-sm text-gray-500 mb-6">
                To proceed with the payment, please contact our support team.
              </p>
              
              <div className="space-y-3 mb-6 relative z-10">
                <div className="flex items-center justify-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="font-semibold text-gray-800 text-lg">+91 9035563111</span>
                </div>
                <div className="flex items-center justify-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <a href="mailto:queries@abc.courses" className="font-semibold text-blue-600 hover:text-blue-700 text-base">
                    queries@abc.courses
                  </a>
                </div>
              </div>

              <button 
                onClick={() => setIsContactModalOpen(false)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
