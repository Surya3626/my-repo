import { useState } from 'react';
import { Bell, Search, Plus, Activity } from 'lucide-react';
import ItemModal from './ItemModal';
import authService from '../services/authService';

const Topbar = () => {
    const currentUser = authService.getCurrentUser();

    return (
        <header className="bg-white border-b border-gray-100 h-20 flex items-center justify-between px-8 sticky top-0 z-10 transition-all">
            <div className="flex-1 max-w-xl">
                {/* Search bar removed per user request */}
            </div>

            <div className="flex items-center space-x-6">
                <button className="relative p-2.5 rounded-2xl text-gray-400 hover:text-tata-pink hover:bg-white hover:shadow-sm transition-all group">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-tata-pink rounded-full border-2 border-white ring-4 ring-tata-pink ring-opacity-10 group-hover:scale-125 transition-transform"></span>
                </button>
                
                <div className="h-8 w-px bg-gray-100 mx-2"></div>
                
                <div className="flex items-center space-x-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-black text-gray-800 tracking-tight leading-none mb-1">
                            {currentUser?.fullName || currentUser?.username}
                        </p>
                        <p className="text-[10px] font-bold text-tata-pink uppercase tracking-widest opacity-70">
                            {currentUser?.roles?.map(r => r.replace('ROLE_', '')).join(' | ')}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-tata-gradient p-[1.5px] shadow-lg group cursor-pointer hover:scale-110 transition-transform">
                        <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
                           <span className="text-xs font-black text-tata-purple">
                                {currentUser?.username?.charAt(0).toUpperCase()}
                           </span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
