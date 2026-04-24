import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PublicLayout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from './components/ui/sonner';

import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Pricing from './pages/Pricing';
import BookService from './pages/BookService';
import Support from './pages/Support';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/customer/Dashboard';
import TechnicianDashboard from './pages/technician/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

const Public = ({ children }) => <PublicLayout>{children}</PublicLayout>;

const DashboardRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'technician') return <Navigate to="/technician" replace />;
  return <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Public><Home /></Public>} />
          <Route path="/about" element={<Public><About /></Public>} />
          <Route path="/services" element={<Public><Services /></Public>} />
          <Route path="/pricing" element={<Public><Pricing /></Public>} />
          <Route path="/book" element={<Public><BookService /></Public>} />
          <Route path="/support" element={<Public><Support /></Public>} />
          <Route path="/contact" element={<Public><Contact /></Public>} />
          <Route path="/privacy" element={<Public><Privacy /></Public>} />
          <Route path="/terms" element={<Public><Terms /></Public>} />
          <Route path="/login" element={<Public><Login /></Public>} />
          <Route path="/register" element={<Public><Register /></Public>} />

          <Route path="/dashboard/*" element={<ProtectedRoute roles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/technician/*" element={<ProtectedRoute roles={['technician']}><TechnicianDashboard /></ProtectedRoute>} />
          <Route path="/admin/*" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

          <Route path="/me" element={<DashboardRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}
