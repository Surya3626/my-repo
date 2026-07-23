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
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b-2 border-purple-500/30 shadow-2xl shadow-purple-500/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="clay-card rounded-3xl p-3.5 flex justify-between items-center border-2 border-purple-500/30 shadow-xl">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-105 transition">
              <Wifi size={22} className="animate-pulse" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-indigo-500 to-pink-600">
                Telco<span className="font-extrabold text-slate-800 dark:text-white">Bridge</span>
              </span>
              <span className="text-[9px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-widest -mt-1">
                Enterprise Fiber
              </span>
            </div>
          </Link>

          {/* Desktop Claymorphic Nav Links */}
          <nav className="hidden md:flex space-x-2 items-center">
            <Link
              to="/"
              className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 ${
                isActive('/') 
                  ? 'clay-button-purple shadow-xl scale-105' 
                  : 'clay-modal bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300'
              }`}
            >
              {t('navHome')}
            </Link>
            <Link
              to="/onboard"
              className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 ${
                isActive('/onboard')
                  ? 'clay-button-purple shadow-xl scale-105'
                  : 'clay-modal bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300'
              }`}
            >
              Book Connection
            </Link>
            {!isAdmin ? (
              <Link
                to="/selfcare"
                className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 ${
                  isActive('/selfcare')
                    ? 'clay-button-purple shadow-xl scale-105'
                    : 'clay-modal bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300'
                }`}
              >
                {t('navSelfCare')}
              </Link>
            ) : (
              <span
                title="Disabled in Admin Mode"
                className="px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60 flex items-center gap-1"
              >
                {t('navSelfCare')}
              </span>
            )}
            {!isAuthenticated && (
              <Link
                to="/admin"
                className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 ${
                  isActive('/admin')
                    ? 'clay-button-purple shadow-xl scale-105'
                    : 'clay-modal bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300'
                }`}
              >
                {t('navAdmin')}
              </Link>
            )}
          </nav>

          {/* Right Side Settings & Claymorphic Profile */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Language Selection */}
            <div className="relative group">
              <button className="clay-modal p-2.5 rounded-2xl text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition">
                <Globe size={18} className="text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-black uppercase tracking-wider">{language}</span>
              </button>
              <div className="absolute right-0 mt-2 w-32 clay-card bg-white dark:bg-slate-900 border-2 border-purple-500/30 rounded-2xl shadow-xl hidden group-hover:block overflow-hidden transition-all duration-300 p-1.5 z-50">
                <button onClick={() => setLanguage('en')} className="w-full text-left px-3 py-2 text-xs font-black hover:bg-purple-500/10 rounded-xl text-slate-700 dark:text-slate-300">English</button>
                <button onClick={() => setLanguage('hi')} className="w-full text-left px-3 py-2 text-xs font-black hover:bg-purple-500/10 rounded-xl text-slate-700 dark:text-slate-300">हिंदी</button>
                <button onClick={() => setLanguage('gu')} className="w-full text-left px-3 py-2 text-xs font-black hover:bg-purple-500/10 rounded-xl text-slate-700 dark:text-slate-300">ગુજરાતી</button>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="clay-modal p-2.5 rounded-2xl text-slate-700 dark:text-slate-300 transition"
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-purple-600" />}
            </button>

            {/* Claymorphic Auth Profile Chip */}
            {isAuthenticated && customer ? (
              <div className="flex items-center gap-3 border-l-2 border-slate-200 dark:border-slate-800 pl-3">
                <div className="clay-card p-1.5 pr-3.5 rounded-2xl flex items-center gap-2.5 border-2 border-purple-500/30">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-purple-500/30">
                    {customer.firstName ? customer.firstName[0] : 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900 dark:text-white leading-none">{customer.firstName} {customer.lastName}</p>
                    <p className="text-[9px] text-purple-600 dark:text-purple-400 font-mono font-black mt-0.5">{customer.customerId}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="clay-modal p-2.5 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition"
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
