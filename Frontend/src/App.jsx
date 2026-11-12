import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import HowItWorksPage from './pages/HowItWorksPage';
import DepartmentsPage from './pages/DepartmentsPage';
import ContactPage from './pages/ContactPage';
import FaqPage from './pages/FaqPage';
import TrackGrievancePage from './pages/TrackGrievancePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CitizenDashboardPage from './pages/CitizenDashboardPage';
import CmoDashboardPage from './pages/CmoDashboardPage';
import OfficerDashboardPage from './pages/OfficerDashboardPage';
import ApiExplorerPage from './pages/ApiExplorerPage';

export default function App() {
  return (
    <AppProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/track" element={<TrackGrievancePage />} />
          <Route path="/track/:refId" element={<TrackGrievancePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/citizen" element={<CitizenDashboardPage />} />
          <Route path="/cmo" element={<CmoDashboardPage />} />
          <Route path="/officer" element={<OfficerDashboardPage />} />
          <Route path="/api-tester" element={<ApiExplorerPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AppProvider>
  );
}
