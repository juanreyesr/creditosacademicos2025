import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Pages
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/admin/Login';
import Dashboard from '@/pages/admin/Dashboard';
import LeadsList from '@/pages/admin/LeadsList';
import LeadDetail from '@/pages/admin/LeadDetail';
import ImportLeads from '@/pages/admin/ImportLeads';
import Reports from '@/pages/admin/Reports';
import CareerContent from '@/pages/admin/CareerContent';
import PensumImages from '@/pages/admin/PensumImages';
import CampusPhotos from '@/pages/admin/CampusPhotos';

// Components

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/leads" element={<LeadsList />} />
          <Route path="/admin/leads/:id" element={<LeadDetail />} />
          <Route path="/admin/import" element={<ImportLeads />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/careers" element={<CareerContent />} />
          <Route path="/admin/pensum" element={<PensumImages />} />
          <Route path="/admin/campus" element={<CampusPhotos />} />
          
          {/* Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
      </BrowserRouter>
      
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
