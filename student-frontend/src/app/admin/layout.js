"use client";
import { useAuth } from '@/hooks/useAuth';

const AdminLayout = ({ children }) => {
  const { loading, isAuthenticated } = useAuth('ADMIN');

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {children}
    </div>
  );
};

export default AdminLayout;
