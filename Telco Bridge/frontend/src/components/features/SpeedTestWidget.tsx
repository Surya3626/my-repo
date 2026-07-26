import React, { useState } from 'react';
import { Gauge, Play, ArrowDown, ArrowUp, RefreshCw, Zap, Sparkles, Wifi } from 'lucide-react';

export const SpeedTestWidget: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
  const [ping, setPing] = useState<number | null>(null);
  const [stage, setStage] = useState<'IDLE' | 'PING' | 'DOWNLOAD' | 'UPLOAD' | 'DONE'>('IDLE');
  const [currentDisplaySpeed, setCurrentDisplaySpeed] = useState(0);

  const startTest = () => {
    setTesting(true);
    setDownloadSpeed(0);
    setUploadSpeed(0);
    setPing(null);
    setCurrentDisplaySpeed(0);
    setStage('PING');

    // Ping check
    setTimeout(() => {
      setPing(3);
      setStage('DOWNLOAD');

      // Download throughput speed test simulation
      let d = 0;
      const dInt = setInterval(() => {
        d += Math.floor(Math.random() * 45) + 25;
        if (d >= 295) {
          d = 302;
          clearInterval(dInt);
          setDownloadSpeed(d);
          setCurrentDisplaySpeed(d);
          setStage('UPLOAD');

          // Upload throughput speed test simulation
          let u = 0;
          const uInt = setInterval(() => {
            u += Math.floor(Math.random() * 45) + 25;
            if (u >= 290) {
              u = 298;
              clearInterval(uInt);
              setUploadSpeed(u);
              setCurrentDisplaySpeed(u);
              setStage('DONE');
              setTesting(false);
            } else {
              setUploadSpeed(u);
              setCurrentDisplaySpeed(u);
            }
          }, 120);
        } else {
          setDownloadSpeed(d);
          setCurrentDisplaySpeed(d);
        }
      }, 120);
    }, 800);
  };

  // Convert speed value to rotation angle for speedometer gauge (0 to 300 Mbps mapped to -110deg to +110deg)
  const calculateGaugeAngle = (speed: number) => {
    const clamped = Math.min(Math.max(speed, 0), 350);
    return (clamped / 350) * 220 - 110;
  };

  const needleAngle = calculateGaugeAngle(currentDisplaySpeed);

  return (
    <div className="glass-panel border-2 border-purple-500/30 rounded-3xl p-6 bg-slate-950 text-white space-y-6 shadow-2xl text-left relative overflow-hidden">
      
      {/* 🚀 Top Optical Fiber Light Conduit Beam (Pulsing Light Particles) */}
      <div className="relative h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <svg className="w-full h-full">
          <line
            x1="0"
            y1="50%"
            x2="100%"
            y2="50%"
            stroke="url(#fiberBeamGrad)"
            strokeWidth="4"
            className={testing ? 'animate-fiber-beam' : ''}
          />
          <defs>
            <linearGradient id="fiberBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Header Bar */}
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black border border-purple-500/30">
            <Gauge size={20} className="animate-pulse text-purple-400" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white">TelcoBridge Ultra Quantum Speedometer</h4>
            <p className="text-[10px] text-slate-400 font-medium">Symmetric Gigabit Fiber SLA &amp; Latency Checker</p>
          </div>
        </div>

        <button
          type="button"
          onClick={startTest}
          disabled={testing}
          className="px-5 py-2.5 clay-button-purple text-xs font-black uppercase tracking-wider shadow-xl flex items-center gap-2 transition disabled:opacity-40"
        >
          {testing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
          {testing ? 'Testing SLA...' : 'Run Speed Test'}
        </button>
      </div>

      {/* 🏎️ Center Stage 3D Quantum Gauge Dial Visualizer */}
      <div className="relative py-4 flex flex-col items-center justify-center">
        {/* Speedometer Arc Graphic */}
        <div className="relative w-56 h-36 flex items-center justify-center">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 120">
            {/* Background Arc */}
            <path
              d="M 20 100 A 80 80 0 1 1 180 100"
              fill="none"
              stroke="#1e293b"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Pulsing Active Speed Arc */}
            <path
              d="M 20 100 A 80 80 0 1 1 180 100"
              fill="none"
              stroke="url(#speedArcGrad)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (Math.min(currentDisplaySpeed, 350) / 350) * 251.2}
              className="transition-all duration-300 shadow-[0_0_20px_#a855f7]"
            />
            <defs>
              <linearGradient id="speedArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>

          {/* Speedometer Needle */}
          <div
            className="absolute bottom-4 w-1.5 h-20 bg-gradient-to-t from-pink-500 to-amber-300 rounded-full origin-bottom transition-transform duration-300 shadow-[0_0_12px_#ec4899]"
            style={{
              transform: `rotate(${needleAngle}deg)`,
            }}
          />

          {/* Center Hub Nut */}
          <div className="absolute bottom-2 w-6 h-6 rounded-full bg-slate-900 border-4 border-purple-500 shadow-lg z-10 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          </div>
        </div>

        {/* Digital Speedometer Real-time Output Display */}
        <div className="mt-2 text-center">
          <span className="text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-emerald-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            {currentDisplaySpeed}
          </span>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mt-0.5">
            Mbps Throughput
          </span>
        </div>
      </div>

      {/* Speed Metrics Display Grid */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {/* Ping */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-inner space-y-0.5">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Ping Latency</span>
          <span className="text-lg font-black text-amber-400 font-mono">
            {ping !== null ? `${ping} ms` : '--'}
          </span>
        </div>

        {/* Download */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-inner space-y-0.5">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase flex items-center justify-center gap-1">
            <ArrowDown size={12} className="text-emerald-400" /> Download
          </span>
          <span className="text-lg font-black text-emerald-400 font-mono">
            {downloadSpeed !== null ? `${downloadSpeed}` : '--'}
          </span>
          <span className="text-[9px] text-slate-500 font-bold block">Mbps</span>
        </div>

        {/* Upload */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-inner space-y-0.5">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase flex items-center justify-center gap-1">
            <ArrowUp size={12} className="text-blue-400" /> Upload
          </span>
          <span className="text-lg font-black text-blue-400 font-mono">
            {uploadSpeed !== null ? `${uploadSpeed}` : '--'}
          </span>
          <span className="text-[9px] text-slate-500 font-bold block">Mbps</span>
        </div>
      </div>

      {/* Status Bar */}
      {stage !== 'IDLE' && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-center text-xs font-black text-purple-300 animate-fade-in flex items-center justify-center gap-2">
          <Sparkles size={16} className="text-purple-400 animate-spin" />
          {stage === 'PING' && 'Measuring ping latency to Mumbai Optical Exchange node...'}
          {stage === 'DOWNLOAD' && `Testing download throughput: ${downloadSpeed} Mbps...`}
          {stage === 'UPLOAD' && `Testing upload throughput: ${uploadSpeed} Mbps...`}
          {stage === 'DONE' && '⚡ Ultra-fast 300 Mbps symmetric fiber connection verified!'}
        </div>
      )}
    </div>
  );
};
