"use client";

import React, { useCallback } from "react";
import { MoreVertical, X } from "lucide-react";

const AdmissionsFeesTab = ({
  admissions,
  admissionsLoading,
  expandedAdmissionRows,
  setExpandedAdmissionRows,
  getField,
  id,
  openAdmissionDropdown,
  setOpenAdmissionDropdown,
  setSelectedAdmission,
  setShowEditAdmissionModal,
  setAdmissionToCancel,
  setShowCancelAdmissionModal,
  canPayInstallment,
  openPaymentModal,
  showEditAdmissionModal,
  selectedAdmission,
  EditAdmission,
  fetchAdmissions,
  showCancelAdmissionModal,
  admissionToCancel,
  toast,
  axios,
  Cookies,
}) => {
  const handleRowClick = useCallback(
    (adm, idx) => {
      if (
        adm.installments &&
        adm.installments.length > 0 &&
        getField(adm, "admissionStatus")?.toLowerCase() !== "canceled"
      ) {
        const newExpanded = new Set(expandedAdmissionRows);
        if (newExpanded.has(idx)) newExpanded.delete(idx);
        else newExpanded.add(idx);
        setExpandedAdmissionRows(newExpanded);
      }
    },
    [expandedAdmissionRows, setExpandedAdmissionRows, getField]
  );

  return (
    <div className="mt-4">
      <table className="w-full table-auto border-collapse text-sm">
        <thead className="bg-gray-100 text-left text-gray-700">
          <tr>
            <th className="px-4 py-2">Sr.</th>
            <th className="px-4 py-2">Course</th>
            <th className="px-4 py-2">Fees</th>
            <th className="px-4 py-2">Payment Status</th>
            <th className="px-4 py-2">Enrolled At</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {admissionsLoading ? (
            <tr>
              <td colSpan="6" className="text-center py-4 text-gray-400">
                Loading...
              </td>
            </tr>
          ) : !admissions || admissions.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center py-4 text-gray-400">
                <div>
                  <div>No course admission data</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Note: Bundle enrollments are not displayed in this section
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            admissions.map((adm, idx) => (
              <React.Fragment key={`${getField(adm, "Id", "courseId", "CourseId", "bundleId")}-${idx}`}>
                <tr
                  className={`border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                    getField(adm, "admissionStatus")?.toLowerCase() === "canceled"
                      ? "bg-red-50 border-red-200"
                      : expandedAdmissionRows.has(idx)
                      ? "bg-blue-50"
                      : ""
                  }`}
                  onClick={() => handleRowClick(adm, idx)}
                >
                  <td className="px-4 py-3">{idx + 1}</td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    {adm.installments &&
                      adm.installments.length > 0 &&
                      getField(adm, "admissionStatus")?.toLowerCase() !== "canceled" && (
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            expandedAdmissionRows.has(idx) ? "rotate-90" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      )}
                    <div className="flex flex-col">
                      <span>{getField(adm, "title", "courseName", "CourseName")}</span>
                      {getField(adm, "admissionStatus")?.toLowerCase() === "canceled" && (
                        <span className="text-red-600 font-bold text-sm mt-1">
                          ADMISSION CANCELLED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    ₹
                    {getField(adm, "fees", "Fees")
                      ? Number(getField(adm, "fees", "Fees")).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })
                      : "0.00"}
                  </td>
                  <td className="px-4 py-3">{getField(adm, "paymentStatus", "PaymentStatus")}</td>
                  <td className="px-4 py-3">
                    {getField(adm, "enrolledAt", "EnrolledAt")
                      ? new Date(getField(adm, "enrolledAt", "EnrolledAt")).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenAdmissionDropdown(openAdmissionDropdown === idx ? null : idx);
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openAdmissionDropdown === idx && (
                      <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-20">
                        <ul className="text-xs sm:text-sm">
                          <li
                            className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-blue-700"
                            onClick={() => {
                              const selected = {
                                ...adm,
                                userId: id,
                                Id: adm.Id ?? adm.courseId ?? adm.bundleId,
                                type: adm.type || (adm.bundleId ? "BUNDLE" : "COURSE"),
                              };
                              setSelectedAdmission(selected);
                              setShowEditAdmissionModal(true);
                              setOpenAdmissionDropdown(null);
                            }}
                          >
                            Edit Admission
                          </li>
                          <li
                            className={`px-4 py-2 ${
                              getField(adm, "admissionStatus")?.toLowerCase() === "canceled"
                                ? "text-gray-400 cursor-not-allowed bg-gray-50"
                                : "hover:bg-red-100 cursor-pointer text-red-700"
                            }`}
                            onClick={() => {
                              if (
                                getField(adm, "admissionStatus")?.toLowerCase() !== "canceled"
                              ) {
                                setAdmissionToCancel(adm);
                                setShowCancelAdmissionModal(true);
                                setOpenAdmissionDropdown(null);
                              }
                            }}
                          >
                            Cancel Admission
                            {getField(adm, "admissionStatus")?.toLowerCase() === "canceled"}
                          </li>
                        </ul>
                      </div>
                    )}
                  </td>
                </tr>
                {adm.installments &&
                  adm.installments.length > 0 &&
                  expandedAdmissionRows.has(idx) &&
                  getField(adm, "admissionStatus")?.toLowerCase() !== "canceled" && (
                    <tr>
                      <td colSpan={6} className="py-4">
                        <div
                          className={`rounded-xl shadow-lg border-l-4 ${
                            getField(adm, "admissionStatus")?.toLowerCase() === "canceled"
                              ? "border-red-500 bg-red-50"
                              : "border-blue-500 bg-white"
                          } p-4 mb-2`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span
                              className={`font-bold text-lg ${
                                getField(adm, "admissionStatus")?.toLowerCase() === "canceled"
                                  ? "text-red-700"
                                  : "text-blue-700"
                              } flex items-center gap-2`}
                            >
                              <svg
                                className={`w-5 h-5 ${
                                  getField(adm, "admissionStatus")?.toLowerCase() === "canceled"
                                    ? "text-red-500"
                                    : "text-blue-500"
                                }`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.364-7.364l-1.414 1.414M6.05 17.95l-1.414 1.414m12.728 0l-1.414-1.414M6.05 6.05L4.636 4.636"
                                />
                              </svg>
                              Installments
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[...adm.installments]
                              .sort((a, b) => (a.installmentId || 0) - (b.installmentId || 0))
                              .map((inst, i) => (
                                <div
                                  key={inst.installmentId || i}
                                  className="bg-blue-50 rounded-lg p-4 flex flex-col gap-2 border border-blue-100 hover:shadow-md transition"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Installment</span>
                                    <span className="font-semibold text-blue-700">#{i + 1}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Amount</span>
                                    <span className="font-bold text-lg text-green-700">
                                      ₹
                                      {inst.amount
                                        ? Number(inst.amount).toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                          })
                                        : "0.00"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Due Date</span>
                                    <span className="font-medium text-gray-700">
                                      {inst.dueDate
                                        ? new Date(inst.dueDate).toLocaleDateString()
                                        : "-"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-gray-500">Status</span>
                                    <span
                                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                        inst.status?.toLowerCase() === "paid"
                                          ? "bg-green-100 text-green-700"
                                          : "bg-yellow-100 text-yellow-700"
                                      }`}
                                    >
                                      {inst.status?.toLowerCase() === "paid" ? (
                                        <svg
                                          className="w-4 h-4 text-green-500"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      ) : (
                                        <svg
                                          className="w-4 h-4 text-yellow-500"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          viewBox="0 0 24 24"
                                        >
                                          <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            fill="none"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 6v6l4 2"
                                          />
                                        </svg>
                                      )}
                                      {inst.status}
                                    </span>
                                  </div>
                                  {inst.status?.toLowerCase() !== "paid" && (
                                    <div className="mt-3">
                                      {canPayInstallment(adm.installments, inst) ? (
                                        <button
                                          onClick={() => openPaymentModal(inst)}
                                          className="w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                            />
                                          </svg>
                                          Record Payment
                                        </button>
                                      ) : (
                                        <div className="text-center">
                                          <div className="text-xs text-gray-500 mb-1">
                                            Previous installments must be paid first
                                          </div>
                                          <button
                                            disabled
                                            className="w-auto px-4 py-2 bg-gray-300 text-gray-500 text-sm font-semibold rounded-lg cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                                          >
                                            <svg
                                              className="w-4 h-4"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                              />
                                            </svg>
                                            Record Payment
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>

      {showEditAdmissionModal && selectedAdmission && (
        <EditAdmission
          admission={selectedAdmission}
          onClose={() => {
            setShowEditAdmissionModal(false);
            setSelectedAdmission(null);
          }}
          onSuccess={() => {
            setShowEditAdmissionModal(false);
            setSelectedAdmission(null);
            fetchAdmissions();
          }}
        />
      )}

      {showCancelAdmissionModal && admissionToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Admission</h3>
              <button
                onClick={() => {
                  setShowCancelAdmissionModal(false);
                  setAdmissionToCancel(null);
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-gray-700">
                Are you sure you want to cancel the admission for{" "}
                <span className="font-semibold">
                  {getField(admissionToCancel, "title", "courseName", "CourseName") ||
                    "this course/bundle"}
                </span>
                ?
              </p>
              <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelAdmissionModal(false);
                  setAdmissionToCancel(null);
                }}
                className="flex-1 border border-gray-300 rounded-lg py-2 text-gray-700 font-semibold hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const itemId =
                      admissionToCancel.Id ??
                      admissionToCancel.courseId ??
                      admissionToCancel.bundleId;
                    const type =
                      admissionToCancel.type ||
                      (admissionToCancel.bundleId ? "BUNDLE" : "COURSE");
                    if (!itemId) return;
                    const params = { userId: id };
                    if ((type || "").toUpperCase() === "BUNDLE") params.bundleId = itemId;
                    else params.courseId = itemId;
                    const token = Cookies.get("accessToken");
                    const response = await axios.delete(
                      `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admission/cancelenrollment`,
                      { params, headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (response.data.success) {
                      toast.success("Admission cancelled successfully!");
                      setShowCancelAdmissionModal(false);
                      setAdmissionToCancel(null);
                      fetchAdmissions();
                    } else {
                      toast.error(
                        response.data.message || "Failed to cancel admission."
                      );
                    }
                  } catch {
                    toast.error("Failed to cancel admission. Please try again.");
                  }
                }}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 font-semibold hover:bg-red-700 transition"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmissionsFeesTab;