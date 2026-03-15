import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout, Lock, Mail, ChevronRight, Activity, ShieldCheck, User, Tag } from 'lucide-react';
import authService from '../services/authService';
import { useNotification } from '../context/NotificationContext';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        email: '',
        role: 'DEVELOPER'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await authService.signup(formData);
            navigate('/login');
        } catch (err) {
            const message = 'Registration failed. Username may already be taken.';
            setError(message);
            showNotification(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden font-outfit">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-tata-purple opacity-5 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tata-pink opacity-5 blur-[120px] rounded-full"></div>

            <div className="max-w-md w-full animate-fade-in relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-4 bg-white rounded-3xl mb-4 shadow-2xl shadow-tata-pink/10 border border-white group">
                        <Activity className="w-8 h-8 text-tata-pink group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                        Dev<span className="text-transparent bg-clip-text bg-gradient-to-r from-tata-pink to-tata-purple">Track</span>
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px] opacity-60">Join the Enterprise Tracking Force</p>
                </div>

                <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
                    <form onSubmit={handleSignup} className="space-y-4 relative">
                        {error && (
                            <div className="bg-red-50 text-red-500 px-4 py-3 rounded-2xl text-xs font-bold flex items-center space-x-2 border border-red-100 animate-shake">
                                <ShieldCheck className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-tata-pink transition-all" />
                                    <input
                                        name="fullName"
                                        type="text"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-300 outline-none focus:bg-white focus:border-tata-pink transition-all font-bold text-sm"
                                        placeholder="Full Name"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-tata-pink transition-all" />
                                    <input
                                        name="username"
                                        type="text"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-300 outline-none focus:bg-white focus:border-tata-pink transition-all font-bold text-sm"
                                        placeholder="Username"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-tata-pink transition-all" />
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-300 outline-none focus:bg-white focus:border-tata-pink transition-all font-bold text-sm"
                                    placeholder="email@company.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-tata-pink transition-all" />
                                <input
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-300 outline-none focus:bg-white focus:border-tata-pink transition-all font-bold text-sm"
                                    placeholder="Create Security Key"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Role</label>
                            <div className="relative group">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-tata-pink transition-all" />
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-slate-900 outline-none focus:bg-white focus:border-tata-pink transition-all font-bold text-sm appearance-none"
                                >
                                    <option value="DEVELOPER">Developer</option>
                                    <option value="TESTER">QA Tester</option>
                                    <option value="DEVADMIN">Developer Admin</option>
                                    <option value="TESTADMIN">QA Manager</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-tata-gradient text-white font-black py-3 rounded-2xl shadow-xl shadow-tata-pink/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 group disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Activity className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                        
                        <div className="text-center pt-2">
                            <Link to="/login" className="text-[10px] font-black text-slate-400 hover:text-tata-pink uppercase tracking-widest transition-colors">
                                Already have an account? <span className="text-tata-pink">Log in</span>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;
