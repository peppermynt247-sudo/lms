"use client"

import { useEffect, useMemo, useState } from "react"
import Cookies from "js-cookie"

export default function CouponEditDrawer({ open, onClose, coupon, onUpdated }) {
	const [typeOpen, setTypeOpen] = useState(false)
	const [form, setForm] = useState({
		code: "",
		description: "",
		discountPercentage: "",
		minPurchaseAmount: "",
		startDate: "",
		expiresAt: "",
		isActive: true,
		couponType: "MULTIPLE",
		couponId: undefined,
	})
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState("")

	useEffect(() => {
		if (coupon && open) {
			setForm({
				code: coupon.code ?? "",
				description: coupon.description ?? "",
				discountPercentage: coupon.discountPercentage != null ? String(coupon.discountPercentage) : "",
				minPurchaseAmount: coupon.minPurchaseAmount != null ? String(coupon.minPurchaseAmount) : "",
				startDate: normalizeIso(coupon.startDate) ?? "",
				expiresAt: normalizeIso(coupon.expiresAt) ?? "",
				isActive: Boolean(coupon.isActive),
				couponType: coupon.couponType ?? "MULTIPLE",
				couponId: coupon.couponId,
			})
			setError("")
		}
	}, [coupon, open])

	useEffect(() => {
		if (!open) return
		const original = document.body.style.overflow
		document.body.style.overflow = typeOpen ? "hidden" : original
		return () => {
			document.body.style.overflow = original
		}
	}, [typeOpen, open])

	const backendBaseUrl = useMemo(() => {
		return process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL || "http://localhost:8080"
	}, [])

	function normalizeIso(value) {
		if (!value) return ""
		// Accept both full ISO and date-only strings, return yyyy-MM-ddTHH:mm:ss
		try {
			const d = new Date(value)
			if (isNaN(d.getTime())) return value
			const pad = (n) => String(n).padStart(2, "0")
			const yyyy = d.getFullYear()
			const MM = pad(d.getMonth() + 1)
			const dd = pad(d.getDate())
			const hh = pad(d.getHours())
			const mm = pad(d.getMinutes())
			const ss = pad(d.getSeconds())
			return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}`
		} catch {
			return value
		}
	}

	const handleChange = (field, value) => {
		setForm((prev) => ({ ...prev, [field]: value }))
	}

	const handleSubmit = async (e) => {
		e?.preventDefault?.()
		setSubmitting(true)
		setError("")
		try {
			const token = Cookies.get("accessToken")
			if (!token) {
				throw new Error("Not authenticated")
			}

			// Simple validation
			if (!form.code?.trim()) throw new Error("Code is required")
			if (!form.description?.trim()) throw new Error("Description is required")
			if (form.discountPercentage === "") throw new Error("Discount is required")
			if (Number(form.discountPercentage) < 0 || Number(form.discountPercentage) > 100) throw new Error("Discount must be 0-100")
			if (form.minPurchaseAmount === "") throw new Error("Min purchase is required")
			if (Number(form.minPurchaseAmount) < 0) throw new Error("Min purchase cannot be negative")
			if (!form.startDate) throw new Error("Start date is required")
			if (!form.expiresAt) throw new Error("Expiry date is required")
			if (!form.couponId && form.couponId !== 0) throw new Error("Invalid coupon id")

			const payload = {
				code: form.code.trim(),
				description: form.description.trim(),
				discountPercentage: Number(form.discountPercentage),
				minPurchaseAmount: Number(form.minPurchaseAmount),
				startDate: normalizeIso(form.startDate),
				expiresAt: normalizeIso(form.expiresAt),
				isActive: Boolean(form.isActive),
				couponType: form.couponType,
				couponId: form.couponId,
			}

			const res = await fetch(`${backendBaseUrl}/api/coupon/update`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
			})

			const data = await res.json().catch(() => ({}))
			if (!res.ok || data?.success === false) {
				throw new Error(data?.message || "Failed to update coupon")
			}

			// Backend returns { success, message, Data: string }
			onUpdated?.(payload)
			onClose?.()
		} catch (err) {
			setError(err.message || "Update failed")
		} finally {
			setSubmitting(false)
		}
	}

	if (!open) return null

	return (
		<div className="fixed inset-0 z-[60]">
			<div className="absolute inset-0 bg-black/30" onClick={submitting ? undefined : onClose} />
			<div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl border-l border-gray-200 rounded-l-2xl overflow-hidden flex flex-col">
				<div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
					<h3 className="text-base font-semibold text-gray-900">Edit Coupon</h3>
					<button
						onClick={onClose}
						disabled={submitting}
						className="text-gray-500 hover:text-gray-700 text-sm"
					>
						Close
					</button>
				</div>

				<form onSubmit={handleSubmit} className={`p-6 space-y-4 ${typeOpen ? 'overflow-hidden' : 'overflow-auto'}`}>
					{error ? (
						<div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
							{error}
						</div>
					) : null}

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
							<input
								type="text"
								value={form.code}
								onChange={(e) => handleChange("code", e.target.value)}
								placeholder="e.g., SAVE25NOW"
								className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-gray-700 mb-1">Discount %</label>
								<input
								type="number"
								min={0}
								max={100}
								value={form.discountPercentage}
								onChange={(e) => handleChange("discountPercentage", e.target.value)}
								placeholder="e.g., 25"
								className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div className="sm:col-span-2">
							<label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
							<textarea
								rows={2}
								value={form.description}
								onChange={(e) => handleChange("description", e.target.value)}
								placeholder="e.g., 25% off on your first purchase"
								className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-gray-700 mb-1">Min Purchase (₹)</label>
							<input
								type="number"
								min={0}
								step="1"
								value={form.minPurchaseAmount}
								onChange={(e) => handleChange("minPurchaseAmount", e.target.value)}
								placeholder="e.g., 500"
								className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
							<button
								type="button"
								onClick={() => handleChange("isActive", !form.isActive)}
								className={`${form.isActive ? "bg-green-500" : "bg-gray-300"} relative inline-flex h-8 w-14 items-center rounded-full transition-colors`}
							>
								<span
									className={`${form.isActive ? "translate-x-7" : "translate-x-1"} inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform`}
								/>
								<span className="sr-only">Toggle Status</span>
							</button>
							<div className="mt-1 text-xs text-gray-500">{form.isActive ? 'Active' : 'Inactive'}</div>
						</div>
						<div>
							<label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
							<input
								type="datetime-local"
								value={form.startDate}
								onChange={(e) => handleChange("startDate", e.target.value)}
								placeholder="Select start date and time"
								className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-gray-700 mb-1">Expires At</label>
							<input
								type="datetime-local"
								value={form.expiresAt}
								onChange={(e) => handleChange("expiresAt", e.target.value)}
								placeholder="Select expiry date and time"
								className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
							<div className="relative" tabIndex={0} onBlur={() => setTypeOpen(false)}>
								<button
									type="button"
									onClick={() => setTypeOpen((v) => !v)}
									className="w-full rounded-full border border-gray-300 px-4 py-2 text-sm shadow-sm text-gray-800 hover:bg-gray-50"
								>
									{form.couponType}
								</button>
								{typeOpen ? (
									<div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-lg ring-1 ring-black/10 overflow-visible p-1">
										<button
											aria-selected={form.couponType === 'MULTIPLE'}
											onMouseDown={(e) => e.preventDefault()}
											onClick={() => { handleChange('couponType', 'MULTIPLE'); setTypeOpen(false) }}
											className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors duration-150 ${form.couponType === 'MULTIPLE' ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
										>
											<span>MULTIPLE</span>
											{form.couponType === 'MULTIPLE' ? (
												<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
											) : null}
										</button>
										<button
											aria-selected={form.couponType === 'SINGLE'}
											onMouseDown={(e) => e.preventDefault()}
											onClick={() => { handleChange('couponType', 'SINGLE'); setTypeOpen(false) }}
											className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors duration-150 ${form.couponType === 'SINGLE' ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
										>
											<span>SINGLE</span>
											{form.couponType === 'SINGLE' ? (
												<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
											) : null}
										</button>
									</div>
								) : null}
							</div>
						</div>
					</div>

					<div className="pt-2 flex items-center justify-end gap-3">
						<button
							type="button"
							disabled={submitting}
							onClick={onClose}
							className="px-4 py-2 text-sm rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={submitting}
							className="px-4 py-2 text-sm rounded-full text-white hover:opacity-90 disabled:opacity-60"
							style={{ backgroundColor: "#ff5e04" }}
						>
							{submitting ? "Updating..." : "Update Coupon"}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
} 