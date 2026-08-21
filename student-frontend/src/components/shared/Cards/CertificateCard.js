"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "react-toastify";

export default function CertificateCard({ certificate }) {
  const handleShare = () => {
    const fullUrl = `${window.location.origin}${certificate.certificateUrl}`;
    const message = `Thrilled to share that I've completed the ${certificate.courseName} and earned my "${certificate.certificateName}" certificate.\n\nYou can view my certificate at: ${fullUrl} \n\nThanks to Agasthya EdTech Pvt Ltd for a great learning experience!`;

    navigator.clipboard
      .writeText(message)
      .then(() => {
        toast?.success?.("Message copied to clipboard!");
      })
      .catch(() => {
        toast?.error?.("Failed to copy. Try again.");
      });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 w-full max-w-xs sm:max-w-sm md:max-w-md flex flex-col">
      {/* Certificate Preview */}
      <div className="relative rounded-md bg-gradient-to-br from-yellow-100 via-orange-100 to-white mb-4 aspect-video flex items-center justify-center border-2 border-orange-300 shadow-lg">
        <svg width="100%" height="100%" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
          <rect x="10" y="10" width="380" height="180" rx="20" fill="#fff" stroke="#FFA500" strokeWidth="4" />
          <text x="200" y="60" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#FFA500">Certificate of Completion</text>
          <text x="200" y="100" textAnchor="middle" fontSize="16" fill="#333">{certificate.certificateName}</text>
          <text x="200" y="130" textAnchor="middle" fontSize="14" fill="#555">{certificate.courseName}</text>
          <text x="200" y="160" textAnchor="middle" fontSize="12" fill="#888">Issued by Agasthya EdTech Pvt Ltd</text>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {/* Optionally overlay logo or seal here */}
        </div>
      </div>

      {/* Certificate Name */}
      <p className="text-xs sm:text-sm font-semibold text-blue-600 uppercase mb-1 truncate">
        {certificate.certificateName}
      </p>

      {/* Course Name */}
      <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
        {certificate.courseName}
      </p>

      {/* Issued Date */}
      <div className="mt-2 text-xs sm:text-sm text-gray-500">
        <p>
          <span className="font-medium text-gray-400">Issued on</span>{" "}
          {new Date(certificate.issuedAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <a
          href={certificate.certificateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button className="w-full text-xs sm:text-sm py-2">Download</Button>
        </a>
        <Button
          variant="outline"
          className="flex items-center justify-center gap-1 text-xs sm:text-sm py-2"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>
    </div>
  );
}
