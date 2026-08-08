import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext';
import { ThemeProvider } from './context/ThemeContext'; // 👈 Import ThemeProvider
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GroupProvider>
          <AppRoutes />
        </GroupProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;