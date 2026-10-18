import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import {
  ShieldCheck,
  Vote,
  MapPin,
  BarChart3,
  Search,
  SlidersHorizontal,
  ArrowRight,
  Layers,
  CheckCircle2,
  Lock,
  Building2,
  Users,
} from 'lucide-react';

export const LandingPage = () => {
  const [stats, setStats] = useState({
    totalAreas: 10,
    totalVoterRecords: 500,
    totalUserAccounts: 0,
    totalElections: 0,
  });

  useEffect(() => {
    axiosClient
      .get('/areas')
      .then((res) => {
        if (res.success && res.data) {
          const totalVoters = res.data.reduce((sum, a) => sum + (a.totalVoterRecords || 0), 0);
          const totalAccounts = res.data.reduce((sum, a) => sum + (a.registeredAccounts || 0), 0);
          setStats((prev) => ({
            ...prev,
            totalAreas: res.data.length,
            totalVoterRecords: totalVoters || 500,
            totalUserAccounts: totalAccounts,
          }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-12 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-[#0E1322] to-[#0A0D16] p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300 border border-cyan-500/30">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span>Layered Civic Election Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Area-Wise Electronic Voting &amp; Verifiable Ballot Architecture
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            <strong>Sovereign Democracy</strong> enables multi-area election lifecycle control, strict authorized electoral roll verification, zero-knowledge ballot privacy, and cryptographic ballot receipt auditing.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/areas"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
              <MapPin className="h-4 w-4" />
              <span>Explore 10 City Voter Rolls</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/login"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-xs transition-all cursor-pointer"
            >
              <span>Voter &amp; Admin Sign In</span>
            </Link>

            <Link
              to="/verify"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-xs transition-all cursor-pointer"
            >
              <Search className="h-4 w-4 text-amber-400" />
              <span>Verify Ballot Receipt</span>
            </Link>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-40 bottom-0 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
      </section>

      {/* Live System Telemetry Metrics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Configured Areas</span>
            <Building2 className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-bold text-white">{stats.totalAreas}</p>
          <p className="text-[11px] text-slate-400 mt-1">10 Metropolitan Zones</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Authorized Voter Roll</span>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-bold text-emerald-400">{stats.totalVoterRecords}</p>
          <p className="text-[11px] text-slate-400 mt-1">50 Records per City</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Citizen Accounts</span>
            <CheckCircle2 className="h-4 w-4 text-violet-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-bold text-violet-300">{stats.totalUserAccounts}</p>
          <p className="text-[11px] text-slate-400 mt-1">Verified with Aadhaar Suffix</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Security Architecture</span>
            <Lock className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-bold text-cyan-400">BCrypt + JWT</p>
          <p className="text-[11px] text-slate-400 mt-1">MySQL Normalized Transactions</p>
        </div>
      </section>

      {/* 3-Layer Architecture Cards */}
      <section className="space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white">Three-Tier Architectural Workflow</h2>
          <p className="text-xs text-slate-400">
            A structured workflow separating electoral enrollment, voting privacy, and certified tally publication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Layer 1 */}
          <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/50 p-6 space-y-3 hover:border-cyan-500/50 transition-all">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/40">
                1
              </span>
              <h3 className="font-bold text-base text-white">Identity &amp; Roll Management</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Single Administrator control over 10 cities and 500 voter records. Citizen sign-up verified strictly against Election ID + Aadhaar last 4 digits.
            </p>
            <div className="pt-2">
              <Link to="/areas" className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1">
                <span>View Area Directories</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Layer 2 */}
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/50 p-6 space-y-3 hover:border-emerald-500/50 transition-all">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/40">
                2
              </span>
              <h3 className="font-bold text-base text-white">Ballot Casting &amp; Secrecy</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Area-wise candidate rosters with official political symbols. Transactional duplicate-vote rejection and ballot-voter identity decoupling.
            </p>
            <div className="pt-2">
              <Link to="/elections" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1">
                <span>Inspect Open Elections</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Layer 3 */}
          <div className="rounded-2xl border border-violet-500/30 bg-slate-900/50 p-6 space-y-3 hover:border-violet-500/50 transition-all">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold border border-violet-500/40">
                3
              </span>
              <h3 className="font-bold text-base text-white">Closure, Results &amp; Receipts</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Admin closure of polls, certified result declaration with vote counts &amp; percentages, and public ballot receipt verification.
            </p>
            <div className="pt-2">
              <Link to="/results" className="text-xs font-bold text-violet-400 hover:underline flex items-center gap-1">
                <span>Certified Results &amp; Audit</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
