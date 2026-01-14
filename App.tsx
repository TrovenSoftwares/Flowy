import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import SidebarContent from './components/SidebarContent';
import Header from './components/Header';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { VersixLogo } from './components/BrandedIcons';
import { Toaster } from 'react-hot-toast';
import { Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Review from './pages/Review';
import Wallet from './pages/Wallet';
import Integration from './pages/Integration';
import IntegrationConfig from './pages/IntegrationConfig';
import NewTransaction from './pages/NewTransaction';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Contacts from './pages/Contacts';
import Team from './pages/Team';
import NewContact from './pages/NewContact';
import NewTeamMember from './pages/NewTeamMember';
import Sales from './pages/Sales';
import NewSale from './pages/NewSale';
import ReviewSaleIA from './pages/ReviewSaleIA';
import Sellers from './pages/Sellers';
import NewSeller from './pages/NewSeller';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TermsOfUse from './pages/TermsOfUse';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Help from './pages/Help';
import BouncedChecks from './pages/BouncedChecks';
import NewBouncedCheck from './pages/NewBouncedCheck';
import Returns from './pages/Returns';
import NewReturn from './pages/NewReturn';
import ReturnReasons from './pages/ReturnReasons';
import Landing from './pages/Landing';
import Documentation from './pages/Documentation';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Bloquear scroll do body quando o menu mobile estiver aberto
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isMobileMenuOpen]);

  const { user } = useAuth();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (location.pathname === '/') {
    return (
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (isAuthPage || location.pathname === '/forgot-password' || location.pathname === '/reset-password' || location.pathname === '/terms' || location.pathname === '/privacy' || location.pathname === '/help') {
    return (
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/help" element={<Help />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark font-display transition-colors duration-200 text-slate-900 dark:text-slate-100">
      <Sidebar />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 xl:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-[280px] sm:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 xl:hidden overflow-hidden flex flex-col shadow-2xl overscroll-contain ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 pb-2 flex items-center justify-between">
          <div className="flex items-center">
            <VersixLogo className="h-[55px] w-auto" />
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 xl:hidden outline-none"
            aria-label="Fechar menu"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        <SidebarContent locationPath={location.pathname} onItemClick={() => setIsMobileMenuOpen(false)} />

        <div className="p-4 border-t border-[#e7edf3] dark:border-slate-700 mt-auto">
          <button
            onClick={async () => {
              setIsMobileMenuOpen(false);
              await signOut();
              navigate('/login');
            }}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
            aria-label="Sair da conta"
          >
            <span className="material-symbols-outlined text-xl group-hover:text-red-500">logout</span>
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col xl:ml-64 h-full overflow-hidden">
        <Header onToggleMobileMenu={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className="max-w-[1400px] mx-auto">
            <Routes>
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/review" element={<ProtectedRoute><Review /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
              <Route path="/integration" element={<ProtectedRoute><Integration /></ProtectedRoute>} />
              <Route path="/integration/config" element={<ProtectedRoute><IntegrationConfig /></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
              <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
              <Route path="/sales/new" element={<ProtectedRoute><NewSale /></ProtectedRoute>} />
              <Route path="/sales/edit/:id" element={<ProtectedRoute><NewSale /></ProtectedRoute>} />
              <Route path="/sales/review/:id" element={<ProtectedRoute><ReviewSaleIA /></ProtectedRoute>} />
              <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
              <Route path="/contacts/new" element={<ProtectedRoute><NewContact /></ProtectedRoute>} />
              <Route path="/contacts/edit/:id" element={<ProtectedRoute><NewContact /></ProtectedRoute>} />
              <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
              <Route path="/team/new" element={<ProtectedRoute><NewTeamMember /></ProtectedRoute>} />
              <Route path="/team/edit/:id" element={<ProtectedRoute><NewTeamMember /></ProtectedRoute>} />

              <Route path="/sellers" element={<ProtectedRoute><Sellers /></ProtectedRoute>} />
              <Route path="/sellers/new" element={<ProtectedRoute><NewSeller /></ProtectedRoute>} />
              <Route path="/sellers/edit/:id" element={<ProtectedRoute><NewSeller /></ProtectedRoute>} />
              <Route path="/new-transaction" element={<ProtectedRoute><NewTransaction /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

              {/* Cheques Devolvidos */}
              <Route path="/bounced-checks" element={<ProtectedRoute><BouncedChecks /></ProtectedRoute>} />
              <Route path="/bounced-checks/new" element={<ProtectedRoute><NewBouncedCheck /></ProtectedRoute>} />
              <Route path="/bounced-checks/edit/:id" element={<ProtectedRoute><NewBouncedCheck /></ProtectedRoute>} />

              {/* Devoluções */}
              <Route path="/returns" element={<ProtectedRoute><Returns /></ProtectedRoute>} />
              <Route path="/returns/new" element={<ProtectedRoute><NewReturn /></ProtectedRoute>} />
              <Route path="/returns/edit/:id" element={<ProtectedRoute><NewReturn /></ProtectedRoute>} />
              <Route path="/returns/reasons" element={<ProtectedRoute><ReturnReasons /></ProtectedRoute>} />
              <Route path="/documentation" element={<ProtectedRoute><Documentation /></ProtectedRoute>} />

              {/* Fallback routes */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // Bloqueio de DevTools ativado
  React.useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.shiftKey && e.key === 'J') || (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1e293b',
            fontWeight: '500',
            fontSize: '14px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#266663',
              secondary: '#fff',
            },
          },
        }} />
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;