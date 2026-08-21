"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import myPurchasesService from "../../../../services/mypurchasesService";

export default function AdmissionDetails({ purchaseId }) {
  const [admission, setAdmission] = useState(null);
  const [activeTab, setActiveTab] = useState("admission");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchAdmission() {
      try {
        // You may need to adjust this API call to fetch by purchaseId
        const userId = localStorage.getItem("userId");
        const { admissions } = await myPurchasesService.getAdmissionsWithPayments(userId);
        const found = admissions.find(a => a.purchaseId === purchaseId || a.id === purchaseId);
        setAdmission(found || null);
      } catch (err) {
        setError("Failed to load admission details");
      } finally {
        setLoading(false);
      }
    }
    fetchAdmission();
  }, [purchaseId]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error || !admission) return <div className="p-8 text-red-500">{error || "Admission not found."}</div>;

  // Amount details
  const totalCost = admission.fees || 0;
  const paidAmount = (admission.installments || [])
    .filter((inst) => inst.status === "PAID")
    .reduce((sum, inst) => sum + (inst.amount || 0), 0);
  const pendingAmount = totalCost - paidAmount;

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-4 text-secondary">Admission Details</h1>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("admission")}
            className={`pb-2 border-b-2 font-medium text-base ${activeTab === "admission" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
          >
            Admission/Fee
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`pb-2 border-b-2 font-medium text-base ${activeTab === "payments" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
          >
            Payments
          </button>
        </nav>
      </div>
      {/* Main Card Layout */}
      {activeTab === "admission" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Course Card */}
          <div className="md:col-span-2">
            <div className="flex items-center bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <Image src={admission.courseImage || "/default-course.png"} alt="Course" width={160} height={112} className="w-40 h-28 object-cover rounded mr-6" />
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">{admission.courseName}</h2>
                <div className="text-gray-600 text-sm mb-1">Registered On</div>
                <div className="flex items-center gap-2 text-md font-medium">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{new Date(admission.enrolledAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            {/* Installments Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-gray-200 rounded overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Installment Name</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Due Date</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Due</th>
                    <th className="px-4 py-2 text-left">Paid On</th>
                    <th className="px-4 py-2 text-left">Credits</th>
                    <th className="px-4 py-2 text-left">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {admission.installments?.map((installment, idx) => (
                    <tr key={installment.installmentId || idx} className={installment.status === "PAID" ? "bg-green-50" : ""}>
                      <td className="px-4 py-2 font-medium">{installment.name || "Full Payment"}</td>
                      <td className={`px-4 py-2 font-medium ${installment.status === "PAID" ? "text-green-600" : "text-yellow-600"}`}>{installment.status === "PAID" ? "Cleared" : "Pending"}</td>
                      <td className="px-4 py-2">{new Date(installment.dueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">₹{installment.amount?.toFixed(2)}</td>
                      <td className="px-4 py-2">₹{installment.due?.toFixed(2) || "0.00"}</td>
                      <td className="px-4 py-2">{installment.paidOn ? new Date(installment.paidOn).toLocaleDateString() : "-"}</td>
                      <td className="px-4 py-2">{installment.credits || 0}</td>
                      <td className="px-4 py-2">
                        <a href={installment.invoiceUrl || "#"} className="text-primary hover:underline text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V6m0 0l-7 7m7-7l7 7" />
                          </svg>
                          Invoice
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Amount Details Card */}
          <div className="bg-white rounded border p-6 shadow-sm md:mt-0 mt-6">
            <h3 className="text-lg font-semibold mb-4">Amount Details</h3>
            <div className="text-md space-y-2">
              <div className="flex justify-between">
                <span>Total Cost</span>
                <span>₹ {totalCost.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>- ₹ 0</span>
              </div>
              <div className="flex justify-between font-medium text-green-600">
                <span>Net Amount</span>
                <span>₹ {totalCost.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid Amount</span>
                <span>₹ {paidAmount.toFixed(0)}</span>
              </div>
              <div className="flex justify-between font-medium text-yellow-600">
                <span>Pending Fee</span>
                <span>₹ {pendingAmount.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Payments Tab - You can add similar layout for payments if needed */}
      {activeTab === "payments" && (
        <div className="p-8 text-gray-500">Payments details coming soon...</div>
      )}
    </div>
  );
}
