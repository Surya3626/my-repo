import React, { useState, useCallback } from 'react';
import { PenLine, CheckCircle, X, RotateCcw } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DigitalSignatureProps {
  label?: string;
  onSign?: (signatureDataUrl: string) => void;
  readonly?: boolean;
  existingSignature?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────

export const DigitalSignature: React.FC<DigitalSignatureProps> = ({
  label = 'Customer Signature',
  onSign,
  readonly = false,
  existingSignature,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isSigned, setIsSigned] = useState(!!existingSignature);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(existingSignature || null);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * (canvas.width / rect.width),
        y: (touch.clientY - rect.top) * (canvas.height / rect.height),
      };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * (canvas.width / rect.width),
      y: ((e as React.MouseEvent).clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (readonly || isSigned) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasStrokes(true);
  }, [readonly, isSigned]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#6d28d9';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing]);

  const stopDraw = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
    setIsSigned(false);
    setSignatureUrl(null);
  };

  const confirmSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureUrl(dataUrl);
    setIsSigned(true);
    onSign?.(dataUrl);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <PenLine size={15} className="text-tpf-purple" />
          {label}
        </span>
        {isSigned && (
          <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
            <CheckCircle size={11} /> Digitally Signed
          </span>
        )}
      </div>

      {/* Signature Canvas / Preview */}
      <div className={`relative rounded-2xl overflow-hidden border-2 ${
        isSigned ? 'border-emerald-400/40 bg-emerald-500/5' : 'border-dashed border-slate-300 dark:border-slate-700'
      }`}>
        {signatureUrl && isSigned ? (
          <div className="relative bg-white dark:bg-slate-950 p-4">
            <img src={signatureUrl} alt="Digital Signature" className="h-20 w-full object-contain" />
            <div className="absolute bottom-1 right-2 text-[9px] font-bold text-emerald-500">
              ✓ Digitally Signed
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={500}
            height={120}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
            className={`w-full bg-white dark:bg-slate-950 ${readonly ? 'cursor-not-allowed opacity-60' : 'cursor-crosshair'}`}
            style={{ touchAction: 'none' }}
          />
        )}

        {!isSigned && !hasStrokes && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600 text-xs font-semibold pointer-events-none">
            ✍️ Sign here with mouse or touch
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!readonly && !isSigned && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={clearSignature}
            disabled={!hasStrokes}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold border dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition"
          >
            <RotateCcw size={12} /> Clear
          </button>
          <button
            type="button"
            onClick={confirmSignature}
            disabled={!hasStrokes}
            className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-tpf-purple text-white text-xs font-extrabold rounded-xl shadow hover:opacity-90 disabled:opacity-30 transition"
          >
            <CheckCircle size={12} /> Confirm Signature
          </button>
        </div>
      )}

      {isSigned && !readonly && (
        <button
          type="button"
          onClick={clearSignature}
          className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-rose-500 border border-rose-400/30 rounded-xl hover:bg-rose-500/5 transition"
        >
          <X size={12} /> Remove & Re-sign
        </button>
      )}

      {isSigned && (
        <p className="text-[10px] text-slate-400 leading-relaxed">
          By signing above, you confirm acceptance of TelcoBridge's Terms & Conditions and

          authorize this Customer Application Form (CAF) as legally binding.
          Timestamp: {new Date().toLocaleString('en-IN')}
        </p>
      )}
    </div>
  );
};
