import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext'; // 👈 Import it here
import './App.css';

function App() {
  return (
    <AuthProvider>
      {/* GroupProvider wraps AppRoutes so everything inside can use group data */}
      <GroupProvider>
        <AppRoutes />
      </GroupProvider>
    </AuthProvider>
  );
}

export default App;