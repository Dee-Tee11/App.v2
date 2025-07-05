// hooks/useAuthCheck.ts
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/src/features/users/service/userService';

export const useAuthCheck = () => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const user = await getCurrentUser();
        setAuthenticated(!!user);
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  return { loading, authenticated };
};
