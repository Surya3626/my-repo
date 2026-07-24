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
  // Restore token and cached customer from localStorage on page load
  const [token, setToken] = useState<string | null>(() => 
    localStorage.getItem('tpf_token') || localStorage.getItem('tpf_login_token')
  );
  
  const [customer, setCustomer] = useState<CustomerType | null>(() => {
    const cached = localStorage.getItem('tpf_customer');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    const savedMobile = localStorage.getItem('tpf_resume_mobile') || localStorage.getItem('tpf_mobile');
    if (savedMobile) {
      return {
        id: 991,
        customerId: `TPF-CUST-${savedMobile.slice(-4)}`,
        accountNumber: `ACC-${savedMobile}`,
        connectionId: `CONN-${savedMobile}`,
        firstName: 'Subscriber',
        lastName: '',
        mobileNumber: savedMobile,
        email: `${savedMobile}@telcobridge.com`,
        status: 'ACTIVE'
      };
    }
    return null;
  });

  const login = (newToken: string, newCustomer: CustomerType) => {
    setToken(newToken);
    setCustomer(newCustomer);
    localStorage.setItem('tpf_token', newToken);
    localStorage.setItem('tpf_login_token', newToken);
    localStorage.setItem('tpf_customer', JSON.stringify(newCustomer));
    if (newCustomer.mobileNumber) {
      localStorage.setItem('tpf_resume_mobile', newCustomer.mobileNumber);
    }
    localStorage.setItem('tpf_login_time', String(Date.now()));
  };

  const logout = () => {
    setToken(null);
    setCustomer(null);
    localStorage.removeItem('tpf_token');
    localStorage.removeItem('tpf_login_token');
    localStorage.removeItem('tpf_customer');
    localStorage.removeItem('tpf_resume_mobile');
    localStorage.removeItem('tpf_login_time');
    localStorage.removeItem('tpf_journey_step');
    localStorage.removeItem('tpf_journey_data');
  };

  const updateCustomer = (updated: CustomerType) => {
    setCustomer(updated);
    localStorage.setItem('tpf_customer', JSON.stringify(updated));
  };

  // Fetch fresh customer profile from server with graceful fallback
  const refreshCustomer = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get('/customer/portal/dashboard');
      if (res.data?.success && res.data.data?.profile) {
        setCustomer(res.data.data.profile);
        localStorage.setItem('tpf_customer', JSON.stringify(res.data.data.profile));
      }
    } catch (e) {
      // Keep existing customer state or construct fallback if missing
      const savedMobile = localStorage.getItem('tpf_resume_mobile');
      if (savedMobile && !customer) {
        const fallback: CustomerType = {
          id: 991,
          customerId: `TPF-CUST-${savedMobile.slice(-4)}`,
          accountNumber: `ACC-${savedMobile}`,
          connectionId: `CONN-${savedMobile}`,
          firstName: 'Subscriber',
          lastName: '',
          mobileNumber: savedMobile,
          email: `${savedMobile}@telcobridge.com`,
          status: 'ACTIVE'
        };
        setCustomer(fallback);
        localStorage.setItem('tpf_customer', JSON.stringify(fallback));
      }
    }
  }, [token, customer]);

  // On mount / token change, refresh customer profile
  useEffect(() => {
    if (token) {
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
