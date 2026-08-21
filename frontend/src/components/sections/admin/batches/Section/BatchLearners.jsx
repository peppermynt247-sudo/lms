"use client";
import React, { useState, useEffect, useRef } from "react";
import { MoreVertical, X, KeyRound } from "lucide-react";
import * as XLSX from "xlsx";
//import api from "../../../../../utils/api";
import api from "@utils/api";
import { toast } from 'react-toastify';

const BatchLearners = ({ batchId, onEnrolledCountChange }) => {
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownId, setDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [learnerToResetPassword, setLearnerToResetPassword] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [confirmResetPasswordValue, setConfirmResetPasswordValue] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const handleAdminResetPassword = async () => {
    if (!learnerToResetPassword) {
      toast.error("No learner selected for password reset.");
      return;
    }
    setResetPasswordLoading(true);
    try {
      await api.post(`/api/user/resetpassword?email=${encodeURIComponent(learnerToResetPassword.email)}&newPassword=${encodeURIComponent(resetPasswordValue)}`);
      toast.success("Password reset successful!");
      setShowResetPasswordModal(false);
      setResetPasswordValue('');
      setConfirmResetPasswordValue('');
      setLearnerToResetPassword(null);
      setResetPasswordError('');
    } catch (err) {
      toast.error("Failed to reset password. Please try again.");
    }
    setResetPasswordLoading(false);
  };

  useEffect(() => {
    if (!dropdownId) return;
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownId]);

  useEffect(() => {
    if (!batchId) return;
    setLoading(true);
    api.get(`/api/batchusers/batch?batchid=${batchId}`)
      .then(res => {
        const learnersData = res.data?.Data || res.data?.data || [];

        setLearners(learnersData);
        if (onEnrolledCountChange) {
          onEnrolledCountChange(learnersData.length);
        }
      })
      .catch(() => {
        setLearners([]);
        if (onEnrolledCountChange) {
          onEnrolledCountChange(0);
        }
      })
      .finally(() => setLoading(false));
  }, [batchId, onEnrolledCountChange]);

  const filteredLearners = learners.filter(learner => {
    const keyword = searchTerm.toLowerCase();
    return (
      (learner.name?.toLowerCase().includes(keyword) ?? false) ||
      (learner.email?.toLowerCase().includes(keyword) ?? false) ||
      (String(learner.phone || "").includes(keyword))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredLearners.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLearners = filteredLearners.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleExportLearners = () => {
    // Export only filtered learners
    if (!filteredLearners.length) {
      toast.warn("No learners to export.");
      return;
    }

    // Try to get batch/course name from parent window if possible
    let courseName = "course";
    try {
      if (typeof window !== 'undefined' && window.__BATCH_COURSE_NAME) {
        courseName = window.__BATCH_COURSE_NAME;
      } else if (batchId) {
        courseName = `batch_${batchId}`;
      } else {
        const first = filteredLearners[0];
        courseName = first?.courseName || first?.courseTitle || first?.course || "course";
      }
    } catch (e) { }
    // Clean courseName for filename
    courseName = String(courseName).replace(/[^a-zA-Z0-9-_]/g, "_");

    const exportData = filteredLearners.map((learner) => {
      // Find enrolled date
      let enrolledDate = learner.enrolledOn || learner.enrolled || learner.joinedAt || learner.joined || learner.createdAt || "";
      if (enrolledDate && typeof enrolledDate === 'string' && enrolledDate.includes('T')) {
        enrolledDate = enrolledDate.split('T')[0];
      }
      // Robust phone fallback
      let phone = learner.phone || learner.mobile || learner.contact || learner.contactNumber || learner.phoneNumber || "";

      // Content Progress and Assessment Progress (try to get from learner object, fallback to '-')
      let contentProgress = learner.contentProgress;
      if (contentProgress === undefined && learner.progress !== undefined) contentProgress = learner.progress;
      if (contentProgress === undefined) contentProgress = '-';
      let assessmentProgress = learner.assessmentProgress;
      if (assessmentProgress === undefined && learner.assessment !== undefined) assessmentProgress = learner.assessment;
      if (assessmentProgress === undefined) assessmentProgress = '-';

      return {
        Name: learner.name,
        Email: learner.email,
        Phone: phone,
        "Enrolled On": enrolledDate,
        "Content Progress": contentProgress,
        "Assessment Progress": assessmentProgress,
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(
      filteredLearners.map((learner) => ({
        Name: learner.name,
        Email: learner.email,
        Phone: learner.phone,
        "Enrolled On": learner.enrolledOn,
        "Attendance %": learner.attendancePercent,
        "Attendance Breakdown": learner.attendanceBreakdown,
        "Progress (%)": learner.progress,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Learners");
    XLSX.writeFile(workbook, `${courseName}_learners.xlsx`);
    toast.success("Learners exported successfully!");
  };

  const handleIssueCertificates = () => {
    toast.warn("Issue Certificates functionality is not implemented yet.");
  };

  if (!batchId) return <div>No batch selected.</div>;
  if (loading) return <div>Loading learners...</div>;


  return (
    <span>
      {/* Filters */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm">
          <span className="text-gray-700">Admitted</span>
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded ml-2 text-sm">
            {filteredLearners.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="search by Name, Email, Mobile..."
            className="px-3 py-2 border rounded-md text-sm w-72"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <button
            className={`ml-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm ${searchTerm ? '' : 'hidden'}`}
            onClick={() => handleSearchChange("")}
            title="Clear search"
          >
            Clear
          </button>
          <select
            onChange={(e) => {
              const selected = e.target.value;
              if (selected === "export") handleExportLearners();
              else if (selected === "issue") handleIssueCertificates();
              e.target.value = ""; // Reset select to default after action
            }}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">Actions</option>
            <option value="export">Export Learners</option>
            <option value="issue">Issue Certificates</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md overflow-x-auto min-h-[250px]">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3">
                <input type="checkbox" />
              </th>
              <th className="px-4 py-3">Learner</th>
              <th className="px-4 py-3">Contact Details</th>
              <th className="px-4 py-3">Enrolled On</th>
              <th className="px-4 py-3">Overall Progress</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLearners.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  No learners found.
                </td>
              </tr>
            ) : (
              paginatedLearners.map((learner) => (
                <tr key={learner.email} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {learner.name}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <div>{learner.email}</div>
                    <div className="text-xs text-gray-500">{learner.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    {learner.enrolled ? new Date(learner.enrolled).toLocaleDateString('en-GB') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full"
                        style={{ width: `0%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      0%
                    </div>
                  </td>
                  <td className="relative px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownId(dropdownId === learner.email ? null : learner.email);
                      }}
                      className="text-gray-600 hover:text-blue-600 focus:outline-none"
                    >
                      <MoreVertical className="w-4 h-4 cursor-pointer" />
                    </button>
                    {dropdownId === learner.email && (
                      <div ref={dropdownRef} className="absolute right-4 top-10 bg-white border rounded-lg shadow-lg z-50 min-w-[150px]">
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 block"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLearnerToResetPassword(learner);
                            setShowResetPasswordModal(true);
                            setDropdownId(null);
                          }}
                        >
                          Reset Password
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

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
        <span>
          Showing {filteredLearners.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredLearners.length)} of {filteredLearners.length} learners
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Prev
            </button>
            <span className="px-2">{safePage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-slide-in-up">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-black" onClick={() => { setShowResetPasswordModal(false); setResetPasswordValue(''); setConfirmResetPasswordValue(''); setResetPasswordError(''); }}>
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-6 text-center flex items-center justify-center gap-2"><KeyRound className="w-5 h-5 text-blue-600" /> Reset Password for {learnerToResetPassword?.name}</h2>
            <form onSubmit={e => {
              e.preventDefault();
              setResetPasswordError('');
              if (resetPasswordValue !== confirmResetPasswordValue) {
                setResetPasswordError('Passwords do not match');
                return;
              }
              if (resetPasswordValue.length < 8) {
                setResetPasswordError('Password must be at least 8 characters long');
                return;
              }
              handleAdminResetPassword();
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input type="password" className="w-full border rounded-lg px-4 py-2 text-base" value={resetPasswordValue} onChange={e => setResetPasswordValue(e.target.value)} required minLength={8} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <input type="password" className="w-full border rounded-lg px-4 py-2 text-base" value={confirmResetPasswordValue} onChange={e => setConfirmResetPasswordValue(e.target.value)} required minLength={8} />
              </div>
              {resetPasswordError && <div className="text-red-600 text-sm mb-2">{resetPasswordError}</div>}
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="px-5 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition" onClick={() => { setShowResetPasswordModal(false); setResetPasswordValue(''); setConfirmResetPasswordValue(''); setResetPasswordError(''); }}>Cancel</button>
                <button type="submit" className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition disabled:opacity-50" disabled={resetPasswordLoading}>{resetPasswordLoading ? 'Resetting...' : 'Reset Password'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </span>
  );
};

export default BatchLearners;
