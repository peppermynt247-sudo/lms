'use client';
import React, { useState } from 'react';
import { ArrowLeft, Info, Calendar, UploadCloud, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Papa from 'papaparse';
import { toast } from 'react-toastify';

export default function IssueCertificatePage() {
  const router = useRouter();
  const [tab, setTab] = useState('learners');
  const [courseName, setCourseName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [selectedLearners, setSelectedLearners] = useState('');
  const [issuedDate, setIssuedDate] = useState('2025-07-01T00:00');
  const [startDate, setStartDate] = useState('2025-07-01T00:00');
  const [endDate, setEndDate] = useState('2025-07-01T00:00');
  const [showSelectLearnersModal, setShowSelectLearnersModal] = useState(false);
  const [allCourses, setAllCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [modalLearners, setModalLearners] = useState([]);
  const [modalLearnersLoading, setModalLearnersLoading] = useState(false);
  const [modalSelected, setModalSelected] = useState([]);
  const [modalError, setModalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [csvStudents, setCsvStudents] = useState([]);
  const [csvError, setCsvError] = useState('');
  const [allBatches, setAllBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [modalBatchesLoading, setModalBatchesLoading] = useState(false);

  const openSelectLearnersModal = async () => {
    setShowSelectLearnersModal(true);
    setModalSelected([]);
    setSelectedCourseId('');
    setModalLearners([]);
    setModalError('');
    try {
      const token = localStorage.getItem('accessToken') || (typeof Cookies !== 'undefined' && Cookies.get('accessToken'));
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      setAllCourses(Array.isArray(res.data?.data?.content) ? res.data.data.content : []);
    } catch {
      setModalError('Failed to fetch courses');
    }
  };

  // Fetch batches for a course
  const fetchBatchesForCourse = async (courseId) => {
    setModalBatchesLoading(true);
    setAllBatches([]);
    setSelectedBatchId('');
    try {
      const token = localStorage.getItem('accessToken') || (typeof Cookies !== 'undefined' && Cookies.get('accessToken'));
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses/${courseId}/batches`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      setAllBatches(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setAllBatches([]);
    }
    setModalBatchesLoading(false);
  };

  // Fetch learners for course+batch
  const fetchModalLearners = async (courseId, batchId) => {
    setModalLearnersLoading(true);
    setModalLearners([]);
    setModalError('');
    try {
      const token = localStorage.getItem('accessToken') || (typeof Cookies !== 'undefined' && Cookies.get('accessToken'));
      let url = `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/courses/learners?courseId=${courseId}`;
      if (batchId) url += `&batchId=${batchId}`;
      const res = await axios.get(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      setModalLearners(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setModalError('Failed to fetch learners');
    }
    setModalLearnersLoading(false);
  };

  // Handle course change: fetch batches, clear batch/learners
  const handleModalCourseChange = (e) => {
    setSelectedCourseId(e.target.value);
    setModalSelected([]);
    setAllBatches([]);
    setSelectedBatchId('');
    setModalLearners([]);
    if (e.target.value) fetchBatchesForCourse(e.target.value);
  };

  // Handle batch change: fetch learners for course+batch
  const handleModalBatchChange = (e) => {
    setSelectedBatchId(e.target.value);
    setModalSelected([]);
    if (selectedCourseId && e.target.value) fetchModalLearners(selectedCourseId, e.target.value);
    else setModalLearners([]);
  };

  // Optionally, fetch learners if only course is selected and batch is not required
  // (Uncomment if you want to show all learners for a course when batch is not selected)
  // useEffect(() => {
  //   if (selectedCourseId && !selectedBatchId) fetchModalLearners(selectedCourseId, '');
  // }, [selectedCourseId]);

  const handleModalSelect = (email) => {
    setModalSelected(sel => sel.includes(email) ? sel.filter(e => e !== email) : [...sel, email]);
  };

  const handleModalConfirm = () => {
    // Add selected emails to main learners input (comma-separated, avoid duplicates)
    const current = selectedLearners.split(',').map(e => e.trim()).filter(Boolean);
    const merged = Array.from(new Set([...current, ...modalSelected]));
    setSelectedLearners(merged.join(', '));
    setShowSelectLearnersModal(false);
  };

  // Helper to determine if all learners are selected
  const allModalLearnersSelected = modalLearners.length > 0 && modalSelected.length === modalLearners.length;
  const handleSelectAllModalLearners = () => {
    if (allModalLearnersSelected) {
      setModalSelected([]);
    } else {
      setModalSelected(modalLearners.map(l => l.email));
    }
  };

  // Helper to format date as 'YYYY-MM-DD HH:mm:ss.SSSSSS'
  function toPgTimestamp(date) {
    if (!date) return undefined;
    // If already a string in correct format, return as is
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{6}$/)) return date;
    // If string in YYYY-MM-DD, add current time
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const now = new Date();
      const pad = n => n.toString().padStart(2, '0');
      const ms = now.getMilliseconds().toString().padEnd(6, '0');
      return `${date} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${ms}`;
    }
    // If Date object
    const pad = n => n.toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padEnd(6, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${ms}`;
  }

  const handleIssueCertificates = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      // Get templateId from URL
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const templateId = pathParts[pathParts.length - 2];
      // Helper to robustly parse date to ISO string or return undefined
      const toISO = (dateStr) => {
        if (!dateStr) return undefined;
        // If already has seconds, return as is
        if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateStr)) return dateStr;
        // If in datetime-local format (YYYY-MM-DDTHH:mm), add :00 seconds
        if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateStr)) return dateStr + ':00';
        // If only date, add T00:00:00
        if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr + 'T00:00:00';
        return dateStr;
      };
      // Helper to get only the date part (YYYY-MM-DD)
      const toDateOnly = (dateStr) => {
        if (!dateStr) return undefined;
        // If in format YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss, split at 'T'
        if (dateStr.includes('T')) return dateStr.split('T')[0];
        // If in format YYYY-MM-DD HH:mm:ss, split at space
        if (dateStr.includes(' ')) return dateStr.split(' ')[0];
        // If already just date
        return dateStr;
      };
      const students = selectedLearners
        .split(',')
        .map(email => email.trim())
        .filter(Boolean)
        .map(email => ({
          email,
          courseName,
          collegeName,
          issuedAt: issuedDate ? new Date(issuedDate).toISOString() : undefined,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
        }));
      if (!templateId || !courseName || !collegeName || students.length === 0 || !issuedDate || !startDate || !endDate) {
        setError('Please fill all required fields (Course Name, College Name) and select at least one learner. All date fields are required.');
        setLoading(false);
        return;
      }
      const token = localStorage.getItem('accessToken') || (typeof Cookies !== 'undefined' && Cookies.get('accessToken'));
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/certificates/issue/bulk`,
        {
          templateId: Number(templateId),
          students,
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      setSuccess(true);
      toast.success('Certificates issued successfully!');
      // Optionally clear form
      // setSelectedLearners(''); setCourseName(''); setIssuedDate('2025-07-01'); setStartDate(''); setEndDate('');
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Failed to issue certificates';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // CSV import handler
  const handleCSVFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        const toISO = (dateStr) => {
          if (!dateStr) return '';
          // If already in ISO format with T, return as is
          if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateStr)) return dateStr;
          // If just YYYY-MM-DD, add T00:00:00Z
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr + 'T00:00:00Z';
          return dateStr;
        };
        const mapped = results.data.map(row => ({
          email: row["email"]?.trim() || '',
          courseName: row["courseName"]?.trim() || '',
          collegeName: row["collegeName"]?.trim() || '',
          issuedAt: toISO(row["issuedAt"] || ''),
          startDate: toISO(row["startDate"] || ''),
          endDate: toISO(row["endDate"] || ''),
        }));
        // Validate required fields
        const invalid = mapped.find(s => !s.email || !s.courseName || !s.collegeName || !s.issuedAt || !s.startDate || !s.endDate);
        if (invalid) {
          setCsvError('All fields (email, courseName, collegeName, issuedAt, startDate, endDate) are required in every row.');
          setCsvStudents([]);
        } else {
          setCsvError('');
          setCsvStudents(mapped);
        }
      },
      error: function (err) {
        setCsvError('CSV parsing failed: ' + err.message);
        setCsvStudents([]);
      }
    });
  };

  // Bulk issue certificates from CSV
  const handleBulkIssueCertificates = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const templateId = pathParts[pathParts.length - 2];
      const token = localStorage.getItem('accessToken') || (typeof Cookies !== 'undefined' && Cookies.get('accessToken'));
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/certificates/issue/bulk`,
        {
          templateId: Number(templateId),
          students: csvStudents,
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      setSuccess(true);
      toast.success('Certificates issued successfully from CSV!');
      setCsvStudents([]);
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Failed to issue certificates';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={() => router.back()} className="mr-3 p-2 rounded hover:bg-gray-100">
            <ArrowLeft size={28} />
          </button>
          <h1 className="text-2xl font-bold leading-tight">Issue Certificate</h1>
        </div>
        <div className="flex gap-2">
          <button className="border px-5 py-2 rounded-md text-gray-700 hover:bg-gray-100" onClick={() => router.back()}>Close</button>
          <button
            className="bg-green-600 text-white px-5 py-2 rounded-md font-semibold shadow hover:bg-green-700 transition-all duration-150 disabled:opacity-60"
            onClick={handleIssueCertificates}
            disabled={loading || !courseName || !selectedLearners}
          >
            {loading ? 'Issuing...' : 'Issue Certificate'}
          </button>
        </div>
      </div>
      {error && <div className="text-red-600 text-sm font-medium text-center mb-2">{error}</div>}
      {success && <div className="text-green-600 text-sm font-medium text-center mb-2">Certificates issued successfully!</div>}

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-all duration-150 ${tab === 'learners' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
          onClick={() => setTab('learners')}
        >
          Select Learners
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-all duration-150 ${tab === 'import' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
          onClick={() => setTab('import')}
        >
          Import from file
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'learners' ? (
        <>
          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Course / Project Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={courseName}
                onChange={e => setCourseName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">College Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={collegeName}
                onChange={e => setCollegeName(e.target.value)}
                placeholder="Enter college/institution name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Select Learners</label>
              <div className="flex gap-2 mb-2">
                <div 
                  className="border px-4 py-2 rounded-md w-full text-sm cursor-pointer bg-white hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between relative"
                  onClick={openSelectLearnersModal}
                >
                  <span className={selectedLearners ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedLearners ? (
                      (() => {
                        const learners = selectedLearners.split(',').map(l => l.trim()).filter(Boolean);
                        if (learners.length === 1) {
                          return learners[0];
                        } else if (learners.length > 1) {
                          const firstFew = learners.slice(0, 2).join(', ');
                          return `${firstFew}${learners.length > 2 ? ` and ${learners.length - 2} more` : ''}`;
                        }
                        return 'Click to select learners...';
                      })()
                    ) : 'Click to select learners...'}
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedLearners && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                        {selectedLearners.split(',').map(l => l.trim()).filter(Boolean).length} selected
                      </span>
                    )}
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors duration-200 flex items-center gap-2" 
                  onClick={openSelectLearnersModal}
                >
                  <Plus size={16} />
                  Select Learners
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Issued Date <span className="text-red-500">*</span></label>
              <DatePicker
                selected={issuedDate ? new Date(issuedDate) : null}
                onChange={date => setIssuedDate(date ? date.toISOString().split('T')[0] : '')}
                dateFormat="yyyy-MM-dd"
                className="w-full border rounded px-3 py-2"
                placeholderText="YYYY-MM-DD"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date <span className="text-red-500">*</span></label>
              <DatePicker
                selected={startDate ? new Date(startDate) : null}
                onChange={date => setStartDate(date ? date.toISOString().split('T')[0] : '')}
                dateFormat="yyyy-MM-dd"
                className="w-full border rounded px-3 py-2"
                placeholderText="YYYY-MM-DD"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date <span className="text-red-500">*</span></label>
              <DatePicker
                selected={endDate ? new Date(endDate) : null}
                onChange={date => setEndDate(date ? date.toISOString().split('T')[0] : '')}
                dateFormat="yyyy-MM-dd"
                className="w-full border rounded px-3 py-2"
                placeholderText="YYYY-MM-DD"
                required
              />
            </div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 flex items-start gap-3 mt-4 shadow-sm">
            <Info size={22} className="text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-900">
              <span className="font-semibold">Note for Issuing Certificates:</span> <br />
              The details you enter here will apply to all selected students. If you need to add unique information (like grades or student IDs), please issue certificates one by one or use the bulk upload feature with a CSV file for personalized data.
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Upload Area */}
          <div className="flex-1">
            <div className="border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center text-gray-400 cursor-pointer mb-4 bg-gray-50">
              <UploadCloud size={36} className="mb-2 text-blue-500" />
              <span className="font-medium">Choose a csv file</span>
              <input type="file" accept=".csv" onChange={handleCSVFileChange} className="mt-2" />
            </div>
            {csvError && <div className="text-red-600 text-sm mb-2">{csvError}</div>}
            <div className="text-xs text-gray-500 mb-2">Supports CSV file, Max file size: 1MB</div>
            <div className="text-xs text-blue-700 mb-2">
              Download <a href="#" className="underline font-medium">Sample File</a>
            </div>
            <div className="text-xs text-gray-700 mb-2">
              <span className="font-semibold">Note:</span> Make sure the CSV file contains only emails of learners already registered on the platform.
            </div>
            <button className="flex items-center gap-1 text-blue-600 text-sm font-medium mt-2 hover:underline bg-transparent">
              <Plus size={18} /> Add Image Field
            </button>
          </div>
          {/* Right: Guidelines and Preview */}
          <div className="w-full md:w-96 bg-blue-50 border border-blue-200 rounded-lg p-5 flex flex-col gap-4">
            <div>
            <div className="flex items-center gap-2 mb-2">
              <Info size={20} className="text-blue-600" />
              <span className="font-semibold text-blue-700">CSV Upload Tips</span>
            </div>
            <div className="text-sm text-blue-900 space-y-3">
                <div><span className="font-semibold">Required columns:</span> email, courseName, issuedAt, startDate, endDate</div>
                <div><span className="font-semibold">Date format:</span> ISO (e.g. 2024-07-21T00:00:00Z)</div>
                <div><span className="font-semibold">Case Matters:</span> Field names are case-sensitive.</div>
              </div>
              </div>
            {csvStudents.length > 0 && (
              <div className="mt-4">
                <div className="font-semibold mb-2">Preview ({csvStudents.length} learners)</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-md text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 border-b text-left font-bold">Email</th>
                        <th className="px-3 py-2 border-b text-left font-bold">Course</th>
                        <th className="px-3 py-2 border-b text-left font-bold">Issued At</th>
                        <th className="px-3 py-2 border-b text-left font-bold">Start</th>
                        <th className="px-3 py-2 border-b text-left font-bold">End</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvStudents.map((s, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-blue-50"}>
                          <td className="px-3 py-2 border-b">{s.email}</td>
                          <td className="px-3 py-2 border-b">{s.courseName}</td>
                          <td className="px-3 py-2 border-b">{s.issuedAt}</td>
                          <td className="px-3 py-2 border-b">{s.startDate}</td>
                          <td className="px-3 py-2 border-b">{s.endDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
                <button
                  className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition disabled:opacity-60"
                  onClick={handleBulkIssueCertificates}
                  disabled={loading || csvStudents.length === 0}
                >
                  {loading ? 'Issuing...' : 'Issue Certificates'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {showSelectLearnersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto p-6 relative flex flex-col max-h-[90vh]">
            <div className="text-xl font-bold mb-4">Select Learners</div>
            {modalError && <div className="text-red-600 mb-2">{modalError}</div>}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Filter by Course</label>
              <select value={selectedCourseId} onChange={handleModalCourseChange} className="border px-3 py-2 rounded w-full">
                <option value="">Select course</option>
                {allCourses.map(c => <option key={c.courseId} value={c.courseId}>{c.name || c.title}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Filter by Batch</label>
              <select value={selectedBatchId} onChange={handleModalBatchChange} className="border px-3 py-2 rounded w-full" disabled={!selectedCourseId || modalBatchesLoading}>
                <option value="">Select batch</option>
                {allBatches.map(b => <option key={b.batchId || b.id} value={b.batchId || b.id}>{b.batchName || b.name}</option>)}
              </select>
            </div>
            <div className="flex-1 max-h-64 overflow-y-auto border rounded mb-4">
              {modalLearnersLoading ? <div className="p-4 text-center text-gray-500">Loading...</div> :
                modalLearners.length === 0 ? <div className="p-4 text-center text-gray-400">No learners found</div> :
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 border-b bg-gray-50 sticky top-0 z-10">
                      <input type="checkbox" checked={allModalLearnersSelected} onChange={handleSelectAllModalLearners} />
                      <span className="font-medium text-sm">Select All</span>
                    </div>
                     <ul>
                       {modalLearners.map(l => (
                         <li key={l.email} className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0">
                           <input type="checkbox" checked={modalSelected.includes(l.email)} onChange={() => handleModalSelect(l.email)} />
                           <span className="font-medium">{l.name}</span>
                           <span className="text-xs text-gray-500 ml-2">{l.email}</span>
                           <span className="text-xs text-gray-400 ml-2">{l.phone}</span>
                         </li>
                       ))}
                     </ul>
                  </>
              }
            </div>
            <div className="border-t pt-4 mt-2 sticky bottom-0 bg-white z-20">
              <div className="flex flex-row justify-between gap-4">
                <button className="px-6 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold text-base w-1/2 hover:bg-gray-200 transition" onClick={() => setShowSelectLearnersModal(false)}>Cancel</button>
                <button className="px-6 py-3 rounded-lg bg-green-600 text-white font-bold text-base w-1/2 shadow-lg hover:bg-green-700 transition disabled:opacity-60" onClick={handleModalConfirm} disabled={modalSelected.length === 0}>Add Selected</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 