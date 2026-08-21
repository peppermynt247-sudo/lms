"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Plus, X, Tag, IndianRupee, Clock, Link2, ChevronDown,
  CheckCircle2, Loader2, Sparkles, TrendingUp, ShieldCheck,
  CreditCard, LayoutList, AlertCircle,
} from "lucide-react";
import api from "@utils/api";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";

/* ── Skeleton helpers ─────────────────────────────────────────────── */
function Sk({ className }) {
  return <div className={`sk rounded ${className}`} />;
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Sk className="h-3 w-20" />
        <Sk className="h-8 w-8 rounded-xl" />
      </div>
      <Sk className="h-7 w-28" />
      <Sk className="h-2.5 w-16 rounded-full" />
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-100">
      <div className="col-span-1"><Sk className="h-3 w-6" /></div>
      <div className="col-span-6 space-y-1.5">
        <Sk className="h-3.5 w-48" />
        <Sk className="h-2.5 w-28" />
      </div>
      <div className="col-span-3 space-y-1.5">
        <Sk className="h-5 w-20 rounded-full" />
      </div>
      <div className="col-span-2 flex justify-end"><Sk className="h-7 w-7 rounded-full" /></div>
    </div>
  );
}

/* ── Custom Select ────────────────────────────────────────────────── */
function PlanSelect({ templates, selectedId, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = templates.find((t) => t.planId === selectedId);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl
                   focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00]
                   transition-colors text-[#1a2b4e] bg-white"
      >
        <span className={selected ? "text-[#1a2b4e]" : "text-gray-400"}>
          {selected ? selected.name : "Choose a fee template…"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-gray-100 z-50 overflow-hidden"
          style={{ boxShadow: "0 8px 32px -4px rgba(26,43,78,0.18)" }}
        >
          <div className="py-1 max-h-56 overflow-y-auto">
            {templates.length === 0 ? (
              <div className="px-4 py-3 text-xs text-gray-400 text-center">
                No fee templates found
              </div>
            ) : (
              templates.map((t) => (
                <button
                  key={t.planId}
                  type="button"
                  onClick={() => { onSelect(t.planId); setOpen(false); }}
                  className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors
                              ${selectedId === t.planId
                                ? "bg-[#ff5b00]/8 text-[#ff5b00] font-semibold"
                                : "text-[#1a2b4e] hover:bg-[#ff5b00]/5"}`}
                >
                  <Tag className={`w-3.5 h-3.5 ${selectedId === t.planId ? "text-[#ff5b00]" : "text-[#0c63e4]"}`} />
                  {t.name}
                  {selectedId === t.planId && (
                    <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-[#ff5b00]" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────── */
export default function CoursePublishingForm() {
  const { courseId } = useParams();

  const [feeTemplates, setFeeTemplates]   = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [coursePricing, setCoursePricing] = useState({ price: 0, validityInDays: 0, plans: [] });
  const [loading, setLoading]             = useState(true);
  const [linkSidebarOpen, setLinkSidebarOpen]   = useState(false);
  const [priceSidebarOpen, setPriceSidebarOpen] = useState(false);
  const [linkSaving, setLinkSaving]   = useState(false);
  const [priceSaving, setPriceSaving] = useState(false);
  const [priceForm, setPriceForm]     = useState({ price: "", validityInDays: "" });

  /* fetch ─────────────────────────────────────────────────────────── */
  const fetchPricing = async () => {
    try {
      const res = await api.get(`/api/courses/${courseId}/pricing-details`);
      if (res.data?.success) setCoursePricing(res.data.data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get("/api/paymentplan/all");
        setFeeTemplates(res.data?.data || []);
      } catch { /* silent */ }
    };
    fetchTemplates();
  }, []);

  useEffect(() => { if (courseId) fetchPricing(); }, [courseId]);

  /* actions ───────────────────────────────────────────────────────── */
  const handleLinkPlan = async () => {
    if (!selectedPlanId) { toast.warn("Please select a fee template first."); return; }
    setLinkSaving(true);
    try {
      await api.post(`/api/courses/${courseId}/plans`, { planId: selectedPlanId });
      toast.success("Plan linked successfully!");
      setSelectedPlanId(null);
      setLinkSidebarOpen(false);
      await fetchPricing();
    } catch {
      toast.error("Failed to link pricing plan.");
    } finally {
      setLinkSaving(false);
    }
  };

  const handleSavePrice = async () => {
    if (!priceForm.price || !priceForm.validityInDays) {
      toast.warn("Please enter both price and validity.");
      return;
    }
    setPriceSaving(true);
    try {
      await api.put(`/api/courses/${courseId}/pricing`, {
        price: parseFloat(priceForm.price),
        validityInDays: parseInt(priceForm.validityInDays),
      });
      toast.success("Price & validity updated!");
      setPriceForm({ price: "", validityInDays: "" });
      setPriceSidebarOpen(false);
      await fetchPricing();
    } catch {
      toast.error("Failed to update price & validity.");
    } finally {
      setPriceSaving(false);
    }
  };

  const openPriceSidebar = () => {
    setPriceForm({
      price: coursePricing.price ? String(coursePricing.price) : "",
      validityInDays: coursePricing.validityInDays ? String(coursePricing.validityInDays) : "",
    });
    setPriceSidebarOpen(true);
  };

  /* ── render ───────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2b4e]">Fee Template &amp; Pricing</h1>
          <p className="text-sm text-gray-400 mt-1">Set course price, validity and link payment plans</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={openPriceSidebar}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#ff5b00] bg-[#ff5b00]/8
                       border border-[#ff5b00]/20 rounded-xl hover:bg-[#ff5b00]/15 transition-colors"
          >
            <IndianRupee className="w-3.5 h-3.5" />
            Set Price
          </button>
          <button
            onClick={() => setLinkSidebarOpen(true)}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#ff5b00]
                       rounded-xl hover:bg-[#e55200] shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Link a Plan
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* Price */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 group hover:border-[#ff5b00]/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Course Price</span>
              <div className="w-9 h-9 rounded-xl bg-[#ff5b00]/10 border border-[#ff5b00]/15 flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-[#ff5b00]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1a2b4e]">
              {coursePricing.price > 0 ? `₹${coursePricing.price.toLocaleString("en-IN")}` : "—"}
            </div>
            <div className="mt-2">
              {coursePricing.price > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-600">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Price set
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-semibold text-amber-600">
                  <AlertCircle className="w-2.5 h-2.5" /> Not set
                </span>
              )}
            </div>
          </div>

          {/* Validity */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 group hover:border-[#0c63e4]/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Validity</span>
              <div className="w-9 h-9 rounded-xl bg-[#0c63e4]/8 border border-[#0c63e4]/15 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#0c63e4]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1a2b4e]">
              {coursePricing.validityInDays > 0 ? `${coursePricing.validityInDays}` : "—"}
              {coursePricing.validityInDays > 0 && (
                <span className="text-sm font-medium text-gray-400 ml-1.5">days</span>
              )}
            </div>
            <div className="mt-2">
              {coursePricing.validityInDays > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0c63e4]/8 text-[10px] font-semibold text-[#0c63e4]">
                  <TrendingUp className="w-2.5 h-2.5" />
                  {Math.round(coursePricing.validityInDays / 30)} months
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-semibold text-amber-600">
                  <AlertCircle className="w-2.5 h-2.5" /> Not set
                </span>
              )}
            </div>
          </div>

          {/* Linked plans */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 group hover:border-[#f2277e]/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Linked Plans</span>
              <div className="w-9 h-9 rounded-xl bg-[#f2277e]/8 border border-[#f2277e]/15 flex items-center justify-center">
                <Link2 className="w-4 h-4 text-[#f2277e]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1a2b4e]">
              {coursePricing.plans?.length ?? 0}
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ff5b00]/8 border border-[#ff5b00]/15 text-[10px] font-semibold text-[#ff5b00]">
                <ShieldCheck className="w-2.5 h-2.5" />
                {coursePricing.plans?.length === 1 ? "1 plan active" : `${coursePricing.plans?.length ?? 0} plans`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Linked plans table ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-visible">
        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#ff5b00]/10 flex items-center justify-center">
              <LayoutList className="w-3.5 h-3.5 text-[#ff5b00]" />
            </div>
            <span className="text-xs font-bold text-[#1a2b4e] uppercase tracking-wide">Linked Payment Plans</span>
            {!loading && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#ff5b00]/8 border border-[#ff5b00]/15 text-[10px] font-semibold text-[#ff5b00]">
                {coursePricing.plans?.length ?? 0}
              </span>
            )}
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="col-span-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">#</div>
          <div className="col-span-7 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Plan Name</div>
          <div className="col-span-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</div>
        </div>

        {/* Rows */}
        {loading ? (
          [0, 1, 2].map((i) => <RowSkeleton key={i} />)
        ) : !coursePricing.plans?.length ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Tag className="w-6 h-6 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#1a2b4e]">No plans linked yet</p>
              <p className="text-xs text-gray-400 mt-1">Link a fee template to enable payments for this course</p>
            </div>
            <button
              onClick={() => setLinkSidebarOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#ff5b00]
                         rounded-xl hover:bg-[#e55200] shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Link First Plan
            </button>
          </div>
        ) : (
          coursePricing.plans.map((plan, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-100 last:border-b-0
                         hover:bg-[#ff5b00]/[0.025] transition-colors duration-150"
            >
              <div className="col-span-1">
                <span className="text-xs font-medium text-gray-400">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="col-span-7 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#ff5b00]/8 border border-[#ff5b00]/15 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-3.5 h-3.5 text-[#ff5b00]" />
                </div>
                <span className="text-sm font-semibold text-[#1a2b4e]">{plan.name}</span>
              </div>
              <div className="col-span-4">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-600">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Active
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ══ Link Plan Sidebar ══════════════════════════════════════════════ */}
      {linkSidebarOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex">
          <div
            className="flex-1 bg-[#1a2b4e]/60 backdrop-blur-sm"
            onClick={() => setLinkSidebarOpen(false)}
            style={{ animation: "fadeIn 0.2s ease-out" }}
          />
          <div
            className="w-96 bg-white h-full shadow-2xl flex flex-col"
            style={{ animation: "slideIn 0.28s cubic-bezier(0.16,1,0.3,1)" }}
          >
            {/* Gradient accent bar */}
            <div className="h-0.5 w-full bg-gradient-to-r from-[#ff5b00] via-[#f2277e] to-[#0c63e4] flex-shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff5b00]/15 to-[#ff5b00]/5
                                flex items-center justify-center border border-[#ff5b00]/15">
                  <Link2 className="w-4 h-4 text-[#ff5b00]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1a2b4e]">Link a Payment Plan</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Connect a fee template to this course</p>
                </div>
              </div>
              <button
                onClick={() => setLinkSidebarOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400
                           hover:text-[#1a2b4e] hover:bg-gray-100 transition-all duration-150"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Fee Template <span className="text-[#ff5b00]">*</span>
                </label>
                <PlanSelect
                  templates={feeTemplates}
                  selectedId={selectedPlanId}
                  onSelect={setSelectedPlanId}
                />
                <p className="text-[11px] text-gray-400 mt-2">
                  Students will be able to purchase this course using the selected payment plan.
                </p>
              </div>

              {selectedPlanId && (
                <div className="p-4 rounded-xl bg-[#ff5b00]/5 border border-[#ff5b00]/15">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#ff5b00]" />
                    <span className="text-xs font-semibold text-[#ff5b00]">Plan selected</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    <strong className="text-[#1a2b4e]">
                      {feeTemplates.find((t) => t.planId === selectedPlanId)?.name}
                    </strong>{" "}
                    will be linked to this course upon saving.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/60">
              <button
                onClick={() => setLinkSidebarOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-500 bg-white border border-gray-200
                           rounded-full hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLinkPlan}
                disabled={!selectedPlanId || linkSaving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#ff5b00]
                           rounded-full hover:bg-[#e55200] transition-colors shadow-sm disabled:opacity-40"
              >
                {linkSaving ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" />Linking…</>
                ) : (
                  <><Link2 className="w-3.5 h-3.5" />Link Plan</>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══ Set Price Sidebar ════════════════════════════════════════════════ */}
      {priceSidebarOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex">
          <div
            className="flex-1 bg-[#1a2b4e]/60 backdrop-blur-sm"
            onClick={() => setPriceSidebarOpen(false)}
            style={{ animation: "fadeIn 0.2s ease-out" }}
          />
          <div
            className="w-96 bg-white h-full shadow-2xl flex flex-col"
            style={{ animation: "slideIn 0.28s cubic-bezier(0.16,1,0.3,1)" }}
          >
            {/* Gradient accent bar */}
            <div className="h-0.5 w-full bg-gradient-to-r from-[#ff5b00] via-[#f2277e] to-[#0c63e4] flex-shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff5b00]/15 to-[#ff5b00]/5
                                flex items-center justify-center border border-[#ff5b00]/15">
                  <IndianRupee className="w-4 h-4 text-[#ff5b00]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1a2b4e]">Set Course Price</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Update price and access validity</p>
                </div>
              </div>
              <button
                onClick={() => setPriceSidebarOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400
                           hover:text-[#1a2b4e] hover:bg-gray-100 transition-all duration-150"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Course Price (₹) <span className="text-[#ff5b00]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <IndianRupee className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={priceForm.price}
                    onChange={(e) => setPriceForm({ ...priceForm, price: e.target.value })}
                    placeholder="e.g. 9999"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00]
                               transition-colors placeholder-gray-400 text-[#1a2b4e] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Validity (Days) <span className="text-[#ff5b00]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={priceForm.validityInDays}
                    onChange={(e) => setPriceForm({ ...priceForm, validityInDays: e.target.value })}
                    placeholder="e.g. 365"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-[#ff5b00]/20 focus:border-[#ff5b00]
                               transition-colors placeholder-gray-400 text-[#1a2b4e] bg-white"
                  />
                </div>
                {priceForm.validityInDays && (
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    ≈ {Math.round(priceForm.validityInDays / 30)} months access
                  </p>
                )}
              </div>

              {/* Preview */}
              {(priceForm.price || priceForm.validityInDays) && (
                <div className="p-4 rounded-xl bg-[#0c63e4]/5 border border-[#0c63e4]/15">
                  <p className="text-[11px] font-semibold text-[#0c63e4] uppercase tracking-wide mb-2">Preview</p>
                  <div className="flex items-center justify-between">
                    {priceForm.price && (
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">Price</p>
                        <p className="text-base font-bold text-[#1a2b4e]">
                          ₹{Number(priceForm.price || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    )}
                    {priceForm.validityInDays && (
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">Validity</p>
                        <p className="text-base font-bold text-[#1a2b4e]">{priceForm.validityInDays} days</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/60">
              <button
                onClick={() => setPriceSidebarOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-500 bg-white border border-gray-200
                           rounded-full hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrice}
                disabled={!priceForm.price || !priceForm.validityInDays || priceSaving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#ff5b00]
                           rounded-full hover:bg-[#e55200] transition-colors shadow-sm disabled:opacity-40"
              >
                {priceSaving ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</>
                ) : (
                  <><CheckCircle2 className="w-3.5 h-3.5" />Save Price</>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
