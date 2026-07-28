import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (payload: any) => Promise<User>;
  logout: () => void;
  verifyPhone: (otp: string) => Promise<void>;
  updateUser: (newUser: User) => void;
  switchRoleQuick: (role: 'tenant' | 'landlord' | 'admin') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days of inactivity

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('casalink_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('casalink_token') || null;
  });

  const [isLoading, setIsLoading] = useState(false);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('casalink_user');
    localStorage.removeItem('casalink_token');
    localStorage.removeItem('casalink_last_active');
  };

  const touchActivity = () => {
    localStorage.setItem('casalink_last_active', Date.now().toString());
  };

  // On initial load: Check 14-day session expiration & validate active token with server
  useEffect(() => {
    if (!token) return;

    const lastActiveStr = localStorage.getItem('casalink_last_active');
    const now = Date.now();

    if (lastActiveStr) {
      const lastActive = parseInt(lastActiveStr, 10);
      if (now - lastActive > SESSION_MAX_AGE_MS) {
        // Session expired after ~14 days of inactivity
        logout();
        return;
      }
    }

    // Validate token against backend to check if user suspended / deleted / token invalid
    api.getMe(token)
      .then(res => {
        setUser(res.user);
        touchActivity();
      })
      .catch(() => {
        // Token invalid, user disabled or password changed
        logout();
      });
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('casalink_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('casalink_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('casalink_token', token);
      touchActivity();
    } else {
      localStorage.removeItem('casalink_token');
    }
  }, [token]);

  const login = async (email: string, pass: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password: pass });
      setUser(res.user);
      setToken(res.token);
      touchActivity();
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.register(payload);
      setUser(res.user);
      setToken(res.token);
      touchActivity();
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPhone = async (otp: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await api.verifyPhone(user.id, otp);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (newUser: User) => {
    setUser(newUser);
  };

  // Switch role quickly for seamless testing in demo mode
  const switchRoleQuick = (role: 'tenant' | 'landlord' | 'admin') => {
    if (role === 'admin') {
      const adminUser: User = {
        id: 'usr_admin',
        fullName: 'System Administrator',
        email: 'admin@casalink.com',
        phoneNumber: '+254700000000',
        role: 'admin',
        isPhoneVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        createdAt: new Date().toISOString(),
      };
      setUser(adminUser);
      setToken('token_usr_admin');
    } else if (role === 'landlord') {
      const landlordUser: User = {
        id: 'usr_landlord1',
        fullName: 'David Kamau',
        email: 'kamau@casalink.com',
        phoneNumber: '0748671072',
        role: 'landlord',
        isPhoneVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        createdAt: new Date().toISOString(),
      };
      setUser(landlordUser);
      setToken('token_usr_landlord1');
    } else {
      const tenantUser: User = {
        id: 'usr_tenant1',
        fullName: 'Grace Ochieng',
        email: 'grace@casalink.com',
        phoneNumber: '0711223344',
        role: 'tenant',
        isPhoneVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=200',
        createdAt: new Date().toISOString(),
      };
      setUser(tenantUser);
      setToken('token_usr_tenant1');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      verifyPhone,
      updateUser,
      switchRoleQuick
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
