'use client'
import { Check, ChevronLeft } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { toast } from "react-toastify";
import Cookies from 'js-cookie';

const Createcertificate = () => {
  const fileInputRef = useRef(null);
  const [certificateName, setCertificateName] = useState("");
  const [serialPrefix, setSerialPrefix] = useState("");
  const [description, setDescription] = useState("");
  const [templateFile, setTemplateFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    setTemplateFile(e.target.files[0]);
  };

  const handleCreateCertificate = async () => {
    if (!certificateName || !serialPrefix || !templateFile) {
      toast.error("Please fill all required fields and upload the HTML template file.");
      return;
    }
    setIsSubmitting(true);
    
    try {
      // Create FormData to match backend multipart/form-data expectation
      const formData = new FormData();
      formData.append("name", certificateName);
      formData.append("description", description);
      formData.append("templateUrl", ""); // Backend expects this but will use the uploaded file
      formData.append("serialPrefix", serialPrefix);
      formData.append("htmlFile", templateFile);

      // Send to backend with multipart/form-data
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL || 'https://atomslmsapi.abc.courses/atoms';
      // Get the auth token
      const token = localStorage.getItem('authToken') || Cookies.get('accessToken');
      
      const res = await fetch(`${backendUrl}/api/certificates/createcertificate`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type header, let browser set it for FormData
        },
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Create certificate error:", errorData);
        toast.error(errorData.message || "Failed to create certificate.");
        setIsSubmitting(false);
        return;
      }
      
      const responseData = await res.json();
      toast.success(responseData.message || "Certificate created successfully!");
      
      // Reset form
      setCertificateName("");
      setSerialPrefix("");
      setDescription("");
      setTemplateFile(null);
      setShowDescription(false);
      
    } catch (err) {
      console.error("Create certificate exception:", err);
      toast.error("Failed to create certificate.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div onClick={() => window.history.back()} className="bg-blue-light flex cursor-pointer items-center justify-center h-[48px] w-[40px] rounded">
              <ChevronLeft />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Create Certificate Template</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-blue text-white  px-4 py-2 rounded-[5px]" onClick={handleCreateCertificate} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Certificate'}
            </button>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 border rounded-[5px] lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[5px] shadow-sm border border-gray-200">
              <div className="p-6 space-y-6">
                {/* Certificate Name */}
                <div className="space-y-2">
                  <label htmlFor="certificate-name" className="block text-sm font-medium text-gray-700">Certificate Name</label>
                  <div className="relative">
                    <input
                      id="certificate-name"
                      type="text"
                      placeholder="Enter certificate name"
                      value={certificateName}
                      onChange={(e) => setCertificateName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-[5px]  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{certificateName.length} / 50</span>
                  </div>
                </div>
                {/* Serial Prefix */}
                <div className="space-y-2">
                  <label htmlFor="serial-prefix" className="block text-sm  font-medium text-gray-700">Serial Prefix</label>
                  <div className="relative">
                    <input
                      id="serial-prefix"
                      type="text"
                      placeholder="Enter serial prefix"
                      value={serialPrefix}
                      onChange={(e) => setSerialPrefix(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{serialPrefix.length} / 50</span>
                  </div>
                </div>
                {/* Add Short Description */}
                <div>
                  <button
                    onClick={() => setShowDescription(!showDescription)}
                    className="flex items-center text-blue-600 hover:text-blue-700 rounded-[5px] text-sm font-normal"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Short Description <span className="text-gray-500 ml-1">(Optional)</span>
                  </button>
                  {showDescription && (
                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="Enter short description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
                {/* HTML Template */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">HTML Template <span className="text-red-500">*</span></label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer" onClick={handleClick}>
                    <p className="text-sm text-gray-600 font-medium">Choose HTML Template File</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".html,.htm" onChange={handleFileChange} />
                    {templateFile && <div className="mt-2 text-xs text-green-700">Selected: {templateFile.name}</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Right Column - Automation Settings (hidden, not sent) */}
        </div>
      </div>
    </div>
  );
};

export default Createcertificate;
