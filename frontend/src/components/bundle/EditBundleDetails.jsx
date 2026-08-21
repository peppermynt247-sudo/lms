"use client";

import React from "react";

export default function EditBundleDetails({
  form,
  onChange,
  thumbnailPreview,
  thumbnail,
  currentThumbnail,
  onThumbnailChange,
  onRemoveNewThumbnail,
  onSave,
}) {
  return (
    <form className="space-y-6 max-w-xl">
      <h2 className="text-xl font-semibold mb-4">Bundle Details</h2>
      <div>
        <label className="block mb-1 font-medium">Title</label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={onChange}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          className="w-full border rounded px-3 py-2"
          rows={3}
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Price</label>
        <input
          type="number"
          name="price"
          value={form.price || ''}
          onChange={onChange}
          className="w-full border rounded px-3 py-2"
          min="0"
          placeholder="Enter bundle price"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Validity (days)</label>
        <input
          type="number"
          name="validity"
          value={form.validity || ''}
          onChange={onChange}
          className="w-full border rounded px-3 py-2"
          min="0"
          placeholder="Enter validity in days"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Thumbnail</label>
        {thumbnailPreview && thumbnail ? (
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.95rem', color: '#555', marginBottom: '0.25rem' }}>New Thumbnail Preview</div>
              <img
                src={thumbnailPreview}
                alt="New Thumbnail Preview"
                style={{ width: '180px', height: '120px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #eee' }}
              />
            </div>
            <button
              type="button"
              onClick={onRemoveNewThumbnail}
              style={{
                background: '#eee',
                color: '#333',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                marginLeft: '0.5rem',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.95rem',
                height: 'fit-content',
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          currentThumbnail && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.95rem', color: '#555', marginBottom: '0.25rem' }}>Current Thumbnail</div>
              <img
                src={currentThumbnail}
                alt="Current Thumbnail"
                style={{ width: '180px', height: '120px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #eee' }}
              />
            </div>
          )
        )}
        <input
          type="file"
          accept="image/*"
          onChange={onThumbnailChange}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          id="save-changes-btn"
          className="force-blue-btn"
          type="button"
          onClick={onSave}
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem 2rem',
            background: '#202745',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(32,39,69,0.08)',
            transition: 'background 0.2s, color 0.2s',
            zIndex: 1000,
            outline: 'none',
          }}
        >
          Save Changes
        </button>
        <style>{`
          #save-changes-btn,
          .force-blue-btn,
          #save-changes-btn:focus,
          #save-changes-btn:active {
            background: #202745 !important;
            color: #fff !important;
            border: none !important;
            outline: none !important;
            box-shadow: 0 2px 8px rgba(32,39,69,0.08) !important;
          }
          #save-changes-btn * {
            background: #202745 !important;
            color: #fff !important;
          }
        `}</style>
      </div>
    </form>
  );
}


