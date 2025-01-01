import { useQuery } from '@tanstack/react-query';

// Since we've disabled auth, always return a default user
const defaultUser = {
  id: 1,
  username: 'Demo User',
  role: 'user',
};

export function useUser() {
  return {
    user: defaultUser,
    isLoading: false,
    error: null,
    login: async () => ({ ok: true }),
    logout: async () => ({ ok: true }),
    register: async () => ({ ok: true }),
  };
}