// components/shared/VideoPlayer.js
import React from "react";

const VideoPlayer = ({ videoUrl, autoplay }) => {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg shadow-lg"
      style={{ paddingTop: "56.25%" }}
    >
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`${videoUrl}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default VideoPlayer;
