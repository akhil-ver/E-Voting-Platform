import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Lock,
  ArrowRight,
  Trophy,
  Award,
  BarChart3,
  Copy,
} from 'lucide-react';

export const BallotVerificationPage = () => {
  const location = useLocation();
  const [receiptInput, setReceiptInput] = useState('');
  const [result, setResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [myReceipts, setMyReceipts] = useState([]);

  useEffect(() => {
    const fetchUserReceipts = async () => {
      try {
        const res = await axiosClient.get('/voting/my-receipts');
        if (res.success && res.data) {
          setMyReceipts(res.data);
        }
      } catch (e) {
        // Not logged in or no receipts
      }
    };
    fetchUserReceipts();
  }, []);

  const verifyCode = async (codeToVerify) => {
    const code = (codeToVerify || receiptInput).trim();
    if (!code) return;

    setIsVerifying(true);
    setError(null);
    setResult(null);

    try {
      const res = await axiosClient.get(`/verify/${encodeURIComponent(code)}`);
      if (res.success && res.data) {
        setResult(res.data);
      }
    } catch (err) {
      setError(
        err.message || 'No official ballot record found matching this cryptographic hash or receipt reference. Please verify and try again.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    verifyCode();
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeParam = params.get('code');
    if (codeParam && codeParam.trim()) {
      setReceiptInput(codeParam.trim());
      verifyCode(codeParam.trim());
    }
  }, [location.search]);

  const copyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/20">
              End-to-End Verifiability
            </span>
            <span className="text-xs text-slate-500 font-mono">Zero-Knowledge Verification</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Public Ballot Receipt &amp; Vote Hash Verification
          </h1>
          <p className="text-xs text-slate-400">
            Verify that your cast ballot is recorded in the certified electoral tally using your SHA-256 vote hash or receipt code.
          </p>
        </div>
      </div>

      {/* Verification Input Box */}
      <div className="rounded-3xl border border-slate-800 bg-[#0E1322] p-6 sm:p-8 space-y-4 shadow-xl">
        {myReceipts.length > 0 && (
          <div className="space-y-2 pb-2 border-b border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Quick Select From Your Saved Ballot Receipts:
            </span>
            <div className="flex flex-wrap gap-2">
              {myReceipts.map((r) => {
                const targetCode = r.voteHash || r.receiptCode;
                const isSelected = receiptInput === targetCode;
                return (
                  <button
                    key={r.receiptCode}
                    type="button"
                    onClick={() => {
                      setReceiptInput(targetCode);
                      verifyCode(targetCode);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-slate-700'
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{r.electionCode}: {r.receiptCode}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-3">
          <label className="block text-xs font-bold text-slate-300">
            Enter Cryptographic Vote Hash (SHA-256) or Receipt Reference Code
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              value={receiptInput}
              onChange={(e) => setReceiptInput(e.target.value)}
              placeholder="e.g. 4543fcb37a9ab87a... or RCP-4543FCB37A9AB87A"
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-cyan-300 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={isVerifying || !receiptInput.trim()}
              className={`px-6 py-3 rounded-xl font-bold text-xs shadow transition-all cursor-pointer ${
                isVerifying || !receiptInput.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
              }`}
            >
              {isVerifying ? 'Verifying...' : 'Verify Ballot Inclusion'}
            </button>
          </div>
        </form>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Each voter receives a 256-bit cryptographic vote hash and receipt reference when submitting a ballot. This portal verifies that your ballot exists in the certified tally vault without revealing the candidate or party you voted for.
        </p>
      </div>

      {/* Verification Success Output */}
      {result && (() => {
        const isDeclared = Boolean(result.resultDeclared || result.electionStatus === 'RESULT_DECLARED');

        return (
          <div
            className={`rounded-3xl border p-6 sm:p-8 space-y-6 animate-fadeIn shadow-2xl ${
              isDeclared
                ? 'border-emerald-500/50 bg-[#0B1A14] shadow-emerald-950/40'
                : 'border-amber-500/50 bg-[#161208] shadow-amber-950/40'
            }`}
          >
            {/* Header Status */}
            <div className="flex items-center gap-3">
              <div
                className={`h-12 w-12 rounded-2xl border flex items-center justify-center shrink-0 ${
                  isDeclared
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                }`}
              >
                {isDeclared ? (
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                ) : (
                  <Clock className="h-7 w-7 text-amber-400 animate-pulse" />
                )}
              </div>
              <div>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider ${
                    isDeclared ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {isDeclared ? 'Official Election Results Declared' : 'Cryptographic Proof Vaulted'}
                </span>
                <h3 className="font-extrabold text-lg text-white">
                  {isDeclared
                    ? 'Ballot Verified in Certified Final Tally'
                    : 'Ballot Securely Vaulted — Counting in Progress'}
                </h3>
              </div>
            </div>

            {/* Verification Metadata Grid */}
            <div
              className={`rounded-2xl border p-5 space-y-3 text-xs ${
                isDeclared
                  ? 'border-emerald-500/20 bg-slate-950/80'
                  : 'border-amber-500/20 bg-slate-950/80'
              }`}
            >
              {result.voteHash && (
                <div className="flex flex-col sm:flex-row justify-between py-1.5 border-b border-slate-800/80 gap-2 items-start sm:items-center">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Cryptographic Vote Hash:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-300 text-xs break-all select-all">
                      {result.voteHash}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(result.voteHash)}
                      className="px-2 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold cursor-pointer shrink-0"
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between py-1.5 border-b border-slate-800/80 gap-1">
                <span className="text-slate-400 font-semibold">Official Receipt Reference:</span>
                <span className="font-mono font-bold text-cyan-300 text-sm">{result.receiptCode}</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between py-1.5 border-b border-slate-800/80 gap-1">
                <span className="text-slate-400 font-semibold">Election Code &amp; Name:</span>
                <span className="font-semibold text-white text-right">
                  {result.electionCode} — {result.electionName}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between py-1.5 border-b border-slate-800/80 gap-1">
                <span className="text-slate-400 font-semibold">Constituency / Area:</span>
                <span className="font-semibold text-slate-200">
                  {result.constituencyName ? `${result.constituencyName} (${result.areaName})` : result.areaName}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between py-1.5 border-b border-slate-800/80 gap-1">
                <span className="text-slate-400 font-semibold">Inclusion Status:</span>
                <span
                  className={`font-bold uppercase tracking-wider text-[11px] px-2 py-0.5 rounded border inline-block ${
                    isDeclared
                      ? 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40'
                      : 'text-amber-400 bg-amber-950/80 border-amber-500/40'
                  }`}
                >
                  {isDeclared ? 'COUNTED IN FINAL TALLY' : 'STILL COUNTING — RESULT NOT DECLARED'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between py-1.5 border-b border-slate-800/80 gap-1">
                <span className="text-slate-400 font-semibold">Election Lifecycle Status:</span>
                <span className="font-bold text-slate-200">
                  {isDeclared ? (
                    <span className="text-emerald-400">RESULT DECLARED &amp; CERTIFIED</span>
                  ) : (
                    <span className="text-amber-300">
                      {result.electionStatus || 'OPEN'} (Polls / Counting in Progress)
                    </span>
                  )}
                </span>
              </div>

              {isDeclared && result.totalValidVotes !== null && result.totalValidVotes !== undefined && (
                <div className="flex flex-col sm:flex-row justify-between py-1.5 border-b border-slate-800/80 gap-1">
                  <span className="text-slate-400 font-semibold">Total Valid Ballots Tallied:</span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">
                    {result.totalValidVotes} votes
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between py-1.5 gap-1">
                <span className="text-slate-400 font-semibold">Timestamp Recorded:</span>
                <span className="font-mono text-slate-300">
                  {new Date(result.issuedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* When Result is NOT declared: Notice Banner */}
            {!isDeclared && (
              <div className="rounded-2xl bg-amber-950/30 border border-amber-500/30 p-4 text-xs text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Counting in Progress — Results Not Yet Declared</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  Your vote is cryptographically secured inside the tamper-evident ballot vault. Polls or counting are currently ongoing. <strong>The final vote counts, candidate tallies, and winner declaration will be displayed here once results are officially declared by the Electoral Authority.</strong>
                </p>
              </div>
            )}

            {/* When Result IS declared: Display Official Vote Counts & Candidate Tallies */}
            {isDeclared && result.candidateResults && result.candidateResults.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    <h4 className="font-bold text-sm text-white">Official Declared Vote Counts</h4>
                  </div>
                  <span className="text-xs text-slate-400">
                    Total Counted Ballots: <strong className="text-white font-mono">{result.totalValidVotes}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.candidateResults.map((cand) => (
                    <div
                      key={cand.candidateId}
                      className={`rounded-2xl border p-4 space-y-3 relative ${
                        cand.winner
                          ? 'border-amber-500/50 bg-amber-950/30 shadow-md shadow-amber-950/20'
                          : 'border-slate-800 bg-slate-950/70'
                      }`}
                    >
                      {cand.winner && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[9px] font-bold">
                          <Trophy className="h-2.5 w-2.5" />
                          <span>Elected Winner</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0">
                          {cand.partySymbol?.split(' ').pop() || '🏛️'}
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-white">{cand.candidateName}</h5>
                          <span className="text-[10px] text-slate-400 block">{cand.partyName}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1 border-t border-slate-800/80 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">Total Votes:</span>
                          <span className="font-mono font-bold text-white">{cand.voteCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">Vote Share:</span>
                          <span className="font-mono font-bold text-cyan-300">{cand.votePercentage}%</span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-1.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              cand.winner
                                ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            }`}
                            style={{ width: `${cand.votePercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <Link
                    to="/results"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow cursor-pointer"
                  >
                    <span>View Public Results Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Privacy Guarantee Explainer */}
            <div
              className={`rounded-2xl border p-4 text-xs space-y-1.5 ${
                isDeclared
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-white">
                <Lock className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Ballot Secrecy Safeguard</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                Your ballot is mathematically verified in the {isDeclared ? 'certified final tally' : 'secure ballot vault'}. Your individual candidate selection remains strictly secret and is never linked, recorded, or displayed.
              </p>
            </div>
          </div>
        );
      })()}

      {/* Error Output */}
      {error && (
        <div className="rounded-3xl border border-rose-500/50 bg-[#1A0D11] p-6 space-y-3 animate-fadeIn">
          <div className="flex items-center gap-3 text-rose-400">
            <AlertCircle className="h-6 w-6 shrink-0" />
            <h3 className="font-bold text-white text-base">Receipt Verification Failed</h3>
          </div>
          <p className="text-xs text-rose-200 leading-relaxed">{error}</p>
          <div className="text-[11px] text-slate-400 pt-2">
            Tip: Please double check the exact receipt code string provided upon ballot submission (e.g. <code className="text-cyan-400 font-mono">RCP-XXXXXXXXXXXXXXXX</code>).
          </div>
        </div>
      )}
    </div>
  );
};

export default BallotVerificationPage;
