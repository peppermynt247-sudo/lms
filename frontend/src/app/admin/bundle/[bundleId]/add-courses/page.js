"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import BundleCoursesManager from "@/components/bundle/BundleCoursesManager";

export default function AddCoursesToBundlePage() {
  const { bundleId } = useParams();
  const router = useRouter();
  return (
    <BundleCoursesManager
      bundleId={bundleId}
      title="Add/Remove Courses from Bundle"
      onDone={() => router.push("/admin/bundle")}
    />
  );
}