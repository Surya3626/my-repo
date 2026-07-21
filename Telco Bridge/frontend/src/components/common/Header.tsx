import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Sun, Moon, Globe, LogOut, Menu, X, Wifi } from 'lucide-react';

export const Header: React.FC = () => {
  const { customer, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isAdmin = !!localStorage.getItem('tpf_admin_token') || location.pathname.startsWith('/admin');
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white shadow-md">
              <Wifi size={22} className="animate-pulse" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-tpf-purple to-tpf-pink">
              Telco<span className="font-medium text-slate-700 dark:text-slate-200">Bridge</span>
            </span>

          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex space-x-1 items-center">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                isActive('/') 
                  ? 'text-tpf-purple bg-purple-50 dark:bg-purple-950/30' 
                  : 'text-slate-600 hover:text-tpf-purple dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {t('navHome')}
            </Link>
            <Link
              to="/onboard"
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                isActive('/onboard')
                  ? 'text-tpf-purple bg-purple-50 dark:bg-purple-950/30'
                  : 'text-slate-600 hover:text-tpf-purple dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Book Connection
            </Link>
            {!isAdmin ? (
              <Link
                to="/selfcare"
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                  isActive('/selfcare')
                    ? 'text-tpf-purple bg-purple-50 dark:bg-purple-950/30'
                    : 'text-slate-600 hover:text-tpf-purple dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {t('navSelfCare')}
              </Link>
            ) : (
              <span
                title="Disabled in Admin Mode"
                className="px-3 py-2 rounded-lg font-medium text-sm text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60 flex items-center gap-1"
              >
                {t('navSelfCare')}
              </span>
            )}
            {!isAuthenticated && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                  isActive('/admin')
                    ? 'text-tpf-purple bg-purple-50 dark:bg-purple-950/30'
                    : 'text-slate-600 hover:text-tpf-purple dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {t('navAdmin')}
              </Link>
            )}
          </nav>

          {/* Right Side Settings & Profile */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Selection */}
            <div className="relative group">
              <button className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1">
                <Globe size={18} />
                <span className="text-xs font-semibold uppercase">{language}</span>
              </button>
              <div className="absolute right-0 mt-1 w-28 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg shadow-lg hidden group-hover:block overflow-hidden transition-all duration-300">
                <button onClick={() => setLanguage('en')} className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">English</button>
                <button onClick={() => setLanguage('hi')} className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">हिंदी</button>
                <button onClick={() => setLanguage('gu')} className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">ગુજરાતી</button>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Auth Button */}
            {isAuthenticated && customer ? (
              <div className="flex items-center gap-3 border-l pl-3 border-slate-200 dark:border-slate-800">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{customer.firstName} {customer.lastName}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{customer.customerId}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                to="/onboard"
                className="px-4 py-2 text-xs font-bold text-white rounded-lg gradient-bg hover:opacity-90 transition-all shadow"
              >
                Register / Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 text-slate-600 dark:text-slate-300 rounded-lg"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 rounded-lg"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {t('navHome')}
          </Link>
          <Link
            to="/onboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Book Connection
          </Link>
          {!isAdmin ? (
            <Link
              to="/selfcare"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('navSelfCare')}
            </Link>
          ) : (
            <span className="block px-3 py-2 rounded-lg text-base font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60">
              {t('navSelfCare')} (Disabled in Admin)
            </span>
          )}
          {!isAuthenticated && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('navAdmin')}
            </Link>
          )}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex flex-wrap gap-2 justify-between items-center">
            <div className="flex gap-1">
              <button onClick={() => setLanguage('en')} className={`px-2 py-1 text-xs rounded ${language === 'en' ? 'bg-tpf-purple text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>EN</button>
              <button onClick={() => setLanguage('hi')} className={`px-2 py-1 text-xs rounded ${language === 'hi' ? 'bg-tpf-purple text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>HI</button>
              <button onClick={() => setLanguage('gu')} className={`px-2 py-1 text-xs rounded ${language === 'gu' ? 'bg-tpf-purple text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>GU</button>
            </div>
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 text-white rounded-lg text-sm font-semibold"
              >
                <LogOut size={16} /> Logout
              </button>
            ) : (
              <Link
                to="/onboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-sm font-bold text-white rounded-lg gradient-bg"
              >
                Register / Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
