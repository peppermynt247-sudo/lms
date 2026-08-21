"use client"

import React from "react"

export default function EnrollmentsTab({ enrollments, enrollmentsLoading, getField, formatAttendance }) {
	return (
		<div className="mt-4">
			<table className="w-full table-auto border-collapse text-sm">
				<thead className="bg-gray-100 text-left text-gray-700">
					<tr>
						<th className="px-4 py-2">Sr.</th>
						<th className="px-4 py-2">Course name</th>
						<th className="px-4 py-2">Batch name</th>
						<th className="px-4 py-2">Attendance</th>
						<th className="px-4 py-2">Progress</th>
					</tr>
				</thead>
				<tbody>
					{enrollmentsLoading ? (
						<tr><td colSpan="5" className="text-center py-4 text-gray-400">Loading...</td></tr>
					) : (!enrollments || enrollments.length === 0) ? (
						<tr><td colSpan="5" className="text-center py-4 text-gray-400">No data</td></tr>
					) : enrollments.map((enr, idx) => (
						<tr key={`${getField(enr, 'courseName', 'course_name', 'name', 'title')}-${idx}`} className="border-b hover:bg-gray-50">
							<td className="px-4 py-3">{idx + 1}</td>
							<td className="px-4 py-3">
								<div>{getField(enr, 'courseName', 'course_name', 'name', 'title')}</div>
							</td>
							<td className="px-4 py-3">{getField(enr, 'batchName', 'batch_name')}</td>
							<td className="px-4 py-3">{formatAttendance(getField(enr, 'enrolled', 'attendance'))}</td>
							<td className="px-4 py-3">
								<div className="w-full bg-gray-200 rounded-full h-2.5">
									<div className="bg-green-600 h-2.5 rounded-full" style={{ width: getField(enr, 'progress', 'progressPercentage', 'progress_percentage') + '%' }}></div>
								</div>
								<span>{getField(enr, 'progress', 'progressPercentage', 'progress_percentage') || '0%'}</span>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
} 