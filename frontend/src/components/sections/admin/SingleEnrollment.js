'use client';
import React, { useState, useEffect, useCallback, useRef } from "react";
import { BookOpen, UserPlus, Trash2, PlusCircle, Search, Phone } from 'lucide-react';
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import Select from 'react-select'; // just test

// Helper functions for GST calculations
const calcPreGST = (amount) => +(amount / 1.18).toFixed(2);
const calcGST = (amount) => +(amount - calcPreGST(amount)).toFixed(2);

// Helper to add months to a date string (yyyy-mm-dd)
function addMonths(dateStr, months) {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  // Handle month overflow (e.g., Jan 31 + 1 month = Mar 3)
  if (date.getDate() !== new Date(dateStr).getDate()) {
    date.setDate(0); // Go to last day of previous month
  }
  return date.toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

// Custom Input Component with proper focus preservation
const StableInput = React.memo(({ value, onChange, placeholder, className, type = "text", min }) => {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [caretPosition, setCaretPosition] = useState(0);

  // Only update internal value if not focused or if value changed externally
  const [internalValue, setInternalValue] = useState(value || '');

  // Preserve caret position and focus during re-renders (only for text inputs)
  useEffect(() => {
    if (inputRef.current && isFocused && type !== 'date') {
      inputRef.current.setSelectionRange(caretPosition, caretPosition);
    }
  });

  // Only sync with external value when not focused
  useEffect(() => {
    if (!isFocused) {
      setInternalValue(value || '');
    }
  }, [value, isFocused]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    if (type !== 'date') {
      setCaretPosition(e.target.selectionStart);
    }
    onChange(newValue);
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (type !== 'date') {
      setCaretPosition(e.target.selectionStart);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setInternalValue(value || ''); // Sync with external value on blur
  };

  return (
    <input
      ref={inputRef}
      type={type}
      value={internalValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      min={min}
    />
  );
});

// Mobile Number Input with Auto-Recommendation
const MobileInputWithSuggestions = ({ value, onChange, placeholder, className }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allLearners, setAllLearners] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Fetch all learners on component mount
  useEffect(() => {
    const fetchAllLearners = async () => {
      const token = Cookies.get("accessToken");
      if (!token) return;

      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/getstudents`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAllLearners(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching learners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllLearners();
  }, []);

  // Filter suggestions based on input value
  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = allLearners
      .filter(learner => {
        const phone = learner.phone || learner.mobile || learner.phoneNumber || '';
        return phone.includes(value);
      })
      .slice(0, 5); // Limit to 5 suggestions

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [value, allLearners]);

  // Handle suggestion selection
  const handleSuggestionClick = (learner) => {
    const phone = learner.phone || learner.mobile || learner.phoneNumber || '';
    onChange(phone);
    setShowSuggestions(false);
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target) &&
          suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="relative">
        <input
          ref={inputRef}
          className={className}
          type="text"
          value={value}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
            onChange(val);
          }}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
          maxLength={10}
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {suggestions.map((learner, index) => {
            const phone = learner.phone || learner.mobile || learner.phoneNumber || '';
            const name = learner.name || 'Unknown';
            const email = learner.email || '';

            return (
              <div
                key={index}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => handleSuggestionClick(learner)}
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{phone}</div>
                    <div className="text-sm text-gray-600">{name} • {email}</div>
                    </div>
                  </div>
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Modern InstallmentsTable Component ---
function InstallmentsTable({ installments, onDueDateChange, setInstallments, selectedCourseId, handleEnroll, loading }) {
  const [saving, setSaving] = useState(false);

  const handleAddInstallment = useCallback(() => {
    const newInstallment = {
      id: Date.now(),
      name: `Installment ${installments.length + 1}`,
      amount: '',
      dueDate: '',
      status: 'PENDING',
    };
    setInstallments(prev => [...prev, newInstallment]);
  }, [installments.length, setInstallments]);

  const handleDeleteInstallment = useCallback((index) => {
    setInstallments(prev => prev.filter((_, i) => i !== index));
  }, [setInstallments]);

  const handleAmountChange = useCallback((index, value) => {
      // Only allow numbers and decimal points
    const sanitizedValue = value.replace(/[^0-9.]/g, '');
    setInstallments(prev => {
      const newInstallments = [...prev];
        if (newInstallments[index] && newInstallments[index].amount !== sanitizedValue) {
        newInstallments[index] = { ...newInstallments[index], amount: sanitizedValue };
        return newInstallments;
        }
      return prev; // Return same reference if no change
    });
  }, [setInstallments]);

  const handleNameChange = useCallback((index, value) => {
    setInstallments(prev => {
      const newInstallments = [...prev];
        if (newInstallments[index] && newInstallments[index].name !== value) {
        newInstallments[index] = { ...newInstallments[index], name: value };
        return newInstallments;
        }
      return prev; // Return same reference if no change
    });
  }, [setInstallments]);

  const handleSaveToBackend = async () => {
    if (!selectedCourseId || installments.length === 0) {
      toast.error('Please select a course and add installments first');
      return;
    }

    // This function should only be called after user enrollment
    // The installments will be created during the enrollment process
    toast.info('Installments will be saved during enrollment');
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 max-w-7xl mx-auto mt-8 border border-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Installments</h3>
          <p className="text-gray-600 text-sm">Manage and customize payment schedules</p>
        </div>
      </div>

      {/* Installments List */}
      <div className="bg-gray-50 rounded-2xl p-6">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 mb-4 px-4 py-3 bg-white rounded-xl shadow-sm">
          <div className="col-span-1">
            <span className="text-sm font-semibold text-gray-700">#</span>
          </div>
          <div className="col-span-2">
            <span className="text-sm font-semibold text-gray-700">Installment Name</span>
          </div>
          <div className="col-span-2">
            <span className="text-sm font-semibold text-gray-700">Amount (₹)</span>
          </div>
          <div className="col-span-2">
            <span className="text-sm font-semibold text-gray-700">Pre-GST</span>
          </div>
          <div className="col-span-2">
            <span className="text-sm font-semibold text-gray-700">GST (18%)</span>
          </div>
          <div className="col-span-2">
            <span className="text-sm font-semibold text-gray-700">Due Date</span>
          </div>
          <div className="col-span-1">
            <span className="text-sm font-semibold text-gray-700">Actions</span>
          </div>
        </div>

        {/* Installment Rows */}
        <div className="space-y-3">
          {installments.map((inst, idx) => (
            <div key={inst.id || `installment-${idx}`} className="grid grid-cols-12 gap-4 px-4 py-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
              {/* Installment Number */}
              <div className="col-span-1 flex items-center">
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                </div>

              {/* Installment Name */}
              <div className="col-span-2 flex items-center">
                  <StableInput
                    value={inst.name}
                    onChange={(value) => handleNameChange(idx, value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white text-gray-800 font-medium text-sm"
                    placeholder="Enter name"
                  />
                </div>

              {/* Amount */}
              <div className="col-span-2 flex items-center">
                  <StableInput
                  value={inst.amount || ''}
                    onChange={(value) => handleAmountChange(idx, value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white text-gray-800 font-bold text-sm"
                    placeholder="0.00"
                    type="text"
                  />
                </div>

              {/* Pre-GST */}
              <div className="col-span-2 flex items-center">
                  <span className="text-sm font-semibold text-gray-700">
                  ₹{((parseFloat(inst.amount) || 0) / 1.18).toFixed(2)}
                  </span>
                </div>

              {/* GST */}
              <div className="col-span-2 flex items-center">
                  <span className="text-sm font-semibold text-orange-600">
                  ₹{((parseFloat(inst.amount) || 0) - (parseFloat(inst.amount) || 0) / 1.18).toFixed(2)}
                  </span>
                </div>

              {/* Due Date */}
              <div className="col-span-2 flex items-center">
                  <input
                    type="date"
                  value={inst.dueDate || ''}
                    onChange={(e) => onDueDateChange(idx, e.target.value)}
                  min={idx > 0 && installments[idx - 1]?.dueDate ? addDays(installments[idx - 1].dueDate, 1) : undefined}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white text-gray-800 text-sm"
                  style={{
                    colorScheme: 'light'
                  }}
                />
              </div>

              {/* Actions */}
              <div className="col-span-1 flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteInstallment(idx)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                    title="Delete installment"
                  >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  </button>
              </div>
            </div>
          ))}

                      {/* Add Installment Button - positioned right after the last installment */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-orange-50 rounded-xl border border-orange-200">
              <div className="col-span-12 flex justify-center">
              <button
                onClick={handleAddInstallment}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                  <span className="font-medium">Add Installment</span>
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {installments.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusCircle className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-gray-500 text-sm">No installments configured yet</p>
            <p className="text-gray-400 text-xs">Click "Add Installment" to get started</p>
          </div>
        )}
      </div>

              {/* Compact Payment Summary */}

    </div>
  );
}

const SingleEnrollment = ({ prefillEmail, prefillPhone }) => {
  // State
  const [contactMethod, setContactMethod] = useState("Mobile");
  const [contactValue, setContactValue] = useState("");
  const [enrollmentType, setEnrollmentType] = useState("bundle"); // "course" or "bundle" - default to bundle
  const [courses, setCourses] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedBundleId, setSelectedBundleId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [userExists, setUserExists] = useState(null); // null=not checked, true=exists, false=not exists
  const [existingUser, setExistingUser] = useState(null);
  const [registerFields, setRegisterFields] = useState({ name: "", email: "", password: "", regNo: "" });
  const [showExtraFields, setShowExtraFields] = useState(false);
  // Set default date to today in yyyy-mm-dd format
  const today = new Date().toISOString().slice(0, 10);
  const [paymentFields, setPaymentFields] = useState({ date: today, currency: "INR", feesScheme: "", place: "Karnataka" });
  const [loading, setLoading] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [proceedClicked, setProceedClicked] = useState(false);
  const [installments, setInstallments] = useState([]);
  const [enrollingUserId, setEnrollingUserId] = useState(null);
  const [paymentPlans, setPaymentPlans] = useState([]); // <-- Add this state
  const [pricingDetails, setPricingDetails] = useState(null); // <-- Add this state

  // Make token available everywhere in the component
  const token = Cookies.get("accessToken");

  // Fetch all courses (auth required)
  useEffect(() => {
    if (!token) {
      toast.error("No access token found. Please login again.");
      return;
    }

    // Try legacy endpoint first (no pagination)
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses/legacy`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) {
          // If legacy fails, try paginated endpoint
          return fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
        }
          });
        }
        return res;
      })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch courses: ${res.status} - ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        let arr = [];
        // Handle different response structures
        if (data.data && Array.isArray(data.data.content)) {
          arr = data.data.content;
        } else if (data.data && Array.isArray(data.data)) {
          arr = data.data;
        } else if (Array.isArray(data)) {
          arr = data;
        }
        setCourses(arr);
      })
      .catch((error) => {
        toast.error(`Failed to fetch courses: ${error.message}`);
      });
  }, []);

  // Fetch all bundles (auth required)
  useEffect(() => {
    if (!token) {
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/course-bundles`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch bundles: ${res.status} - ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        let arr = [];
        // Backend returns direct array, not wrapped in data field
        if (Array.isArray(data)) {
          arr = data;
        } else if (data.data && Array.isArray(data.data)) {
          arr = data.data;
        }
        setBundles(arr);
      })
      .catch((error) => {
        toast.error(`Failed to fetch bundles: ${error.message}`);
      });
  }, []);

  // Function to fetch batches for a specific course or bundle
  const fetchBatchesForCourse = async (courseId, bundleId) => {
    if (!token || (!courseId && !bundleId)) {
      setBatches([]);
      setSelectedBatchId("");
      return;
    }
    setLoadingBatches(true);
    try {
      let endpoint = '';
      if (courseId) {
        endpoint = `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses/${courseId}/batches`;
      } else if (bundleId) {
        endpoint = `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/course-bundles/${bundleId}/batches`;
      }

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch batches: ${response.status} - ${response.statusText}`);
      }
      const data = await response.json();
      let batchesArray = [];
      // Handle different response structures
      if (data.data && Array.isArray(data.data)) {
        batchesArray = data.data;
      } else if (Array.isArray(data)) {
        batchesArray = data;
      }
      setBatches(batchesArray);
      // Automatically select the first batch if available
      if (batchesArray.length > 0) {
        const firstBatch = batchesArray[0];
        const firstBatchId = firstBatch.batchId || firstBatch.batch_id || firstBatch.id;
        setSelectedBatchId(firstBatchId);
      } else {
        setSelectedBatchId("");
      }
    } catch (error) {
      toast.error(`Failed to fetch batches: ${error.message}`);
      setBatches([]);
      setSelectedBatchId("");
    } finally {
      setLoadingBatches(false);
    }
  };

  // Handle course selection
  const handleCourseSelection = (selectedOption) => {
    const courseId = selectedOption ? selectedOption.value : "";
    setSelectedCourseId(courseId);

    if (courseId) {
      // Fetch batches for the selected course
      fetchBatchesForCourse(courseId, null);
    } else {
      // Clear batches if no course is selected
      setBatches([]);
      setSelectedBatchId("");
    }
  };

  // Handle bundle selection
  const handleBundleSelection = (selectedOption) => {
    const bundleId = selectedOption ? selectedOption.value : "";
    setSelectedBundleId(bundleId);

    if (bundleId) {
      // Fetch batches for the selected bundle
      fetchBatchesForCourse(null, bundleId);
    } else {
      // Clear batches if no bundle is selected
      setBatches([]);
      setSelectedBatchId("");
    }
  };

  // Reset proceedClicked and userExists if contactValue or contactMethod changes
  useEffect(() => {
    setProceedClicked(false);
    setUserExists(null);
    setExistingUser(null);
  }, [contactValue, contactMethod]);

  // Reset selections when enrollment type changes
  useEffect(() => {
    setSelectedCourseId("");
    setSelectedBundleId("");
    setBatches([]);
    setSelectedBatchId("");
  }, [enrollmentType]);

  // Validation helpers
  const isValidMobile = (value) => {
    const digits = value.replace(/\D/g, '');
    const last10 = digits.slice(-10);
    const valid = last10.length === 10;
    return valid;
  };
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  // Helper to get last 10 digits for mobile
  const getCleanMobile = (value) => {
    const digits = value.replace(/\D/g, '');
    const clean = digits.slice(-10);
    return clean;
  };

  // Dynamic user lookup (only after Proceed is clicked)
  useEffect(() => {
    if (!proceedClicked) return;
    let timeout;
    if (!token) {
      toast.error("No access token found. Please login again.");
      return;
    }
    if (contactMethod === "Mobile" && isValidMobile(contactValue)) {
      const cleanMobile = getCleanMobile(contactValue);
      timeout = setTimeout(async () => {
        setLoading(true);
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/enrollments/isnumberexist?phonenumber=${cleanMobile}`, {
              method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const payload = await res.json();
            const data = payload?.Data || null;
            const name = data?.name || "";
            setUserExists(!!data);
            setExistingUser(data);
            setRegisterFields(f => ({ ...f, name, regNo: "", password: "" }));
          } else {
            setUserExists(false);
            setExistingUser(null);
            setRegisterFields(f => ({ ...f, name: "", regNo: "", password: "" }));
          }
        } catch (err) {
          setUserExists(false);
          setExistingUser(null);
        }
        setLoading(false);
      }, 400);
    } else if (contactMethod === "Email" && isValidEmail(contactValue)) {
      timeout = setTimeout(async () => {
        setLoading(true);
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/enrollments/isemailexist?email=${contactValue}`, {
              method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const payload = await res.json();
            const data = payload?.Data || null;
            const name = data?.name || "";
            setUserExists(!!data);
            setExistingUser(data);
            setRegisterFields(f => ({ ...f, name, regNo: "", password: "" }));
          } else {
            setUserExists(false);
            setExistingUser(null);
            setRegisterFields(f => ({ ...f, name: "", regNo: "", password: "" }));
          }
        } catch (err) {
          setUserExists(false);
          setExistingUser(null);
        }
        setLoading(false);
      }, 400);
    } else {
      setUserExists(null);
      setExistingUser(null);
    }
    return () => clearTimeout(timeout);
  }, [proceedClicked, contactValue, contactMethod]);

  // Handle Proceed button click
  const handleProceed = () => {
    if (
      (contactMethod === "Mobile" && isValidMobile(contactValue)) ||
      (contactMethod === "Email" && isValidEmail(contactValue))
    ) {
      setProceedClicked(true);
    } else {
      toast.error("Please enter a valid email or mobile number.");
    }
  };

  // Completely rewritten handleEnroll with robust, simple logic
  const handleEnroll = async () => {
    if (loading) return; // Prevent double call
    setLoading(true);
    try {
      // 1. Validate required fields
      let missingFields = [];
      if (userExists === false) { // New user registration
        if (!registerFields.name) missingFields.push('Name');
        if (!registerFields.email) missingFields.push('Email');
        if (!contactValue) missingFields.push('Mobile/Email');
        if (!registerFields.password) missingFields.push('Password');
        if (enrollmentType === "course" && !selectedCourseId) missingFields.push('Course');
        if (enrollmentType === "bundle" && !selectedBundleId) missingFields.push('Bundle');
        if (!selectedBatchId) missingFields.push('Batch');
        if (!paymentFields.date) missingFields.push('Date of enrollment');
        if (!paymentFields.feesScheme) missingFields.push('Fees scheme');
      } else if (userExists === true) { // Existing user enrollment
        if (!existingUser?.name) missingFields.push('Name');
        if (!contactValue) missingFields.push('Mobile/Email');
        if (enrollmentType === "course" && !selectedCourseId) missingFields.push('Course');
        if (enrollmentType === "bundle" && !selectedBundleId) missingFields.push('Bundle');
        if (!selectedBatchId) missingFields.push('Batch');
        if (!paymentFields.date) missingFields.push('Date of enrollment');
        if (!paymentFields.feesScheme) missingFields.push('Fees scheme');
      }

      // Additional validation to ensure either course or bundle is selected
      if (enrollmentType === "course" && !selectedCourseId) {
        toast.error("Please select a course");
        setLoading(false);
        return;
      }
      if (enrollmentType === "bundle" && !selectedBundleId) {
        toast.error("Please select a bundle");
        setLoading(false);
        return;
      }
      if (missingFields.length > 0) {
        const msg = `Please fill all required fields: ${missingFields.join(', ')}`;
        toast.error(msg);
        setLoading(false);
        return;
      }
      // 2. Ensure a valid installmentsList
      let coursePrice = 0;
      if (enrollmentType === "course") {
        const selectedCourse = courses.find(c => (c.courseId || c.course_id || c.id) === selectedCourseId);
        if (selectedCourse && selectedCourse.price) coursePrice = Number(selectedCourse.price);
      } else if (enrollmentType === "bundle") {
        const selectedBundle = bundles.find(b => b.bundleId === selectedBundleId);
        if (selectedBundle && selectedBundle.price) coursePrice = Number(selectedBundle.price);
      }
      let safeInstallments = Array.isArray(installments) ? installments : [];
      if (safeInstallments.length === 0 && coursePrice > 0) {
        safeInstallments = [{ amount: coursePrice, dueDate: paymentFields.date, status: 'PENDING' }];
      }
      if (!Array.isArray(safeInstallments)) safeInstallments = [];
      // Require due date for each installment
      const hasMissingDueDate = safeInstallments.some(inst => !inst.dueDate)
      if (hasMissingDueDate) {
        toast.error("Please select a due date for all installments")
        setLoading(false)
        return
      }
      let userId = null;
      let userExistsResult = null;
      if (contactMethod === "Mobile") {
        const cleanMobile = contactValue.replace(/\D/g, '').slice(-10);
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/enrollments/isnumberexist?phonenumber=${cleanMobile}`, {
            method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const payload = await res.json();
          const data = payload?.Data || null;
          userExistsResult = data;
          userId = data?.userId;
        }
      } else if (contactMethod === "Email") {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/enrollments/isemailexist?email=${contactValue}`, {
            method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const payload = await res.json();
          const data = payload?.Data || null;
          userExistsResult = data;
          userId = data?.userId;
        }
      }
      if (!userId) {
        const formData = new FormData();
        formData.append("name", registerFields.name);
        // Fix email and phone number mapping based on contact method
        if (contactMethod === "Mobile") {
          // If searched by mobile, registerFields.email contains the email
        formData.append("email", registerFields.email);
          formData.append("phoneNumber", contactValue.replace(/\D/g, '').slice(-10));
        } else {
          // If searched by email, registerFields.email contains the mobile number
          formData.append("email", contactValue);
          formData.append("phoneNumber", registerFields.email);
        }
        formData.append("password", registerFields.password);
        formData.append("role", "STUDENT");
        formData.append("gender", "null");
        formData.append("profileImage", new Blob(), "default.png");
        const regRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/user/register`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (!regRes.ok) {
          const errorText = await regRes.text();
          if (regRes.status === 409) {
            toast.error("User already exists. Please use a different email or phone number.");
          } else if (errorText.toLowerCase().includes('already exists')) {
            toast.error("User already registered with this email or phone number.");
          } else {
            toast.error(errorText || "Registration failed");
          }
          setLoading(false);
          return;
        }
        const regData = await regRes.json();
        userId = regData.id || regData.data?.id;
      }
      // 5. Enroll the user
      const formattedInstallments = safeInstallments.map(inst => ({
        amount: parseFloat(inst.amount) || 0,
        status: inst.status || "PENDING",
        dueDate: inst.dueDate ? new Date(inst.dueDate).toISOString() : null
      }));
      const enrollPayload = {
        userId: parseInt(userId),
        courseId: enrollmentType === "course" ? parseInt(selectedCourseId) : null,
        bundleId: enrollmentType === "bundle" ? parseInt(selectedBundleId) : null,
        batchId: parseInt(selectedBatchId),
        paymentStatus: "PENDING",
        planId: paymentFields.feesScheme ? parseInt(paymentFields.feesScheme) : null,
        enrolledAt: new Date(paymentFields.date).toISOString(),
        installments: formattedInstallments
      };

      
      let enrollmentSuccess = false;
      let enrollmentResponse = null;
      try {
        const enrollRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/enrollments/enroll`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(enrollPayload)
        });
        if (!enrollRes.ok) {
          const errorMsg = await enrollRes.text();
          toast.error(errorMsg || "Enrollment failed");
          setLoading(false);
          return;
        }
        enrollmentSuccess = true;
        enrollmentResponse = await enrollRes.json();
      } catch (err) {
        toast.error("Enrollment failed. Please try again.");
        setLoading(false);
        return;
      }
      // 6. Only after enrollment succeeds, show success and refresh UI
      if (enrollmentSuccess) {
        toast.success("Learner enrolled successfully!");
        // Optionally, trigger a UI refresh or callback here
      }
      // 8. For each installment with status 'PAID', create a payment
      for (const inst of formattedInstallments) {
        if (inst.status === 'PAID') {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/payments`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                user: { id: userId },
                amount: inst.amount,
                currency: 'INR',
                paymentStatus: 'PAID',
                paymentMethod: 'manual',
                createdAt: new Date().toISOString()
              })
            });
          } catch (err) {
            // console.error('Failed to create payment for installment:', err);
          }
        }
      }
    } catch (e) {
      toast.error(e.message || "Enrollment failed");
    }
    setLoading(false);
  };

  // --- Installments logic (replace old logic) ---
  useEffect(() => {
    if (!selectedCourseId && !selectedBundleId) {
      setInstallments([]);
      return;
    }

    let price = 0;
    let selectedCourseOrBundle = null;

    if (selectedCourseId) {
      const selectedCourse = courses.find(c => (c.courseId || c.course_id || c.id) === selectedCourseId);
      if (selectedCourse && selectedCourse.price) price = Number(selectedCourse.price);
      selectedCourseOrBundle = selectedCourse;
    } else if (selectedBundleId) {
      const selectedBundle = bundles.find(b => b.bundleId === selectedBundleId);
      if (selectedBundle && selectedBundle.price) price = Number(selectedBundle.price);
      selectedCourseOrBundle = selectedBundle;
    }

    if (!price) {
      setInstallments([]);
      return;
    }

    const endpoint = enrollmentType === "course" 
        ? `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses/${selectedCourseId}/pricing-details`
      : `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/course-bundles/${selectedBundleId}/pricing-details`;

    fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setPricingDetails(data);
        const plan = Array.isArray(data.data?.plans)
          ? data.data.plans.find(p => p.planId === paymentFields.feesScheme)
          : null;


        if (plan && Array.isArray(plan.rules) && plan.rules.length > 0 && price > 0) {
          const newInstallments = plan.rules.map(rule => {
            const baseDate = new Date(paymentFields.date);
            baseDate.setMonth(baseDate.getMonth() + (rule.interval || 0));
            return {
              amount: Math.round((price * rule.weightage) / 100),
              dueDate: baseDate.toISOString().slice(0, 10),
              status: 'PENDING',
              name: `Installment ${rule.installment}`,
              weightage: rule.weightage,
              interval: rule.interval
            };
          });
          setInstallments(newInstallments);
        } else {
          setInstallments([]);
        }
      })
      .catch((error) => {
        console.error('Error fetching pricing details:', error); // Debug log
        setInstallments([]);
      });
  }, [selectedCourseId, selectedBundleId, paymentFields.feesScheme, paymentFields.date, token]);

  // --- Table rendering (replace old table) ---
  const handleDueDateChange = (idx, date) => {
    // Validation: Ensure due date is not earlier than or equal to previous installment
    if (idx > 0) {
      const previousInstallment = installments[idx - 1];
      if (previousInstallment.dueDate && date <= previousInstallment.dueDate) {
        toast.error(`Due date must be at least 1 day after the previous installment (${previousInstallment.dueDate})`);
        return;
      }
    }

    // Validation: Ensure due date is not later than or equal to next installment (if exists)
    if (idx < installments.length - 1) {
      const nextInstallment = installments[idx + 1];
      if (nextInstallment.dueDate && date >= nextInstallment.dueDate) {
        toast.error(`Due date must be at least 1 day before the next installment (${nextInstallment.dueDate})`);
        return;
      }
    }

    setInstallments(insts => insts.map((inst, i) => i === idx ? { ...inst, dueDate: date } : inst));
  };

  const handleRemoveInstallment = (idx) => {
    setInstallments(insts => insts.filter((_, i) => i !== idx));
  };

  {installments.length > 0 && (
    <InstallmentsTable
      installments={installments}
      onDueDateChange={handleDueDateChange}
      setInstallments={setInstallments}
      selectedCourseId={selectedCourseId}
    />
  )}

  // Add installment
  const handleAddInstallment = () => {
    const n = installments.length + 1;
    const split = Array(n).fill(0).map((_, i) => Math.round((coursePrice / n) * 100) / 100);
    // Adjust last installment to fix rounding
    const sum = split.reduce((a, b) => a + b, 0);
    split[split.length - 1] += +(coursePrice - sum).toFixed(2);

    // Calculate due dates ensuring they are sequential with at least 1 day gap
    const newInstallments = split.map((amt, i) => {
      let dueDate;
      if (i === 0) {
        // First installment uses the payment date
        dueDate = addMonths(paymentFields.date, i);
      } else {
        // Subsequent installments must be at least 1 day after the previous one
        const previousDueDate = installments[i - 1]?.dueDate;
        if (previousDueDate) {
          // Add at least 1 day to the previous due date (minimum gap)
          dueDate = addDays(previousDueDate, 1);
        } else {
          // Fallback to original logic
          dueDate = addMonths(paymentFields.date, i);
        }
      }

      return {
        amount: amt,
        dueDate: dueDate,
        status: 'PENDING' 
      };
    });

    setInstallments(newInstallments);
  };

  // Remove installment


  // Calculate summary
  const totalPreGST = installments.reduce((sum, inst) => sum + calcPreGST(inst.amount), 0).toFixed(2);
  const totalGST = installments.reduce((sum, inst) => sum + calcGST(inst.amount), 0).toFixed(2);
  const total = installments.reduce((sum, inst) => sum + Number(inst.amount), 0).toFixed(2);

  // Helper to update all installments with user ID
  const updateInstallmentsWithUserId = (userId) => {
    setInstallments(insts => insts.map(inst => ({
        ...inst,
      user: { id: userId }
    })));
  };

  // After user existence check (existing user found):
  // Call this after fetching userId from backend
  const handleUserExists = (userId) => {
    setEnrollingUserId(userId);
    updateInstallmentsWithUserId(userId);
  };

  // After successful registration (new user):
  // Call this after getting userId from registration response
  const handleRegister = async () => {
    const formData = new FormData();
    formData.append("name", registerFields.name);
    formData.append("email", registerFields.email);
    formData.append(
      "phoneNumber",
      contactMethod === "Mobile"
        ? contactValue.replace(/\D/g, '').slice(-10)
        : ""
    );
    formData.append("password", registerFields.password);
    formData.append("role", "STUDENT");
    formData.append("gender", "");
    formData.append("profileImage", new Blob(), "default.png");
    const regRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/user/register`, {
      method: "POST",
      body: formData,
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!regRes.ok) {
      const errorText = await regRes.text();
      if (regRes.status === 409) {
        toast.error("User already exists. Please use a different email or phone number.");
        setLoading(false);
        return;
      }
      toast.error(errorText || "Registration failed");
      throw new Error("Registration failed");
    }
    const regData = await regRes.json();
    const userId = regData.id || regData.data?.id;
    if (!userId) {
      toast.error('Registration succeeded but user ID not returned.');
      return;
    }
    setEnrollingUserId(userId);
    updateInstallmentsWithUserId(userId);
    // proceed to enrollment/payment
  };

  // Fetch payment plans when course or bundle changes
  useEffect(() => {
    const selectedId = enrollmentType === "course" ? selectedCourseId : selectedBundleId;
    if (!selectedId || !token) {
      setPaymentPlans([]);
      setPaymentFields(f => ({ ...f, feesScheme: '' }));
      return;
    }

    const endpoint = enrollmentType === "course" 
        ? `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses/${selectedId}/pricing-details`
      : `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/course-bundles/${selectedId}/pricing-details`;

    fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        let plans = [];
        if (data.data && Array.isArray(data.data.plans)) {
          plans = data.data.plans;
        }
        setPaymentPlans(plans);
        // Reset feesScheme if current is not in new plans
        if (!plans.some(p => p.planId === paymentFields.feesScheme)) {
          setPaymentFields(f => ({ ...f, feesScheme: '' }));
        }
      })
      .catch(() => setPaymentPlans([]));
  }, [enrollmentType, selectedCourseId, selectedBundleId, token]);

  // UI
  useEffect(() => {
    if (prefillEmail) {
      setContactMethod('Email');
      setContactValue(prefillEmail);
    } else if (prefillPhone) {
      setContactMethod('Mobile');
      setContactValue(prefillPhone);
    }
  }, [prefillEmail, prefillPhone]);

  // Password validation regex
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  return (
    <div className="min-h-screen bg-white px-4 py-4 font-sans text-[15px]">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Enter Enrollment Details</h2>
        
        {/* Row 1: Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Method *</label>
                <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors h-9"
                  value={contactMethod}
              onChange={e => setContactMethod(e.target.value)}
                >
                  <option value="Mobile">Mobile Number</option>
                  <option value="Email">Email Address</option>
                </select>
              </div>

              <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                  {contactMethod === "Mobile" ? "Mobile Number" : "Email Address"} *
                </label>
                {contactMethod === "Mobile" ? (
                  <MobileInputWithSuggestions
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors h-9"
                    value={contactValue}
                    onChange={setContactValue}
                    placeholder="Enter 10-digit mobile number"
                  />
                ) : (
                  <input
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors h-9"
                    type="email"
                    value={contactValue}
                onChange={e => setContactValue(e.target.value)}
                    placeholder="Enter email address"
                  />
                )}
          </div>
        </div>

        {/* Row 2: Enrollment Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Type *</label>
              <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors h-9"
                value={enrollmentType}
              onChange={e => setEnrollmentType(e.target.value)}
              >
                <option value="bundle">Bundle</option>
                <option value="course">Course</option>
              </select>
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {enrollmentType === "bundle" ? "Bundle" : "Course"} *
              </label>
              {enrollmentType === "bundle" ? (
                <Select
                  classNamePrefix="react-select"
                options={Array.isArray(bundles) ? bundles.map(b => ({ value: b.bundleId, label: b.title || 'Unknown Bundle' })) : []}
                value={Array.isArray(bundles) ? bundles.map(b => ({ value: b.bundleId, label: b.title || 'Unknown Bundle' })).find(opt => opt.value === selectedBundleId) : null}
                  onChange={handleBundleSelection}
                  placeholder="Select bundle"
                  isClearable
                  styles={{
                    control: (base, state) => ({
                      ...base,
                    minHeight: '36px',
                    height: '36px',
                    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                    borderRadius: '6px',
                    boxShadow: state.isFocused ? '0 0 0 1px #dbeafe' : 'none',
                    '&:hover': { borderColor: '#3b82f6' },
                    fontSize: '0.875rem',
                    padding: '0 8px',
                    }),
                  menu: base => ({ ...base, zIndex: 9999 }),
                  placeholder: base => ({ ...base, color: '#9ca3af' }),
                  }}
                />
              ) : (
                <Select
                  classNamePrefix="react-select"
                options={Array.isArray(courses) ? courses.map(c => ({ value: c.courseId || c.course_id || c.id, label: c.title || c.name || 'Unknown Course' })) : []}
                value={Array.isArray(courses) ? courses.map(c => ({ value: c.courseId || c.course_id || c.id, label: c.title || c.name || 'Unknown Course' })).find(opt => opt.value === selectedCourseId) : null}
                  onChange={handleCourseSelection}
                  placeholder="Select course"
                  isClearable
                  styles={{
                    control: (base, state) => ({
                      ...base,
                    minHeight: '36px',
                    height: '36px',
                    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                    borderRadius: '6px',
                    boxShadow: state.isFocused ? '0 0 0 1px #dbeafe' : 'none',
                    '&:hover': { borderColor: '#3b82f6' },
                    fontSize: '0.875rem',
                    padding: '0 8px',
                    }),
                  menu: base => ({ ...base, zIndex: 9999 }),
                  placeholder: base => ({ ...base, color: '#9ca3af' }),
                  }}
                />
              )}
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch {(selectedCourseId || selectedBundleId) && batches.length > 0 && `(${batches.length} available)`}
              {loadingBatches && <span className="text-blue-600 ml-2">Loading...</span>}
              </label>
              <Select
                classNamePrefix="react-select"
              options={Array.isArray(batches) ? batches.map(b => ({ value: b.batchId || b.batch_id || b.id, label: b.batchName || b.batch_name || b.name || 'Unknown Batch' })) : []}
              value={Array.isArray(batches) ? batches.map(b => ({ value: b.batchId || b.batch_id || b.id, label: b.batchName || b.batch_name || b.name || 'Unknown Batch' })).find(opt => opt.value === selectedBatchId) : null}
              onChange={opt => setSelectedBatchId(opt ? opt.value : '')}
              placeholder={loadingBatches ? "Loading batches..." : ((selectedCourseId || selectedBundleId) ? (batches.length > 0 ? "Select batch" : `No batches available for this ${enrollmentType}`) : `Select a ${enrollmentType} first`)}
                isDisabled={!(selectedCourseId || selectedBundleId) || loadingBatches}
                isClearable={(selectedCourseId || selectedBundleId) && batches.length > 0}
                styles={{
                  control: (base, state) => ({
                    ...base,
                  minHeight: '36px',
                  height: '36px',
                  borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                  borderRadius: '6px',
                  boxShadow: state.isFocused ? '0 0 0 1px #dbeafe' : 'none',
                  '&:hover': { borderColor: '#3b82f6' },
                  fontSize: '0.875rem',
                  padding: '0 8px',
                  backgroundColor: !(selectedCourseId || selectedBundleId) ? '#f9fafb' : 'white',
                  }),
                menu: base => ({ ...base, zIndex: 9999 }),
                placeholder: base => ({ ...base, color: '#9ca3af' }),
                }}
              />
              {(selectedCourseId || selectedBundleId) && batches.length === 0 && (
              <p className="text-sm text-orange-600 mt-1">No batches available for the selected {enrollmentType}</p>
              )}
          </div>
        </div>

        {/* Proceed Button */}
        <div className="flex justify-start">
          <button
            type="button"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)';
              e.target.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.3)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
              e.target.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.2)';
              e.target.style.transform = 'translateY(0)';
            }}
            onClick={handleProceed}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Proceed'}
          </button>
        </div>
        </div>

      {/* Only show additional fields after Proceed is clicked */}
        {proceedClicked && userExists !== null && (
          <>
          {/* If user does not exist, show registration fields (Name, pre-filled email/mobile, Password, Reg No.), then Payments */}
          {userExists === false && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:border-blue-500"
                      type="text"
                      value={registerFields.name}
                    onChange={e => setRegisterFields(f => ({ ...f, name: e.target.value }))}
                    placeholder="Enter name"
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{contactMethod === 'Mobile' ? 'Mobile number' : 'Email address'}</label>
                    <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 focus:border-blue-500"
                    type={contactMethod === 'Mobile' ? 'text' : 'email'}
                      value={contactValue}
                      readOnly
                    placeholder={contactMethod === 'Mobile' ? 'e.g. +91 9876543210' : 'user@email.com'}
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{contactMethod === 'Mobile' ? 'Email address' : 'Mobile number'} *</label>
                    <input
                    className={`w-full border rounded-md px-3 py-2 text-sm bg-white focus:border-blue-500 ${
                      contactMethod === 'Email' && registerFields.email && !isValidMobile(registerFields.email) 
                        ? 'border-red-500' 
                        : 'border-gray-300'
                      }`}
                    type={contactMethod === 'Mobile' ? 'email' : 'text'}
                      value={registerFields.email}
                    onChange={e => {
                      const value = e.target.value;
                      if (contactMethod === 'Email') {
                          // For mobile number field, only allow digits and limit to 10 characters
                        const digitsOnly = value.replace(/\D/g, '');
                        const limitedValue = digitsOnly.slice(0, 10);
                        setRegisterFields(f => ({ ...f, email: limitedValue }));
                        } else {
                          // For email field, allow normal input
                        setRegisterFields(f => ({ ...f, email: value }));
                        }
                      }}
                    placeholder={contactMethod === 'Mobile' ? 'user@email.com' : 'e.g. +91 9876543210'}
                    />
                  {contactMethod === 'Email' && registerFields.email && !isValidMobile(registerFields.email) && (
                    <p className="text-xs text-red-500 mt-1">Mobile number must be exactly 10 digits</p>
                    )}
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Set Password</label>
                    <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:border-blue-500"
                      type="password"
                      value={registerFields.password}
                    onChange={e => setRegisterFields(f => ({ ...f, password: e.target.value }))}
                    placeholder="Set password"
                    />
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters, include 1 uppercase, 1 lowercase, 1 digit, and 1 symbol.</p>
                  </div>
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration no.</label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:border-blue-500"
                    type="text"
                    value={registerFields.regNo}
                    onChange={e => setRegisterFields(f => ({ ...f, regNo: e.target.value }))}
                    placeholder="Enter registration number"
                  />
                </div> */}
                </div>
              {/* Payments Section for new user */}
              <div className="mt-2 mb-2">
                <h3 className="font-semibold mb-2 text-sm">Payments</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of enrollment *</label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:border-blue-500"
                      type="date"
                      value={paymentFields.date}
                      onChange={e => setPaymentFields(f => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 focus:border-blue-500"
                      type="text"
                      value="INR"
                      readOnly
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fees scheme *</label>
                    <Select
                      classNamePrefix="react-select"
                      options={paymentPlans.map(plan => ({ value: plan.planId, label: plan.name }))}
                      value={paymentPlans.map(plan => ({ value: plan.planId, label: plan.name })).find(opt => opt.value === paymentFields.feesScheme) || null}
                      onChange={opt => setPaymentFields(f => ({ ...f, feesScheme: opt ? opt.value : '' }))}
                      placeholder="Select fees scheme"
                      isClearable
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          minHeight: '40px',
                          borderColor: state.isFocused ? '#2563eb' : '#d1d5db',
                          boxShadow: state.isFocused ? '0 0 0 1px #2563eb' : 'none',
                          '&:hover': { borderColor: '#2563eb' },
                          fontSize: '0.95rem',
                        }),
                        menu: base => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Place of Supply</label>
                    <Select
                      classNamePrefix="react-select"
                      options={[
                        { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
                        { value: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
                        { value: 'Assam', label: 'Assam' },
                        { value: 'Bihar', label: 'Bihar' },
                        { value: 'Chhattisgarh', label: 'Chhattisgarh' },
                        { value: 'Goa', label: 'Goa' },
                        { value: 'Gujarat', label: 'Gujarat' },
                        { value: 'Haryana', label: 'Haryana' },
                        { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
                        { value: 'Jharkhand', label: 'Jharkhand' },
                        { value: 'Karnataka', label: 'Karnataka' },
                        { value: 'Kerala', label: 'Kerala' },
                        { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
                        { value: 'Maharashtra', label: 'Maharashtra' },
                        { value: 'Manipur', label: 'Manipur' },
                        { value: 'Meghalaya', label: 'Meghalaya' },
                        { value: 'Mizoram', label: 'Mizoram' },
                        { value: 'Nagaland', label: 'Nagaland' },
                        { value: 'Odisha', label: 'Odisha' },
                        { value: 'Punjab', label: 'Punjab' },
                        { value: 'Rajasthan', label: 'Rajasthan' },
                        { value: 'Sikkim', label: 'Sikkim' },
                        { value: 'Tamil Nadu', label: 'Tamil Nadu' },
                        { value: 'Telangana', label: 'Telangana' },
                        { value: 'Tripura', label: 'Tripura' },
                        { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
                        { value: 'Uttarakhand', label: 'Uttarakhand' },
                        { value: 'West Bengal', label: 'West Bengal' },
                        { value: 'Andaman and Nicobar Islands', label: 'Andaman and Nicobar Islands' },
                        { value: 'Chandigarh', label: 'Chandigarh' },
                        { value: 'Dadra and Nagar Haveli and Daman and Diu', label: 'Dadra and Nagar Haveli and Daman and Diu' },
                        { value: 'Delhi', label: 'Delhi' },
                        { value: 'Jammu and Kashmir', label: 'Jammu and Kashmir' },
                        { value: 'Ladakh', label: 'Ladakh' },
                        { value: 'Lakshadweep', label: 'Lakshadweep' },
                        { value: 'Puducherry', label: 'Puducherry' }
                      ]}
                      value={[
                        { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
                        { value: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
                        { value: 'Assam', label: 'Assam' },
                        { value: 'Bihar', label: 'Bihar' },
                        { value: 'Chhattisgarh', label: 'Chhattisgarh' },
                        { value: 'Goa', label: 'Goa' },
                        { value: 'Gujarat', label: 'Gujarat' },
                        { value: 'Haryana', label: 'Haryana' },
                        { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
                        { value: 'Jharkhand', label: 'Jharkhand' },
                        { value: 'Karnataka', label: 'Karnataka' },
                        { value: 'Kerala', label: 'Kerala' },
                        { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
                        { value: 'Maharashtra', label: 'Maharashtra' },
                        { value: 'Manipur', label: 'Manipur' },
                        { value: 'Meghalaya', label: 'Meghalaya' },
                        { value: 'Mizoram', label: 'Mizoram' },
                        { value: 'Nagaland', label: 'Nagaland' },
                        { value: 'Odisha', label: 'Odisha' },
                        { value: 'Punjab', label: 'Punjab' },
                        { value: 'Rajasthan', label: 'Rajasthan' },
                        { value: 'Sikkim', label: 'Sikkim' },
                        { value: 'Tamil Nadu', label: 'Tamil Nadu' },
                        { value: 'Telangana', label: 'Telangana' },
                        { value: 'Tripura', label: 'Tripura' },
                        { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
                        { value: 'Uttarakhand', label: 'Uttarakhand' },
                        { value: 'West Bengal', label: 'West Bengal' },
                        { value: 'Andaman and Nicobar Islands', label: 'Andaman and Nicobar Islands' },
                        { value: 'Chandigarh', label: 'Chandigarh' },
                        { value: 'Dadra and Nagar Haveli and Daman and Diu', label: 'Dadra and Nagar Haveli and Daman and Diu' },
                        { value: 'Delhi', label: 'Delhi' },
                        { value: 'Jammu and Kashmir', label: 'Jammu and Kashmir' },
                        { value: 'Ladakh', label: 'Ladakh' },
                        { value: 'Lakshadweep', label: 'Lakshadweep' },
                        { value: 'Puducherry', label: 'Puducherry' }
                      ].find(opt => opt.value === paymentFields.place) || null}
                      onChange={opt => setPaymentFields(f => ({ ...f, place: opt ? opt.value : '' }))}
                      placeholder="Select place of supply"
                      isClearable
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          minHeight: '40px',
                          borderColor: state.isFocused ? '#2563eb' : '#d1d5db',
                          boxShadow: state.isFocused ? '0 0 0 1px #2563eb' : 'none',
                          '&:hover': { borderColor: '#2563eb' },
                          fontSize: '0.95rem',
                        }),
                        menu: base => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          {/* If user exists, only show pre-filled, read-only name and payments section */}
          {userExists === true && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 focus:border-blue-500"
                    type="text"
                    value={existingUser?.name || ""}
                    readOnly
                  />
            </div>
              </div>
              {/* Payments Section for existing user */}
              <div className="mt-2 mb-2">
                <h3 className="font-semibold mb-2 text-sm">Payments</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of enrollment *</label>
                  <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:border-blue-500"
                    type="date"
                    value={paymentFields.date}
                      onChange={e => setPaymentFields(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                  <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 focus:border-blue-500"
                    type="text"
                    value="INR"
                    readOnly
                    disabled
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fees scheme *</label>
                  <Select
                    classNamePrefix="react-select"
                      options={paymentPlans.map(plan => ({ value: plan.planId, label: plan.name }))}
                      value={paymentPlans.map(plan => ({ value: plan.planId, label: plan.name })).find(opt => opt.value === paymentFields.feesScheme) || null}
                      onChange={opt => setPaymentFields(f => ({ ...f, feesScheme: opt ? opt.value : '' }))}
                    placeholder="Select fees scheme"
                    isClearable
                    styles={{
                      control: (base, state) => ({
                        ...base,
                          minHeight: '40px',
                          borderColor: state.isFocused ? '#2563eb' : '#d1d5db',
                          boxShadow: state.isFocused ? '0 0 0 1px #2563eb' : 'none',
                          '&:hover': { borderColor: '#2563eb' },
                          fontSize: '0.95rem',
                      }),
                        menu: base => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Place of Supply</label>
                  <Select
                    classNamePrefix="react-select"
                    options={[
                        { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
                        { value: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
                        { value: 'Assam', label: 'Assam' },
                        { value: 'Bihar', label: 'Bihar' },
                        { value: 'Chhattisgarh', label: 'Chhattisgarh' },
                        { value: 'Goa', label: 'Goa' },
                        { value: 'Gujarat', label: 'Gujarat' },
                        { value: 'Haryana', label: 'Haryana' },
                        { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
                        { value: 'Jharkhand', label: 'Jharkhand' },
                        { value: 'Karnataka', label: 'Karnataka' },
                        { value: 'Kerala', label: 'Kerala' },
                        { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
                        { value: 'Maharashtra', label: 'Maharashtra' },
                        { value: 'Manipur', label: 'Manipur' },
                        { value: 'Meghalaya', label: 'Meghalaya' },
                        { value: 'Mizoram', label: 'Mizoram' },
                        { value: 'Nagaland', label: 'Nagaland' },
                        { value: 'Odisha', label: 'Odisha' },
                        { value: 'Punjab', label: 'Punjab' },
                        { value: 'Rajasthan', label: 'Rajasthan' },
                        { value: 'Sikkim', label: 'Sikkim' },
                        { value: 'Tamil Nadu', label: 'Tamil Nadu' },
                        { value: 'Telangana', label: 'Telangana' },
                        { value: 'Tripura', label: 'Tripura' },
                        { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
                        { value: 'Uttarakhand', label: 'Uttarakhand' },
                        { value: 'West Bengal', label: 'West Bengal' },
                        { value: 'Andaman and Nicobar Islands', label: 'Andaman and Nicobar Islands' },
                        { value: 'Chandigarh', label: 'Chandigarh' },
                        { value: 'Dadra and Nagar Haveli and Daman and Diu', label: 'Dadra and Nagar Haveli and Daman and Diu' },
                        { value: 'Delhi', label: 'Delhi' },
                        { value: 'Jammu and Kashmir', label: 'Jammu and Kashmir' },
                        { value: 'Ladakh', label: 'Ladakh' },
                        { value: 'Lakshadweep', label: 'Lakshadweep' },
                        { value: 'Puducherry', label: 'Puducherry' }
                    ]}
                      value={[
                        { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
                        { value: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
                        { value: 'Assam', label: 'Assam' },
                        { value: 'Bihar', label: 'Bihar' },
                        { value: 'Chhattisgarh', label: 'Chhattisgarh' },
                        { value: 'Goa', label: 'Goa' },
                        { value: 'Gujarat', label: 'Gujarat' },
                        { value: 'Haryana', label: 'Haryana' },
                        { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
                        { value: 'Jharkhand', label: 'Jharkhand' },
                        { value: 'Karnataka', label: 'Karnataka' },
                        { value: 'Kerala', label: 'Kerala' },
                        { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
                        { value: 'Maharashtra', label: 'Maharashtra' },
                        { value: 'Manipur', label: 'Manipur' },
                        { value: 'Meghalaya', label: 'Meghalaya' },
                        { value: 'Mizoram', label: 'Mizoram' },
                        { value: 'Nagaland', label: 'Nagaland' },
                        { value: 'Odisha', label: 'Odisha' },
                        { value: 'Punjab', label: 'Punjab' },
                        { value: 'Rajasthan', label: 'Rajasthan' },
                        { value: 'Sikkim', label: 'Sikkim' },
                        { value: 'Tamil Nadu', label: 'Tamil Nadu' },
                        { value: 'Telangana', label: 'Telangana' },
                        { value: 'Tripura', label: 'Tripura' },
                        { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
                        { value: 'Uttarakhand', label: 'Uttarakhand' },
                        { value: 'West Bengal', label: 'West Bengal' },
                        { value: 'Andaman and Nicobar Islands', label: 'Andaman and Nicobar Islands' },
                        { value: 'Chandigarh', label: 'Chandigarh' },
                        { value: 'Dadra and Nagar Haveli and Daman and Diu', label: 'Dadra and Nagar Haveli and Daman and Diu' },
                        { value: 'Delhi', label: 'Delhi' },
                        { value: 'Jammu and Kashmir', label: 'Jammu and Kashmir' },
                        { value: 'Ladakh', label: 'Ladakh' },
                        { value: 'Lakshadweep', label: 'Lakshadweep' },
                        { value: 'Puducherry', label: 'Puducherry' }
                      ].find(opt => opt.value === paymentFields.place) || null}
                      onChange={opt => setPaymentFields(f => ({ ...f, place: opt ? opt.value : '' }))}
                    placeholder="Select place of supply"
                    isClearable
                    styles={{
                      control: (base, state) => ({
                        ...base,
                          minHeight: '40px',
                          borderColor: state.isFocused ? '#2563eb' : '#d1d5db',
                          boxShadow: state.isFocused ? '0 0 0 1px #2563eb' : 'none',
                          '&:hover': { borderColor: '#2563eb' },
                          fontSize: '0.95rem',
                      }),
                        menu: base => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                </div>
              </div>
            </div>
            </>
          )}

          {/* --- Payment Installments Section --- */}
          {/* Show InstallmentsTable and/or Payment Summary when course/bundle and fees scheme are selected */}
          {(selectedCourseId || selectedBundleId) && paymentFields.feesScheme ? (
            <>

              {/* Always show InstallmentsTable so admin can add installments if desired */}
              <InstallmentsTable
                installments={installments}
                onDueDateChange={handleDueDateChange}
                setInstallments={setInstallments}
                selectedCourseId={selectedCourseId}
                handleEnroll={handleEnroll}
                loading={loading}
              />

              {/* Show Payment Summary always if a plan is selected (including Full Payment) */}
              <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  {/* Summary (Left) */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {(() => {
                      // If installments exist, use their sum; otherwise, show the course/bundle price
                      let total = (installments || []).reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0);
                      if (total === 0) {
                        // Find selected course or bundle price
                        let price = 0;
                        if (enrollmentType === "course" && selectedCourseId) {
                          const selectedCourse = courses.find(c => (c.courseId || c.course_id || c.id) === selectedCourseId);
                          if (selectedCourse && selectedCourse.price) price = Number(selectedCourse.price);
                        } else if (enrollmentType === "bundle" && selectedBundleId) {
                          const selectedBundle = bundles.find(b => b.bundleId === selectedBundleId);
                          if (selectedBundle && selectedBundle.price) price = Number(selectedBundle.price);
                        }
                        total = price;
                      }
                      const preGst = total / 1.18;
                      const gst = total - preGst;
                      return (
                        <>
                          <div className="text-gray-500 font-medium">Subtotal (Pre-GST)</div>
                          <div className="font-semibold text-gray-900">₹{preGst.toFixed(2)}</div>
                          <div className="text-gray-500 font-medium">GST (18%)</div>
                          <div className="font-semibold text-orange-600">₹{gst.toFixed(2)}</div>
                          <div className="text-gray-700 font-semibold">Total</div>
                          <div className="text-gray-900 font-bold text-base">₹{total.toFixed(2)}</div>
                        </>
                      );
                    })()}
                  </div>

                  {/* CTA (Right) */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleEnroll}
                      disabled={loading}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        "Enroll Learner"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : null}


        </>
      )}
    </div>
  );
};

export default SingleEnrollment;