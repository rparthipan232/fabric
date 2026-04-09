import { useState, useCallback, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, RefreshCw, AlertCircle, CheckCircle2, XCircle, Image as ImageIcon, Trash2 } from 'lucide-react';
import { predictFabricDefect, PredictionResult } from '../services/gemini';
import { cn } from '../lib/utils';

export default function UploadDetection() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const prediction = await predictFabricDefect(selectedImage);
      setResult(prediction);
    } catch (err) {
      setError("Analysis failed. Please try again.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
  };

  const getStatusColor = (label: string) => {
    switch (label) {
      case 'no defect': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'not fabric': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      default: return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    }
  };

  const getStatusIcon = (label: string) => {
    switch (label) {
      case 'no defect': return <CheckCircle2 className="w-8 h-8" />;
      case 'not fabric': return <AlertCircle className="w-8 h-8" />;
      default: return <XCircle className="w-8 h-8" />;
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
        <h1 className="text-lg font-bold tracking-tight text-white">UPLOAD DETECTION</h1>
        <div className="w-10" />
      </header>

      <main className="max-w-xl mx-auto p-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden"
        >
          <div className="p-6">
            {!selectedImage ? (
              <label className="group cursor-pointer block">
                <div className="border-2 border-dashed border-slate-800 rounded-xl p-10 flex flex-col items-center justify-center gap-4 group-hover:border-brand-accent group-hover:bg-blue-500/5 transition-all duration-300">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="text-slate-500 group-hover:text-brand-accent w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">Upload fabric photo</p>
                    <p className="text-slate-500 text-sm mt-1">Tap to browse gallery</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              </label>
            ) : (
              <div className="space-y-6">
                <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800 aspect-square flex items-center justify-center">
                  <img 
                    src={selectedImage} 
                    alt="Selected fabric" 
                    className="max-w-full max-h-full object-contain"
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

                  <button 
                    onClick={reset}
                    className="absolute top-3 right-3 p-2 bg-slate-900/90 hover:bg-slate-800 text-rose-500 rounded-full shadow-lg transition-all active:scale-90"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={analyzeImage}
                    disabled={isAnalyzing}
                    className="flex-1 py-4 bg-brand-accent hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                  >
                    {isAnalyzing ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <ImageIcon className="w-6 h-6" />
                    )}
                    {isAnalyzing ? "Analyzing..." : "Run Analysis"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Result Section */}
          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={cn(
                  "border-t border-slate-800 p-6",
                  getStatusColor(result.label)
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-900 rounded-xl shadow-sm">
                    {getStatusIcon(result.label)}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Analysis Result</p>
                    <h3 className="text-xl font-black uppercase tracking-tight mt-1 text-white">
                      {result.label === 'no defect' ? 'No Defect Detected' : result.label}
                    </h3>
                    <p className="mt-1 text-xs font-medium opacity-80 leading-relaxed text-slate-400">
                      {result.label === 'no defect' 
                        ? "The fabric sample appears to be of high quality."
                        : result.label === 'not fabric'
                        ? "This image does not appear to be a fabric sample."
                        : `AI identified a ${result.label} in this sample and marked the location.`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold opacity-60">Confidence</p>
                    <p className="text-2xl font-black text-white">{(result.confidence * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
