"use client";
import React, { useState, useEffect } from "react";
import { getEbookData } from "@/services/contentService";
import { toast } from 'react-toastify';

const EbookViewer = ({ contentReferenceId, title = "eBook" }) => {
  const [embedUrl, setEmbedUrl] = useState(null);
  const [isGoogleSlides, setIsGoogleSlides] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!contentReferenceId) {
      setError("No eBook ID provided");
      setLoading(false);
      return;
    }

    const fetchEbookData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getEbookData(contentReferenceId);
        const fileUrl = response?.data?.fileUrl || response?.fileUrl;
        
        if (!fileUrl) {
          throw new Error('File URL not found');
        }

        // Check if it's a Google Drive link
        const match = fileUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
          const slideId = match[1];
          const embedLink = `https://docs.google.com/presentation/d/${slideId}/embed?start=false&loop=false&delayms=3000`;
          setEmbedUrl(embedLink);
          setIsGoogleSlides(true);
        } else {
          // Fallback for other file types
          setEmbedUrl(fileUrl);
          setIsGoogleSlides(false);
        }
      } catch (error) {
        setError("Failed to load eBook. Please try again.");
        toast.error('Failed to load eBook. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEbookData();
  }, [contentReferenceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-xl aspect-video">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading eBook...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-xl aspect-video">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">📚</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-xl aspect-video">
        <div className="text-center">
          <p className="text-gray-600">eBook not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 1px 6px -1px rgba(26,43,78,0.08)" }}>
      <div className="relative bg-white aspect-video">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          title={`${title} - eBook Viewer`}
          allowFullScreen
          frameBorder="0"
        />
      </div>
      {!isGoogleSlides && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            This content is being rendered from an external source.
          </p>
        </div>
      )}
    </div>
  );
};

export default EbookViewer;