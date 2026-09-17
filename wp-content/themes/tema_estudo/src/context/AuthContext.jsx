import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(api.getToken());
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    if (token) {
      setUser({ authenticated: true });
    } else {
      setUser(null);
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await api.login(username, password);
    const newToken = api.getToken();
    setTokenState(newToken);
    setUser({ username, authenticated: true });
    setIsAuthOpen(false);
    return res;
  };

  const logout = async () => {
    await api.logout();
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!token,
        isAuthOpen,
        openAuth: () => setIsAuthOpen(true),
        closeAuth: () => setIsAuthOpen(false),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
