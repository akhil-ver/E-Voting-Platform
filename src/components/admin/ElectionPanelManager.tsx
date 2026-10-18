/**
 * Core Election Panel & Admin Command Center
 * Authoritative management console for Election Commission / Admins:
 * 1. Create Election (Election Number, Name, Type, Constituency, Hometown, Dates)
 * 2. Upload Eligible Voter List (CSV upload, batch JSON, manual registration, search, delete)
 * 3. Candidate & Official Symbol Manager (Symbols, Party, Colors, Bio, Add/Edit/Remove before voting)
 * 4. Election State & Lifecycle FSM (Open, Pause, Close, Tally / Threshold Decrypt, Publish Results)
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Vote,
  Plus,
  Users,
  UploadCloud,
  FileSpreadsheet,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Lock,
  Unlock,
  Key,
  BarChart3,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  RefreshCw,
  Search,
  Check,
  X,
  FileText,
  AlertOctagon,
  ShieldCheck,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { Election, Candidate, EligibleVoter, ElectionState, ElectionResults } from '../../types';

interface ElectionPanelManagerProps {
  onRefreshMetrics?: () => void;
}

const OFFICIAL_SYMBOLS = [
  { symbol: '🪷', name: 'Lotus', defaultParty: 'National Development Front' },
  { symbol: '✋', name: 'Hand', defaultParty: 'Democratic People’s Coalition' },
  { symbol: '🐘', name: 'Elephant', defaultParty: 'Social Justice Union' },
  { symbol: '🧹', name: 'Broom', defaultParty: 'Civic Transparency Alliance' },
  { symbol: '⚖️', name: 'Scales of Justice', defaultParty: 'National Integrity Forum' },
  { symbol: '🌳', name: 'Green Tree', defaultParty: 'Ecology & Climate Action Front' },
  { symbol: '🌅', name: 'Rising Sun', defaultParty: 'Progressive Civic Alliance' },
  { symbol: '🔥', name: 'Flaming Torch', defaultParty: 'Youth Liberation Bloc' },
  { symbol: '📖', name: 'Open Book', defaultParty: 'Education & Reform Union' },
  { symbol: '🏹', name: 'Bow & Arrow', defaultParty: 'Indigenous Heritage Front' },
  { symbol: '⭐', name: 'Five-Point Star', defaultParty: 'Labor & Workers Coalition' },
  { symbol: '🚜', name: 'Tractor', defaultParty: 'Farmers & Agrarian League' },
  { symbol: '🚲', name: 'Bicycle', defaultParty: 'Urban Mobility & People’s Party' },
  { symbol: '☸️', name: 'Dharma Wheel', defaultParty: 'Sovereign Republic Front' },
];

export const ElectionPanelManager: React.FC<ElectionPanelManagerProps> = ({ onRefreshMetrics }) => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VOTERS' | 'CANDIDATES' | 'LIFECYCLE' | 'RESULTS'>('OVERVIEW');
  const [voters, setVoters] = useState<EligibleVoter[]>([]);
  const [voterSearch, setVoterSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  // Create Election Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newElectionNumber, setNewElectionNumber] = useState<string>('');
  const [newElectionName, setNewElectionName] = useState<string>('');
  const [newElectionType, setNewElectionType] = useState<string>('Municipal Council');
  const [newConstituencyName, setNewConstituencyName] = useState<string>('Mumbai South');
  const [newHometown, setNewHometown] = useState<string>('Mumbai');
  const [newDescription, setNewDescription] = useState<string>('');

  // Add Candidate Modal
  const [showCandidateModal, setShowCandidateModal] = useState<boolean>(false);
  const [candName, setCandName] = useState<string>('');
  const [candParty, setCandParty] = useState<string>('');
  const [candSymbol, setCandSymbol] = useState<string>('🪷');
  const [candBio, setCandBio] = useState<string>('');
  const [candColor, setCandColor] = useState<string>('#38BDF8');

  // Single Voter Add Modal
  const [showAddVoterModal, setShowAddVoterModal] = useState<boolean>(false);
  const [voterName, setVoterName] = useState<string>('');
  const [voterElectionNumber, setVoterElectionNumber] = useState<string>('');
  const [voterNationalId, setVoterNationalId] = useState<string>('');
  const [voterEmail, setVoterEmail] = useState<string>('');

  // CSV Upload Modal
  const [showCsvModal, setShowCsvModal] = useState<boolean>(false);
  const [csvText, setCsvText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Candidate Structured Import Modal (PDF / CSV / Text Table)
  const [showCandidateImportModal, setShowCandidateImportModal] = useState<boolean>(false);
  const [candidateImportText, setCandidateImportText] = useState<string>('');
  const candidateFileInputRef = useRef<HTMLInputElement | null>(null);

  // Results State
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);

  const selectedElection = elections.find((e) => e.id === selectedElectionId) || elections[0] || null;

  const loadElections = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const loadVoters = async () => {
    if (!selectedElectionId) return;
    try {
      const res = await fetch(`/api/elections/${selectedElectionId}/voters?search=${encodeURIComponent(voterSearch)}`);
      if (res.ok) {
        setVoters(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadResults = async () => {
    if (!selectedElectionId) return;
    try {
      const res = await fetch(`/api/elections/${selectedElectionId}/results`);
      if (res.ok) {
        setResults(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadElections();
  }, []);

  useEffect(() => {
    if (selectedElectionId) {
      loadVoters();
      loadResults();
    }
  }, [selectedElectionId, voterSearch]);

  // CREATE ELECTION
  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newElectionName.trim() || !newConstituencyName.trim()) {
      setFeedback({ type: 'ERROR', text: 'Election Name and Constituency are required.' });
      return;
    }

    try {
      const res = await fetch('/api/elections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
        body: JSON.stringify({
          electionNumber: newElectionNumber.trim() || undefined,
          name: newElectionName.trim(),
          electionType: newElectionType,
          constituencyName: newConstituencyName.trim(),
          hometown: newHometown.trim(),
          description: newDescription.trim() || undefined,
          createdBy: 'Authorized Election Panel',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create election.');
      }

      const created: Election = await res.json();
      setFeedback({
        type: 'SUCCESS',
        text: `Election "${created.name}" created with Election Number ${created.electionNumber}.`,
      });

      setShowCreateModal(false);
      setNewElectionName('');
      setNewElectionNumber('');
      setNewDescription('');
      await loadElections();
      setSelectedElectionId(created.id);
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (err: unknown) {
      setFeedback({ type: 'ERROR', text: err instanceof Error ? err.message : 'Creation error' });
    }
  };

  // ADD CANDIDATE WITH SYMBOL
  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candName.trim() || !candParty.trim()) {
      setFeedback({ type: 'ERROR', text: 'Candidate Name and Party are required.' });
      return;
    }

    try {
      const res = await fetch(`/api/elections/${selectedElectionId}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
        body: JSON.stringify({
          displayName: candName.trim(),
          party: candParty.trim(),
          symbol: candSymbol,
          bio: candBio.trim() || undefined,
          color: candColor,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add candidate.');
      }

      const added = await res.json();
      setFeedback({
        type: 'SUCCESS',
        text: `Candidate "${added.displayName}" (${added.party}) added with symbol ${added.symbol}.`,
      });

      setShowCandidateModal(false);
      setCandName('');
      setCandParty('');
      setCandBio('');
      await loadElections();
    } catch (err: unknown) {
      setFeedback({ type: 'ERROR', text: err instanceof Error ? err.message : 'Candidate error' });
    }
  };

  // DELETE CANDIDATE
  const handleDeleteCandidate = async (candidateId: string, displayName: string) => {
    if (!confirm(`Are you sure you want to remove ${displayName}?`)) return;
    try {
      const res = await fetch(`/api/elections/${selectedElectionId}/candidates/${candidateId}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'ADMIN' },
      });
      if (res.ok) {
        setFeedback({ type: 'SUCCESS', text: `Candidate ${displayName} removed.` });
        await loadElections();
      } else {
        const err = await res.json();
        setFeedback({ type: 'ERROR', text: err.error || 'Failed to delete candidate.' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ADD SINGLE ELIGIBLE VOTER
  const handleAddSingleVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voterName.trim()) {
      setFeedback({ type: 'ERROR', text: 'Voter Name is required.' });
      return;
    }

    try {
      const res = await fetch(`/api/elections/${selectedElectionId}/voters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
        body: JSON.stringify({
          name: voterName.trim(),
          voterId: voterElectionNumber.trim() || undefined,
          nationalIdMasked: voterNationalId.trim() ? `IND-****-${voterNationalId.slice(-4)}` : undefined,
          email: voterEmail.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add voter.');
      }

      const added = await res.json();
      setFeedback({
        type: 'SUCCESS',
        text: `Voter ${added.name} added to roll with Election ID: ${added.voterId}.`,
      });

      setShowAddVoterModal(false);
      setVoterName('');
      setVoterElectionNumber('');
      setVoterNationalId('');
      setVoterEmail('');
      loadVoters();
    } catch (err: unknown) {
      setFeedback({ type: 'ERROR', text: err instanceof Error ? err.message : 'Voter registration error' });
    }
  };

  // UPLOAD CSV / JSON VOTERS LIST
  const handleUploadVoters = async () => {
    if (!csvText.trim()) {
      setFeedback({ type: 'ERROR', text: 'Please paste CSV voter data or select a file.' });
      return;
    }

    try {
      // Parse CSV text into voter objects
      const lines = csvText.trim().split('\n');
      const parsedVoters = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        if (i === 0 && (line.toLowerCase().includes('name') || line.toLowerCase().includes('voter'))) continue; // Skip header

        const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 1 && parts[0]) {
          parsedVoters.push({
            name: parts[0],
            voterId: parts[1] || undefined,
            nationalIdMasked: parts[2] ? (parts[2].startsWith('IND-') ? parts[2] : `IND-****-${parts[2].slice(-4)}`) : undefined,
            email: parts[3] || undefined,
            constituency: parts[4] || undefined,
            electionNumber: parts[5] || undefined,
          });
        }
      }

      if (parsedVoters.length === 0) {
        throw new Error('No valid voter entries found in the provided CSV text.');
      }

      const res = await fetch(`/api/elections/${selectedElectionId}/voters/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
        body: JSON.stringify({ voters: parsedVoters }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'CSV upload failed.');
      }

      const data = await res.json();
      setFeedback({
        type: data.rejected > 0 ? 'INFO' : 'SUCCESS',
        text: `Roster Processed: Total: ${data.totalRecords || parsedVoters.length} | Accepted: ${data.accepted} | Rejected: ${data.rejected} (Duplicates: ${data.duplicates || 0}, Invalid Constituency: ${data.invalidConstituency || 0})`,
      });

      setShowCsvModal(false);
      setCsvText('');
      loadVoters();
    } catch (err: unknown) {
      setFeedback({ type: 'ERROR', text: err instanceof Error ? err.message : 'Upload error' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleCandidateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCandidateImportText(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleImportCandidatesList = async () => {
    if (!selectedElectionId || !candidateImportText.trim()) return;
    try {
      let candidateList: Array<{ displayName: string; party: string; symbol?: string; bio?: string; color?: string }> = [];

      const trimmed = candidateImportText.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        candidateList = JSON.parse(trimmed);
      } else {
        const lines = trimmed.split('\n').filter((l) => l.trim() && !l.toLowerCase().startsWith('candidate name'));
        candidateList = lines.map((line) => {
          const parts = line.split(',').map((p) => p.trim());
          return {
            displayName: parts[0] || 'Nominated Candidate',
            party: parts[1] || 'Independent',
            symbol: parts[2] || '🗳️',
            bio: parts[3] || 'Certified by Election Commission for this constituency.',
            color: parts[4] || '#38BDF8',
          };
        });
      }

      if (candidateList.length === 0) {
        throw new Error('No candidate records detected in the import text.');
      }

      const res = await fetch(`/api/elections/${selectedElectionId}/candidates/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
        body: JSON.stringify({ candidates: candidateList }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Candidate list import failed.');
      }

      const data = await res.json();
      setFeedback({
        type: 'SUCCESS',
        text: `Candidate Roster Imported: ${data.accepted} candidates accepted (${data.rejected} rejected).`,
      });

      setShowCandidateImportModal(false);
      setCandidateImportText('');
      await loadElections();
    } catch (err: unknown) {
      setFeedback({ type: 'ERROR', text: err instanceof Error ? err.message : 'Candidate upload error' });
    }
  };

  // DELETE VOTER
  const handleDeleteVoter = async (voterRecordId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this election's roll?`)) return;
    try {
      const res = await fetch(`/api/elections/${selectedElectionId}/voters/${voterRecordId}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'ADMIN' },
      });
      if (res.ok) {
        setFeedback({ type: 'SUCCESS', text: `Voter ${name} removed from roll.` });
        loadVoters();
      } else {
        const err = await res.json();
        setFeedback({ type: 'ERROR', text: err.error || 'Failed to remove voter.' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // TRANSITION STATE
  const handleTransitionState = async (targetState: ElectionState) => {
    if (!selectedElectionId) return;
    try {
      const res = await fetch(`/api/elections/${selectedElectionId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
        body: JSON.stringify({ targetState }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed state transition');
      }

      const updated = await res.json();
      setFeedback({
        type: 'SUCCESS',
        text: `Election state transitioned to ${targetState}.`,
      });

      await loadElections();
      loadResults();
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (err: unknown) {
      setFeedback({ type: 'ERROR', text: err instanceof Error ? err.message : 'State error' });
    }
  };

  // PAUSE / RESUME ELECTION
  const handleTogglePause = async (isPaused: boolean) => {
    if (!selectedElectionId) return;
    try {
      const res = await fetch(`/api/elections/${selectedElectionId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
        body: JSON.stringify({
          isPaused,
          reason: isPaused ? 'Official Inspection by Election Panel' : undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to update pause status.');

      const updated = await res.json();
      setFeedback({
        type: isPaused ? 'ERROR' : 'SUCCESS',
        text: isPaused ? 'Election PAUSED. All voting temporarily blocked.' : 'Election RESUMED. Voting open.',
      });

      await loadElections();
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (err: unknown) {
      setFeedback({ type: 'ERROR', text: err instanceof Error ? err.message : 'Pause error' });
    }
  };

  // UNLOCK THRESHOLD KEY FOR TALLY
  const handleUnlockKeyHolder = async (keyHolderId: string) => {
    setIsUnlocking(true);
    try {
      const res = await fetch(`/api/elections/${selectedElectionId}/results/unlock-threshold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
        body: JSON.stringify({ keyHolderId }),
      });
      if (res.ok) {
        setResults(await res.json());
        setFeedback({ type: 'SUCCESS', text: `Threshold key fragment authorized by ${keyHolderId}.` });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUnlocking(false);
    }
  };

  if (isLoading && elections.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-cyan-400 mb-3" />
        <p className="text-xs font-mono">Loading Election Panel command center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner & Election Selector */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(79,209,255,0.3)]">
              <Vote className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Election Panel Command Center</h2>
                <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/30">
                  AUTHORITATIVE ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Central management of elections, eligible voter lists, candidates, official symbols, and tally publication.
              </p>
            </div>
          </div>

          {/* Action buttons & Election Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Election Dropdown Selector */}
            <div className="relative">
              <select
                id="admin-election-selector"
                value={selectedElectionId}
                onChange={(e) => setSelectedElectionId(e.target.value)}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer pr-8 font-mono"
              >
                {elections.map((el) => (
                  <option key={el.id} value={el.id}>
                    {el.electionNumber}: {el.name} ({el.state})
                  </option>
                ))}
              </select>
            </div>

            {/* Create New Election Button */}
            <button
              id="create-election-btn"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(79,209,255,0.4)] hover:bg-cyan-400 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Election</span>
            </button>
          </div>
        </div>

        {/* Selected Election Metadata Bar */}
        {selectedElection && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Election ID</span>
              <span className="font-mono font-bold text-cyan-400">{selectedElection.electionNumber}</span>
            </div>
            <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Constituency / Area</span>
              <span className="font-semibold text-white truncate block">
                {selectedElection.constituencyName} ({selectedElection.hometown})
              </span>
            </div>
            <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Election Type</span>
              <span className="font-semibold text-slate-200">{selectedElection.electionType}</span>
            </div>
            <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Status</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    selectedElection.isPaused
                      ? 'bg-amber-400'
                      : selectedElection.state === 'VOTING_OPEN'
                      ? 'bg-emerald-400 animate-pulse'
                      : selectedElection.state === 'RESULTS_PUBLISHED'
                      ? 'bg-blue-400'
                      : 'bg-slate-400'
                  }`}
                />
                <span className="font-mono font-bold text-xs text-white">
                  {selectedElection.isPaused ? 'PAUSED' : selectedElection.state}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-medium border animate-in fade-in duration-200 ${
            feedback.type === 'SUCCESS'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'SUCCESS' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="cursor-pointer text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'Overview & Config', icon: Sparkles },
          { id: 'VOTERS', label: `Eligible Voter List (${voters.length})`, icon: Users },
          { id: 'CANDIDATES', label: `Candidates & Symbols (${selectedElection?.candidates.length || 0})`, icon: Vote },
          { id: 'LIFECYCLE', label: 'Lifecycle FSM & Controls', icon: ShieldCheck },
          { id: 'RESULTS', label: 'Tallying & Results', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_15px_rgba(79,209,255,0.15)]'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-900 hover:text-white border border-transparent'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 1. OVERVIEW & CONFIG */}
      {/* ======================================================== */}
      {activeTab === 'OVERVIEW' && selectedElection && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
              <h3 className="text-sm font-bold text-white mb-2">Election Specifications</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{selectedElection.description}</p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Assigned Election ID</span>
                  <span className="font-mono font-bold text-cyan-400 text-sm">{selectedElection.electionNumber}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Target Constituency</span>
                  <span className="font-semibold text-white text-sm">{selectedElection.constituencyName}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Voting Commenced</span>
                  <span className="font-mono text-slate-300">{new Date(selectedElection.startAt).toLocaleString()}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Voting Concludes</span>
                  <span className="font-mono text-slate-300">{new Date(selectedElection.endAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Candidate summary cards */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Certified Candidates</h3>
                <button
                  onClick={() => setActiveTab('CANDIDATES')}
                  className="text-xs text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Manage candidates</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedElection.candidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg shadow-md"
                      style={{ backgroundColor: `${cand.color}20`, border: `1px solid ${cand.color}60` }}
                    >
                      {cand.symbol}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">{cand.displayName}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{cand.party}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side stats */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
              <h3 className="text-sm font-bold text-white mb-4">Roster & Security Metrics</h3>
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Total Registered Voters</span>
                  <span className="font-mono font-bold text-cyan-400">{voters.length}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Ballots Recorded</span>
                  <span className="font-mono font-bold text-emerald-400">{voters.filter((v) => v.hasVoted).length}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Turnout Percentage</span>
                  <span className="font-mono font-bold text-white">
                    {voters.length > 0 ? Math.round((voters.filter((v) => v.hasVoted).length / voters.length) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-slate-400">ZK Proof Validation</span>
                  <span className="font-mono font-bold text-emerald-400">GROTH16 ACTIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Threshold Decryption</span>
                  <span className="font-mono font-bold text-violet-400">2-of-3 MULTI-KEY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ELIGIBLE VOTER LIST MANAGER */}
      {/* ======================================================== */}
      {activeTab === 'VOTERS' && selectedElection && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white">Eligible Voter Roll for {selectedElection.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Only voters present on this roster can verify their credentials and vote in this constituency.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddVoterModal(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3.5 py-2 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Add Single Voter</span>
                </button>

                <button
                  onClick={() => setShowCsvModal(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 transition-all cursor-pointer shadow-[0_0_15px_rgba(79,209,255,0.3)]"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload Voter CSV</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="mt-4 relative">
              <input
                type="text"
                value={voterSearch}
                onChange={(e) => setVoterSearch(e.target.value)}
                placeholder="Search voter by name, election number, or email..."
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono"
              />
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            </div>

            {/* Voter Table */}
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Voter Name</th>
                    <th className="px-4 py-3">Election ID (Voter ID)</th>
                    <th className="px-4 py-3">Constituency / Hometown</th>
                    <th className="px-4 py-3">National ID</th>
                    <th className="px-4 py-3">Voting Status</th>
                    <th className="px-4 py-3">Receipt Hash</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono">
                  {voters.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No voters found on this election roster. Upload a CSV list or add voters individually.
                      </td>
                    </tr>
                  ) : (
                    voters.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-4 py-3 font-sans font-semibold text-white">{v.name}</td>
                        <td className="px-4 py-3 text-cyan-400 font-bold">{v.voterId}</td>
                        <td className="px-4 py-3 text-slate-300 font-sans">
                          {v.constituencyName} ({v.hometown})
                        </td>
                        <td className="px-4 py-3 text-slate-400">{v.nationalIdMasked}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              v.hasVoted
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}
                          >
                            {v.hasVoted ? 'BALLOT CAST' : 'NOT VOTED'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[10px] text-slate-400 max-w-[140px] truncate">
                          {v.receiptHash || '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteVoter(v.id, v.name)}
                            disabled={v.hasVoted}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={v.hasVoted ? 'Cannot delete voter after ballot is cast' : 'Delete voter'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. CANDIDATES & OFFICIAL SYMBOLS MANAGER */}
      {/* ======================================================== */}
      {activeTab === 'CANDIDATES' && selectedElection && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white">Candidates & Official Symbols</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Election Panel assigns certified party symbols. Candidates can only be modified prior to election opening.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCandidateImportModal(true)}
                  disabled={selectedElection.state === 'VOTING_OPEN' || selectedElection.state === 'RESULTS_PUBLISHED'}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-200 transition-all cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4 text-cyan-400" />
                  <span>Import Candidate List (PDF/CSV/Text)</span>
                </button>
                <button
                  onClick={() => setShowCandidateModal(true)}
                  disabled={selectedElection.state === 'VOTING_OPEN' || selectedElection.state === 'RESULTS_PUBLISHED'}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-xs font-bold text-slate-950 transition-all cursor-pointer shadow-[0_0_15px_rgba(79,209,255,0.3)]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Candidate</span>
                </button>
              </div>
            </div>

            {/* Candidates Grid */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedElection.candidates.map((cand) => (
                <div
                  key={cand.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 relative group hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-lg border"
                        style={{
                          backgroundColor: `${cand.color}15`,
                          borderColor: `${cand.color}50`,
                        }}
                      >
                        {cand.symbol}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{cand.displayName}</h4>
                        <span className="text-xs font-medium" style={{ color: cand.color }}>
                          {cand.party}
                        </span>
                      </div>
                    </div>

                    {selectedElection.state !== 'VOTING_OPEN' && selectedElection.state !== 'RESULTS_PUBLISHED' && (
                      <button
                        onClick={() => handleDeleteCandidate(cand.id, cand.displayName)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-slate-400 leading-relaxed">{cand.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. LIFECYCLE FSM & CONTROLS */}
      {/* ======================================================== */}
      {activeTab === 'LIFECYCLE' && selectedElection && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
            <h3 className="text-sm font-bold text-white mb-2">State Machine & Lifecycle Transitions</h3>
            <p className="text-xs text-slate-400 mb-6">
              Only authorized Election Panel administrators can advance state transitions or initiate emergency pauses.
            </p>

            {/* State Progress Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8 text-xs font-mono">
              {[
                { state: 'DRAFT', label: '1. Draft' },
                { state: 'CONFIGURED', label: '2. Configured' },
                { state: 'VOTING_OPEN', label: '3. Voting Open' },
                { state: 'VOTING_CLOSED', label: '4. Voting Closed' },
                { state: 'TALLYING', label: '5. Tallying' },
                { state: 'RESULTS_PUBLISHED', label: '6. Results Published' },
              ].map((step, idx) => {
                const isCurrent = selectedElection.state === step.state;
                return (
                  <div
                    key={step.state}
                    className={`rounded-xl p-3 border text-center transition-all ${
                      isCurrent
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold shadow-[0_0_15px_rgba(79,209,255,0.2)]'
                        : 'bg-slate-900/40 text-slate-500 border-slate-800'
                    }`}
                  >
                    {step.label}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {selectedElection.state === 'DRAFT' && (
                <button
                  onClick={() => handleTransitionState('CONFIGURED')}
                  className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 cursor-pointer shadow-[0_0_15px_rgba(79,209,255,0.3)]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Lock Configuration & Move to Configured</span>
                </button>
              )}

              {selectedElection.state === 'CONFIGURED' && (
                <button
                  onClick={() => handleTransitionState('VOTING_OPEN')}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-slate-950 cursor-pointer shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                >
                  <Play className="h-4 w-4" />
                  <span>Open Voting (Start Season)</span>
                </button>
              )}

              {selectedElection.state === 'VOTING_OPEN' && (
                <>
                  <button
                    onClick={() => handleTogglePause(!selectedElection.isPaused)}
                    className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      selectedElection.isPaused
                        ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                        : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    }`}
                  >
                    {selectedElection.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    <span>{selectedElection.isPaused ? 'Resume Voting' : 'Pause Election (Inspection)'}</span>
                  </button>

                  <button
                    onClick={() => handleTransitionState('VOTING_CLOSED')}
                    className="flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-400 px-5 py-2.5 text-xs font-bold text-white cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                  >
                    <Lock className="h-4 w-4" />
                    <span>Close Voting (End Ballot Casting)</span>
                  </button>
                </>
              )}

              {selectedElection.state === 'VOTING_CLOSED' && (
                <button
                  onClick={() => handleTransitionState('TALLYING')}
                  className="flex items-center gap-2 rounded-xl bg-violet-500 hover:bg-violet-400 px-5 py-2.5 text-xs font-bold text-white cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                >
                  <Key className="h-4 w-4" />
                  <span>Start Vote-Counting / Tally Process</span>
                </button>
              )}

              {selectedElection.state === 'TALLYING' && (
                <button
                  onClick={() => handleTransitionState('RESULTS_PUBLISHED')}
                  className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 cursor-pointer shadow-[0_0_15px_rgba(79,209,255,0.3)]"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Publish Official Results</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. TALLYING & RESULTS */}
      {/* ======================================================== */}
      {activeTab === 'RESULTS' && selectedElection && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-white">Election Tally & Multi-Party Threshold Keys</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tally decryption requires 2 of 3 multi-party keys before aggregate release.
                </p>
              </div>

              <span
                className={`rounded-xl px-3 py-1 text-xs font-bold border ${
                  results?.isDecrypted
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-950 text-amber-400 border-amber-500/40'
                }`}
              >
                {results?.isDecrypted ? 'TALLY DECRYPTED & PUBLISHED' : 'THRESHOLD LOCKED (2/3 REQUIRED)'}
              </span>
            </div>

            {/* Threshold Key Holders */}
            <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 mb-3">Threshold Key Delegates</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'keyholder-ec-chair', name: 'Chief Election Commissioner' },
                  { id: 'keyholder-auditor-lead', name: 'Lead Independent Auditor' },
                  { id: 'keyholder-observer-rep', name: 'Multi-Party Observer Delegate' },
                ].map((kh) => {
                  const isUnlocked = results?.keyHoldersUnlocked.includes(kh.id);
                  return (
                    <div
                      key={kh.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        isUnlocked
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>
                        <span className="font-semibold block text-white">{kh.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{kh.id}</span>
                      </div>
                      {isUnlocked ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <button
                          onClick={() => handleUnlockKeyHolder(kh.id)}
                          disabled={isUnlocking}
                          className="rounded bg-violet-600 hover:bg-violet-500 px-2 py-1 text-[10px] font-bold text-white cursor-pointer"
                        >
                          Unlock
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Candidate Results */}
            {results && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 mb-2">Candidate Vote Totals</h4>
                {results.candidateResults.map((cand) => (
                  <div key={cand.candidateId} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cand.symbol}</span>
                        <span className="font-bold text-white">{cand.displayName}</span>
                        <span className="text-slate-400">({cand.party})</span>
                      </div>
                      <span className="font-mono font-bold text-cyan-400">
                        {cand.voteCount} votes ({cand.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cand.percentage}%`,
                          backgroundColor: cand.color || '#38BDF8',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE ELECTION */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Create New Election</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateElection} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Unique Election Number / ID</label>
                <input
                  type="text"
                  value={newElectionNumber}
                  onChange={(e) => setNewElectionNumber(e.target.value)}
                  placeholder="e.g. ELEC-2026-MUM-03 (Auto-generated if empty)"
                  className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-white border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Election Name *</label>
                <input
                  type="text"
                  required
                  value={newElectionName}
                  onChange={(e) => setNewElectionName(e.target.value)}
                  placeholder="e.g. 2026 Mumbai South Municipal Council Election"
                  className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-white border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Election Type</label>
                  <select
                    value={newElectionType}
                    onChange={(e) => setNewElectionType(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-white border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
                  >
                    <option value="Municipal Council">Municipal Council</option>
                    <option value="State Assembly">State Assembly</option>
                    <option value="Parliamentary">Parliamentary</option>
                    <option value="Civic General">Civic General</option>
                    <option value="By-Election">By-Election</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Hometown / City</label>
                  <input
                    type="text"
                    value={newHometown}
                    onChange={(e) => setNewHometown(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-white border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Constituency Name *</label>
                <input
                  type="text"
                  required
                  value={newConstituencyName}
                  onChange={(e) => setNewConstituencyName(e.target.value)}
                  placeholder="e.g. Mumbai South Constituency"
                  className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-white border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of the election..."
                  className="w-full rounded-xl bg-slate-950 px-3.5 py-2 text-white border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2 font-bold text-slate-950 cursor-pointer shadow-[0_0_15px_rgba(79,209,255,0.4)]"
                >
                  Create Election
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD CANDIDATE */}
      {/* ======================================================== */}
      {showCandidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Add Candidate & Official Symbol</h3>
              </div>
              <button onClick={() => setShowCandidateModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddCandidate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Candidate Full Name *</label>
                <input
                  type="text"
                  required
                  value={candName}
                  onChange={(e) => setCandName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kulkarni"
                  className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-white border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Political Party *</label>
                <input
                  type="text"
                  required
                  value={candParty}
                  onChange={(e) => setCandParty(e.target.value)}
                  placeholder="e.g. Progressive Civic Alliance"
                  className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-white border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              {/* Official Symbol Picker */}
              <div>
                <label className="block text-slate-400 mb-1.5">Official Party/Candidate Symbol *</label>
                <div className="grid grid-cols-7 gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  {OFFICIAL_SYMBOLS.map((item) => (
                    <button
                      key={item.symbol}
                      type="button"
                      onClick={() => {
                        setCandSymbol(item.symbol);
                        if (!candParty) setCandParty(item.defaultParty);
                      }}
                      className={`h-10 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer ${
                        candSymbol === item.symbol
                          ? 'bg-cyan-500/30 border-2 border-cyan-400 scale-110 shadow-lg'
                          : 'bg-slate-900 hover:bg-slate-800 border border-slate-800'
                      }`}
                      title={`${item.name} (${item.defaultParty})`}
                    >
                      {item.symbol}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Candidate Bio & Manifesto</label>
                <textarea
                  rows={2}
                  value={candBio}
                  onChange={(e) => setCandBio(e.target.value)}
                  placeholder="Key civic goals, infrastructure vision..."
                  className="w-full rounded-xl bg-slate-950 px-3.5 py-2 text-white border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCandidateModal(false)}
                  className="rounded-xl px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2 font-bold text-slate-950 cursor-pointer shadow-[0_0_15px_rgba(79,209,255,0.4)]"
                >
                  Certify Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD SINGLE VOTER */}
      {/* ======================================================== */}
      {showAddVoterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Register Eligible Voter</h3>
              </div>
              <button onClick={() => setShowAddVoterModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSingleVoter} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Voter Full Name *</label>
                <input
                  type="text"
                  required
                  value={voterName}
                  onChange={(e) => setVoterName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-white border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Election Number / Voter ID (Optional)</label>
                <input
                  type="text"
                  value={voterElectionNumber}
                  onChange={(e) => setVoterElectionNumber(e.target.value)}
                  placeholder="e.g. VOT-MUM-552 (Auto-generated if empty)"
                  className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-white border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">National ID / Aadhaar Last 4 Digits</label>
                <input
                  type="text"
                  maxLength={4}
                  value={voterNationalId}
                  onChange={(e) => setVoterNationalId(e.target.value)}
                  placeholder="e.g. 8821"
                  className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-white border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={voterEmail}
                  onChange={(e) => setVoterEmail(e.target.value)}
                  placeholder="e.g. voter@domain.gov"
                  className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-white border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVoterModal(false)}
                  className="rounded-xl px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2 font-bold text-slate-950 cursor-pointer shadow-[0_0_15px_rgba(79,209,255,0.4)]"
                >
                  Add to Roll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CSV VOTER UPLOAD */}
      {/* ======================================================== */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Upload Complete Eligible Voter List</h3>
              </div>
              <button onClick={() => setShowCsvModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-400">
                Upload a CSV file or paste voter entries directly. Columns: <code className="text-cyan-400">Name, VoterID, NationalID, Email</code>
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".csv,.txt"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 px-4 py-2 text-xs font-bold text-cyan-400 cursor-pointer flex items-center gap-1.5"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Choose CSV File</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCsvText(
                      `Name,VoterID,NationalID,Email\n` +
                      `Sunita Kadam,VOT-MUM-801,9921,sunita@mumbai.gov\n` +
                      `Deepak Joshi,VOT-MUM-802,4412,deepak@mumbai.gov\n` +
                      `Farhan Qureshi,VOT-MUM-803,1190,farhan@mumbai.gov\n` +
                      `Meenakshi Sundaram,VOT-MUM-804,7731,meenakshi@mumbai.gov`
                    );
                  }}
                  className="text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Load Sample Roster
                </button>
              </div>

              <div>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Paste CSV rows here..."
                  className="w-full rounded-xl bg-slate-950 p-3 text-white border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="rounded-xl px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUploadVoters}
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2 font-bold text-slate-950 cursor-pointer shadow-[0_0_15px_rgba(79,209,255,0.4)]"
                >
                  Upload & Validate Roster
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CANDIDATE STRUCTURED IMPORT (PDF/CSV/TEXT) */}
      {/* ======================================================== */}
      {showCandidateImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Import Candidate List</h3>
                  <p className="text-[11px] text-slate-400">Structured PDF extract, CSV roster, or formatted table</p>
                </div>
              </div>
              <button onClick={() => setShowCandidateImportModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-400">
                Upload a structured file or paste candidate lines. Columns: <code className="text-cyan-400">Name, Party, Symbol, Bio, ColorHex</code>
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".csv,.txt,.json"
                  ref={candidateFileInputRef}
                  onChange={handleCandidateFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => candidateFileInputRef.current?.click()}
                  className="rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 px-4 py-2 text-xs font-bold text-cyan-400 cursor-pointer flex items-center gap-1.5"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Choose File</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCandidateImportText(
                      `Candidate Name,Party,Symbol,Bio,Color\n` +
                      `Dr. Ananya Roy,Progressive Civic Alliance,⚖️,Urban Infrastructure & Health Specialist,#06B6D4\n` +
                      `Vikramaditya Rao,National People's Front,🌾,Rural & Economic Development Lead,#10B981\n` +
                      `Zoya Merchant,Clean Governance Movement,🕊️,Public Transparency Advocate,#8B5CF6\n` +
                      `Rohan Mehra,United Tech Workers League,💻,Digital Economy & Worker Welfare,#F59E0B`
                    );
                  }}
                  className="text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Load Sample Candidate List
                </button>
              </div>

              <div>
                <textarea
                  rows={6}
                  value={candidateImportText}
                  onChange={(e) => setCandidateImportText(e.target.value)}
                  placeholder="Paste candidate entries or PDF extracted text here..."
                  className="w-full rounded-xl bg-slate-950 p-3 text-white border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCandidateImportModal(false)}
                  className="rounded-xl px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportCandidatesList}
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2 font-bold text-slate-950 cursor-pointer shadow-[0_0_15px_rgba(79,209,255,0.4)]"
                >
                  Import Candidates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
