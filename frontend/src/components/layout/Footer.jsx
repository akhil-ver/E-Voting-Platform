import React from 'react';
import { ShieldCheck, Database, Server, Lock } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 py-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-slate-300">Sovereign Democracy Prototype</span>
            <span className="text-slate-600">•</span>
            <span>Area-Wise E-Voting & Election Management Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-emerald-400" />
              <span>Spring Boot 3.3 (Java 21)</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span>MySQL 8.0</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-violet-400" />
              <span>BCrypt + JWT</span>
            </span>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-4 text-[11px] text-slate-500 text-center leading-relaxed">
          <p>
            <strong>Educational & Demonstration Prototype:</strong> This platform is designed for research, workflow demonstration, and simulated civic elections. It is not certified for legally binding public elections without independent multi-stakeholder cryptographic audits and statutory accreditation.
          </p>
        </div>
      </div>
    </footer>
  );
};
