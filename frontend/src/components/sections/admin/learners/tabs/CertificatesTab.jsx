"use client"

import React from "react"
import { MoreVertical, X } from "lucide-react"
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function CertificatesTab({ 
  certificates, 
  certificatesLoading, 
  getField, 
  openCertificateDropdown, 
  setOpenCertificateDropdown, 
  toast, 
  onEdit, 
  onDelete,
  editCertificateDrawerOpen,
  setEditCertificateDrawerOpen,
  certificateTemplatesLoading,
  editCertificateData,
  editIssuedDate,
  setEditIssuedDate,
  editStartDate,
  setEditStartDate,
  editEndDate,
  setEditEndDate,
  setEditCertificateData,
  id,
  axios,
  Cookies
}) {
	return (
		<div className="mt-4">
			<table className="w-full table-auto border-collapse text-sm">
				<thead className="bg-gray-100 text-left text-gray-700">
					<tr>
						<th className="px-4 py-2">Sr.</th>
						<th className="px-4 py-2">Issued Certificate</th>
						<th className="px-4 py-2">Course</th>
						<th className="px-4 py-2">Actions</th>
					</tr>
				</thead>
				<tbody>
					{certificatesLoading ? (
						<tr><td colSpan="4" className="text-center py-8 text-gray-400">Loading certificates...</td></tr>
					) : (!certificates || certificates.length === 0) ? (
						<tr><td colSpan="4" className="text-center py-8 text-gray-400">No certificates found</td></tr>
					) : certificates.map((cert, idx) => (
						<tr key={cert.id || idx} className="border-b hover:bg-gray-50">
							<td className="px-4 py-3">{idx + 1}</td>
							<td className="px-4 py-3">
								{cert.certificateName || getField(cert, 'name', 'certificate_name')}
								<div className="text-xs text-gray-400 hidden">Debug: {JSON.stringify(cert)}</div>
							</td>
							<td className="px-4 py-3">{getField(cert, 'course', 'course_name', 'courseName')}</td>
							<td className="px-4 py-3 relative">
								<button onClick={e => { e.stopPropagation(); setOpenCertificateDropdown(openCertificateDropdown === idx ? null : idx); }}>
									<MoreVertical className="w-4 h-4" />
								</button>
								{openCertificateDropdown === idx && (
									<div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-20">
										<ul className="text-xs sm:text-sm">
											<li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { toast.info("Download functionality coming soon"); setOpenCertificateDropdown(null); }}>Download</li>
											<li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => onEdit(cert)}>Edit</li>
											<li className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600" onClick={() => onDelete(cert)}>Delete</li>
										</ul>
									</div>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{/* Edit Certificate Drawer */}
			{editCertificateDrawerOpen && (
				<div className="fixed inset-0 z-50 flex justify-end">
					<div className="flex-1 bg-black bg-opacity-30" onClick={() => setEditCertificateDrawerOpen(false)} />
					<div className="w-full max-w-md h-full bg-white shadow-2xl p-8 relative animate-slide-in-right flex flex-col" style={{ borderTopLeftRadius: 18, borderBottomLeftRadius: 18 }}>
						<button className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl" onClick={() => setEditCertificateDrawerOpen(false)}>&times;</button>
						<h2 className="text-2xl font-bold mb-6 text-blue-700">
							Edit Certificate
						</h2>

						{certificateTemplatesLoading ? (
							<div className="flex items-center justify-center h-32">
								<div className="text-gray-500">Loading certificate template...</div>
							</div>
						) : editCertificateData ? (
							<form className="flex flex-col gap-5 flex-1" onSubmit={async e => {
								e.preventDefault();
								const token = Cookies.get('accessToken');

								// Create JSON payload for issued certificate update
								// Convert dates to ISO format for LocalDateTime parsing
								const formatDateForBackend = (dateStr) => {
									if (!dateStr) return null;

									// If it's already a full ISO string with time, return as is
									if (dateStr.includes('T') && dateStr.includes(':')) {
										return dateStr;
									}

									// If it's just a date (YYYY-MM-DD), add time
									if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
										return `${dateStr}T00:00:00`;
									}

									// If it's a date with time but malformed, clean it up
									if (dateStr.includes('T')) {
										// Remove any redundant time parts
										const datePart = dateStr.split('T')[0];
										return `${datePart}T00:00:00`;
									}

									// Default fallback
									return dateStr;
								};

								const payload = {
									courseName: e.target.courseName.value,
									collegeName: e.target.collegeName.value,
									isPublished: e.target.isPublished.checked,
									issuedAt: formatDateForBackend(editIssuedDate),
									startDate: formatDateForBackend(editStartDate),
									endDate: formatDateForBackend(editEndDate)
								};

								const config = {
									headers: {
										'Authorization': `Bearer ${token}`,
										'Content-Type': 'application/json'
									}
								};

								try {
									// Update issued certificate using the endpoint from Postman
									// Use dynamic template ID and user ID
									// Get template ID from certificate data or use a default
									const templateId = editCertificateData?.templateId || editCertificateData?.template?.templateId || 1;
									const userId = id; // Use the current learner ID from URL

									const response = await axios.put(
										`${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/certificates/updateissuedcertificate/${templateId}/${userId}`,
										payload,
										config
									);

									if (response.data.success) {
										toast.success("Certificate updated successfully!");
										setEditCertificateDrawerOpen(false);
										setEditCertificateData(null);
									} else {
										toast.error("Failed to update certificate: " + (response.data.message || "Unknown error"));
									}
								} catch (error) {
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
										<input
											name="isPublished"
											type="checkbox"
											checked={editCertificateData?.isPublished || false}
											onChange={(e) => {
												setEditCertificateData(prev => ({
													...prev,
													isPublished: e.target.checked
												}));
											}}
											className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
										/>
										<label className="text-sm text-gray-700">Publish this certificate</label>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-xs font-semibold mb-1 text-gray-700">Issue Date <span className="text-red-500">*</span></label>
										<DatePicker
											selected={editIssuedDate ? new Date(editIssuedDate) : null}
											onChange={date => setEditIssuedDate(date ? date.toISOString().split('T')[0] : null)}
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
											onChange={date => setEditStartDate(date ? date.toISOString().split('T')[0] : null)}
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
											onChange={date => setEditEndDate(date ? date.toISOString().split('T')[0] : null)}
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
								<div className="text-gray-500">No certificate template data available</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
} 