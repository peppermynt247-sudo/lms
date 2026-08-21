"use client";

import { useEffect, useState } from "react";
import myPurchasesService from "../../../../services/mypurchasesService";
import Link from "next/link";

export default function MyAdmissions() {
  const [activeTab, setActiveTab] = useState("admission");
  const [data, setData] = useState([]);
  const [paymentsMap, setPaymentsMap] = useState({});
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const fetchAdmissionsWithPayments = async () => {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("accessToken");

      if (!userId || !token) {
        setError("User authentication details missing.");
        setLoading(false);
        return;
      }

      try {
        const { admissions, paymentsMap } = await myPurchasesService.getAdmissionsWithPayments(userId);

        setData(admissions);
        if (admissions && admissions.length > 0) {
          console.log('Sample admission object:', admissions[0]);
        }
        setPaymentsMap(paymentsMap);
        setError("");
        setApiError("");
      } catch (err) {
        setError("Failed to load purchases");
        const msg =
          err?.response?.data?.message || err?.message || "Unknown error";
        setApiError(msg);
      } finally {
        setLoading(false);
      }
    };

    const fetchPayments = async () => {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("accessToken");

      if (!userId || !token) {
        setPaymentsLoading(false);
        return;
      }

      try {
        const response = await myPurchasesService.getAllPayments(userId);
        setPayments(response.Data || []);
      } catch (err) {
        console.error("Failed to load payments:", err);
      } finally {
        setPaymentsLoading(false);
      }
    };

    fetchAdmissionsWithPayments();
    fetchPayments();
  }, []);

  return (
    <div className="min-h-screen bg-white p-2 sm:p-4 md:p-6">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-secondary mb-2">My Purchases</h1>
      <div className="flex justify-center mb-4 sm:mb-6">
        <span className="block w-16 sm:w-20 md:w-24 h-1 rounded-full bg-orange shadow-md"></span>
      </div>



      {/* Admission/Fee Tab - Mobile Responsive */}
      {activeTab === "admission" && (
        <>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4">
              <p className="text-sm sm:text-base">{error}</p>
              {apiError && (
                <>
                  <br />
                  <span className="text-xs text-red-400">{apiError}</span>
                </>
              )}
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm sm:text-base">No admission records found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mobile Cards View */}
              <div className="block sm:hidden">
                {data.map((admission, index) => {
                  const totalCost = admission.fees || 0;
                  const paidAmount = (admission.installments || [])
                    .filter((inst) => inst.status === "PAID")
                    .reduce((sum, inst) => sum + (inst.amount || 0), 0);
                  const pendingAmount = totalCost - paidAmount;
                  const isCleared = pendingAmount <= 0;
                  const firstDueDate = admission.installments?.[0]?.dueDate || admission.enrolledAt;
                  const courseName = admission.title || admission.courseName || admission.course?.name || "Course";
                  
                  return (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-gray-900 text-sm">{courseName}</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isCleared ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {isCleared ? "Cleared" : "Pending"}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-gray-500">Admission Date</p>
                            <p className="font-medium">{new Date(firstDueDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total Fee</p>
                            <p className="font-medium">₹{totalCost.toFixed(0)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Paid</p>
                            <p className="font-medium text-green-600">₹{paidAmount.toFixed(0)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Pending</p>
                            <p className="font-medium text-red-600">₹{pendingAmount.toFixed(0)}</p>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <Link
                            href={`/student/my-purchases/${admission.id}`}
                            className="w-full bg-primary text-white px-4 py-2 rounded text-xs font-medium text-center block hover:opacity-90 transition"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission Date</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Fee</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((admission, index) => {
                      const totalCost = admission.fees || 0;
                      const paidAmount = (admission.installments || [])
                        .filter((inst) => inst.status === "PAID")
                        .reduce((sum, inst) => sum + (inst.amount || 0), 0);
                      const pendingAmount = totalCost - paidAmount;
                      const isCleared = pendingAmount <= 0;
                      const firstDueDate = admission.installments?.[0]?.dueDate || admission.enrolledAt;
                      const courseName = admission.title || admission.courseName || admission.course?.name || "Course";
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{courseName}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(firstDueDate).toLocaleDateString()}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{totalCost.toFixed(0)}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-green-600">₹{paidAmount.toFixed(0)}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-red-600">₹{pendingAmount.toFixed(0)}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isCleared ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                              {isCleared ? "Cleared" : "Pending"}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/student/my-purchases/${admission.id}`}
                              className="bg-primary text-white px-3 py-1 rounded text-xs font-medium hover:opacity-90 transition"
                            >
                              Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Payments Tab - Mobile Responsive */}
      {activeTab === "payments" && (
        <>
          {paymentsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-gray-600">Loading payments...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm sm:text-base">No payment records found.</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">Please check if you have any payment history.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment, index) => (
                <div key={payment.paymentId || index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                        Payment #{payment.paymentId}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-md text-xs sm:text-sm font-medium">
                          Active
                        </span>
                        <Link
                          href={`/admissions/${payment.admissionId}`}
                          className="text-primary hover:underline text-xs sm:text-sm flex items-center gap-1"
                        >
                          <span>DETAILS</span>
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      {/* Date */}
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-gray-500 text-xs">Date</p>
                          <p className="font-medium">{new Date(payment.date).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <div>
                          <p className="text-gray-500 text-xs">Amount</p>
                          <p className="font-medium">₹{payment.amount}</p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${payment.paymentMethod === "CARD" ? "bg-green-500" : "bg-yellow-500"}`}></div>
                        <div>
                          <p className="text-gray-500 text-xs">Status</p>
                          <p className={`font-medium ${payment.paymentMethod === "CARD" ? "text-green-600" : "text-yellow-600"}`}>
                            {payment.paymentMethod === "CARD" ? "Cleared" : "Pending"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
