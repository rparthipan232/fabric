import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, RefreshCw, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { predictFabricDefect, PredictionResult } from '../services/gemini';
import { cn } from '../lib/utils';

export default function LiveDetection() {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoMode, setAutoMode] = useState(false);

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error("Failed to capture image");
      
      const prediction = await predictFabricDefect(imageSrc);
      setResult(prediction);
    } catch (err) {
      setError("Analysis failed. Please try again.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [webcamRef]);

  // Auto-analysis loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoMode) {
      interval = setInterval(() => {
        if (!isAnalyzing) {
          capture();
        }
      }, 3000); // Analyze every 3 seconds
    }
    return () => clearInterval(interval);
  }, [autoMode, isAnalyzing, capture]);

  const getStatusColor = (label: string) => {
    switch (label) {
      case 'no defect': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'not fabric': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      default: return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    }
  };

  const getStatusIcon = (label: string) => {
    switch (label) {
      case 'no defect': return <CheckCircle2 className="w-6 h-6" />;
      case 'not fabric': return <AlertCircle className="w-6 h-6" />;
      default: return <XCircle className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => navigate('/dashboard')}
          className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-100"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold tracking-tight text-white">LIVE DETECTION</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <main className="max-w-xl mx-auto p-4 flex flex-col items-center">
        {/* Camera Feed */}
        <div className="relative w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
          <Webcam
            audio={false}
            ref={webcamRef as any}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
            videoConstraints={{ facingMode: "environment" }}
            {...({} as any)}
          />
          
          {/* Bounding Boxes */}
          {result?.boundingBoxes?.map((box, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute border-2 border-brand-accent rounded-sm z-20 pointer-events-none"
              style={{
                top: `${box.ymin / 10}%`,
                left: `${box.xmin / 10}%`,
                width: `${(box.xmax - box.xmin) / 10}%`,
                height: `${(box.ymax - box.ymin) / 10}%`,
              }}
            >
              <div className="absolute -top-6 left-0 bg-brand-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-t">
                {result.label.toUpperCase()}
              </div>
            </motion.div>
          ))}

          {/* Scanning Overlay */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div 
                initial={{ top: "0%" }}
                animate={{ top: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[2px] bg-brand-accent shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10"
              />
            )}
          </AnimatePresence>

          {/* Result Overlay */}
          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={cn(
                  "absolute bottom-4 left-4 right-4 p-4 rounded-xl border flex items-center gap-4 backdrop-blur-lg bg-slate-900/90 shadow-2xl",
                  getStatusColor(result.label)
                )}
              >
                {getStatusIcon(result.label)}
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">Detection Result</p>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">
                    {result.label === 'no defect' ? 'Perfect Quality' : result.label}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold opacity-70">Confidence</p>
                  <p className="text-base font-black text-white">{(result.confidence * 100).toFixed(0)}%</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col gap-3 w-full">
          <button
            onClick={capture}
            disabled={isAnalyzing}
            className="w-full py-4 bg-brand-accent hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
          >
            {isAnalyzing ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <Camera className="w-6 h-6" />
            )}
            {isAnalyzing ? "Analyzing..." : "Capture Now"}
          </button>

          <button
            onClick={() => setAutoMode(!autoMode)}
            className={cn(
              "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 border-2",
              autoMode 
                ? "bg-slate-100 text-slate-950 border-slate-100" 
                : "bg-transparent text-slate-100 border-slate-800 hover:border-slate-700"
            )}
          >
            <RefreshCw className={cn("w-6 h-6", autoMode && "animate-spin-slow")} />
            {autoMode ? "Auto: ON" : "Auto Mode"}
          </button>
        </div>

        {error && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-rose-400 text-sm font-medium flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.p>
        )}

        <div className="mt-12 text-center text-slate-500 max-w-md">
          <p className="text-sm">
            Position the fabric clearly within the frame. 
            The AI will automatically detect and mark stains, holes, or broken yarns.
          </p>
        </div>
      </main>
    </div>
  );
}
