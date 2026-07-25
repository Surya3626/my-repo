import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './components/common/Toast';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { Chatbot } from './components/chatbot/Chatbot';
import { LandingPage } from './pages/LandingPage';
import { SelfOnboardingRouter, ResumeLookup } from './onboarding/self';
import { SalesAgentOnboardingRouter } from './onboarding/salesAgent';
import { SelfCarePortal } from './pages/SelfCarePortal';
import { AdminPortal } from './pages/AdminPortal';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <ToastProvider>
            <div className="flex flex-col min-h-screen">
              {/* Header Navigation */}
              <Header />

              {/* Main Content Area */}
              <main className="flex-1 bg-slate-50 dark:bg-tpf-darkBg transition-all duration-300">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/onboard" element={<SelfOnboardingRouter />} />
                  <Route path="/onboard/resume" element={<ResumeLookup />} />
                  <Route path="/admin/onboard" element={<SalesAgentOnboardingRouter />} />
                  <Route path="/selfcare" element={<SelfCarePortal />} />
                  <Route path="/customer/portal" element={<Navigate to="/selfcare" replace />} />
                  <Route path="/dashboard" element={<Navigate to="/selfcare" replace />} />
                  <Route path="/admin" element={<AdminPortal />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              {/* Floating Support Chatbot Helper */}
              <Chatbot />

              {/* Footer Area */}
              <Footer />
            </div>
          </ToastProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

