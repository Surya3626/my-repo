import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ChevronRight, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';
import authService from '../services/authService';
import { useNotification } from '../context/NotificationContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await authService.login(username, password);
            navigate('/');
        } catch (err) {
            const message = 'Invalid credentials. Please try again.';
            setError(message);
            showNotification(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden font-outfit">
            {/* Soft Background Accents */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-deltascribe-navy opacity-5 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-deltascribe-emerald opacity-5 blur-[120px] rounded-full"></div>

            <div className="max-w-md w-full animate-fade-in relative z-10">
                {/* Logo & Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-4 bg-white rounded-3xl mb-6 shadow-2xl shadow-deltascribe-emerald/10 border border-white group">
                        <Logo className="w-12 h-12 text-deltascribe-emerald group-hover:scale-110 transition-transform duration-300" color="currentColor" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                        Delta<span className="text-transparent bg-clip-text bg-gradient-to-r from-deltascribe-navy to-deltascribe-emerald">Scribe</span>
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] opacity-60">High-Precision Audit & Task Tracking</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
                    <form onSubmit={handleLogin} className="space-y-6 relative">
                        {error && (
                            <div className="bg-red-50 text-red-500 px-4 py-3 rounded-2xl text-xs font-bold flex items-center space-x-2 border border-red-100 animate-shake">
                                <ShieldCheck className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-deltascribe-emerald transition-all" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder-slate-300 outline-none focus:bg-white focus:border-deltascribe-emerald focus:ring-4 focus:ring-deltascribe-emerald focus:ring-opacity-5 transition-all font-bold"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-deltascribe-emerald transition-all" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder-slate-300 outline-none focus:bg-white focus:border-deltascribe-emerald focus:ring-4 focus:ring-deltascribe-emerald focus:ring-opacity-5 transition-all font-bold"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-deltascribe py-4 flex items-center justify-center space-x-2 group disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Logo className="w-5 h-5 animate-spin" color="currentColor" />
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                    <div className="text-center mt-6">
                        <Link to="/signup" className="text-[10px] font-black text-slate-400 hover:text-deltascribe-emerald uppercase tracking-widest transition-colors">
                            Don't have an account? <span className="text-deltascribe-emerald">Create one</span>
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;
