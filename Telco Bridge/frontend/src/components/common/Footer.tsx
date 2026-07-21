import React from 'react';
import { Wifi, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Slogan */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white">
                <Wifi size={18} />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                Telco<span className="text-slate-400 font-medium">Bridge</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering next-gen ISP and telecom customer journeys with modern headless APIs, instant onboarding, and zero-legacy friction.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Quick Actions</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/onboard" className="hover:text-white transition">Book New Connection</a></li>
              <li><a href="/selfcare" className="hover:text-white transition">Customer Portal</a></li>
              <li><a href="/admin" className="hover:text-white transition">Administrative Portal</a></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Customer Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#faqs" className="hover:text-white transition">Frequently Asked Questions</a></li>
              <li><span className="hover:text-white transition">Raise a Billing Dispute</span></li>
              <li><span className="hover:text-white transition">Relocation Terms</span></li>
            </ul>
          </div>

          {/* Contacts */}
          <div className="space-y-3 text-sm">
            <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-wider">Contact Info</h4>
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-tpf-pink" />
              <span>1800-120-8686 (Toll Free)</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-tpf-pink" />
              <span>help@telcobridge.com</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-tpf-pink" />
              <span>TelcoBridge HQ, Mumbai, India</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80 mt-10 pt-6 text-center text-xs flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 TelcoBridge Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer transition">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition">Terms & Conditions</span>
            <span className="hover:text-white cursor-pointer transition">KYC Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
