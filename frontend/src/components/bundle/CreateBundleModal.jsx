"use client";

import React from "react";

export default function CreateBundleModal({
  open,
  onClose,
  onSubmit,
  form,
  setForm,
  creating,
  thumbnailPreview,
  onThumbnailChange,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg relative max-h-[80vh] overflow-y-auto">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 11-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>
        </button>
        <h2 className="text-xl font-bold mb-4">Create Bundle</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Validity (days)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={form.validity}
              onChange={(e) => setForm((f) => ({ ...f, validity: e.target.value }))}
              min="1"
              required
            />
          </div>
          <div>
            <input type="file" accept="image/*" onChange={onThumbnailChange} className="w-full border rounded px-3 py-2" />
            {thumbnailPreview && (
              <img src={thumbnailPreview} alt="Thumbnail Preview" className="mt-2 h-24 rounded border object-contain" />
            )}
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#fff",
                color: "#2563eb",
                border: "1px solid #2563eb",
                borderRadius: "0.375rem",
                padding: "0.5rem 1.5rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s, color 0.2s",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "1px solid #2563eb",
                borderRadius: "0.375rem",
                padding: "0.5rem 1.5rem",
                fontWeight: 600,
                cursor: creating ? "not-allowed" : "pointer",
                opacity: creating ? 0.6 : 1,
                transition: "background 0.2s, color 0.2s",
              }}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Bundle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


