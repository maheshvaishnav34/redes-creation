import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    const token = localStorage.getItem('redes_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setBusinesses(data.businesses || []);

      const savedBizId = localStorage.getItem('redes_business_id');
      const found = data.businesses.find(b => b.id === savedBizId);
      const defaultName = import.meta.env.VITE_BUSINESS_NAME;
      const namedBiz = defaultName ? data.businesses.find(b => b.name?.toLowerCase().includes(defaultName.toLowerCase())) : null;
      const primaryBiz = data.businesses.find(b => b.is_primary);

      if (found) {
        setActiveBusiness(found);
      } else if (namedBiz) {
        setActiveBusiness(namedBiz);
        localStorage.setItem('redes_business_id', namedBiz.id);
      } else if (primaryBiz) {
        setActiveBusiness(primaryBiz);
        localStorage.setItem('redes_business_id', primaryBiz.id);
      } else if (data.businesses.length > 0) {
        setActiveBusiness(data.businesses[0]);
        localStorage.setItem('redes_business_id', data.businesses[0].id);
      }
    } catch (err) {
      console.error('[AUTH] Failed to initialize user session:', err);
      localStorage.removeItem('redes_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (emailOrCredentials, maybePassword) => {
    const credentials =
      typeof emailOrCredentials === 'object' && emailOrCredentials !== null
        ? emailOrCredentials
        : { email: emailOrCredentials, password: maybePassword };

    const res = await api.login(credentials);
    localStorage.setItem('redes_token', res.token);
    localStorage.setItem('redes_workspace_id', res.user.workspaceId);
    setUser(res.user);
    setBusinesses(res.businesses || []);

    if (res.businesses && res.businesses.length > 0) {
      setActiveBusiness(res.businesses[0]);
      localStorage.setItem('redes_business_id', res.businesses[0].id);
    }
    return res;
  };

  const register = async (payload) => {
    const res = await api.register(payload);
    localStorage.setItem('redes_token', res.token);
    localStorage.setItem('redes_workspace_id', res.user.workspaceId);
    setUser(res.user);
    setBusinesses([]);
    setActiveBusiness(null);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('redes_token');
    localStorage.removeItem('redes_workspace_id');
    localStorage.removeItem('redes_business_id');
    setUser(null);
    setBusinesses([]);
    setActiveBusiness(null);
    window.location.href = '/login';
  };

  const switchBusiness = (businessId) => {
    const found = businesses.find(b => b.id === businessId);
    if (found) {
      setActiveBusiness(found);
      localStorage.setItem('redes_business_id', found.id);
      // Trigger refresh or event
      window.dispatchEvent(new Event('redes:business-switched'));
    }
  };

  const refreshUserData = async () => {
    await initAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        businesses,
        activeBusiness,
        loading,
        login,
        register,
        logout,
        switchBusiness,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
