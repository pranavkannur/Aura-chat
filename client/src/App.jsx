import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ChatPage from './pages/ChatPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  console.log('ProtectedRoute:', { user, loading });
  if (loading) return <div className="h-screen bg-aura-dark flex items-center justify-center text-aura-light">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  console.log('App Rendering');
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
