import React, { useState, useEffect } from 'react';
import { Activity, Ticket, Stethoscope, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing OPD Queue System...');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(40);
      setStatusText('Connecting to Supabase Realtime DB...');
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(75);
      setStatusText('Syncing Live Doctor Tokens & Clinics...');
    }, 1000);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Queue Ready — Welcome to Hospital Qswift');
    }, 1700);

    const timer4 = setTimeout(() => {
      onComplete();
    }, 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#0A4D54] via-[#0E7C86] to-[#08383D] text-white p-6 select-none overflow-hidden animate-in fade-in duration-300">
      {/* Background Decorative Ambient Circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Tag */}
      <div className="pt-8 flex items-center gap-2">
        <span className="px-3 py-1 text-xs font-semibold tracking-wider uppercase bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-emerald-200 flex items-center gap-1.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          Realtime Walk-in OPD Queue
        </span>
      </div>

      {/* Center Hero Logo & Branding */}
      <div className="flex flex-col items-center text-center space-y-6 max-w-sm px-4">
        {/* Animated Pulse Logo Icon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-28 h-28 bg-emerald-400/20 rounded-3xl animate-ping opacity-30"></div>
          <div className="w-24 h-24 bg-white text-[#0E7C86] rounded-3xl flex items-center justify-center shadow-2xl ring-4 ring-white/20 transform transition-transform hover:scale-105">
            <Activity className="w-13 h-13 animate-pulse text-[#0E7C86]" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-900 p-2 rounded-xl shadow-lg border-2 border-[#0A4D54]">
            <Ticket className="w-5 h-5" />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight font-display text-white drop-shadow-md">
            Hospital <span className="text-amber-300">Qswift</span>
          </h1>
          <p className="text-sm font-medium text-emerald-100/90 leading-relaxed">
            Grab OPD Tokens remotely & track live position without waiting in line.
          </p>
        </div>

        {/* Key Feature Chips */}
        <div className="grid grid-cols-2 gap-2.5 w-full pt-2">
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 p-2.5 rounded-xl text-left flex items-center gap-2 text-xs">
            <Stethoscope className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="font-medium text-white/90">Live Queue Sync</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 p-2.5 rounded-xl text-left flex items-center gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="font-medium text-white/90">Instant OPD Token</span>
          </div>
        </div>
      </div>

      {/* Bottom Progress & Skip */}
      <div className="w-full max-w-sm pb-8 space-y-4 text-center">
        {/* Progress Status */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-medium text-emerald-100">
            <span>{statusText}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-emerald-300 to-amber-300 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Manual Enter / Skip Button */}
        <button
          onClick={onComplete}
          className="w-full py-3 px-4 bg-white text-[#0A4D54] hover:bg-emerald-50 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all cursor-pointer transform active:scale-98"
        >
          <span>Enter Application Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
