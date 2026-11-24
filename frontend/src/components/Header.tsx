import React from 'react';
import { Zap, Database, Server, Building2 } from 'lucide-react';

interface HeaderProps {
  dbConnected: boolean;
  totalSessions: number;
}

export const Header: React.FC<HeaderProps> = ({ dbConnected, totalSessions }) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                EV Charging Demand & Utilization Analytics
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Caltech & JPL ACN-Data
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Real-world EV charging session analytics across Pasadena & La Cañada, CA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            <span className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono">{dbConnected ? 'PostgreSQL 16' : 'Client Mode'}</span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono">{totalSessions.toLocaleString()} Real Sessions</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>106 Physical EVSEs</span>
          </div>
        </div>
      </div>
    </header>
  );
};
