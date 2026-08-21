'use client'
import { useEffect, useState, useRef } from 'react';
import { MoreVertical, Search, ChevronDown, Download } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Filter } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../../../../utils/api';
import ReactDOM from 'react-dom';
import { toast } from 'react-toastify';

function Certificates() {

  const router = useRouter();

    const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingCertificate, setDeletingCertificate] = useState(null);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, top: 0, width: 0 });

  // Function to delete certificate
  const handleDeleteCertificate = async (certificateId) => {
    if (!certificateId) {
      toast.error('Certificate ID not found');
      return;
    }

    setDeletingCertificate(certificateId);
    try {
      const token = Cookies.get('accessToken');
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/certificates/deletecertificate?certificateid=${certificateId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.success) {
        toast.success('Certificate deleted successfully');
        // Remove the deleted certificate from the state
        setCertificates(prev => prev.filter(cert => cert.templateId !== certificateId));
      } else {
        toast.error(response.data?.message || 'Failed to delete certificate');
      }
    } catch (error) {
      console.error('Error deleting certificate:', error);
      toast.error(error.response?.data?.message || 'Failed to delete certificate');
    } finally {
      setDeletingCertificate(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/api/certificates/getcertificates')
      .then(res => {
        setCertificates(
          Array.isArray(res.data?.data) ? res.data.data : []
        );
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch certificates');
        setLoading(false);
      });
  }, []);

  const filteredLearners = certificates.filter(certificate => {
    const keyword = searchTerm.toLowerCase();
    return (
      (certificate.name?.toLowerCase().includes(keyword) || '') 
    );
  });

  useEffect(() => {
    if (openDropdownIndex === null) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownIndex(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownIndex]);

  return (
    <div className="p-6 bg-white rounded-xl shadow min-h-screen">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">Certificates</h1>
          <p className="text-gray-500 text-sm">Create, Edit and Issue certificates to your learners.</p>
        </div>
      

        <div className="flex items-center gap-4">
          <div className="relative text-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name"
              className="border pl-8 pr-2 py-3 rounded-[5px] w-[200px] text-sm"
            />
          </div>
        
    
          <button onClick={() => router.push('/admin/certificates/create')} className="bg-blue text-white px-4 py-2 rounded-[5px]">+ Create New Certificate</button>
        </div>

      
      </div>

      {/* Filters and Export */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          {/* Learner Status Dropdown */}
          <div className="relative">
            <button  className="text-blue-600 font-medium flex items-center">
              All Certificates 
            </button>
          
          </div>
          <div className="bg-gray-100 px-2 py-1 text-sm rounded-md">{filteredLearners.length}</div>
        </div>

        
      </div>

      {/* Learners Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-10 text-blue-600 font-semibold">Loading certificates...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500 font-semibold">{error}</div>
        ) : (
        <table className="w-full table-auto border-collapse text-sm">
          <thead className="bg-gray-100 text-left text-gray-700">
            <tr>
              <th className="px-4 py-2">Sr.</th>
              <th className="px-4 py-2">Certificate Name</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Serial Prefix</th>
              <th className="px-4 py-2">Issued</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
           {filteredLearners.map((Certificate, index) => {
              return (
                <tr key={Certificate.id || index} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{String(index + 1).padStart(2, '0')}</td>
                  <td className="px-4 py-3 cu">
                    <Link href={`/admin/certificates/learners/${Certificate.templateId}`}> 
                      <span>{Certificate.name ?? 'N/A'}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-500 text-sm">{Certificate.description ?? 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3">
                    {Certificate.serialPrefix ?? Certificate.serial_prefix ?? 'N/A'}
                  </td>
                  <td className="px-4 py-3">{
                    Certificate.created_at
                      ? new Date(Certificate.created_at).toISOString().slice(0, 10)
                      : Certificate.createdAt
                        ? new Date(Certificate.createdAt).toISOString().slice(0, 10)
                        : 'N/A'
                  }</td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={e => {
                        setOpenDropdownIndex(openDropdownIndex === index ? null : index);
                        if (openDropdownIndex !== index) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const dropdownWidth = 180; // px, adjust as needed
                          let left = rect.right - dropdownWidth;
                          if (left < 8) left = 8; // prevent left overflow
                          // Prevent right overflow
                          if (left + dropdownWidth > window.innerWidth - 8) {
                            left = window.innerWidth - dropdownWidth - 8;
                          }
                          setDropdownPosition({
                            left,
                            top: rect.bottom + 4, // 4px offset below button
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
                        ref={dropdownRef}
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
                            onClick={() => {
                              router.push(`/admin/certificates/learners/${Certificate.templateId}`);
                              setOpenDropdownIndex(null);
                            }}
                          >
                            View Details
                          </li>
                          <li
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              router.push(`/admin/certificates/${Certificate.templateId}/edit-template`);
                              setOpenDropdownIndex(null);
                            }}
                          >
                            Edit Template
                          </li>
                          <li
                            className="px-4 py-2 hover:bg-red-100 text-red-500 cursor-pointer"
                            onClick={() => {
                              if (deletingCertificate === Certificate.templateId) return; // Prevent multiple clicks
                              handleDeleteCertificate(Certificate.templateId);
                              setOpenDropdownIndex(null);
                            }}
                          >
                            {deletingCertificate === Certificate.templateId ? 'Deleting...' : 'Delete'}
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
    </div>
  )
}

export default Certificates
