'use client';

import { useEffect, useState } from 'react';
import { MoreVertical, Search, ChevronDown, ChevronRight, Download, ChevronLeft, Edit, Edit2 } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Filter } from 'lucide-react';
import api from '../../../../../utils/api';

export default function Certificatesissued() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Learners');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/api/certificates/getcertificates')
      .then(res => {
        setCertificates(Array.isArray(res.data?.data) ? res.data.data : []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch certificates');
        setLoading(false);
      });
  }, []);

  const filteredCertificates = certificates.filter(cert => {
    const keyword = searchTerm.toLowerCase();
    return (
      (cert.name?.toLowerCase().includes(keyword) || '') ||
      (cert.description?.toLowerCase().includes(keyword) || '')
    );
  });

  return (
    <div className="p-6 bg-white rounded-xl shadow h-screen overflow-y-auto">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6">
        <div className='flex items-center gap-2'>
          <div onClick={() => window.history.back()} className="bg-blue-light flex cursor-pointer items-center justify-center h-[48px] w-[40px] rounded">
            <ChevronLeft />
          </div>
          <div>
            <h1 className="text-xl font-bold">Certificates</h1>
            <p className="text-gray-500 text-sm">Course Completion Certificates.</p>
          </div>
        </div>


        <div className="flex items-center gap-4">
          <div className="relative text-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name, Email, Mobile..."
              className="border pl-8 pr-2 py-3 rounded-[5px] w-[200px] text-sm"
            />
          </div>
          <div className="relative text-sm">
            <Edit2 className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <button className='border cursor-pointer pl-8 pr-2 py-3 rounded-[5px] w-[150px] text-sm'>
              Edit Template
            </button>
          </div>


          <button className="bg-green-600 text-white px-5 py-2 rounded-[5px] font-semibold shadow hover:bg-green-700 transition-all duration-150">+ Issue Certificate</button>
        </div>


      </div>

      <div className="flex  my-5">
        <div className="flex justify-between items-center gap-10">
          <div className='border-r-2 pr-4 '>
            <div className="text-blue-600  font-medium flex items-center">
              Serial Prefix
            </div>
            <p className='text-sm'>ABC2025C0</p>
          </div>
          <div className='border-r-2 pr-4 '>
            <div className="text-blue-600 font-medium flex items-center">
              Validity
            </div>
            <p className='text-sm'>Always available</p>
          </div>
          <div className='border-r-2 pr-4 '>
            <div className="text-blue-600  font-medium flex items-center">
              Certificates Issues
            </div>
            <p className='text-sm'>19</p>
          </div>
          <div className=''>
            <div className="text-blue-600  font-medium flex items-center">
              Certificates Published
            </div>
            <p className='text-sm'>10</p>
          </div>

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
              <th className="px-4 py-2">Sl.No</th>
              <th className="px-4 py-2">Certificate Name</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Serial Prefix</th>
              <th className="px-4 py-2">Issued Date</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCertificates.map((cert, index) => (
              <tr key={cert.templateId || index} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">{String(index + 1).padStart(2, '0')}</td>
                <td className="px-4 py-3 whitespace-nowrap">{cert.name ?? 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap">{cert.description ?? 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap">{cert.serialPrefix ?? cert.serial_prefix ?? 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap">{
                  cert.created_at
                    ? new Date(cert.created_at).toISOString().slice(0, 10)
                    : cert.createdAt
                      ? new Date(cert.createdAt).toISOString().slice(0, 10)
                      : 'N/A'
                }</td>
                <td className="px-4 py-3 whitespace-nowrap">{cert.status ?? 'N/A'}</td>
                <td className="px-4 py-3 relative whitespace-nowrap">
                  <button
                    onClick={() => setOpenDropdownIndex(openDropdownIndex === index ? null : index)}
                    className="p-2"
                  >
                    <MoreVertical />
                  </button>
                  {openDropdownIndex === index && (
                    <div className="absolute right-2 mt-1 w-40 bg-white shadow-md rounded-md z-10 border">
                      <ul className="text-sm">
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer whitespace-nowrap">Publish/Unpublish</li>
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer whitespace-nowrap">Download</li>
                        <li className="px-4 py-2 hover:bg-red-100 text-red-500 cursor-pointer whitespace-nowrap">Edit</li>
                      </ul>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
