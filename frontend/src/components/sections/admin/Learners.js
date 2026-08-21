'use client';

import { useEffect, useState, useRef } from 'react';
import { MoreVertical, Search, ChevronDown, Download, Filter, X, KeyRound } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import ReactDOM from 'react-dom';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { useCallback } from 'react';

function ActionDropdownMenu({ anchorRef, open, onClose, children, menuRef }) {
  const [menuStyle, setMenuStyle] = useState({});

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const menuWidth = 180; // Approximate width of the menu
    const margin = 8;
    let left = rect.left + margin;
    let top = rect.bottom + 4;
    // If menu would overflow right, open to the left
    if (left + menuWidth > window.innerWidth) {
      left = rect.right - menuWidth - margin;
      if (left < margin) left = margin; // Don't go off the left edge
    }
    setMenuStyle({
      position: 'fixed',
      top,
      left,
      zIndex: 9999,
      background: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      borderRadius: 12,
      minWidth: menuWidth,
      border: '1px solid #e5e7eb',
      padding: '8px 0',
    });
  }, [open, anchorRef]);

  if (!open || !anchorRef.current) return null;
  return ReactDOM.createPortal(
    <div ref={menuRef} style={menuStyle}>
      {children}
    </div>,
    document.body
  );
}

export default function LearnersTable() {
  const [learners, setLearners] = useState([]);
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Learners');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedLearners, setSelectedLearners] = useState([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterValues, setFilterValues] = useState({
    name: '',
    email: '',
    phone: '',
    registrationNo: '',
    relativeDate: '', // e.g., '7d', '30d', '90d', '6m', '1y'
  });
  const router = useRouter();
  const dropdownRef = useRef();
  const actionDropdownRefs = useRef([]);
  const actionDropdownMenuRefs = useRef([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarData, setSidebarData] = useState(null);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [sidebarError, setSidebarError] = useState(null);
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [learnerToResetPassword, setLearnerToResetPassword] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [confirmResetPasswordValue, setConfirmResetPasswordValue] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [serverTotalElements, setServerTotalElements] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(0);

  // Helper to fetch learners by status using correct backend endpoints with server-side pagination
  const fetchLearnersByStatus = useCallback(async (status, page = 0, size = 10) => {
    const token = Cookies.get("accessToken");
    if (!token) return;
    let url = '';
    let statusValue = '';
    switch (status) {
      case 'Registered':
        url = `/api/admin/getregisteredstudents?page=${page}&size=${size}`;
        statusValue = 'REGISTERED';
        break;
      case 'Admitted':
        url = `/api/admin/getadmittedstudents?page=${page}&size=${size}`;
        statusValue = 'ADMITTED';
        break;
      case 'Archived':
        url = `/api/admin/getarchivedstudents?page=${page}&size=${size}`;
        statusValue = 'ARCHIVED';
        break;
      default:
        url = `/api/admin/getstudents?page=${page}&size=${size}`;
        statusValue = '';
        break;
    }
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}${url}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      let content = [];
      let totalElements = 0;
      let totalPagesCount = 0;
      if (data?.content && Array.isArray(data.content)) {
        content = data.content;
        totalElements = data.totalElements || 0;
        totalPagesCount = data.totalPages || 0;
      } else if (data?.data?.content && Array.isArray(data.data.content)) {
        content = data.data.content;
        totalElements = data.data.totalElements || 0;
        totalPagesCount = data.data.totalPages || 0;
      } else if (Array.isArray(data?.data)) {
        content = data.data;
        totalElements = data.data.length;
        totalPagesCount = 1;
      } else if (Array.isArray(data)) {
        content = data;
        totalElements = data.length;
        totalPagesCount = 1;
      }
      if (statusValue) {
        content = content.map(l => ({ ...l, status: statusValue }));
      }
      setLearners(content);
      setServerTotalElements(totalElements);
      setServerTotalPages(totalPagesCount);
    } catch (err) {
      setLearners([]);
      setServerTotalElements(0);
      setServerTotalPages(0);
    }
  }, []);

  // Helper to fetch learners by courseId and optional batchId
  const fetchLearnersByCourseAndBatch = async (courseId, batchId) => {
    const token = Cookies.get("accessToken");
    if (!token) return;
    let url = '/api/courses/learners?';
    if (courseId) url += `courseId=${courseId}`;
    if (batchId) url += `${courseId ? '&' : ''}batchId=${batchId}`;
    if (!courseId && !batchId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}${url}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLearners(data);
      } else if (Array.isArray(data.data)) {
        setLearners(data.data);
      } else if (Array.isArray(data.data?.content)) {
        setLearners(data.data.content);
      } else if (data.data) {
        setLearners([data.data]);
      } else {
        setLearners([]);
      }
    } catch (err) {
      setLearners([]);
    }
  };

  // Fetch learners whenever status, page, or page size changes
  useEffect(() => {
    fetchLearnersByStatus(statusFilter, currentPage - 1, rowsPerPage);
  }, [statusFilter, currentPage, rowsPerPage, fetchLearnersByStatus]);

  useEffect(() => {
    if (!showStatusDropdown) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStatusDropdown]);

  useEffect(() => {
    if (openDropdownIndex === null) return;
    function handleClickOutside(event) {
      const anchor = actionDropdownRefs.current[openDropdownIndex];
      const menu = actionDropdownMenuRefs.current[openDropdownIndex];
      if (
        anchor &&
        !anchor.contains(event.target) &&
        menu &&
        !menu.contains(event.target)
      ) {
        setOpenDropdownIndex(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownIndex]);

  // Sort learners by date (createdAt or dateAdded) descending
  const sortedLearners = [...learners].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.dateAdded || 0);
    const dateB = new Date(b.createdAt || b.dateAdded || 0);
    return dateB - dateA;
  });

  const filteredLearners = sortedLearners.filter(learner => {
    const keyword = searchTerm.toLowerCase();
    // Fix: status filter logic
    let statusMatch = true;
    if (statusFilter !== 'All Learners') {
      statusMatch = (learner.status || '').toLowerCase() === statusFilter.toLowerCase();
    } else {
      // For "All Learners", exclude archived learners
      statusMatch = (learner.status || '').toLowerCase() !== 'archived';
    }
    // Panel filters
    const nameMatch = filterValues.name ? (learner.name?.toLowerCase().includes(filterValues.name.toLowerCase())) : true;
    const emailMatch = filterValues.email ? (learner.email?.toLowerCase().includes(filterValues.email.toLowerCase())) : true;
    const phoneMatch = filterValues.phone ? (String(learner.phone).includes(filterValues.phone)) : true;
    const regNoMatch = filterValues.registrationNo
      ? (
          (learner.registrationNo && learner.registrationNo.toLowerCase().includes(filterValues.registrationNo.toLowerCase())) ||
          (learner.abcId && learner.abcId.toLowerCase().includes(filterValues.registrationNo.toLowerCase()))
        )
      : true;
    const batchMatch = true;
    const courseMatch = true;
    let relativeDateMatch = true;
    const learnerDate = new Date(learner.createdAt || learner.dateAdded);
    if (filterValues.relativeDate) {
      const now = new Date();
      let compareDate = new Date();
      if (filterValues.relativeDate.endsWith('d')) {
        compareDate.setDate(now.getDate() - parseInt(filterValues.relativeDate));
      } else if (filterValues.relativeDate.endsWith('m')) {
        compareDate.setMonth(now.getMonth() - parseInt(filterValues.relativeDate));
      } else if (filterValues.relativeDate.endsWith('y')) {
        compareDate.setFullYear(now.getFullYear() - parseInt(filterValues.relativeDate));
      }
      relativeDateMatch = learnerDate >= compareDate;
    }
    return (
      statusMatch &&
      nameMatch &&
      emailMatch &&
      phoneMatch &&
      regNoMatch &&
      relativeDateMatch &&
      ((learner.name?.toLowerCase().includes(keyword) || '') ||
      (learner.email?.toLowerCase().includes(keyword) || '') ||
      (String(learner.phone).includes(keyword) || ''))
    );
  });

  const handleSelectAll = () => {
    if (selectedLearners.length === filteredLearners.length) {
      setSelectedLearners([]);
    } else {
      setSelectedLearners(filteredLearners.map((_, index) => index));
    }
  };

  const handleSelectLearner = (index) => {
    setSelectedLearners(prev => 
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleRowClick = (learner) => {
    router.push(`learners/${learner.id}`);
  };

  // Calculate the number of active filters (non-empty fields)
  const activeFilterCount = Object.values(filterValues).filter(v => v && v !== '').length;

  // Export filtered learners to Excel
  const handleExport = () => {
    if (filteredLearners.length === 0) return;
    const exportData = filteredLearners.map(l => ({
      Name: l.name,
      Email: l.email,
      Phone: l.phone,
      Status: l.status,
      'Registration No.': l.abcId ?? l.registrationNo ?? '',
      'Date Added': l.createdAt
        ? (() => {
            let dateStr = l.createdAt;
            if (typeof dateStr === 'string' && dateStr.includes('.')) dateStr = dateStr.split('.')[0];
            const d = new Date(dateStr);
            return isNaN(d) ? '' : d.toLocaleDateString('en-GB');
          })()
        : l.dateAdded
        ? new Date(l.dateAdded).toLocaleDateString('en-GB')
        : '',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Learners');
    XLSX.writeFile(wb, 'learners_export.xlsx');
  };

  // Use server-side pagination totals; apply client-side search/filter on top of current page
  const totalRows = serverTotalElements;
  const totalPages = serverTotalPages || 1;
  const paginatedLearners = filteredLearners;

  // Reset to page 1 when search/filter panel values change (status/rowsPerPage handled by main effect)
  useEffect(() => { setCurrentPage(1); }, [filterValues, searchTerm]);

  // Fetch all courses and batches when filter panel is opened
  useEffect(() => {
    if (!showFilterPanel) return;
    const token = Cookies.get('accessToken');
    if (!token) return;
    // Fetch courses
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        let courses = [];
        if (Array.isArray(data.data?.content)) courses = data.data.content;
        else if (Array.isArray(data.data)) courses = data.data;
        else if (Array.isArray(data)) courses = data;
        setAllCourses(courses);
      });
    // Fetch batches
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/batches`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        let batches = [];
        if (Array.isArray(data.data?.content)) batches = data.data.content;
        else if (Array.isArray(data.data)) batches = data.data;
        else if (Array.isArray(data)) batches = data;
        setAllBatches(batches);
      });
  }, [showFilterPanel]);

  // For the filter dropdowns, use allCourses and allBatches
  const batchOptions = allBatches.map(b => ({ value: b.batchId || b.id, label: b.batchName || b.name || b.title || b.id }));
  const courseOptions = allCourses.map(c => ({ value: c.courseId || c.id, label: c.title || c.name || c.courseName || c.id }));

  // Debug: Log courseOptions and selected course value
  useEffect(() => {
    if (filterValues.course) {
      const selected = courseOptions.find(opt => String(opt.value) === String(filterValues.course));
    }
  }, [courseOptions, filterValues.course]);

  // Sidebar open handler
  const handleViewDetails = (learner) => {
    setSidebarOpen(true);
    setSidebarLoading(true);
    setSidebarError(null);
    setSidebarData(null);
    setSelectedLearner(learner);
    const token = Cookies.get('accessToken');
    axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/enrollments/enrolledcourses?userid=${learner.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        setSidebarData(res.data);
        setSidebarLoading(false);
      })
      .catch(err => {
        setSidebarError('Failed to fetch details');
        setSidebarLoading(false);
      });
  };

  // Compute archive/unarchive status for selected learners
  const selectedLearnerObjs = selectedLearners.map(idx => paginatedLearners[idx]).filter(Boolean);
  const allArchived = selectedLearnerObjs.length > 0 && selectedLearnerObjs.every(l => l.status && l.status.toLowerCase() === 'archived');
  const allUnarchived = selectedLearnerObjs.length > 0 && selectedLearnerObjs.every(l => l.status && l.status.toLowerCase() !== 'archived');
  const mixedArchive = selectedLearnerObjs.length > 0 && !allArchived && !allUnarchived;

  // Update handleBulkAction to use PUT for archive/unarchive
  async function handleBulkAction(option) {
    if (!option || !option.value) return;
    if (selectedLearners.length === 0) {
      toast.error('Please select at least one learner.');
      return;
    }
    const userIds = selectedLearners.map(idx => paginatedLearners[idx]?.id).filter(Boolean);
    if (userIds.length === 0) {
      toast.error('No valid learners selected.');
      return;
    }
    const token = Cookies.get('accessToken');
    if (!token) {
      toast.error('No access token found. Please login again.');
      return;
    }
    let url = '';
    let method = '';
    let body = {};
    switch (option.value) {
      case 'reset':
        url = '/api/admin/sendresetpasswordlink';
        method = 'POST';
        body = { userIds };
        break;
      case 'archive':
        url = '/api/admin/bulkarchive';
        method = 'POST'; // changed from PUT to POST
        body = { userIds };
        break;
      case 'unarchive':
        url = '/api/admin/bulkunarchive';
        method = 'POST'; // changed from PUT to POST
        body = { userIds };
        break;
      default:
        toast.info('This action is not implemented yet.');
        return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}${url}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(`${option.label} successful!`);
        if (option.value === 'archive') {
          setLearners(prev => {
            const updated = prev.map(l => userIds.includes(l.id) ? { ...l, status: 'ARCHIVED', isActive: false } : l);
            return [...updated.filter(l => l.status !== 'ARCHIVED'), ...updated.filter(l => l.status === 'ARCHIVED')];
          });
        } else if (option.value === 'unarchive') {
          setLearners(prev => {
            const updated = prev.map(l => userIds.includes(l.id) ? { ...l, status: 'REGISTERED', isActive: true } : l);
            return [...updated.filter(l => userIds.includes(l.id)), ...updated.filter(l => !userIds.includes(l.id))];
          });
        }
      } else {
        const err = await res.text();
        toast.error(`Failed: ${err}`);
      }
    } catch (e) {
      toast.error('Request failed: ' + (e.message || e));
    }
  }

  const handleArchive = async (learner) => {
    if (!learner.id) {
      toast.error('Learner ID is missing. Cannot archive.');
      return;
    }
    const token = Cookies.get('accessToken');
    if (!token) return toast.error('No access token found.');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/bulkarchive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds: [learner.id] }),
      });
      toast.success('Learner archived!');
      setLearners(prev => {
        const updated = prev.map(l => l.id === learner.id ? { ...l, status: 'ARCHIVED', isActive: false } : l);
        return [...updated.filter(l => l.status !== 'ARCHIVED'), ...updated.filter(l => l.status === 'ARCHIVED')];
      });
    } catch (err) {
      toast.error('Failed to archive learner.');
    }
  };

  const handleUnarchive = async (learner) => {
    if (!learner.id) {
      toast.error('Learner ID is missing. Cannot unarchive.');
      return;
    }
    const token = Cookies.get('accessToken');
    if (!token) return toast.error('No access token found.');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/admin/bulkunarchive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds: [learner.id] }),
      });
      toast.success('Learner unarchived!');
      setLearners(prev => {
        const updated = prev.map(l => l.id === learner.id ? { ...l, status: 'REGISTERED', isActive: true } : l);
        return [...updated.filter(l => l.id === learner.id), ...updated.filter(l => l.id !== learner.id)];
      });
    } catch (err) {
      toast.error('Failed to unarchive learner.');
    }
  };

  const handleAdminResetPassword = async () => {
    if (!learnerToResetPassword) {
        toast.error("No learner selected for password reset.");
        return;
    }
    setResetPasswordLoading(true);
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/user/resetpassword?email=${encodeURIComponent(learnerToResetPassword.email)}&newPassword=${encodeURIComponent(resetPasswordValue)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Cookies.get('accessToken')}`,
                'Content-Type': 'application/json',
            },
        });
        const text = await res.text();
        if (res.ok) {
            toast.success('Password reset successful!');
            setShowResetPasswordModal(false);
            setResetPasswordValue('');
            setConfirmResetPasswordValue('');
            setLearnerToResetPassword(null);
            setResetPasswordError('');
        } else {
            toast.error(text || 'Failed to reset password');
        }
    } catch (err) {
        toast.error('Failed to reset password');
    }
    setResetPasswordLoading(false);
  };

  // In the filter panel Apply button handler, update to use the new fetch
  const handleApplyFilters = () => {
    // Filters are applied client-side, so we just close the panel.
    // We can re-fetch here if server-side filtering for these fields is implemented.
    setShowFilterPanel(false);
  };

  // Fetch batches for selected course in filter modal
  useEffect(() => {
    if (!showFilterPanel || !filterValues.course) {
      setFilteredBatches([]);
      return;
    }
    const token = Cookies.get('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses/${filterValues.course}/batches`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        let batches = [];
        if (Array.isArray(data.data)) batches = data.data;
        else if (Array.isArray(data)) batches = data;
        setFilteredBatches(batches);
      });
    // Clear batch selection if course changes
    setFilterValues(v => ({ ...v, batch: '' }));
  // eslint-disable-next-line
  }, [filterValues.course, showFilterPanel]);

  return (
    <div className="p-2 sm:p-4 bg-white rounded-xl shadow text-xs sm:text-sm">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-bold">Learners</h1>
          <p className="text-gray-500 text-xs sm:text-sm">Create and manage learners for your branches.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative text-xs sm:text-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name, Email, Mobile..."
              className="border pl-7 pr-2 py-2 rounded-[4px] w-[120px] sm:w-[180px] md:w-[220px] text-xs sm:text-sm"
            />
          </div>
          {/* Bulk Actions */}
          <div className="min-w-[180px] max-w-[260px]">
            <Select
              classNamePrefix="react-select"
              options={[
                // { value: '', label: 'Bulk Actions', isDisabled: true },
                // { value: 'add', label: 'Add Learners', isDisabled: true },
                // { value: 'reset', label: 'Send Reset Password Link', isDisabled: false },
                { value: 'archive', label: 'Bulk Learner Archive', isDisabled: mixedArchive || !allUnarchived },
                { value: 'unarchive', label: 'Bulk Learner Unarchive', isDisabled: mixedArchive || !allArchived },
              ]}
              defaultValue={{ value: '', label: 'Bulk Actions', isDisabled: true }}
              onChange={option => handleBulkAction(option)}
              isSearchable={false}
              isDisabled={selectedLearners.length === 0}
              styles={{
                control: (base, state) => ({
                  ...base,
                  minHeight: '32px',
                  fontSize: '13px',
                  borderColor: state.isFocused ? '#2563eb' : '#d1d5db',
                  boxShadow: state.isFocused ? '0 0 0 1px #2563eb' : 'none',
                  '&:hover': { borderColor: '#2563eb' },
                }),
                menu: base => ({ ...base, zIndex: 9999 }),
                option: (base, state) => ({
                  ...base,
                  fontSize: '13px',
                  backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#e0e7ff' : '#fff',
                  color: state.isDisabled ? '#b0b0b0' : state.isSelected ? '#fff' : '#222',
                  cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                  padding: '8px 12px',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  opacity: state.isDisabled ? 0.7 : 1,
                }),
              }}
            />
          </div>
          <button 
            className="bg-blue text-white px-2 py-1 sm:px-4 sm:py-2 rounded-[4px] text-xs sm:text-sm"
            onClick={() => router.push('/admin/users/new-enrollment')}
          >
            + Add Learner(s)
          </button>
        </div>
      </div>
      {/* Filters and Export */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-2">
        <div className="flex items-center gap-2">
          {/* Learner Status Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setShowStatusDropdown(!showStatusDropdown)} className="text-blue-600 font-medium flex items-center text-xs sm:text-sm">
              {statusFilter} <ChevronDown className="ml-1 w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            {showStatusDropdown && (
              <div className="absolute mt-2 w-32 sm:w-40 bg-white border rounded shadow-md z-10">
                {['All Learners', 'Registered', 'Admitted', 'Archived'].map(option => (
                  <div
                    key={option}
                    onClick={() => {
                      setCurrentPage(1);
                      setStatusFilter(option);
                      setShowStatusDropdown(false);
                    }}
                    className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm hover:bg-gray-100 cursor-pointer"
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-gray-100 px-2 py-1 text-xs sm:text-sm rounded-md">{serverTotalElements}</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 text-gray-600 bg-gray-200 p-1 rounded-[4px] hover:text-black text-xs sm:text-sm"
            onClick={handleExport}
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4" /> Export
          </button>
          <button
            className="text-xs sm:text-sm text-gray-600 hover:text-black p-1 bg-gray-200 rounded-[4px] flex items-center gap-1 relative"
            onClick={() => setShowFilterPanel(true)}
          >
            <span className="relative inline-block">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue text-white text-[8px] font-bold rounded-full px-1 py-0.5 min-w-[12px] text-center shadow z-10" style={{lineHeight:'10px',height:'14px'}}>{activeFilterCount}</span>
              )}
            </span>
            <span className="ml-1">Filters</span>
          </button>
        </div>
      </div>
      {/* Learners Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse text-xs sm:text-sm">
          <thead className="bg-gray-100 text-left text-gray-700">
            <tr>
              <th className="px-2 py-1 sm:px-4 sm:py-2">
                <input
                  type="checkbox"
                  checked={selectedLearners.length === filteredLearners.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-2 py-1 sm:px-4 sm:py-2">Learner's Name</th>
              <th className="px-2 py-1 sm:px-4 sm:py-2">Contact</th>
              <th className="px-2 py-1 sm:px-4 sm:py-2">Date</th>
              <th className="px-2 py-1 sm:px-4 sm:py-2">Status</th>
              <th className="px-2 py-1 sm:px-4 sm:py-2">Reg. No.</th>
              <th className="px-2 py-1 sm:px-4 sm:py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLearners.map((learner, index) => (
              <tr 
                key={index + (currentPage - 1) * rowsPerPage}
                style={
                  learner.status === 'Archived'
                    ? { background: '#e5e7eb', color: '#a3a3a3', cursor: 'not-allowed', opacity: 0.6 }
                    : { cursor: 'pointer' }
                }
                onClick={() => learner.status !== 'Archived' && handleRowClick(learner)}
              >
                <td className="px-2 py-1 sm:px-4 sm:py-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedLearners.includes(index)}
                    onChange={() => handleSelectLearner(index)}
                  />
                </td>
                <td className="px-2 py-1 sm:px-4 sm:py-2">{learner.name ?? 'N/A'}</td>
                <td className="px-2 py-1 sm:px-4 sm:py-2">
                  <div>{learner.email ?? 'N/A'}</div>
                  <div className="text-gray-500 text-xs">{learner.phone ?? 'N/A'}</div>
                </td>
                <td className="px-2 py-1 sm:px-4 sm:py-2">
                  {learner.createdAt
                    ? (() => {
                        let dateStr = learner.createdAt;
                        if (typeof dateStr === 'string' && dateStr.includes('.')) dateStr = dateStr.split('.')[0];
                        const d = new Date(dateStr);
                        return isNaN(d) ? 'N/A' : d.toLocaleDateString('en-GB');
                      })()
                    : learner.dateAdded
                    ? new Date(learner.dateAdded).toLocaleDateString('en-GB')
                    : 'N/A'}
                </td>
                <td className="px-2 py-1 sm:px-4 sm:py-2">
                  <span style={
                    learner.status && learner.status.toLowerCase() === 'admitted'
                      ? { background: '#d1fae5', color: '#15803d', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 } // green
                      : learner.status && learner.status.toLowerCase() === 'registered'
                      ? { background: '#dbeafe', color: '#2563eb', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 } // blue
                      : learner.status && learner.status.toLowerCase() === 'archived'
                      ? { background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 } // red
                      : { background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }
                  }>
                    {learner.status ?? 'N/A'}
                  </span>
                </td>
                <td className="px-2 py-1 sm:px-4 sm:py-2">{learner.abcId ?? learner.registrationNo ?? 'N/A'}</td>
                <td className="px-2 py-1 sm:px-4 sm:py-2 relative" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-block relative">
                    <button
                      ref={el => actionDropdownRefs.current[index] = el}
                      onClick={() => setOpenDropdownIndex(openDropdownIndex === index ? null : index)}
                      className="p-1"
                    >
                      <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <ActionDropdownMenu
                      anchorRef={{ current: actionDropdownRefs.current[index] }}
                      open={openDropdownIndex === index}
                      onClose={() => setOpenDropdownIndex(null)}
                      menuRef={el => actionDropdownMenuRefs.current[index] = el}
                    >
                      <button
                        className="text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm font-medium w-full"
                        onClick={e => {
                          e.stopPropagation();
                          setLearnerToResetPassword(learner);
                          setShowResetPasswordModal(true);
                          setOpenDropdownIndex(null);
                        }}
                      >
                        Reset Password
                      </button>
                      {learner.status && learner.status.toLowerCase() === 'archived' ? (
                        <button
                          className="text-left px-4 py-2 hover:bg-green-50 text-green-700 text-sm font-medium w-full"
                          onClick={e => {
                            e.stopPropagation();
                            handleUnarchive(learner);
                            setOpenDropdownIndex(null);
                          }}
                        >
                          Unarchive
                        </button>
                      ) : (
                        <button
                          className="text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm font-medium w-full"
                          onClick={e => {
                            e.stopPropagation();
                            handleArchive(learner);
                            setOpenDropdownIndex(null);
                          }}
                        >
                          Archive
                        </button>
                      )}
                    </ActionDropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 text-sm bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="font-medium">Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={e => { setCurrentPage(1); setRowsPerPage(Number(e.target.value)); }}
            className="border rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-200"
            style={{ minWidth: 56 }}
          >
            {[10, 20, 50, 100].map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <span className="ml-3 text-gray-700">{(totalRows === 0) ? 0 : ((currentPage - 1) * rowsPerPage + 1)}-{Math.min(currentPage * rowsPerPage, totalRows)} of {totalRows}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 bg-white border border-gray-300 rounded shadow-sm font-semibold text-gray-700 hover:bg-blue-50 disabled:opacity-50 transition"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            &#8592; Prev
          </button>
          <span className="px-3 font-semibold text-blue-700">{currentPage} / {totalPages || 1}</span>
          <button
            className="px-3 py-1 bg-white border border-gray-300 rounded shadow-sm font-semibold text-gray-700 hover:bg-blue-50 disabled:opacity-50 transition"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalRows === 0}
          >
            Next &#8594;
          </button>
        </div>
      </div>
      {/* Centered Modal Filter Card */}
      {showFilterPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white shadow-2xl rounded-xl px-8 py-6 flex flex-col gap-4 border border-gray-200 relative w-full max-w-2xl animate-fade-in">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setShowFilterPanel(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold mb-2 text-center">Advanced Filters</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <div className="flex flex-col">
                <label className="block text-xs font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={filterValues.name}
                  onChange={e => setFilterValues(v => ({ ...v, name: e.target.value }))}
                  className="border rounded px-3 py-2 text-xs"
                  placeholder="Name"
                />
              </div>
              <div className="flex flex-col">
                <label className="block text-xs font-medium mb-1">Email</label>
                <input
                  type="text"
                  value={filterValues.email}
                  onChange={e => setFilterValues(v => ({ ...v, email: e.target.value }))}
                  className="border rounded px-3 py-2 text-xs"
                  placeholder="Email"
                />
              </div>
              <div className="flex flex-col">
                <label className="block text-xs font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={filterValues.phone}
                  onChange={e => setFilterValues(v => ({ ...v, phone: e.target.value }))}
                  className="border rounded px-3 py-2 text-xs"
                  placeholder="Phone"
                />
              </div>
              <div className="flex flex-col">
                <label className="block text-xs font-medium mb-1">Registration No.</label>
                <input
                  type="text"
                  value={filterValues.registrationNo}
                  onChange={e => setFilterValues(v => ({ ...v, registrationNo: e.target.value }))}
                  className="border rounded px-3 py-2 text-xs"
                  placeholder="Reg. No."
                />
              </div>
              {/* Date Added (relative) */}
              <div className="flex flex-col">
                <label className="block text-xs font-medium mb-1">Date Added</label>
                <select
                  value={filterValues.relativeDate}
                  onChange={e => setFilterValues(v => ({ ...v, relativeDate: e.target.value }))}
                  className="border rounded px-3 py-2 text-xs"
                >
                  <option value="">Any time</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="6m">Last 6 months</option>
                  <option value="1y">Last 1 year</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 justify-center mt-2">
              <button
                className="bg-blue text-white py-2 px-6 rounded text-xs font-semibold shadow hover:bg-blue-700 transition"
                onClick={handleApplyFilters}
              >
                Apply
              </button>
              <button
                className="bg-gray-200 text-gray-700 py-2 px-6 rounded text-xs font-semibold shadow hover:bg-gray-300 transition"
                onClick={() => setFilterValues({ name: '', email: '', phone: '', registrationNo: '', relativeDate: '' })}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
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
      {/* Sidebar for View Details */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div className="flex-1 bg-black bg-opacity-30" onClick={() => setSidebarOpen(false)} />
          {/* Sidebar */}
          <div style={{ width: '40vw', minWidth: 350, maxWidth: 600 }} className="relative h-full bg-white shadow-2xl animate-slide-in-right overflow-y-auto">
            <button className="absolute top-4 right-4 z-10 text-gray-500 hover:text-black" onClick={() => setSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
            <div className="p-6">
              <h2 className="text-lg font-bold mb-2">{selectedLearner?.name}</h2>
              <div className="text-gray-500 mb-4">{selectedLearner?.email} &bull; {selectedLearner?.phone}</div>
              {sidebarLoading && <div>Loading...</div>}
              {sidebarError && <div className="text-red-500">{sidebarError}</div>}
              {sidebarData && Array.isArray(sidebarData) && sidebarData.length > 0 ? (
                sidebarData.map((course, idx) => (
                  <div key={idx} className="mb-6 border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-4 mb-2">
                      {course.imageUrl && <img src={course.imageUrl} alt={course.title} className="w-20 h-20 object-cover rounded" />}
                      <div>
                        <div className="font-semibold text-base">{course.title}</div>
                        <div className="text-gray-600 text-sm">{course.price ? `₹${course.price}` : '$0.00'}</div>
                        <div className="text-gray-400 text-xs">Registered on {course.enrolledAt ? new Date(course.enrolledAt).toLocaleDateString() : '-'}</div>
                      </div>
                    </div>
                    <div className="font-semibold text-blue-700 mb-2">Curriculum</div>
                    {course.curriculum && course.curriculum.length > 0 ? (
                      course.curriculum.map((item, i) => (
                        <div key={i} className="mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{String(i+1).padStart(2, '0')}</span>
                            <span className="text-sm">{item.title}</span>
                          </div>
                          <div className="text-gray-400 text-xs mb-1">Added on {item.addedOn ? new Date(item.addedOn).toLocaleDateString() : '-'}</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${item.progress || 0}%` }}></div>
                            </div>
                            <span className="text-xs text-gray-700">{item.progress || 0}%</span>
                            <span className="text-xs bg-yellow-100 text-yellow-700 rounded px-2 py-0.5">{item.progress || 0}%</span>
                            <span className="text-xs text-green-600">{item.completed || 0}/{item.total || 0}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 text-xs">No curriculum data</div>
                    )}
                  </div>
                ))
              ) : (
                !sidebarLoading && <div className="text-gray-400">No course details found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}