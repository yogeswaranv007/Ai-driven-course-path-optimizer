import { useAuthContext } from '../context/AuthContext.jsx';

export const useAuth = () => {
  const { user, loading, login, register, logout } = useAuthContext();
  return { user, loading, login, register, logout };
};
