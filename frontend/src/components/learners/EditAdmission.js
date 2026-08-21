import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Plus, Trash2 } from 'lucide-react';

const EditAdmission = ({ admission, onClose, onSuccess }) => {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Helper function to add days to a date
  const addDays = (dateString, days) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  // Initialize installments from admission prop
  useEffect(() => {
    if (admission && Array.isArray(admission.installments)) {
      const unpaid = admission.installments.filter(inst => {
        const status = (inst.status || '').toString().toLowerCase();
        return status !== 'paid';
      });
      setInstallments(
        unpaid.map(inst => ({
          installmentId: inst.installmentId ?? -1,
          amount: inst.amount ?? '',
          dueDate: inst.dueDate ? new Date(inst.dueDate).toISOString().split('T')[0] : '',
          status: inst.status || 'PENDING',
        }))
      );
    }
  }, [admission]);

  // Add new installment
  const handleAddInstallment = () => {
    setInstallments([
      ...installments,
      {
        installmentId: -1,
        amount: '',
        dueDate: '',
        status: 'PENDING',
      },
    ]);
  };

  // Remove installment with confirmation
  const handleRemoveInstallment = (idx) => {
    const installment = installments[idx];
    setDeleteTarget({ idx, installment });
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const { idx, installment } = deleteTarget;

    // If it's a new installment (not yet saved), just remove from local state
    if (!installment.installmentId || installment.installmentId === -1) {
      setInstallments(installments.filter((_, i) => i !== idx));
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      return;
    }

    // If it's an existing installment, call the delete API
    try {
      const token =
        localStorage.getItem('accessToken') ||
        Cookies.get('accessToken') ||
        sessionStorage.getItem('accessToken');

      if (!token) {
        setError('Authentication token not found. Please login again.');
        setShowDeleteConfirm(false);
        setDeleteTarget(null);
        return;
      }

      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admission/deleteinstallment?installmentId=${installment.installmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200 || response.data?.success) {
        setInstallments(installments.filter((_, i) => i !== idx));
        setSuccess('Installment deleted successfully!');
        setTimeout(() => setSuccess(false), 3000);

        if (onSuccess) {
          onSuccess({ type: 'delete', installmentId: installment.installmentId });
        }
      } else {
        setError(response.data?.message || 'Failed to delete installment');
      }
    } catch (error) {
      console.error('Error deleting installment:', error);
      setError('Error deleting installment. Please try again.');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  // Handle input changes
  const handleChange = (idx, field, value) => {
    setInstallments(installments.map((inst, i) => (i === idx ? { ...inst, [field]: value } : inst)));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!admission?.userId || !admission?.id) {
      setError('Missing user or course/bundle information');
      setLoading(false);
      return;
    }

    // Validate installments
    const validInstallments = installments.filter(
      (inst) =>
        inst.amount &&
        inst.amount !== '' &&
        !isNaN(parseFloat(inst.amount)) &&
        parseFloat(inst.amount) >= 0 &&
        inst.dueDate
    );

    if (validInstallments.length === 0) {
      setError('Please add at least one valid installment');
      setLoading(false);
      return;
    }

    try {
      const token =
        localStorage.getItem('accessToken') ||
        Cookies.get('accessToken') ||
        sessionStorage.getItem('accessToken');

      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      // IMPORTANT: match backend DTO exactly
      // Send type as uppercase: 'COURSE' or 'BUNDLE'
      const normalizedType = String(admission.type).toUpperCase() === 'BUNDLE' ? 'BUNDLE' : 'COURSE';
      const payload = {
        userId: Number(admission.userId),
        id: Number(admission.id),
        type: normalizedType,
        installments: validInstallments.map((inst) => ({
          installmentId: inst.installmentId ?? -1,
          amount: Number(inst.amount),
          // Send without timezone: YYYY-MM-DDTHH:mm:ss
          dueDate: `${inst.dueDate}T00:00:00`,
        })),
      };

      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admission/updateadmission`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );

      if (response.status === 200 || response.data?.success) {
        setSuccess('Admission updated successfully!');
        setTimeout(() => setSuccess(false), 3000);

        if (onSuccess) {
          onSuccess(response.data);
        }

        // Auto-close modal after 2 seconds
        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
      } else {
        setError(response.data?.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating admission:', error);

      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (error.response?.status === 404) {
        setError('Course or Bundle not found. Please check the admission details.');
      } else if (error.response?.status === 400) {
        setError(error.response.data?.message || 'Invalid data provided.');
      } else if (error.code === 'ECONNABORTED') {
        setError('Request timeout. Please try again.');
      } else if (error.code === 'ERR_NETWORK') {
        setError('Network error. Please check your connection.');
      } else {
        setError(error.response?.data?.message || error.message || 'Failed to update admission.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="relative w-full max-w-2xl h-[90vh] bg-white rounded-lg shadow border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-lg">
          <div>
            <div className="text-lg font-semibold text-gray-900">Edit Admission</div>
            <div className="text-sm text-gray-500">{admission?.title || 'Admission Details'}</div>
          </div>
          {onClose && (
            <button
              className="text-gray-400 hover:text-black text-2xl font-bold absolute right-6 top-4 z-20"
              onClick={onClose}
              aria-label="Close"
              style={{ lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8">
          {/* Installments Table */}
          <div>
            <div className="font-medium text-gray-800 mb-4 flex items-center justify-between">
              <span>Installments</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddInstallment}
                  className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add installment
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-normal text-gray-600">#</th>
                    <th className="px-3 py-2 text-left font-normal text-gray-600">Amount</th>
                    <th className="px-3 py-2 text-left font-normal text-gray-600">Due Date</th>
                    <th className="px-3 py-2 text-center font-normal text-gray-600">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((inst, idx) => (
                    <tr key={idx} className="border-b last:border-b-0">
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="border border-gray-300 rounded px-2 py-1 w-full bg-white"
                          value={inst.amount}
                          min={0}
                          step="0.01"
                          onChange={(e) => handleChange(idx, 'amount', e.target.value)}
                          required
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          className="border border-gray-300 rounded px-2 py-1 w-full bg-white"
                          value={inst.dueDate || ''}
                          onChange={(e) => handleChange(idx, 'dueDate', e.target.value)}
                          min={idx > 0 && installments[idx - 1]?.dueDate ? addDays(installments[idx - 1].dueDate, 1) : undefined}
                          required
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveInstallment(idx)}
                          className="text-red-500 hover:text-red-700 transition text-lg"
                        >
                          <Trash2 className="inline w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-800 text-sm font-medium text-center">{error}</div>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-800 text-sm font-medium text-center">{success}</div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white rounded-b-lg sticky bottom-0 z-20">
            <button
              type="button"
              className="px-5 py-2 rounded border border-gray-400 text-gray-700 bg-white hover:bg-gray-100 text-sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Update Details'}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Delete Installment</h3>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this installment? This action cannot be undone.</p>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Amount:</span>
                      <div className="text-gray-900">Rs. {deleteTarget.installment.amount || 'Not set'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Due Date:</span>
                      <div className="text-gray-900">
                        {deleteTarget.installment.dueDate ? new Date(deleteTarget.installment.dueDate).toLocaleDateString() : 'Not set'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditAdmission; 