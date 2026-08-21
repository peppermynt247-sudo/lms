'use client';
import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit2 } from 'lucide-react';
import api from '../../../../../utils/api';
import { toast } from 'react-toastify';
import ReactDOM from 'react-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function LearnerCertificateDetails() {
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const router = useRouter();
  const params = useParams();
  const templateId = params?.id;
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [certLoading, setCertLoading] = useState(true);
  const [certError, setCertError] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, top: 0, width: 0 });
  
  // Edit certificate modal states
  const [editCertificateDrawerOpen, setEditCertificateDrawerOpen] = useState(false);
  const [editCertificateData, setEditCertificateData] = useState(null);
  const [editIssuedDate, setEditIssuedDate] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [selectedLearnerId, setSelectedLearnerId] = useState(null);

  // Fetch certificate template details (from all, then filter)
  React.useEffect(() => {
    if (!templateId) return;
    setCertLoading(true);
    setCertError(null);
    api.get(`/api/certificates/getcertificates`)
      .then(res => {
        const all = Array.isArray(res.data?.data) ? res.data.data : [];
        const found = all.find(c => String(c.templateId) === String(templateId));
        setCertificate(found || null);
        setCertLoading(false);
      })
      .catch(err => {
        setCertError('Failed to fetch certificate details');
        setCertLoading(false);
      });
  }, [templateId]);

  // Fetch learners for this certificate template
  React.useEffect(() => {
    if (!templateId) return;
    setLoading(true);
    setError(null);
    api.get(`/api/certificates/learners/${templateId}`)
      .then(res => {
        setLearners(Array.isArray(res.data?.data) ? res.data.data : []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch learner certificates');
        setLoading(false);
      });
  }, [templateId]);

  // Filter logic
  const filteredLearners = learners.filter(learner => {
    const keyword = searchTerm.toLowerCase();
    return (
      learner.learnerName?.toLowerCase().includes(keyword) ||
      learner.email?.toLowerCase().includes(keyword) ||
      learner.phoneNumber?.toLowerCase().includes(keyword) ||
      learner.courseName?.toLowerCase().includes(keyword)
    );
  });

  // Sort learners by certificate ID (from database) for consistent ordering
  const sortedLearners = filteredLearners.sort((a, b) => {
    // Sort by certificate ID (primary key from database)
    const certIdA = a.certificateId || a.id || 0;
    const certIdB = b.certificateId || b.id || 0;
    return certIdA - certIdB; // Ascending order (oldest first)
  });

  // Pagination logic
  const totalRows = sortedLearners.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const paginatedLearners = sortedLearners.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Reset to page 1 if rowsPerPage or searchTerm changes
  React.useEffect(() => { setCurrentPage(1); }, [rowsPerPage, searchTerm]);

  // Function to handle publish/unpublish certificate
  const handlePublishToggle = async (learner) => {
    try {
      if (!learner.userId) {
        toast.error('User ID is missing. Cannot publish/unpublish certificate.');
        return;
      }

      if (!templateId) {
        toast.error('Template ID is missing. Cannot publish/unpublish certificate.');
        return;
      }

      // Close dropdown immediately to prevent UI issues
      setOpenDropdownIndex(null);

      const endpoint = learner.isPublished ? 'unpublish' : 'publish';
      const res = await api.post(`/api/certificates/${endpoint}/${templateId}/${learner.userId}`);
      
      if (res.data.success) {
        toast.success(`Certificate ${learner.isPublished ? 'unpublished' : 'published'} successfully!`);
        
        // Refresh learners list with loading state
        setLoading(true);
        try {
          const refreshRes = await api.get(`/api/certificates/learners/${templateId}`);
          const refreshedLearners = Array.isArray(refreshRes.data?.data) ? refreshRes.data.data : [];
          
          // Apply the same sorting to maintain consistency
          const sortedRefreshedLearners = refreshedLearners.sort((a, b) => {
            const certIdA = a.certificateId || a.id || 0;
            const certIdB = b.certificateId || b.id || 0;
            return certIdA - certIdB; // Ascending order (oldest first)
          });
          
          setLearners(sortedRefreshedLearners);
        } catch (refreshErr) {
          console.error('Error refreshing learners:', refreshErr);
          toast.error('Certificate updated but failed to refresh the list. Please reload the page.');
        } finally {
          setLoading(false);
        }
      } else {
        toast.error(res.data.message || `Failed to ${learner.isPublished ? 'unpublish' : 'publish'} certificate`);
      }
    } catch (err) {
      console.error('Error publishing/unpublishing certificate:', err);
      toast.error(`Failed to ${learner.isPublished ? 'unpublish' : 'publish'} certificate. Please try again.`);
    }
  };

  // Function to handle edit certificate
  const handleEditCertificate = async (learner) => {
    if (!learner.userId) {
      toast.error('User ID is missing. Cannot edit certificate.');
      setOpenDropdownIndex(null);
      return;
    }

    if (!templateId) {
      toast.error('Template ID is missing. Cannot edit certificate.');
      setOpenDropdownIndex(null);
      return;
    }

    try {
      // Fetch complete certificate details
      const detailsRes = await api.get(`/api/certificates/getissuedcertificatedetails/${templateId}/${learner.userId}`);
      
      if (!detailsRes.data.success) {
        toast.error('Failed to fetch certificate details. Please try again.');
        setOpenDropdownIndex(null);
        return;
      }

      const certificateDetails = detailsRes.data.data;
      setEditCertificateData({ ...learner, ...certificateDetails });
      setSelectedLearnerId(learner.userId);
      
      // Pre-fill all date fields with proper fallbacks
      const issuedDate = certificateDetails.issuedAt || learner.issuedDate || learner.issued_at || learner.issuedAt;
      const startDate = certificateDetails.startDate || learner.startDate || learner.start_date || learner.startAt;
      const endDate = certificateDetails.endDate || learner.endDate || learner.end_date || learner.endAt;
      
      setEditIssuedDate(issuedDate ? new Date(issuedDate).toISOString().slice(0, 10) : '');
      setEditStartDate(startDate ? new Date(startDate).toISOString().slice(0, 10) : '');
      setEditEndDate(endDate ? new Date(endDate).toISOString().slice(0, 10) : '');
      
      setEditCertificateDrawerOpen(true);
      setOpenDropdownIndex(null);
    } catch (error) {
      console.error('Error fetching certificate details:', error);
      toast.error('Failed to fetch certificate details. Please try again.');
      setOpenDropdownIndex(null);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow overflow-y-auto">
      {/* Header */}
      <div className="flex items-center mb-2">
        <button onClick={() => router.back()} className="mr-3 p-2 rounded hover:bg-gray-100">
          <ArrowLeft size={28} />
        </button>
        <div>
          {certLoading ? (
            <div className="text-blue-600 font-semibold">Loading certificate details...</div>
          ) : certError ? (
            <div className="text-red-500 font-semibold">{certError}</div>
          ) : certificate ? (
            <>
              <h1 className="text-2xl font-bold leading-tight">{certificate.name || 'Certificate Details'}</h1>
              <div className="text-blue-600 text-base font-medium">{certificate.description || ''}</div>
            </>
          ) : null}
        </div>
      </div>

      {/* Certificate Stats */}
      <div className="flex flex-wrap gap-8 my-4 text-gray-700">
        <div>
          <div className="text-xs uppercase text-gray-400">Serial Prefix</div>
          <div className="font-semibold text-base">{certificate?.serialPrefix ?? certificate?.serial_prefix ?? '-'}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-400">Certificates Issued</div>
          <div className="font-semibold text-base">{learners.length}</div>
        </div>
      </div>

      {/* Top Bar: Search, Edit Template, Issue Certificate */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <input
          type="text"
          placeholder="Search Learners"
          className="border px-4 py-2 rounded-md w-64 text-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2">
          <button 
            className="flex items-center border px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
            onClick={() => router.push(`/admin/certificates/${templateId}/edit-template`)}
          >
            <Edit2 size={16} className="mr-2" /> Edit Template
          </button>
          <button 
            className="flex items-center gap-2 bg-blue-700 text-white px-5 py-2 rounded-lg font-bold shadow-md border-2 border-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200"
            style={{ minWidth: 180, backgroundColor: '#1e3a8a', borderColor: '#1e293b', color: '#fff', zIndex: 10 }}
            onClick={() => router.push(`/admin/certificates/${templateId}/issue-certificate`)}
            aria-label="Issue Certificate"
          >
            <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' /></svg>
            Issue Certificate
          </button>
        </div>
      </div>

      {/* Learners Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-10 text-blue-600 font-semibold">Loading learners...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500 font-semibold">{error}</div>
        ) : (
        <table className="w-full table-auto border-collapse text-sm">
          <thead className="bg-gray-100 text-left text-gray-700">
            <tr>
              <th className="px-4 py-2">Sr.</th>
              <th className="px-4 py-2">Learner's Name</th>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Course name</th>
              <th className="px-4 py-2">Issued Date</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLearners.map((learner, index) => {
              return (
                <tr key={`${learner.userId}-${learner.email}`} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-blue-400 font-semibold">{String((currentPage - 1) * rowsPerPage + index + 1).padStart(2, '0')}</td>
                  <td className="px-4 py-3">{learner.learnerName}</td>
                  <td className="px-4 py-3">
                    <div>{learner.email}</div>
                    <div className="text-gray-500 text-xs">{learner.phoneNumber}</div>
                  </td>
                  <td className="px-4 py-3">{learner.courseName}</td>
                  <td className="px-4 py-3">{learner.issuedDate ? new Date(learner.issuedDate).toISOString().slice(0, 10) : 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold
                      ${learner.isPublished
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-300'}`}>
                      {learner.isPublished ? 'Published' : 'Unpublished'}
                    </span>
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={e => {
                        setOpenDropdownIndex(openDropdownIndex === index ? null : index);
                        if (openDropdownIndex !== index) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const dropdownWidth = 180;
                          let left = rect.right - dropdownWidth;
                          if (left < 8) left = 8;
                          if (left + dropdownWidth > window.innerWidth - 8) {
                            left = window.innerWidth - dropdownWidth - 8;
                          }
                          setDropdownPosition({
                            left,
                            top: rect.bottom + 4,
                            width: dropdownWidth
                          });
                        }
                      }}
                      className="p-2"
                    >
                      <MoreVertical />
                    </button>
                    {openDropdownIndex === index && typeof window !== 'undefined' && ReactDOM.createPortal(
                      <div
                        className="z-50 w-44 gap-0 bg-white shadow-md rounded-md border"
                        style={{
                          position: 'fixed',
                          left: dropdownPosition.left,
                          top: dropdownPosition.top,
                          width: dropdownPosition.width,
                          zIndex: 9999
                        }}
                      >
                        <ul className="text-sm">
                          <li
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handlePublishToggle(learner)}
                          >
                            {learner.isPublished ? 'Unpublish' : 'Publish'}
                          </li>
                          <li
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              if (learner.certificateUrl) {
                                window.open(learner.certificateUrl, '_blank');
                              } else {
                                toast.info('No certificate file available');
                              }
                              setOpenDropdownIndex(null);
                            }}
                          >
                            Download
                          </li>
                          <li
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleEditCertificate(learner)}
                          >
                            Edit
                          </li>
                        </ul>
                      </div>,
                      document.body
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 text-sm bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="font-medium">Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={e => setRowsPerPage(Number(e.target.value))}
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

      {/* Edit Certificate Modal */}
      {editCertificateDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="flex-1 bg-black bg-opacity-30" onClick={() => setEditCertificateDrawerOpen(false)} />
          <div className="w-full max-w-md h-full bg-white shadow-2xl p-8 relative animate-slide-in-right flex flex-col" style={{borderTopLeftRadius: 18, borderBottomLeftRadius: 18}}>
            <button className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl" onClick={() => setEditCertificateDrawerOpen(false)}>&times;</button>
            <h2 className="text-2xl font-bold mb-6 text-blue-700">
              Edit Certificate
            </h2>
            
            {editCertificateData ? (
              <form className="flex flex-col gap-5 flex-1" onSubmit={async e => {
                e.preventDefault();
                const token = Cookies.get('accessToken');
                
                // Debug: Log form values
                
                // Create JSON payload for issued certificate update using state values
                const payload = {
                  courseName: e.target.courseName.value,
                  collegeName: e.target.collegeName.value,
                  isPublished: e.target.isPublished.checked,
                  issuedAt: editIssuedDate ? `${editIssuedDate}T00:00:00` : null,
                  startDate: editStartDate ? `${editStartDate}T00:00:00` : null,
                  endDate: editEndDate ? `${editEndDate}T00:00:00` : null
                };
                
                // Debug: Log the final payload
                
                const config = {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                };
                
                try {
                  // Validate that we have the required IDs
                  if (!selectedLearnerId) {
                    toast.error("Learner ID is missing. Cannot update certificate.");
                    return;
                  }
                  
                  if (!templateId) {
                    toast.error("Template ID is missing. Cannot update certificate.");
                    return;
                  }
                  
                  
                  // Update issued certificate using the endpoint from Postman
                  const response = await axios.put(
                    `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/certificates/updateissuedcertificate/${templateId}/${selectedLearnerId}`,
                    payload,
                    config
                  );
                  
                  if (response.data.success) {
                    toast.success("Certificate updated successfully!");
                    setEditCertificateDrawerOpen(false);
                    setEditCertificateData(null);
                    // Refresh the learners list with proper error handling
                    setLoading(true);
                    try {
                      const refreshRes = await api.get(`/api/certificates/learners/${templateId}`);
                      const refreshedLearners = Array.isArray(refreshRes.data?.data) ? refreshRes.data.data : [];
                      
                      // Apply the same sorting to maintain consistency
                      const sortedRefreshedLearners = refreshedLearners.sort((a, b) => {
                        const certIdA = a.certificateId || a.id || 0;
                        const certIdB = b.certificateId || b.id || 0;
                        return certIdA - certIdB; // Ascending order (oldest first)
                      });
                      
                      setLearners(sortedRefreshedLearners);
                    } catch (refreshErr) {
                      console.error('Error refreshing learners:', refreshErr);
                      toast.error('Certificate updated but failed to refresh the list. Please reload the page.');
                    } finally {
                      setLoading(false);
                    }
                  } else {
                    toast.error("Failed to update certificate: " + (response.data.message || "Unknown error"));
                  }
                } catch (error) {
                  console.error("Update certificate error:", error);
                  toast.error("Failed to update certificate: " + (error.response?.data?.message || error.message || "Unknown error"));
                }
              }}>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">Course Name <span className="text-red-500">*</span></label>
                  <input name="courseName" type="text" defaultValue={editCertificateData?.courseName || ''} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-blue-400 bg-gray-50" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">College Name</label>
                  <input name="collegeName" type="text" defaultValue={editCertificateData?.collegeName || ''} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-blue-400 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">Published Status</label>
                  <div className="flex items-center gap-2">
                    <input name="isPublished" type="checkbox" defaultChecked={editCertificateData?.isPublished || false} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                    <label className="text-sm text-gray-700">Publish this certificate</label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-700">Issue Date <span className="text-red-500">*</span></label>
                    <DatePicker
                      selected={editIssuedDate ? new Date(editIssuedDate) : null}
                      onChange={date => setEditIssuedDate(date ? date.toISOString().split('T')[0] : '')}
                      dateFormat="yyyy-MM-dd"
                      className="w-full border rounded-lg px-3 py-2 text-lg focus:outline-green-400 bg-gray-50"
                      placeholderText="YYYY-MM-DD"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-700">Start Date <span className="text-red-500">*</span></label>
                    <DatePicker
                      selected={editStartDate ? new Date(editStartDate) : null}
                      onChange={date => setEditStartDate(date ? date.toISOString().split('T')[0] : '')}
                      dateFormat="yyyy-MM-dd"
                      className="w-full border rounded-lg px-3 py-2 text-lg focus:outline-green-400 bg-gray-50"
                      placeholderText="YYYY-MM-DD"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-700">End Date <span className="text-red-500">*</span></label>
                    <DatePicker
                      selected={editEndDate ? new Date(editEndDate) : null}
                      onChange={date => setEditEndDate(date ? date.toISOString().split('T')[0] : '')}
                      dateFormat="yyyy-MM-dd"
                      className="w-full border rounded-lg px-3 py-2 text-lg focus:outline-green-400 bg-gray-50"
                      placeholderText="YYYY-MM-DD"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-auto">
                  <button type="button" className="flex-1 border border-gray-300 rounded-lg py-2 text-gray-700 font-semibold hover:bg-gray-100" onClick={() => setEditCertificateDrawerOpen(false)}>Cancel</button>
                  <button type="submit" className="flex-1 bg-green-600 text-white rounded-lg py-2 font-semibold hover:bg-green-700">
                    Update Certificate
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">No certificate data available</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LearnerCertificateDetails; 