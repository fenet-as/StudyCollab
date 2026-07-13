import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has an active, valid session on page load
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    if (token && email) {
      setUser({ email, token });
    }
    setLoading(false);
  }, []);

  const login = (authData) => {
    localStorage.setItem('token', authData.token);
    localStorage.setItem('email', authData.email);
    setUser({ email: authData.email, token: authData.token });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);