'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../src/contexts/AuthContext';

const RoleProtection = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      const userRole = Array.isArray(user?.roles) ? user.roles[0] : user?.roles;
      if (!user || !userRole || !allowedRoles.includes(userRole)) {
        router.push('/login');
      }
    }
  }, [loading, user, allowedRoles, router]);

  if (loading || !user) return null;

  const userRole = Array.isArray(user.roles) ? user.roles[0] : user.roles;
  if (!userRole || !allowedRoles.includes(userRole)) return null;

  return children;
};

export default RoleProtection;
