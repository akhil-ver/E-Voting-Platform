/**
 * Election Results & Threshold Decryption Dashboard
 * Enforces 2-of-3 multi-party threshold key unlocking before tally release
 * Provides official signed, verifiable election report exports for external archival
 */
import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  CheckCircle2,
  Users,
  Award,
  Vote,
  Sparkles,
  RefreshCw,
  Download,
  FileCheck2,
  Copy,
  Check,
  FileJson,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { Election, ElectionResults, SignedElectionReport } from '../../types';
import { RegionalAnomalyBubbleChart } from './RegionalAnomalyBubbleChart';

export const ResultsDashboard: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('elec-mum-01');
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [reportData, setReportData] = useState<SignedElectionReport | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [copiedDigest, setCopiedDigest] = useState<boolean>(false);
  const [copiedAuditHash, setCopiedAuditHash] = useState<boolean>(false);
  const [reportExportSuccess, setReportExportSuccess] = useState<string | null>(null);

  const fetchElections = async () => {
    try {
      const res = await fetch('/api/elections');
      if (res.ok) {
        const data: Election[] = await res.json();
        setElections(data);
        if (data.length > 0 && !selectedElectionId) {
          setSelectedElectionId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchResults = async () => {
    if (!selectedElectionId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/elections/${selectedElectionId}/results`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    fetchResults();
  }, [selectedElectionId]);

  const handleUnlockKeyHolder = async (keyHolderId: string) => {
    if (!selectedElectionId) return;
    setIsUnlocking(true);
    try {
      const response = await fetch(`/api/elections/${selectedElectionId}/results/unlock-threshold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyHolderId }),
      });
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleFetchReport = async () => {
    if (!selectedElectionId) return;
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/elections/${selectedElectionId}/report`);
      if (response.ok) {
        const data: SignedElectionReport = await response.json();
        setReportData(data);
        setShowReportModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch election report:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSignedJson = async () => {
    if (!selectedElectionId) return;
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/elections/${selectedElectionId}/report?download=true`);
      if (response.ok) {
        const data: SignedElectionReport = await response.json();
        setReportData(data);
        
        // Trigger browser download
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const fileName = `certified-election-report-${data.election.electionNumber}-${data.reportId}.json`;
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setReportExportSuccess(`Exported ${fileName}`);
        setTimeout(() => setReportExportSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Failed to download election report:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const copyDigest = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDigest(true);
    setTimeout(() => setCopiedDigest(false), 2000);
  };

  const copyAuditHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAuditHash(true);
    setTimeout(() => setCopiedAuditHash(false), 2000);
  };

  const handleToggleElectionState = async () => {
    if (!selectedElectionId) return;
    try {
      const res = await fetch(`/api/elections/${selectedElectionId}/toggle-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        await fetchElections();
        await fetchResults();
      }
    } catch {
      // Ignore
    }
  };

  const selectedElection = elections.find((e) => e.id === selectedElectionId);

  if (isLoading || !results) {
    return (
      <div className="py-20 text-center text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-cyan-400 mb-3" />
        <p className="text-xs font-mono">Loading election tally and threshold keys...</p>
      </div>
    );
  }

  const keyHolders = [
    {
      id: 'keyholder-ec-chair',
      name: 'Chief Election Commissioner',
      role: 'ELECTION_AUTHORITY',
      unlocked: results.keyHoldersUnlocked.includes('keyholder-ec-chair'),
    },
    {
      id: 'keyholder-auditor-lead',
      name: 'Lead Independent Auditor',
      role: 'INDEPENDENT_AUDITOR',
      unlocked: results.keyHoldersUnlocked.includes('keyholder-auditor-lead'),
    },
    {
      id: 'keyholder-observer-rep',
      name: 'Multi-Party Observer Delegate',
      role: 'PUBLIC_OBSERVER',
      unlocked: results.keyHoldersUnlocked.includes('keyholder-observer-rep'),
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(79,209,255,0.3)]">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {selectedElection ? selectedElection.name : 'Election Results & Tally'}
                </h2>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                    results.isDecrypted
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                      : 'bg-amber-950 text-amber-400 border-amber-500/40'
                  }`}
                >
                  {results.isDecrypted ? 'RESULTS DECRYPTED' : 'THRESHOLD LOCKED (2/3 REQUIRED)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedElection?.electionNumber} • {selectedElection?.constituencyName} ({selectedElection?.hometown})
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {elections.length > 1 && (
              <select
                id="election-results-select"
                value={selectedElectionId}
                onChange={(e) => setSelectedElectionId(e.target.value)}
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer font-mono"
              >
                {elections.map((el) => (
                  <option key={el.id} value={el.id}>
                    {el.electionNumber}: {el.name}
                  </option>
                ))}
              </select>
            )}

            <div className="rounded-xl bg-slate-900 px-3 py-2 border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Turnout</span>
              <span className="font-mono font-bold text-cyan-400 text-sm">
                {results.totalVotes} votes ({results.turnoutPercentage}%)
              </span>
            </div>

            {/* Download Election Report CTA Button */}
            <button
              id="download-election-report-button"
              onClick={handleDownloadSignedJson}
              disabled={isDownloading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(79,209,255,0.35)] hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer disabled:opacity-50"
              title="Export signed, verifiable JSON report for official archival"
            >
              {isDownloading ? (
                <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
              ) : (
                <Download className="h-4 w-4 text-slate-950" />
              )}
              <span>{isDownloading ? 'Exporting...' : 'Download Election Report'}</span>
            </button>

            {/* Inspect Report Modal Trigger */}
            <button
              id="view-signed-report-button"
              onClick={handleFetchReport}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 transition-all cursor-pointer"
              title="Inspect cryptographic proof document and signatures"
            >
              <FileCheck2 className="h-3.5 w-3.5 text-cyan-400" />
              <span>Verify Signatures</span>
            </button>
          </div>
        </div>

        {/* Success Alert Notification */}
        {reportExportSuccess && (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold">{reportExportSuccess}</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">Cryptographically Signed Document</span>
          </div>
        )}

        {/* Election State Banner & Admin Action */}
        <div
          className={`mt-4 rounded-xl p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
            selectedElection?.state === 'VOTING_OPEN'
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {selectedElection?.state === 'VOTING_OPEN' ? (
              <Clock className="h-5 w-5 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            )}
            <div>
              <span className="font-bold block">
                {selectedElection?.state === 'VOTING_OPEN'
                  ? 'Status: Election Undergoing (Polls Open)'
                  : 'Status: Election Closed (Tally Finalized & Certified)'}
              </span>
              <span className="text-slate-300 text-[11px]">
                {selectedElection?.state === 'VOTING_OPEN'
                  ? 'Polls are currently open. Ballots are sealed in the ledger. Receipts verify as "Election Undergoing" until Admin closes the election.'
                  : 'Polls have been closed by Election Admin. All ballots are counted in the certified tally.'}
              </span>
            </div>
          </div>

          <button
            onClick={handleToggleElectionState}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shrink-0 flex items-center gap-1.5 ${
              selectedElection?.state === 'VOTING_OPEN'
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {selectedElection?.state === 'VOTING_OPEN' ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                <span>Admin: Close Election (Count Votes)</span>
              </>
            ) : (
              <>
                <Unlock className="h-3.5 w-3.5" />
                <span>Admin: Reopen Election (Voting Undergoing)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Threshold Key-Holder Unlocking Section */}
      <div className="rounded-2xl border border-violet-500/30 bg-slate-900/40 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Shamir / Multi-Party Threshold Cryptography (Quorum: {results.keyHoldersRequired} of {keyHolders.length} Keys)
            </h3>
          </div>
          <span className="text-xs font-mono text-violet-300">
            {results.keyHoldersUnlocked.length}/{results.keyHoldersRequired} Required Approvals
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {keyHolders.map((kh) => (
            <div
              key={kh.id}
              className={`rounded-xl border p-4 transition-all ${
                kh.unlocked
                  ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase">{kh.role}</span>
                {kh.unlocked ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Lock className="h-4 w-4 text-slate-500" />
                )}
              </div>
              <h4 className="text-xs font-bold text-white mt-1">{kh.name}</h4>

              <div className="mt-3">
                {kh.unlocked ? (
                  <span className="rounded bg-emerald-950/80 px-2 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 block text-center">
                    KEY SIGNATURE APPROVED
                  </span>
                ) : (
                  <button
                    onClick={() => handleUnlockKeyHolder(kh.id)}
                    disabled={isUnlocking}
                    className="w-full rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Unlock className="h-3.5 w-3.5" />
                    <span>Approve Key Share</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Candidate Tally Visualizer */}
      {results.isDecrypted ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" />
                <span>Certified Candidate Tabulation</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Official tally certified with 2-of-3 threshold signature release and Merkle branch integrity.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
                <span>Audit:</span>
                <strong className="text-cyan-300">{results.tallyAuditHash?.slice(0, 14)}...</strong>
                <button
                  onClick={() => copyAuditHash(results.tallyAuditHash)}
                  className="hover:text-white ml-1 text-slate-400 cursor-pointer"
                  title="Copy Audit Hash"
                >
                  {copiedAuditHash ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {results.candidateResults.map((candidate, idx) => (
              <div key={candidate.candidateId} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 font-bold text-xs text-white">
                      #{idx + 1}
                    </span>
                    <span className="text-xl">{candidate.symbol}</span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{candidate.displayName}</h4>
                      <p className="text-xs text-slate-400">{candidate.party}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-cyan-400">
                      {candidate.voteCount} votes
                    </span>
                    <span className="text-xs text-slate-400 block font-mono">
                      {candidate.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 h-2.5 w-full rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${candidate.percentage}%`,
                      backgroundColor: candidate.color || '#3b82f6',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Archival Export Banner at bottom of Tally */}
          <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900/80 to-blue-950/30 p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                <FileJson className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Official Signed Election Report Available</h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  Contains certified candidate results, digital signatures from Commission & Observers, Merkle roots, and tamper-proof SHA-256 digest.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleFetchReport}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-bold text-white border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FileCheck2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>View Report</span>
              </button>
              <button
                onClick={handleDownloadSignedJson}
                disabled={isDownloading}
                className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5 text-slate-950" />
                <span>Download JSON</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-12 text-center">
          <Lock className="h-10 w-10 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-white">Results Homomorphically Sealed</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Click &quot;Approve Key Share&quot; above for at least 2 keyholders to release the cryptographic threshold seal.
          </p>
        </div>
      )}

      {/* D3-based Regional District Anomaly Detection Bubble Chart */}
      <RegionalAnomalyBubbleChart
        electionId={selectedElectionId}
        electionName={selectedElection?.name}
      />

      {/* Signed Election Report Inspection Modal */}
      {showReportModal && reportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Official Signed Election Report
                  </h3>
                  <span className="font-mono text-xs text-cyan-300">
                    ID: {reportData.reportId} • Schema {reportData.schemaVersion}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Election & Constituency Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-slate-900/60 p-3.5 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Election Information</span>
                <p className="font-bold text-white text-sm">{reportData.election.name}</p>
                <p className="text-cyan-300 font-mono">{reportData.election.electionNumber}</p>
                <p className="text-slate-400">
                  {reportData.election.constituencyName} ({reportData.election.hometown}) • {reportData.election.electionType}
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/60 p-3.5 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Turnout & Tabulation</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Votes Cast:</span>
                  <span className="font-mono font-bold text-white">{reportData.statistics.totalVotesCast}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Registered Electors:</span>
                  <span className="font-mono font-bold text-white">{reportData.statistics.registeredVoters}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Voter Turnout:</span>
                  <span className="font-mono font-bold text-cyan-400">{reportData.statistics.turnoutPercentage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Threshold Status:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {reportData.statistics.thresholdKeyHoldersUnlocked}/{reportData.statistics.thresholdKeyHoldersTotal} Keys (Decrypted)
                  </span>
                </div>
              </div>
            </div>

            {/* Cryptographic Proofs & Digest */}
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck2 className="h-4 w-4 text-cyan-400" />
                  <span>Cryptographic Content Digest (SHA-256)</span>
                </span>
                <button
                  onClick={() => copyDigest(reportData.cryptographicProofs.contentDigestSha256)}
                  className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  {copiedDigest ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedDigest ? 'Copied' : 'Copy Digest'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-white break-all">
                {reportData.cryptographicProofs.contentDigestSha256}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-950/60 p-2 rounded border border-slate-800 font-mono">
                  <span className="text-slate-500 block text-[10px]">Tally Audit Hash:</span>
                  <span className="text-cyan-300 break-all">{reportData.cryptographicProofs.tallyAuditHash}</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded border border-slate-800 font-mono">
                  <span className="text-slate-500 block text-[10px]">Merkle Root:</span>
                  <span className="text-emerald-300 break-all">{reportData.cryptographicProofs.merkleRoot}</span>
                </div>
              </div>
            </div>

            {/* Digital Multi-Signatures */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Certified Digital Signatures ({reportData.signatures.length} Multi-Party Signers)
              </h4>
              <div className="space-y-2">
                {reportData.signatures.map((sig) => (
                  <div key={sig.signerId} className="rounded-xl bg-slate-900/60 border border-slate-800 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span className="font-bold text-white">{sig.signerName}</span>
                      </div>
                      <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                        {sig.role}
                      </span>
                    </div>
                    <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[10px] text-slate-400">
                      <div>Key: {sig.keyFingerprint}</div>
                      <div className="truncate">Sig: {sig.signature}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <p className="text-[11px] text-slate-500">
                Generated at {new Date(reportData.generatedAt).toLocaleString()}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleDownloadSignedJson}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 shadow-md cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Signed JSON</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
