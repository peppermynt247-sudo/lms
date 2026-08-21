import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { logout, setAuthFromStorage, fetchCurrentUser } from '@/store/slices/authSlice';

export const useAuth = (requiredRole = null) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const email = localStorage.getItem('userEmail');
      
      if (!token) {
        setInitialLoading(false);
        // Only redirect if a specific role is required
        if (requiredRole) {
          router.push('/login');
        }
        return;
      }

      try {
        // Set auth from storage first
        dispatch(setAuthFromStorage());
        
        // Fetch current user data if we have email
        if (email) {
          await dispatch(fetchCurrentUser(email));
        }

        const roleString = localStorage.getItem('userRole');
        const roles = JSON.parse(roleString || '[]');
        
        // If a specific role is required, check if user has it
        if (requiredRole && !roles.includes(requiredRole)) {
          setInitialLoading(false);
          router.push('/login');
          return;
        }

      } catch (error) {
        console.error('Auth check failed:', error);
        // Only redirect if a specific role is required
        if (requiredRole) {
          router.push('/login');
        }
      } finally {
        setInitialLoading(false);
      }
    };

    checkAuth();
  }, [router, requiredRole, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return {
    loading: initialLoading || loading,
    user,
    isAuthenticated,
    logout: handleLogout,
    error
  };
};
