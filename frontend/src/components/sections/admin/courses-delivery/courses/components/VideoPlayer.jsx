"use client";
import React, { useState, useEffect } from "react";
import api from "@utils/api";
import { toast } from 'react-toastify';

const VideoPlayer = ({ contentReferenceId }) => {
  const [embedData, setEmbedData] = useState(null);

  useEffect(() => {
    if (!contentReferenceId) return;
    async function fetchOTP() {
      try {
        const response = await api.get(`/api/video/${contentReferenceId}/playback`);
        setEmbedData(response.data);
      } catch (error) {
        toast.error('Failed to load video. Please try again.');
      }
    }
    fetchOTP();
  }, [contentReferenceId]);

  if (!embedData) {
    return <div>Loading video...</div>;
  }

  const { otp, playbackInfo } = embedData;
  const iframeSrc = `https://player.vdocipher.com/v2/?otp=${otp}&playbackInfo=${playbackInfo}`;

  return (
    <iframe
      src={iframeSrc}
      style={{ border: 0, width: "100%", height: "405px", maxWidth: "720px" }}
      allow="encrypted-media"
      allowFullScreen
      title="VdoCipher Video Player"
    />
  );
};

export default VideoPlayer; 