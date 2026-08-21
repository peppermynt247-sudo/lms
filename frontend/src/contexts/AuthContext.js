'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import api from '@utils/api';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const email = Cookies.get('userEmail');
      const token = Cookies.get('accessToken');

      if (!email || !token) {
        setUser(null);
        setLoading(false);
        if (!pathname.startsWith('/login')) router.push('/login');
        return;
      }

      try {
        const response = await api.get(
          `/api/user/currentuser?email=${email}`
        );
        const userData = response.data.user || response.data;
        setUser(userData);
      } catch (err) {
        console.error('Error fetching current user:', err);
        setUser(null);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
