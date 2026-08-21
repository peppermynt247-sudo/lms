"use client";

import React, { useEffect, useState } from "react";
import FeeTemplateModal from "@/components/sections/admin/fee/feeTemplateModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash } from "lucide-react";
import api from "@utils/api";
import {toast} from "react-toastify";

const FeeTemplatesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [feeTemplates, setFeeTemplates] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  const toggleTemplateStatus = async (id, status) => {
    try {
      const res = await api.put("/api/paymentplan/active", {
        paymentPlanId: id,
        isActive: status,
      });

      if (res.status === 200) {
        toast.success(`Template ${status ? "unarchived" : "archived"} successfully`);
        fetchFeeTemplates();
      } else {
        toast.error("Failed to update template status");
      }
    } catch (err) {
      console.error("API Error:", err);
      toast.error("Error archiving/unarchiving");
    }
  };

  const fetchFeeTemplates = async () => {
    try {
      const res = await api.get("/api/paymentplan/all");
      const result = res.data;

      if (result.success && Array.isArray(result.data)) {
        const templates = result.data.map((plan) => ({
          id: plan.planId,
          name: plan.name,
          description: plan.description,
          installments: plan.billingCycle,
          isActive: plan.isActive,
          invoiceCriteria: `Installments: ${
            plan.paymentPlanRules.length > 0 ? "Custom rules" : "Evenly split"
          }`,
          paymentPlanRules: plan.paymentPlanRules,
        }));
        setFeeTemplates(templates);
      }
    } catch (error) {
      console.error("Failed to fetch payment plans", error);
    }
  };

  useEffect(() => {
    fetchFeeTemplates();
  }, []);

  const activeTemplates = feeTemplates.filter((t) => t.isActive);
  const archivedTemplates = feeTemplates.filter((t) => !t.isActive);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Fees Templates</h1>
        <Button variant="blue" onClick={() => {
          setEditingTemplate(null);
          setIsModalOpen(true);
        }}>
          + New Fees Templates
        </Button>
      </div>

      {/* Active Templates Table */}
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full table-auto text-sm border-collapse">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3 border-b">#</th>
                <th className="px-4 py-3 border-b">Template Name</th>
                <th className="px-4 py-3 border-b">Description</th>
                <th className="px-4 py-3 border-b">Installments</th>
                <th className="px-4 py-3 border-b">Invoice Generation</th>
                <th className="px-4 py-3 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeTemplates.map((template, index) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b">{index + 1}</td>
                  <td className="px-4 py-3 border-b">{template.name}</td>
                  <td className="px-4 py-3 border-b truncate max-w-xs">
                    {template.description || "-"}
                  </td>
                  <td className="px-4 py-3 border-b">{template.installments}</td>
                  <td className="px-4 py-3 border-b">{template.invoiceCriteria}</td>
                  <td className="px-4 py-3 border-b text-center">
                    <div className="flex gap-2 justify-center">
                      {/* <Button
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          setIsModalOpen(true);
                        }}
                      >
                        Edit
                      </Button> */}
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => toggleTemplateStatus(template.id, false)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Archived Templates Toggle */}
      <div className="mt-4">
        <Button
          variant="outline"
          onClick={() => setShowArchived((prev) => !prev)}
        >
          {showArchived ? "Hide Archived Templates" : "Show Archived Templates"}
        </Button>
      </div>

      {/* Archived Templates Table */}
      {showArchived && archivedTemplates.length > 0 && (
        <Card className="mt-4 border-dashed border-2 border-gray-300">
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full table-auto text-sm border-collapse">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-4 py-3 border-b">#</th>
                  <th className="px-4 py-3 border-b">Template Name</th>
                  <th className="px-4 py-3 border-b">Description</th>
                  <th className="px-4 py-3 border-b">Installments</th>
                  <th className="px-4 py-3 border-b">Invoice Generation</th>
                  <th className="px-4 py-3 border-b text-center">Restore</th>
                </tr>
              </thead>
              <tbody>
                {archivedTemplates.map((template, index) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-b">{index + 1}</td>
                    <td className="px-4 py-3 border-b">{template.name}</td>
                    <td className="px-4 py-3 border-b">{template.description}</td>
                    <td className="px-4 py-3 border-b">{template.installments}</td>
                    <td className="px-4 py-3 border-b">{template.invoiceCriteria}</td>
                    <td className="px-4 py-3 border-b text-center">
                      <Button
                        size="sm"
                        onClick={() => toggleTemplateStatus(template.id, true)}
                      >
                        Unarchive
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      <FeeTemplateModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTemplate(null);
          fetchFeeTemplates();
        }}
        initialData={editingTemplate}
      />
    </div>
  );
};

export default FeeTemplatesPage;
