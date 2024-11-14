import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/login/Login.tsx';
import DashboardLayout from './components/DashboardLayout.tsx';
import TaskManager from './components/Task/TaskList.tsx';
import './App.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={
          <DashboardLayout>
          </DashboardLayout>
        } />
        <Route path="/" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;