// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BoardProvider } from './contexts/BoardContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Board from './components/Board/Board';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import './App.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <BoardProvider>
                    <Navbar />
                    <div style={{ display: 'flex' }}>
                      <Sidebar />
                      <main style={{ 
                        marginLeft: '280px', 
                        flex: 1,
                        transition: 'margin-left 0.3s ease'
                      }}>
                        <Routes>
                          <Route path="/" element={<Board />} />
                          <Route path="/board/:boardId" element={<Board />} />
                        </Routes>
                      </main>
                    </div>
                  </BoardProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;