"use client"

import React from "react"

export default function ReferralsTab({ referrals, referralsLoading, referralsError, referralCode, walletBalance, toast }) {
	return (
		<div className="mt-4">
			<div className="bg-white shadow rounded-2xl p-8 border border-gray-100 mb-8">
				<div className="flex items-center justify-between mb-6">
					<h3 className="text-lg font-bold text-gray-800">Referrals</h3>
					<div className="flex items-center gap-6">
						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-500 font-medium">Referral Code</span>
							<span className="font-mono text-base font-semibold text-blue-700 select-all">{referralCode}</span>
							<button className="p-1 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300" onClick={() => { navigator.clipboard.writeText(referralCode); toast.success('Referral code copied!'); }} title="Copy Referral Code" type="button" style={{ lineHeight: 0 }}>
								<svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
							</button>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-500 font-medium">Wallet Balance</span>
							<span className="font-mono text-base font-bold text-yellow-700">{walletBalance}</span>
						</div>
					</div>
				</div>
				{referralsLoading ? (
					<div className="text-center py-8 text-gray-400">Loading...</div>
				) : referralsError ? (
					<div className="text-center py-8 text-red-500">{referralsError}</div>
				) : (!referrals || referrals.length === 0) ? (
					<div className="flex flex-col items-center justify-center py-12">
						<svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-blue-200 mb-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 14v2a4 4 0 01-8 0v-2M12 11a4 4 0 100-8 4 4 0 000 8zm6 8v-2a6 6 0 00-12 0v2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2M7 8H5a2 2 0 00-2 2v6a2 2 0 002 2h2" /></svg>
						<div className="text-lg font-semibold text-gray-500 mb-2">This user hasn't referred anyone yet!</div>
						<div className="text-gray-400">Referrals made by this user will appear here.</div>
					</div>
				) : (
					<table className="w-full table-auto border-collapse text-sm">
						<thead className="bg-gray-100 text-left text-gray-700">
							<tr>
								<th className="px-4 py-2">Sr. No.</th>
								<th className="px-4 py-2">Name</th>
								<th className="px-4 py-2">Email</th>
								<th className="px-4 py-2">Referred Date</th>
								<th className="px-4 py-2">Amount Earned</th>
							</tr>
						</thead>
						<tbody>
							{referrals.map((ref, idx) => (
								<tr key={`${ref.email}-${ref.name}-${idx}`} className="border-b hover:bg-gray-50">
									<td className="px-4 py-3">{idx + 1}</td>
									<td className="px-4 py-3">{ref.name}</td>
									<td className="px-4 py-3">{ref.email}</td>
									<td className="px-4 py-3">{ref.enrolled ? new Date(ref.enrolled).toLocaleDateString() : '-'}</td>
									<td className="px-4 py-3">100</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	)
} 