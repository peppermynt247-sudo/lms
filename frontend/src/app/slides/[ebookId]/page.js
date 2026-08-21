"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@utils/api";

export default function EbookViewerPage() {
  const { ebookId } = useParams();
  const router = useRouter();
  const [viewUrl, setViewUrl] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchEbook() {
      try {
        const res = await api.get(`/api/ebooks/${ebookId}`);
        const data = res.data.data || res.data;
        setViewUrl(data.viewUrl);
        setTitle(data.title || "eBook");
      } catch (err) {
        setError("Failed to load eBook. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    if (ebookId) fetchEbook();
  }, [ebookId]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 shadow-sm">
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back
        </button>
        <h1 className="text-sm font-semibold text-gray-800 truncate">{title}</h1>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Loading eBook...
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full text-red-500 text-sm">
            {error}
          </div>
        )}
        {!loading && !error && viewUrl && (
          <iframe
            src={viewUrl}
            title={title}
            className="w-full h-full border-0"
            allow="fullscreen"
          />
        )}
      </div>
    </div>
  );
}
