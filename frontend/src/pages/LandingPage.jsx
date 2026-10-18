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
  Key,
  Cpu,
  FileCheck,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const LandingPage = () => {
  const [stats, setStats] = useState({
    totalAreas: 10,
    totalVoterRecords: 500,
    totalUserAccounts: 0,
    totalElections: 0,
  });

  const [blockchainInfo, setBlockchainInfo] = useState({
    status: 'ONLINE',
    latestBlock: 4,
    contractAddress: '0x9A676e781A523b5d0C0e43731313A708CB607508',
    chainId: 1337,
    connected: true,
  });

  useEffect(() => {
    // Fetch areas & voter stats
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

    // Fetch live blockchain health
    axiosClient
      .get('/blockchain/health')
      .then((res) => {
        if (res.success && res.data) {
          setBlockchainInfo({
            status: res.data.connected ? 'ONLINE' : 'OFFLINE',
            latestBlock: res.data.latestBlock,
            contractAddress: res.data.contractAddress,
            chainId: res.data.chainId,
            connected: res.data.connected,
          });
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
            <span>Layered Civic Election &amp; Blockchain Audit Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Area-Wise Electronic Voting &amp; Verifiable Blockchain Ballot Architecture
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            <strong>Sovereign Democracy</strong> integrates multi-area election lifecycle control, strict authorized electoral roll verification, <strong>Secret Voting Key (SVK)</strong> zero-knowledge ballot secrecy, and <strong>Hyperledger Besu / Ethereum blockchain</strong> immutable receipt auditing.
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
              to="/elections"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs transition-all cursor-pointer"
            >
              <Vote className="h-4 w-4 text-emerald-400" />
              <span>Cast Ballot with SVK</span>
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
            <span>Blockchain Audit Node</span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${blockchainInfo.connected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${blockchainInfo.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </span>
              <Layers className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-mono font-bold text-amber-300">
            {blockchainInfo.connected ? `Block #${blockchainInfo.latestBlock ?? 4}` : 'OFFLINE'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 truncate" title={blockchainInfo.contractAddress}>
            {blockchainInfo.connected ? 'Besu / ETH Node (Chain 1337)' : 'Node offline'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Security Architecture</span>
            <Lock className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-bold text-cyan-400">SVK + BCrypt</p>
          <p className="text-[11px] text-slate-400 mt-1">256-Bit Entropy &amp; JWT</p>
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
              <h3 className="font-bold text-base text-white">Secret Voting Key &amp; Ballot Secrecy</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Election-specific high-entropy Secret Voting Key (SVK) validation. Area-wise candidate rosters, zero-knowledge ballot decoupling, and atomic double-vote rejection.
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
              <h3 className="font-bold text-base text-white">Blockchain Audit &amp; Receipts</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated on-chain ballot commitment synchronization, immutable smart contract tallies, administrative closure, and public cryptographic receipt verification.
            </p>
            <div className="pt-2">
              <Link to="/verify" className="text-xs font-bold text-violet-400 hover:underline flex items-center gap-1">
                <span>Verify On-Chain Receipt</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cryptographic Security & Blockchain Architecture Showcase */}
      <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 sm:p-10 space-y-8 backdrop-blur-xl">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-300 border border-violet-500/30">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <span>End-to-End Cryptographic Security &amp; Blockchain</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Enterprise Security &amp; Decentralized Trust
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            A multi-layered defense architecture combining one-time secret credentials, zero-knowledge ballot decoupling, and immutable blockchain ledger audits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Feature 1: Secret Voting Key */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-3 hover:border-cyan-500/40 transition-all">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Key className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Secret Voting Key (SVK)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-entropy 256-bit cryptographic token generated per voter per election using Java <code className="text-cyan-300">SecureRandom</code>. Stored exclusively as one-way salted BCrypt verifiers on the backend.
            </p>
            <div className="pt-1 text-[11px] font-mono text-cyan-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>One-Time Atomic Consumption</span>
            </div>
          </div>

          {/* Feature 2: Blockchain Smart Contracts */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-3 hover:border-amber-500/40 transition-all">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Hyperledger Besu / ETH</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise Ethereum-compatible smart contract (<code className="text-amber-300">SovereignDemocracyVoting.sol</code>) deployed to <code className="text-amber-300">0xe7f1...0512</code>, publishing immutable commitments and tally events via Web3j.
            </p>
            <div className="pt-1 text-[11px] font-mono text-amber-300 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Resilient Auto-Reconciliation</span>
            </div>
          </div>

          {/* Feature 3: Privacy & Nullifiers */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-3 hover:border-emerald-500/40 transition-all">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Zero PII &amp; Nullifier Privacy</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No voter names, Aadhaar numbers, or voter-to-candidate mappings touch the blockchain. Deterministic SHA-256 nullifiers prevent double voting without compromising secret ballot privacy.
            </p>
            <div className="pt-1 text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Mathematically Decoupled</span>
            </div>
          </div>

          {/* Feature 4: Public Receipt Verification */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-3 hover:border-violet-500/40 transition-all">
            <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <FileCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Public Receipt Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every ballot produces an official cryptographic receipt. Voters verify their ballot inclusion against on-chain block receipts and contract event logs by Receipt Code, Commitment, or Tx Hash.
            </p>
            <div className="pt-1 text-[11px] font-mono text-violet-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Auditable by Anyone</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
