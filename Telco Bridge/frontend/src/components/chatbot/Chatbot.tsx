import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../common/Toast';
import { 
  MessageSquare, Send, X, Bot, User, Sparkles, Mic, MicOff, Volume2, VolumeX, Square,
  Maximize2, Minimize2, Globe, Zap, CheckCircle2, ShieldCheck, ArrowRight,
  Compass, FileText, CreditCard, RefreshCw, ChevronRight, Activity, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ActionChip {
  label: string;
  action: string;
  payload: string;
}

export interface RichCard {
  type: string;
  title: string;
  subtitle: string;
  data: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  chips?: ActionChip[];
  richCard?: RichCard;
  timestamp: string;
}

interface ChatbotProps {
  currentStep?: number;
  pageContext?: 'ONBOARDING' | 'SELFCARE' | 'ADMIN';
  onPerformAction?: (action: string, payload: any) => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({
  currentStep: propStep = 1,
  pageContext: propContext = 'ONBOARDING',
  onPerformAction,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const location = useLocation();

  const [currentStep, setCurrentStep] = useState(propStep);
  const [pageContext, setPageContext] = useState(propContext);

  // Auto-detect pageContext from router path
  useEffect(() => {
    if (location.pathname.includes('selfcare')) {
      setPageContext('SELFCARE');
    } else if (location.pathname.includes('admin')) {
      setPageContext('ADMIN');
    } else if (location.pathname.includes('onboard')) {
      setPageContext('ONBOARDING');
    }
  }, [location.pathname]);

  // Listen to step changes
  useEffect(() => {
    const handleStepEvent = (e: any) => {
      if (e.detail?.step) {
        setCurrentStep(e.detail.step);
      }
    };
    window.addEventListener('tpf_step_change', handleStepEvent);
    return () => window.removeEventListener('tpf_step_change', handleStepEvent);
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'EN' | 'HI' | 'GU' | 'MR' | 'TA'>('EN');
  const [unreadCount, setUnreadCount] = useState(1);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'bot',
      text: "Hello! I'm your TelcoBridge AI Journey Co-Pilot. How can I assist you with your broadband setup today?",
      chips: [
        { label: '🚀 Recommend Best Plan', action: 'CHAT_PROMPT', payload: 'Which plan is best for me?' },
        { label: '📍 Check PIN Code Coverage', action: 'NAVIGATE_STEP', payload: '1' },
        { label: '⚡ View All Broadband Plans', action: 'NAVIGATE_STEP', payload: '6' },
        { label: '📡 Run Line Diagnostic', action: 'RUN_DIAGNOSTIC', payload: 'RESET_WIFI' },
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [currentCoPilotHint, setCurrentCoPilotHint] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Update Co-Pilot Context on Step Change
  useEffect(() => {
    if (pageContext === 'ONBOARDING' && currentStep) {
      fetchCoPilotHint(currentStep);
    }
  }, [currentStep, pageContext]);

  const fetchCoPilotHint = async (stepNum: number) => {
    try {
      const res = await api.post('/chatbot/message', {
        message: '',
        currentStep: stepNum,
        pageContext: pageContext,
        language: selectedLang
      });

      if (res.data?.success && res.data.data?.stepHint) {
        setCurrentCoPilotHint(res.data.data.stepHint);
      }
    } catch (err) {}
  };

  // Handle Send Message
  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || query;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customMessage) setQuery('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/message', {
        message: textToSend,
        currentStep: currentStep,
        pageContext: pageContext,
        language: selectedLang
      });

      if (res.data?.success && res.data.data) {
        const data = res.data.data;
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.reply || "Thank you. Let me check that for you.",
          chips: data.actionChips || [],
          richCard: data.richCard,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        fallbackBotResponse(textToSend);
      }
    } catch (err) {
      fallbackBotResponse(textToSend);
    } finally {
      setLoading(false);
    }
  };

  const fallbackBotResponse = (userText?: string) => {
    const isFeasibility = userText && /\b\d{6}\b/.test(userText);
    const pinMatch = userText ? userText.match(/\b\d{6}\b/) : null;
    const pin = pinMatch ? pinMatch[0] : null;

    let responseText = `I am your TelcoBridge AI Assistant. You are currently on Step ${currentStep} of your onboarding journey. Enter any 6-digit PIN code (e.g. 400001) to check fiber feasibility!`;

    if (pin) {
      if (pin.endsWith('9')) {
        responseText = `❌ Out of Coverage: TelcoBridge optical fiber network is NOT YET ACTIVE at PIN Code ${pin}. We are expanding rapidly!`;
      } else {
        responseText = `✅ Great News! TelcoBridge Ultra Fiber is FULLY ACTIVE & FEASIBLE at PIN Code ${pin}. You can get up to 1 Gbps symmetrical speeds, zero installation charges, and 99.98% SLA uptime!`;
      }
    }

    setMessages(prev => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: responseText,
        chips: [
          { label: '⚡ View All Broadband Plans', action: 'NAVIGATE_STEP', payload: '6' },
          { label: '📍 Check PIN Code 400001', action: 'AUTOFILL', payload: 'PIN_400001' }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Handle Action Chip Click
  const handleActionClick = (chip: ActionChip) => {
    // Dispatch global bot action event
    window.dispatchEvent(new CustomEvent('tpf_bot_action', { 
      detail: { action: chip.action, payload: chip.payload } 
    }));

    if (onPerformAction) {
      onPerformAction(chip.action, chip.payload);
    }

    // Send query to AI engine to get real conversation response
    if (chip.action === 'CHAT_PROMPT') {
      handleSend(chip.payload);
    } else {
      handleSend(chip.label);
    }
  };

  // Web Speech API Voice Recognition
  const handleVoiceToggle = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLang === 'HI' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        toast.info("Voice Assistant Active", "Listening to your voice... Speak now!");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        toast.success("Voice Captured", `"${transcript}"`);
        handleSend(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.warning("Voice Input", "Voice recognition unavailable. Please type your message.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      toast.warning("Voice Not Supported", "Speech recognition is not supported in this browser. Please type your text.");
    }
  };

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Stop Audio Player
  const handleStopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      toast.info("Audio Stopped", "Voice playback stopped.");
    }
  };

  // Text-to-Speech Audio Reader (Multilingual)
  const handleReadAloud = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isPlayingAudio) {
        handleStopAudio();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;

      if (selectedLang === 'HI') utterance.lang = 'hi-IN';
      else if (selectedLang === 'GU') utterance.lang = 'gu-IN';
      else if (selectedLang === 'MR') utterance.lang = 'mr-IN';
      else if (selectedLang === 'TA') utterance.lang = 'ta-IN';
      else utterance.lang = 'en-US';

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
      toast.info("Audio Playing", `Reading message in ${selectedLang} mode...`);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 text-left">
      
      {/* Floating Chat Trigger Button with Glow Ring */}
      <motion.button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setUnreadCount(0);
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-2xl cursor-pointer focus:outline-none ring-4 ring-purple-500/30 relative border-2 border-white/40"
      >
        {isOpen ? (
          <X size={26} />
        ) : (
          <div className="relative">
            <Bot size={28} className="animate-bounce" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </motion.button>

      {/* Floating Chat Window / Expanded AI Assistant Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className={`fixed ${
              isExpanded 
                ? 'inset-4 sm:inset-10 max-w-5xl max-h-[85vh] m-auto z-50' 
                : 'bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[560px] max-h-[calc(100vh-7rem)] z-50'
            } rounded-3xl shadow-2xl glass-panel border-2 border-purple-500/40 overflow-hidden flex flex-col backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 transition-all duration-300`}
          >
            
            {/* AI Assistant Header Bar */}
            <div className="p-4 bg-gradient-to-r from-purple-950 via-slate-900 to-purple-900 text-white flex items-center justify-between border-b border-purple-500/30 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/40 text-purple-300 flex items-center justify-center border border-purple-500/40 shadow-inner">
                  <Bot size={22} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-white">TelcoBridge AI Assistant</h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase">
                      CO-PILOT
                    </span>
                  </div>
                  <p className="text-[10px] text-purple-300 font-mono">
                    {pageContext === 'ONBOARDING' ? `Active Step ${currentStep} of 10` : 'Self Care Support Engine'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Stop Audio Button if currently playing */}
                {isPlayingAudio && (
                  <button
                    type="button"
                    onClick={handleStopAudio}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-[10px] font-bold shadow-md border border-rose-400/50 animate-pulse transition"
                    title="Stop Audio Playback"
                  >
                    <Square size={12} className="fill-current" />
                    <span>Stop Audio</span>
                  </button>
                )}

                {/* Language Switcher Dropdown */}
                <select
                  value={selectedLang}
                  onChange={e => setSelectedLang(e.target.value as any)}
                  className="bg-slate-800 text-purple-300 border border-purple-500/40 rounded-xl px-2 py-1 text-[10px] font-extrabold focus:outline-none"
                >
                  <option value="EN">🌐 EN (English)</option>
                  <option value="HI">🇮🇳 HI (हिंदी)</option>
                  <option value="GU">🇮🇳 GU (ગુજરાતી)</option>
                  <option value="MR">🇮🇳 MR (मराठी)</option>
                  <option value="TA">🇮🇳 TA (தமிழ்)</option>
                </select>

                {/* Expand / Minimize Toggle */}
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title={isExpanded ? "Collapse View" : "Expand Fullscreen Assistant"}
                >
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Active Journey Co-Pilot Step Hint Banner */}
            {currentCoPilotHint && (
              <div className="p-3 bg-purple-500/10 border-b border-purple-500/20 text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center justify-between gap-2 shrink-0 animate-fade-in">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-pink-500 shrink-0 animate-bounce" />
                  <span className="line-clamp-1">{currentCoPilotHint}</span>
                </div>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/60 dark:bg-slate-950/60">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  
                  {msg.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center font-black shrink-0 shadow-md">
                      <Bot size={16} />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-3 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    
                    {/* Text Bubble */}
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none font-medium'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-800 font-medium'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span>{msg.text}</span>
                        {msg.sender === 'bot' && (
                          <button
                            type="button"
                            onClick={() => handleReadAloud(msg.text)}
                            className="text-slate-400 hover:text-purple-600 p-0.5 shrink-0 opacity-75 hover:opacity-100 transition"
                            title="Read aloud"
                          >
                            <Volume2 size={13} />
                          </button>
                        )}
                      </div>
                      <span className={`text-[9px] block text-right mt-1 ${msg.sender === 'user' ? 'text-purple-200' : 'text-slate-400'}`}>
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Rich Card Renderer (Plan Match / Diagnostic Result / Technician ETA) */}
                    {msg.richCard && (
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-500/30 text-xs space-y-2.5 shadow-xl">
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                          <span className="font-black text-slate-900 dark:text-white uppercase text-[11px] flex items-center gap-1.5">
                            <Sparkles size={14} className="text-pink-500" /> {msg.richCard.title}
                          </span>
                          <span className="clay-badge-purple px-2 py-0.5 text-[8px] font-black uppercase">
                            AI MATCH
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{msg.richCard.subtitle}</p>

                        {/* Card Payload Breakdown */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 font-mono text-[11px]">
                          {Object.entries(msg.richCard.data).map(([key, val]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                              <span className="font-bold text-slate-900 dark:text-white">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Action Chips */}
                    {msg.chips && msg.chips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.chips.map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleActionClick(chip)}
                            className="px-3 py-1.5 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 hover:bg-purple-600 hover:text-white transition text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm hover:scale-105"
                          >
                            <span>{chip.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black shrink-0">
                      <User size={16} />
                    </div>
                  )}

                </div>
              ))}

              {/* Typing Indicator */}
              {loading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-8 h-8 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shrink-0 animate-pulse">
                    <Bot size={16} />
                  </div>
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                    <RefreshCw size={12} className="animate-spin text-purple-500" />
                    <span>AI Assistant thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form & Voice Control Bar */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                
                {/* Voice Microphone Toggle Button */}
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={`p-2.5 rounded-2xl transition ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600'
                  }`}
                  title={isListening ? "Listening... Click to stop" : "Voice search via microphone"}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>

                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={isListening ? "Listening... Speak now!" : "Ask anything (e.g. recommend plan, slow speed)..."}
                  className="flex-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-medium"
                />

                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="p-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white rounded-2xl disabled:opacity-40 shadow-lg transition"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
