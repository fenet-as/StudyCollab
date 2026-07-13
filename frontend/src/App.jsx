import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;