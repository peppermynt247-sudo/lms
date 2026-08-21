"use client";
import { useAuth } from '@/hooks/useAuth';
import InstructorWrapper from "@/components/shared/wrappers/InstructorWrapper";
import Sidebar from '@/components/shared/SideBar/Sidebar';
import { instructorSidebarConfig } from '@/config/sidebar/instructorSidebar';

const InstructorLayout = ({ children }) => {
  const { loading, user, isAuthenticated, logout } = useAuth('INSTRUCTOR');

  if (loading) {
    return (
      <InstructorWrapper>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading instructor dashboard...</span>
        </div>
      </InstructorWrapper>
    );
  }

  if (!isAuthenticated) {
    return null; // The hook will redirect to login
  }

  return (
    <InstructorWrapper>
      <div className="flex h-screen bg-background">
        <Sidebar 
          config={instructorSidebarConfig}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {children}
          </div>
        </main>
      </div>
    </InstructorWrapper>
  );
};

export default InstructorLayout;
