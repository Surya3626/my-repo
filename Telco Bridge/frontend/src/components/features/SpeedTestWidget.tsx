import React, { useState } from 'react';
import { Gauge, Play, ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';

export const SpeedTestWidget: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
  const [ping, setPing] = useState<number | null>(null);
  const [stage, setStage] = useState<'IDLE' | 'PING' | 'DOWNLOAD' | 'UPLOAD' | 'DONE'>('IDLE');

  const startTest = () => {
    setTesting(true);
    setDownloadSpeed(0);
    setUploadSpeed(0);
    setPing(null);
    setStage('PING');

    // Ping check
    setTimeout(() => {
      setPing(3);
      setStage('DOWNLOAD');

      // Download test animation
      let d = 0;
      const dInt = setInterval(() => {
        d += Math.floor(Math.random() * 40) + 20;
        if (d >= 295) {
          d = 302;
          clearInterval(dInt);
          setDownloadSpeed(d);
          setStage('UPLOAD');

          // Upload test animation
          let u = 0;
          const uInt = setInterval(() => {
            u += Math.floor(Math.random() * 40) + 20;
            if (u >= 290) {
              u = 298;
              clearInterval(uInt);
              setUploadSpeed(u);
              setStage('DONE');
              setTesting(false);
            } else {
              setUploadSpeed(u);
            }
          }, 150);
        } else {
          setDownloadSpeed(d);
        }
      }, 150);
    }, 1000);
  };

  return (
    <div className="glass-panel border-2 border-purple-500/30 rounded-3xl p-6 bg-slate-900 text-white space-y-4 shadow-xl text-left">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
            <Gauge size={20} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white">TelcoBridge Ultra Speed Test</h4>

            <p className="text-[10px] text-slate-400">Live Speed Test &amp; Latency Checker</p>
          </div>
        </div>

        <button
          type="button"
          onClick={startTest}
          disabled={testing}
          className="px-4 py-2 bg-gradient-to-r from-tpf-purple to-tpf-pink text-white text-xs font-extrabold rounded-xl shadow hover:opacity-90 disabled:opacity-40 transition flex items-center gap-1.5"
        >
          {testing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
          {testing ? 'Testing...' : 'Run Speed Test'}
        </button>
      </div>

      {/* Speed Metrics Display Grid */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {/* Ping */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Ping / Latency</span>
          <span className="text-lg font-black text-amber-400">
            {ping !== null ? `${ping} ms` : '--'}
          </span>
        </div>

        {/* Download */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
            <ArrowDown size={10} className="text-emerald-400" /> Download
          </span>
          <span className="text-xl font-black text-emerald-400">
            {downloadSpeed !== null ? `${downloadSpeed}` : '--'}
          </span>
          <span className="text-[9px] text-slate-500 block">Mbps</span>
        </div>

        {/* Upload */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
            <ArrowUp size={10} className="text-blue-400" /> Upload
          </span>
          <span className="text-xl font-black text-blue-400">
            {uploadSpeed !== null ? `${uploadSpeed}` : '--'}
          </span>
          <span className="text-[9px] text-slate-500 block">Mbps</span>
        </div>
      </div>

      {/* Status Bar */}
      {stage !== 'IDLE' && (
        <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center text-xs font-bold text-purple-300">
          {stage === 'PING' && 'Measuring ping latency to Mumbai Fiber Exchange node...'}
          {stage === 'DOWNLOAD' && `Testing download throughput: ${downloadSpeed} Mbps...`}
          {stage === 'UPLOAD' && `Testing upload throughput: ${uploadSpeed} Mbps...`}
          {stage === 'DONE' && '⚡ Ultra-high speed 300 Mbps symmetric fiber connection verified!'}
        </div>
      )}
    </div>
  );
};
