'use client';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, UploadCloud, Trash2, BookOpen, FileText, Layout, Square, CheckCircle2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

export default function EditCertificateTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const certificateId = params.id;
  
  // Only the fields that backend actually supports
  const [certificateName, setCertificateName] = useState('');
  const [serialPrefix, setSerialPrefix] = useState('');
  const [description, setDescription] = useState('');
  const [templateUrl, setTemplateUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch certificate data on component mount
  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const token = Cookies.get('accessToken');
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/certificates/getcertificates`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          const certificates = response.data.data || [];
          const certificate = certificates.find(cert => cert.templateId === parseInt(certificateId));
          
          if (certificate) {
            setCertificateName(certificate.name || '');
            setSerialPrefix(certificate.serialPrefix || '');
            setDescription(certificate.description || '');
            setTemplateUrl(certificate.templateUrl || '');
          } else {
            toast.error('Certificate not found');
            router.push('/admin/certificates');
          }
        } else {
          toast.error('Failed to fetch certificate data');
        }
      } catch (error) {
        console.error('Error fetching certificate:', error);
        toast.error('Failed to fetch certificate data');
      } finally {
        setLoading(false);
      }
    };

    if (certificateId) {
      fetchCertificate();
    }
  }, [certificateId, router]);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/html') {
      setSelectedFile(file);
      setTemplateUrl(file.name);
    } else {
      toast.error('Please select a valid HTML file');
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      if (!selectedFile) {
        toast.error('Please select an HTML template file');
        return;
      }

      const token = Cookies.get('accessToken');
      const formData = new FormData();
      formData.append('templateId', certificateId);
      formData.append('name', certificateName);
      formData.append('description', description);
      formData.append('templateUrl', templateUrl);
      formData.append('serialPrefix', serialPrefix);
      formData.append('htmlFile', selectedFile);

      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/certificates/updatecertificate`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      if (response.data.success) {
        toast.success('Certificate template updated successfully!');
        router.push('/admin/certificates');
      } else {
        toast.error(response.data.message || 'Failed to update certificate');
      }
    } catch (error) {
      console.error('Error updating certificate:', error);
      toast.error(error.response?.data?.message || 'Failed to update certificate');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-blue-600 font-semibold">Loading certificate...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="p-8 bg-white rounded-2xl shadow-lg max-w-6xl mx-auto border border-gray-100">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button onClick={() => router.back()} className="mr-3 p-2 rounded hover:bg-gray-100">
            <ArrowLeft size={28} />
          </button>
          <div>
            <h1 className="text-2xl font-bold leading-tight">Edit Certificate Template</h1>
            <div className="text-blue-600 text-base font-medium">Course Completion</div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Form Fields - Only what backend supports */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">Certificate Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={certificateName} 
                onChange={e => setCertificateName(e.target.value)} 
                maxLength={50} 
                className="border px-4 py-2 rounded-md w-full text-sm" 
                required
              />
              <div className="text-xs text-gray-400 mt-1 text-right">{certificateName.length} / 50</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Serial Prefix <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={serialPrefix} 
                onChange={e => setSerialPrefix(e.target.value)} 
                maxLength={50} 
                className="border px-4 py-2 rounded-md w-full text-sm" 
                required
              />
              <div className="text-xs text-gray-400 mt-1 text-right">{serialPrefix.length} / 50</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                rows={3} 
                className="border px-4 py-2 rounded-md w-full text-sm" 
                placeholder="Enter certificate description"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">HTML Template <span className="text-red-500">*</span></label>
              <div className="border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center text-gray-400 cursor-pointer mb-2 bg-gray-50 relative">
                <input
                  type="file"
                  accept=".html,.htm"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <UploadCloud size={32} className="mb-1 text-blue-500" />
                <span className="font-medium">Choose HTML Certificate Template</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-600">{templateUrl || 'No file selected'}</span>
                {selectedFile && (
                  <button 
                    type="button"
                    className="text-red-500 hover:bg-red-50 rounded p-1"
                    onClick={() => {
                      setSelectedFile(null);
                      setTemplateUrl('');
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Current template: {templateUrl || 'None'}</p>
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-8">
          <button className="border px-6 py-2 rounded-md text-gray-700 hover:bg-gray-100" onClick={() => router.back()}>Cancel</button>
          <button 
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              submitting 
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
            }`}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Updating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Update Certificate</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 