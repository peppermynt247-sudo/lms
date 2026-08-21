"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import CertificateCard from "@/components/shared/Cards/CertificateCard";
import certificateService from "@/services/certificateService"; 
export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchCertificates() {
      try {
        const res = await certificateService.getMyCertificates();
        if (!res || !Array.isArray(res)) {
          throw new Error("Invalid response format");
        }
        setCertificates(res);
      } catch (err) {
        console.error("Failed to fetch certificates", err);
      }
    }

    fetchCertificates();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-secondary mb-2">Certificates</h1>
      <div className="flex justify-center mb-6">
        <span className="block w-24 h-1 rounded-full bg-orange shadow-md"></span>
      </div>

      {certificates.length === 0 ? (
        <p className="text-muted-foreground">No certificates available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {certificates.map((cert, idx) => (
            <CertificateCard key={idx} certificate={cert} />
          ))}
        </div>
      )}
    </div>
  );
}
