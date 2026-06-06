import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../api/auth.js';
import { setAuthToken } from '../api/client.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('vendorbridge_token');

    if (!token) {
      setLoading(false);
      return;
    }

    setAuthToken(token);
    getMe()
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('vendorbridge_token');
        setAuthToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('vendorbridge_token', token);
    setAuthToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('vendorbridge_token');
    setAuthToken(null);
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
