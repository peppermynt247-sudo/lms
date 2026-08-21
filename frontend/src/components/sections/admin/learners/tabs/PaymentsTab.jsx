"use client"

import React from "react"

export default function PaymentsTab({ payments, paymentsLoading, id }) {
	return (
		<div className="mt-4">
			{paymentsLoading ? (
				<div className="text-center py-8 text-gray-400">Loading payments...</div>
			) : (!payments || payments.length === 0) ? (
				<div className="text-center py-8 text-gray-400">
					<div>No payment records found.</div>
					<div className="text-xs text-gray-500 mt-2">Debug: payments array length = {payments?.length || 0}</div>
					<div className="text-xs text-gray-500">User ID: {id}</div>
				</div>
			) : (
				<table className="w-full table-auto border-collapse text-sm">
					<thead className="bg-gray-100 text-left text-gray-700">
						<tr>
							<th className="px-4 py-2">Sr.</th>
							<th className="px-4 py-2">Amount</th>
							<th className="px-4 py-2">Date</th>
							<th className="px-4 py-2">Payment Method</th>
							<th className="px-4 py-2">Transaction ID</th>
						</tr>
					</thead>
					<tbody>
						{payments.map((pmt, idx) => (
							<tr key={pmt.paymentId || idx} className="border-b hover:bg-gray-50">
								<td className="px-4 py-3">{idx + 1}</td>
								<td className="px-4 py-3">
									<span className="font-bold text-green-700">₹{pmt.amount ? Number(pmt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</span>
								</td>
								<td className="px-4 py-3"><span className="font-medium text-gray-700">{pmt.date ? new Date(pmt.date).toLocaleDateString() : '-'}</span></td>
								<td className="px-4 py-3">
									<span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all 
									${pmt.paymentMethod?.toLowerCase() === 'cash' ? 'bg-yellow-100 text-yellow-700' :
										pmt.paymentMethod?.toLowerCase() === 'upi' ? 'bg-blue-100 text-blue-700' :
										pmt.paymentMethod?.toLowerCase() === 'card' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
										{pmt.paymentMethod || 'N/A'}
									</span>
								</td>
								<td className="px-4 py-3"><span className="font-mono text-xs text-gray-700">{pmt.transactionId || '-'}</span></td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	)
} 