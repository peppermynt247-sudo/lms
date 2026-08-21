"use client";
import { useAuth } from '@/hooks/useAuth';
import StudentWrapper from "@/components/shared/wrappers/StudentWrapper";
import Sidebar from '@/components/shared/SideBar/Sidebar';
import SidebarSkeleton from '@/components/shared/skeletons/SidebarSkeleton';
import { studentSidebarConfig } from '@/config/sidebar/studentSidebar';
import { usePathname } from "next/navigation";

const LayoutContentSkeleton = () => (
  <div className="flex-1 p-6 md:p-8 space-y-5 overflow-y-auto bg-gray-50">
    {/* Page header */}
    <div className="space-y-2 pb-4 border-b border-gray-200">
      <div className="sk h-6 rounded-lg w-44" />
      <div className="sk h-3.5 rounded w-80" />
    </div>

    {/* Quick info bar */}
    <div className="bg-white rounded-2xl border border-gray-100 p-4"
         style={{ boxShadow: "0 1px 6px -1px rgba(26,43,78,0.06)" }}>
      <div className="flex gap-6">
        <div className="sk h-3.5 rounded w-52" />
        <div className="sk h-3.5 rounded w-40" />
        <div className="sk h-3.5 rounded w-24" />
      </div>
    </div>

    {/* Stats row */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2"
             style={{ boxShadow: "0 1px 6px -1px rgba(26,43,78,0.06)" }}>
          <div className="sk h-4 w-4 rounded" />
          <div className="sk h-3 rounded w-3/4" />
          <div className="sk h-6 rounded w-1/2" />
        </div>
      ))}
    </div>

    {/* Table skeleton */}
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
         style={{ boxShadow: "0 1px 6px -1px rgba(26,43,78,0.06)" }}>
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <div className="sk h-4 rounded w-32" />
        <div className="flex gap-2">
          <div className="sk h-8 rounded-xl w-44" />
          <div className="sk h-8 rounded-xl w-28" />
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-4 items-center">
            <div className="sk h-3.5 rounded w-5 flex-shrink-0" />
            <div className="sk h-3.5 rounded flex-1" />
            <div className="sk h-3.5 rounded w-32 hidden md:block" />
            <div className="sk h-3.5 rounded w-24 hidden md:block" />
            <div className="sk h-3.5 rounded w-12 hidden md:block" />
            <div className="sk h-5 rounded-full w-20 hidden md:block" />
            <div className="sk h-8 rounded-xl w-28 hidden md:block" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const StudentLayout = ({ children }) => {
  const { loading, user, isAuthenticated, logout } = useAuth('STUDENT');
  const pathname = usePathname();

  const hideSidebarRoutes = [
    "/student/mycourses/courses",
    "/student/course",
    "/student/elab"
  ];

  const shouldHideSidebar = hideSidebarRoutes.some(route => pathname.startsWith(route));

  if (loading) {
    return (
      <StudentWrapper>
        <div className="flex h-screen bg-background">
          {!shouldHideSidebar && <SidebarSkeleton />}
          {!shouldHideSidebar && <LayoutContentSkeleton />}
        </div>
      </StudentWrapper>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <StudentWrapper>
      <div className="flex h-screen bg-background">
        {!shouldHideSidebar && (
          <Sidebar
            config={studentSidebarConfig}
            userRole="student"
            currentUser={user}
            onLogout={logout}
          />
        )}
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0 min-h-screen">
          {children}
        </main>
      </div>
    </StudentWrapper>
  );
};

export default StudentLayout;
