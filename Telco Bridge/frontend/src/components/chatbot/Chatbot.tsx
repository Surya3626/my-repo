import React, { useState } from 'react';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { MessageSquare, Send, X, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  sender: 'bot' | 'user';
  text: string;
}

export const Chatbot: React.FC = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: t('chatIntro') }
  ]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userText = query;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setQuery('');
    setLoading(true);

    try {
      const response = await api.post('/chatbot/message', { message: userText });
      const reply = response.data?.data?.reply || "Unable to process. Please try again.";
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: "Support system is currently offline. Call us at 1800-120-8686." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center text-white shadow-lg cursor-pointer focus:outline-none"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-80 sm:w-96 h-[450px] rounded-2xl shadow-2xl glass-panel border overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 gradient-bg text-white flex items-center gap-2">
              <Bot size={20} className="animate-bounce" />
              <div>
                <h4 className="font-extrabold text-sm tracking-wide">TelcoBridge Assistant</h4>

                <p className="text-[10px] text-purple-200">Online | Auto Feasibility Guide</p>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-tpf-purple flex items-center justify-center text-white flex-shrink-0">
                      <Bot size={14} />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-tpf-pink text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border dark:border-slate-800'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 flex-shrink-0">
                      <User size={14} />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-tpf-purple flex items-center justify-center text-white flex-shrink-0 animate-pulse">
                    <Bot size={14} />
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none px-3 py-2 text-xs text-slate-400">
                    Typing...
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 border-t dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('chatPlaceholder')}
                className="flex-1 border dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-tpf-purple dark:text-white"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="p-2 gradient-bg hover:opacity-90 text-white rounded-xl disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
