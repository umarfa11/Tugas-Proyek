import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (userData, token) => {
        set({
          user: userData,
          token: token,
          isAuthenticated: true,
        });
        localStorage.setItem('token', token); // Store explicitly for Axios interceptor
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        localStorage.removeItem('token');
      },
    }),
    {
      name: 'auth-storage', // unique name for localStorage key
    }
  )
);

export default useAuthStore;
