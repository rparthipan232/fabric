import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Upload, Shield, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();

  const options = [
    {
      title: "Live Detection",
      subtitle: "Real-time AI monitoring",
      description: "Analyze fabric quality continuously using your webcam or industrial camera feed.",
      icon: Camera,
      path: "/live",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Batch Upload",
      subtitle: "Static image analysis",
      description: "Upload high-resolution photos of fabric samples for deep inspection and reporting.",
      icon: Upload,
      path: "/upload",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Shield className="text-brand-accent w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tight text-white">FABRIC GUARD AI</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Welcome to Fabric Guard</h1>
            <p className="text-slate-400 mt-3 text-lg">Choose a method to start your fabric inspection</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {options.map((option, index) => (
              <motion.div
                key={option.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link 
                  to={option.path}
                  className="group block bg-slate-900 rounded-3xl p-10 border border-slate-800 shadow-sm hover:shadow-2xl hover:border-brand-accent/40 transition-all duration-500 h-full"
                >
                  <div className="flex items-center justify-center mb-8">
                    <div className={cn("p-6 rounded-2xl transition-transform duration-500 group-hover:scale-110", "bg-slate-800")}>
                      <option.icon className={cn("w-12 h-12", option.color)} />
                    </div>
                  </div>
                  <div className="text-center">
                    <span className={cn("text-xs font-bold uppercase tracking-widest mb-2 block", option.color)}>
                      {option.subtitle}
                    </span>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {option.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed">
                      {option.description}
                    </p>
                    <div className="mt-8 flex items-center justify-center text-brand-accent font-bold gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Get Started <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-slate-600 text-sm border-t border-slate-900">
        &copy; 2026 Fabric Guard AI. All rights reserved.
      </footer>
    </div>
  );
}


