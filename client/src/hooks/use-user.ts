import { useQuery } from '@tanstack/react-query';

const defaultUser = {
  id: 1,
  username: 'guest',
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