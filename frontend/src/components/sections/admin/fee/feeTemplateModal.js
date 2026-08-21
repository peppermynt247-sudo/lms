"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import api from "@utils/api";

const FeeTemplateModal = ({ open, onClose, initialData }) => {
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [installmentsCount, setInstallmentsCount] = useState("");
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(false);

  const totalWeightage = installments.reduce(
    (total, item) => total + parseFloat(item.weightage || 0),
    0
  );
  const isWeightageValid = totalWeightage === 100;

  useEffect(() => {
    if (initialData) {
      setTemplateName(initialData.name || "");
      setDescription(initialData.description || "");
      setInstallmentsCount(initialData.installments?.toString() || "");
      const rules = initialData.paymentPlanRules || [];

      const preFilled = rules.map((rule) => ({
        installment: rule.installment,
        name: `Installment ${rule.installment}`,
        weightage: rule.weightage?.toString() || "",
        interval: rule.interval?.toString() || "0",
        unit: "Month",
        paymentPlanRulesId: rule.paymentPlanRulesId,
      }));

      setInstallments(preFilled);
    } else {
      setTemplateName("");
      setDescription("");
      setInstallmentsCount("");
      setInstallments([]);
    }
  }, [initialData]);

  const handleInstallmentsChange = (value) => {
    setInstallmentsCount(value);
    const count = parseInt(value);
    const newInstallments = Array.from({ length: count }, (_, i) => ({
      installment: i + 1,
      name: `Installment ${i + 1}`,
      weightage: "0",
      interval: "0",
      unit: "Month",
    }));

    setInstallments(newInstallments);
  };

  const updateInstallment = (index, field, value) => {
    const updated = [...installments];
    
    // Prevent negative values for weightage and interval
    if (field === 'weightage' || field === 'interval') {
      const numValue = parseFloat(value);
      if (numValue < 0) {
        value = "0";
      }
      // For weightage, also prevent values over 100
      if (field === 'weightage' && numValue > 100) {
        value = "100";
      }
    }
    
    updated[index][field] = value;
    setInstallments(updated);
  };

  const handleSubmit = async () => {
    const billingCycle = installments.length;
    const payload = {
      name: templateName,
      description,
      interval: billingCycle,
      billingCycle: billingCycle,
      isActive: true,
      PaymentPlanRules: installments.map((item) => ({
        installment: item.installment,
        weightage: parseFloat(item.weightage),
        interval: parseInt(item.interval),
        paymentPlanRulesId: item.paymentPlanRulesId || undefined,
      })),
    };

    try {
      setLoading(true);
      if (initialData?.id) {
        await api.patch("/api/paymentplan/update", {
          planId: initialData.id,
          ...payload,
        });
      } else {
        await api.post("/api/paymentplan/add", payload);
      }
      onClose();
    } catch (err) {
      console.error("Error saving payment plan", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-y-auto max-h-[85vh] rounded-xl border-0 shadow-xl">
        <DialogHeader className="pb-3 border-b border-gray-100">
          <DialogTitle className="text-xl font-semibold text-gray-800">
            {initialData ? "Edit Fees Template" : "New Fees Template"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Template Details Section */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., Standard 6-Month Plan"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                placeholder="Describe the payment structure..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Installments <span className="text-red-500">*</span>
              </label>
              <Select
                value={installmentsCount}
                onValueChange={handleInstallmentsChange}
              >
                <SelectTrigger className="rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 px-3 py-2">
                  <SelectValue placeholder="Select installments (1-12)" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {Array.from({ length: 10 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()} className="rounded-md">
                      {i + 1} {i === 0 ? 'Installment' : 'Installments'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Installment Details Section */}
          {installments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-1">
                Installment Details
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Sl.</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Name</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Weightage (%)</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Interval</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100 last:border-b-0">
                        <td className="py-2 px-2 text-gray-600 font-medium text-xs">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            value={item.name}
                            onChange={(e) =>
                              updateInstallment(idx, "name", e.target.value)
                            }
                            placeholder="e.g., First Payment"
                            className="rounded-md border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-xs px-2 py-1"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            className="w-full rounded-md border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-xs px-2 py-1"
                            value={item.weightage}
                            onChange={(e) =>
                              updateInstallment(idx, "weightage", e.target.value)
                            }
                            placeholder="0-100"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            min="0"
                            className="w-full rounded-md border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-xs px-2 py-1"
                            value={item.interval}
                            onChange={(e) =>
                              updateInstallment(idx, "interval", e.target.value)
                            }
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Weightage Summary */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">
                    Total Weightage:
                  </span>
                  <span className={`text-sm font-bold ${isWeightageValid ? "text-green-600" : "text-red-600"}`}>
                    {totalWeightage}%
                  </span>
                </div>
                
                {!isWeightageValid && (
                  <div className="mt-1 flex items-center gap-1 text-red-600">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    <p className="text-xs">
                      Total weightage must be exactly 100% to proceed.
                    </p>
                  </div>
                )}
                
                {isWeightageValid && (
                  <div className="mt-1 flex items-center gap-1 text-green-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <p className="text-xs font-medium">
                      Weightage is valid! You can proceed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
            className="rounded-lg px-4 py-1.5 border-gray-300 hover:bg-gray-50 text-sm"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !isWeightageValid || !templateName.trim()}
            className="rounded-lg px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm text-white font-medium shadow-sm"
          >
            {loading
              ? initialData
                ? "Updating..."
                : "Creating..."
              : initialData
              ? "Update Template"
              : "Create Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeeTemplateModal;
