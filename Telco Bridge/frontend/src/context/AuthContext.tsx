import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export interface CustomerType {
  id: number;
  customerId: string;
  accountNumber: string;
  connectionId: string;
  prospectId?: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email: string;
  status: string;
}

interface AuthContextType {
  token: string | null;
  customer: CustomerType | null;
  isAuthenticated: boolean;
  login: (token: string, customer: CustomerType) => void;
  logout: () => void;
  updateCustomer: (customer: CustomerType) => void;
  refreshCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Only store token in localStorage — customer data is fetched from server
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('tpf_token'));
  const [customer, setCustomer] = useState<CustomerType | null>(null);

  const login = (newToken: string, newCustomer: CustomerType) => {
    setToken(newToken);
    setCustomer(newCustomer);
    localStorage.setItem('tpf_token', newToken);
    localStorage.setItem('tpf_login_time', String(Date.now()));
    // Do NOT store customer data in localStorage
  };

  const logout = () => {
    setToken(null);
    setCustomer(null);
    localStorage.removeItem('tpf_token');
    localStorage.removeItem('tpf_login_time');
    // Legacy cleanup (in case old keys exist)
    localStorage.removeItem('tpf_customer');
    localStorage.removeItem('tpf_journey_step');
    localStorage.removeItem('tpf_journey_data');
  };

  const updateCustomer = (updated: CustomerType) => {
    setCustomer(updated);
    // No localStorage write — kept in memory only
  };

  // Fetch fresh customer profile from server
  const refreshCustomer = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get('/customer/portal/dashboard');
      if (res.data?.success && res.data.data?.profile) {
        setCustomer(res.data.data.profile);
      }
    } catch (e) {
      // Session may have expired — don't crash, just clear
      setToken(null);
      setCustomer(null);
      localStorage.removeItem('tpf_token');
    }
  }, [token]);

  // On token change (page load / login), fetch customer from server
  useEffect(() => {
    if (token && !customer) {
      refreshCustomer();
    }
  }, [token]);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, customer, isAuthenticated, login, logout, updateCustomer, refreshCustomer }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
