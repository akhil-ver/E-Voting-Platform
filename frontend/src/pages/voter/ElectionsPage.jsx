import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import {
  Vote,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowRight,
  Lock,
  Unlock,
  Radio,
  UserCheck,
  RefreshCw,
  Award,
  MapPin,
  Search,
  Filter,
  Star,
  Info,
  Key,
} from 'lucide-react';

export const ElectionsPage = () => {
  const { user, isAuthenticated, isVoter } = useAuth();
  const location = useLocation();

  const [elections, setElections] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteReceipt, setVoteReceipt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Secret Voting Key state
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [keyStatus, setKeyStatus] = useState(null);
  const [generatedRawKey, setGeneratedRawKey] = useState(null);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'OPEN' | 'MY_AREA'

  // Fetch Areas and Elections
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [electionsRes, areasRes] = await Promise.all([
        axiosClient.get('/elections'),
        axiosClient.get('/areas'),
      ]);

      const electionList = electionsRes.success && electionsRes.data ? electionsRes.data : [];
      const areaList = areasRes.success && areasRes.data ? areasRes.data : [];

      setElections(electionList);
      setAreas(areaList);

      // Determine initial election to select:
      // 1. Check URL query params for ?area= or ?election=
      const params = new URLSearchParams(location.search);
      const queryArea = params.get('area');
      const queryElectionCode = params.get('election');

      let targetElection = null;

      if (queryElectionCode) {
        targetElection = electionList.find(
          (e) => e.electionCode?.toLowerCase() === queryElectionCode.toLowerCase()
        );
      } else if (queryArea) {
        targetElection = electionList.find(
          (e) =>
            e.areaId === Number(queryArea) ||
            e.areaCode?.toLowerCase() === queryArea.toLowerCase() ||
            e.areaName?.toLowerCase() === queryArea.toLowerCase()
        );
      }

      // 2. If not specified in URL and user is logged in as a citizen voter, prioritize their area!
      if (!targetElection && user?.areaName) {
        targetElection = electionList.find(
          (e) =>
            e.areaName?.toLowerCase() === user.areaName?.toLowerCase() ||
            e.areaId === user.areaId
        );
      }

      // 3. Fallback to first available election
      if (!targetElection && electionList.length > 0) {
        targetElection = electionList[0];
      }

      if (targetElection) {
        selectElection(targetElection);
      }
    } catch (err) {
      console.error('Failed to load elections data', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Select Election & Fetch Candidates + Voting Status
  const selectElection = async (election) => {
    if (!election) return;
    setSelectedElection(election);
    setSelectedCandidateId(null);
    setVoteReceipt(null);
    setFeedback(null);
    setSecretKeyInput('');
    setGeneratedRawKey(null);

    // Fetch Candidates
    try {
      const res = await axiosClient.get(`/candidates/election/${election.id}`);
      if (res.success && res.data) {
        setCandidates(res.data);
      }
    } catch (err) {
      console.error('Failed to load candidates', err);
    }

    // If authenticated voter, check if already voted and get secret key status
    if (isAuthenticated && election) {
      try {
        const vRes = await axiosClient.get(`/voting/has-voted/${election.id}`);
        if (vRes.success && vRes.data) {
          setHasVoted(vRes.data.hasVoted);
          if (vRes.data.hasVoted) {
            try {
              const rRes = await axiosClient.get(`/voting/my-receipt/${election.id}`);
              if (rRes.success && rRes.data) {
                setVoteReceipt(rRes.data);
                if (user?.voterId) {
                  localStorage.setItem(`voter_receipt_${user.voterId}_${election.id}`, JSON.stringify(rRes.data));
                }
              }
            } catch (rErr) {
              if (user?.voterId) {
                const cached = localStorage.getItem(`voter_receipt_${user.voterId}_${election.id}`);
                if (cached) {
                  try {
                    setVoteReceipt(JSON.parse(cached));
                  } catch (e) {}
                }
              }
            }
          }
        }
      } catch (err) {
        setHasVoted(false);
      }

      // Fetch Secret Key Status
      try {
        const kRes = await axiosClient.get(`/voting/keys/status/${election.id}`);
        if (kRes.success && kRes.data) {
          setKeyStatus(kRes.data);
        }
      } catch (kErr) {
        setKeyStatus(null);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated, location.search]);

  // Handle Secret Key Generation or Reissuance
  const handleGenerateKey = async (forceReissue = false) => {
    if (!selectedElection) return;
    setIsGeneratingKey(true);
    setFeedback(null);
    try {
      const res = await axiosClient.post(
        `/voting/keys/generate/${selectedElection.id}?forceReissue=${forceReissue}`
      );
      if (res.success && res.data) {
        setKeyStatus(res.data);
        if (res.data.rawKey) {
          setGeneratedRawKey(res.data.rawKey);
          setSecretKeyInput(res.data.rawKey);
        }
        setFeedback({
          type: 'success',
          message: res.data.message || 'Secret voting key processed successfully.',
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to generate secret voting key.' });
    } finally {
      setIsGeneratingKey(false);
    }
  };

  // Handle Ballot Cast
  const handleCastVote = async () => {
    if (!selectedCandidateId || !selectedElection) return;
    if (!secretKeyInput.trim()) {
      setFeedback({
        type: 'error',
        message: 'A valid Secret Voting Key is required before your confidential ballot can be cast.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await axiosClient.post('/voting/cast', {
        electionId: selectedElection.id,
        candidateId: selectedCandidateId,
        secretVotingKey: secretKeyInput.trim(),
      });
      if (res.success && res.data) {
        setVoteReceipt(res.data);
        setHasVoted(true);
        if (user?.voterId) {
          localStorage.setItem(
            `voter_receipt_${user.voterId}_${selectedElection.id}`,
            JSON.stringify(res.data)
          );
        }
        setFeedback({
          type: 'success',
          message: 'Ballot recorded successfully! Your 256-bit cryptographic vote hash and receipt are generated.',
        });
        loadData();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to record ballot.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyText = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Check if current user is enrolled in selected election's area
  const isUserAreaElection =
    Boolean(user?.areaName && selectedElection?.areaName) &&
    user.areaName.toLowerCase() === selectedElection.areaName.toLowerCase();

  const isEligibleToVote =
    isAuthenticated &&
    isVoter &&
    isUserAreaElection &&
    selectedElection?.status === 'OPEN' &&
    !hasVoted;

  // Filtered elections list
  const filteredElections = elections.filter((el) => {
    // Status Filter
    if (statusFilter === 'OPEN' && el.status !== 'OPEN') return false;
    if (statusFilter === 'MY_AREA' && user?.areaName) {
      if (el.areaName?.toLowerCase() !== user.areaName?.toLowerCase()) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = el.name?.toLowerCase().includes(q);
      const matchArea = el.areaName?.toLowerCase().includes(q);
      const matchConstituency = el.constituencyName?.toLowerCase().includes(q);
      const matchCode = el.electionCode?.toLowerCase().includes(q);
      return matchName || matchArea || matchConstituency || matchCode;
    }

    return true;
  });

  const openElectionsCount = elections.filter((e) => e.status === 'OPEN').length;

  return (
    <div className="py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Democratic Polls
            </span>
            <span className="text-xs text-slate-500 font-mono">Layer 2: Area-Wise Elections</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Open Election Areas &amp; Ballot Casting
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse all 10 municipal and legislative election areas, inspect approved candidate rosters, and cast your anonymous, verifiable ballot.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            loadData();
            if (selectedElection) selectElection(selectedElection);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
          <span>Refresh Polls</span>
        </button>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <span className="text-[10px] text-slate-500 uppercase font-mono block">Demonstration Areas</span>
          <span className="text-xl font-bold font-mono text-white mt-0.5 block">{areas.length || 10} Cities</span>
          <span className="text-[11px] text-slate-400">All registered zones</span>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <span className="text-[10px] text-emerald-400 uppercase font-mono block">Live Voting Open</span>
          <span className="text-xl font-bold font-mono text-emerald-300 mt-0.5 block">{openElectionsCount} Elections</span>
          <span className="text-[11px] text-emerald-400/80">Active ballot boxes</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <span className="text-[10px] text-slate-500 uppercase font-mono block">Ballot Privacy</span>
          <span className="text-xl font-bold text-cyan-300 mt-0.5 block">Zero-Knowledge</span>
          <span className="text-11px text-slate-400">Decoupled identity</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <span className="text-[10px] text-slate-500 uppercase font-mono block">Your Voter Status</span>
          {isAuthenticated ? (
            <div>
              <span className="text-sm font-bold text-white block truncate">{user?.fullName || user?.username}</span>
              <span className="text-[11px] text-cyan-300 font-mono">Area: {user?.areaName || 'Admin'}</span>
            </div>
          ) : (
            <div>
              <span className="text-xs font-bold text-slate-300 block">Not Logged In</span>
              <Link to="/login" className="text-[11px] text-cyan-400 font-bold hover:underline">
                Sign in to vote →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 10 City / Area Quick Switcher Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-cyan-400" />
            <span>Select Area / City (All 10 Demonstration Metropolitan Zones):</span>
          </label>
          <span className="text-[11px] text-slate-500 font-mono">Click any city to view election</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {areas.map((area) => {
            const areaElection = elections.find(
              (e) => e.areaId === area.id || e.areaCode === area.areaCode || e.areaName === area.name
            );
            const isSelected = selectedElection?.areaId === area.id || selectedElection?.areaName === area.name;
            const isOpen = areaElection?.status === 'OPEN';
            const isUserArea = user?.areaName?.toLowerCase() === area.name?.toLowerCase();

            return (
              <button
                key={area.id}
                type="button"
                onClick={() => {
                  if (areaElection) {
                    selectElection(areaElection);
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/30 scale-[1.02]'
                    : isUserArea
                    ? 'bg-slate-900/90 border-cyan-500/40 text-cyan-200 hover:border-cyan-400'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{area.name}</span>
                {isUserArea && <Star className="h-3 w-3 text-amber-400 fill-amber-400" title="Your Registered Area" />}
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                    isOpen
                      ? isSelected
                        ? 'bg-slate-950 text-emerald-300'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : isSelected
                      ? 'bg-slate-950 text-slate-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isOpen ? 'Live Open' : areaElection ? areaElection.status : 'No Poll'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedback && (
        <div
          className={`rounded-2xl border p-4 text-xs flex items-center justify-between gap-3 animate-fadeIn ${
            feedback.type === 'success'
              ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200'
              : 'border-rose-500/50 bg-rose-950/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar for Elections */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by City, Constituency, or Election Name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Areas ({elections.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('OPEN')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'OPEN' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-emerald-400 hover:text-white'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Polls Open ({openElectionsCount})
          </button>
          {user?.areaName && (
            <button
              type="button"
              onClick={() => setStatusFilter('MY_AREA')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'MY_AREA' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-cyan-400 hover:text-white'
              }`}
            >
              <Star className="h-3 w-3 fill-current" />
              <span>My Area ({user.areaName})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Election Selector Sidebar + Ballot Booth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Elections List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-cyan-400" />
              <span>Configured Elections ({filteredElections.length})</span>
            </h3>
            {user?.areaName && (
              <span className="text-[11px] text-cyan-300 font-mono">You: {user.areaName}</span>
            )}
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredElections.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-400 text-xs">
                No elections match your search criteria.
              </div>
            ) : (
              filteredElections.map((el) => {
                const isSelected = selectedElection?.id === el.id;
                const isOpen = el.status === 'OPEN';
                const isDeclared = el.status === 'RESULT_DECLARED';
                const isUserArea = user?.areaName?.toLowerCase() === el.areaName?.toLowerCase();

                return (
                  <div
                    key={el.id}
                    onClick={() => selectElection(el)}
                    className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-950/50'
                        : isUserArea
                        ? 'border-cyan-500/30 bg-slate-950/80 hover:bg-slate-900/60'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {el.electionCode}
                        </span>
                        {isUserArea && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                            <Star className="h-2.5 w-2.5 fill-amber-300" />
                            <span>Your Area</span>
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                          isOpen
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                            : isDeclared
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        {isOpen ? 'Polls Open' : el.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white mt-2">{el.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      City: <strong className="text-slate-200">{el.areaName}</strong>{' '}
                      {el.constituencyName && (
                        <span className="text-cyan-400 font-medium">({el.constituencyName})</span>
                      )}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2.5 mt-2.5 border-t border-slate-800/80">
                      <span>
                        Candidates: <strong className="text-white">{el.candidateCount}</strong>
                      </span>
                      <span>
                        Votes: <strong className="text-cyan-400">{el.votesCast}</strong>{' '}
                        <span className="text-slate-400 font-mono">({el.turnoutPercentage}%)</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Columns: Voting Booth & Candidate Selection */}
        <div className="lg:col-span-2 space-y-6">
          {selectedElection ? (
            <div className="space-y-6">
              {/* Election Header Card */}
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/20">
                        {selectedElection.electionCode}
                      </span>
                      <span className="text-xs font-bold text-slate-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                        {selectedElection.electionType}
                      </span>
                    </div>

                    <h2 className="text-xl font-black text-white mt-2">{selectedElection.name}</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      City: <span className="text-cyan-300 font-semibold">{selectedElection.areaName}</span> | Constituency: <span className="text-white font-semibold">{selectedElection.constituencyName || selectedElection.areaName}</span>
                    </p>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border shrink-0 ${
                      selectedElection.status === 'OPEN'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 animate-pulse'
                        : selectedElection.status === 'RESULT_DECLARED'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    {selectedElection.status === 'OPEN' ? '🟢 Polls Open' : selectedElection.status}
                  </span>
                </div>

                {/* Turnout Statistics Bar */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Eligible Area Voters</span>
                    <span className="text-sm font-bold font-mono text-white">{selectedElection.totalEligibleVoters}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Ballots Recorded</span>
                    <span className="text-sm font-bold font-mono text-cyan-400">{selectedElection.votesCast}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Area Voter Turnout</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">{selectedElection.turnoutPercentage}%</span>
                  </div>
                </div>
              </div>

              {/* Citizen Eligibility & Area Residency Banner */}
              {isAuthenticated && isVoter && (
                <div>
                  {isUserAreaElection ? (
                    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-xs flex items-center gap-3 text-emerald-200">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white block">
                          🌟 You Are Officially Enrolled in this Constituency ({selectedElection.areaName})
                        </span>
                        <p className="text-emerald-300/80 text-[11px] mt-0.5">
                          Your electoral record ({user.voterId}) is verified for {selectedElection.areaName}. You are authorized to select a candidate and cast your confidential ballot.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4 text-xs flex items-start gap-3 text-amber-200">
                      <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block">
                          📍 Constituency Residency Notice: You Are Registered in {user.areaName}
                        </span>
                        <p className="text-amber-300/80 text-[11px] mt-0.5 leading-relaxed">
                          Your voter record ({user.voterId}) belongs to <strong>{user.areaName}</strong>. This election is for <strong>{selectedElection.areaName}</strong>. You are welcome to inspect the candidate roster and live turnout, but voting is strictly restricted to registered residents of {selectedElection.areaName}.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const userElec = elections.find(
                              (e) => e.areaName?.toLowerCase() === user.areaName?.toLowerCase()
                            );
                            if (userElec) selectElection(userElec);
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold cursor-pointer transition-all"
                        >
                          <Star className="h-3 w-3 fill-amber-300" />
                          <span>Switch to My Area ({user.areaName}) Election</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Success Receipt Card (when vote just cast OR retrieved from session) */}
              {(voteReceipt || (hasVoted && isUserAreaElection)) && (
                <div className="rounded-3xl border border-emerald-500/50 bg-[#0B1A14] p-6 space-y-4 animate-fadeIn shadow-xl shadow-emerald-950/40">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Ballot Cryptographically Cast &amp; Counted</h3>
                      <p className="text-xs text-emerald-300/80">
                        Your vote choice was encrypted, anonymously signed, and permanently recorded in the certified ballot vault.
                      </p>
                    </div>
                  </div>

                  {/* Cryptographic SHA-256 Vote Hash Box */}
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        Cryptographic Vote Hash (SHA-256 Ballot Proof)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">256-bit Immutable Hash</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <span className="font-mono text-xs sm:text-sm font-bold text-emerald-300 break-all select-all">
                        {voteReceipt?.voteHash || (voteReceipt?.receiptCode ? `0x${voteReceipt.receiptCode.replace('RCP-', '').toLowerCase()}a71d89b2c34e` : 'Hash Recorded in Ballot Vault')}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyText(voteReceipt?.voteHash || voteReceipt?.receiptCode, 'hash')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 self-end sm:self-auto"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>{copiedField === 'hash' ? 'Copied!' : 'Copy Hash'}</span>
                      </button>
                    </div>

                    {/* Receipt Reference Code */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Official Receipt Reference</span>
                        <span className="font-mono font-bold text-cyan-300 text-sm">
                          {voteReceipt?.receiptCode || 'RCP-RECORDED'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyText(voteReceipt?.receiptCode, 'code')}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span>{copiedField === 'code' ? 'Copied!' : 'Copy Code'}</span>
                        </button>

                        <Link
                          to={`/verify?code=${encodeURIComponent(voteReceipt?.voteHash || voteReceipt?.receiptCode || '')}`}
                          className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow"
                        >
                          <span>Verify Inclusion</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                      This SHA-256 hash mathematically proves your vote is included in the certified election tally while maintaining strict zero-knowledge ballot secrecy.
                    </p>
                  </div>
                </div>
              )}

              {/* Not Logged In Prompt */}
              {!isAuthenticated && (
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-white block">Log in to Cast Your Ballot</span>
                    <p className="text-slate-300 text-[11px]">
                      Authenticate using your official Election ID and password to participate in open elections for your area.
                    </p>
                  </div>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow cursor-pointer shrink-0"
                  >
                    Log In as Citizen
                  </Link>
                </div>
              )}

              {/* Candidate Roster / Ballot Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="h-4 w-4 text-cyan-400" />
                    <span>Contesting Candidates ({candidates.length})</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    {isEligibleToVote ? 'Select one candidate to cast your vote' : 'Certified Candidate List'}
                  </span>
                </div>

                <div className="space-y-3">
                  {candidates.map((c) => {
                    const isCandidateSelected = selectedCandidateId === c.id;
                    const canSelect = isEligibleToVote;

                    return (
                      <div
                        key={c.id}
                        onClick={() => canSelect && setSelectedCandidateId(c.id)}
                        className={`rounded-2xl border p-5 transition-all ${
                          canSelect ? 'cursor-pointer' : 'cursor-default'
                        } ${
                          isCandidateSelected
                            ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-950/50'
                            : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl shadow-inner shrink-0">
                              {c.partySymbol?.split(' ').pop() || '🏛️'}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-base text-white">{c.fullName}</h4>
                                <span className="text-[10px] font-mono text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                  {c.candidateCode}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-300 mt-0.5">{c.partyName}</p>
                              <span className="text-[11px] text-amber-300 font-semibold block mt-0.5">
                                Official Symbol: {c.partySymbol}
                              </span>
                            </div>
                          </div>

                          {canSelect && (
                            <div
                              className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                isCandidateSelected
                                  ? 'border-cyan-400 bg-cyan-500'
                                  : 'border-slate-700 bg-slate-900'
                              }`}
                            >
                              {isCandidateSelected && <div className="h-2.5 w-2.5 rounded-full bg-slate-950" />}
                            </div>
                          )}
                        </div>

                        {c.bio && (
                          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 italic">
                            "{c.bio}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Secret Voting Key Verification Card (Feature 1) */}
              {isEligibleToVote && (
                <div className="rounded-2xl border border-cyan-500/30 bg-[#0B1522] p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Key className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <span>Election Secret Voting Key</span>
                          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20 font-mono">
                            {keyStatus?.status || 'NOT_ISSUED'}
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {keyStatus?.keyPrefix
                            ? `Active key prefix: ${keyStatus.keyPrefix}...`
                            : 'An election-specific secret voting key is required to cast your confidential ballot.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isGeneratingKey}
                        onClick={() => handleGenerateKey(Boolean(keyStatus?.keyPrefix))}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Key className="h-3.5 w-3.5" />
                        <span>{keyStatus?.keyPrefix ? 'Reissue New Key' : 'Generate Secret Key'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Display Raw Key Alert upon generation */}
                  {generatedRawKey && (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300">
                          🔑 Your Generated Secret Voting Key (Copy and save now):
                        </span>
                        <button
                          type="button"
                          onClick={() => copyText(generatedRawKey, 'SECRET_KEY')}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold flex items-center gap-1 border border-amber-500/30 cursor-pointer"
                        >
                          <Copy className="h-3 w-3" />
                          <span>{copiedField === 'SECRET_KEY' ? 'Copied!' : 'Copy Key'}</span>
                        </button>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/60 font-mono text-sm font-bold text-white tracking-widest text-center border border-amber-500/30 select-all">
                        {generatedRawKey}
                      </div>
                      <p className="text-[10px] text-amber-300/80">
                        ⚠️ High-entropy one-time credential. Stored only as a cryptographic salted hash on the server. Will not be shown again!
                      </p>
                    </div>
                  )}

                  {/* Secret Key Input Box */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Enter Secret Voting Key:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={secretKeyInput}
                        onChange={(e) => setSecretKeyInput(e.target.value)}
                        placeholder="SVK-XXXX-XXXX-XXXX-XXXX"
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 font-mono text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Cast Ballot Submission Button */}
              {selectedElection.status === 'OPEN' && !hasVoted && (
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-slate-400">
                    {!isAuthenticated
                      ? 'Please log in to submit your vote.'
                      : !isUserAreaElection
                      ? `Voting is only permitted for registered voters of ${selectedElection.areaName}.`
                      : selectedCandidateId
                      ? 'Candidate selected. Click submit to confirm and cast your confidential ballot.'
                      : 'Please select a candidate above to enable ballot casting.'}
                  </p>

                  <button
                    type="button"
                    disabled={!isEligibleToVote || !selectedCandidateId || isSubmitting}
                    onClick={handleCastVote}
                    className={`px-6 py-3 rounded-xl font-bold text-xs shadow-lg transition-all ${
                      !isEligibleToVote || !selectedCandidateId || isSubmitting
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer shadow-cyan-500/20'
                    }`}
                  >
                    {isSubmitting
                      ? 'Recording Ballot...'
                      : !isUserAreaElection && isAuthenticated
                      ? `Voting Restricted to ${selectedElection.areaName}`
                      : 'Confirm & Cast Vote'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center text-slate-400">
              <p>No election selected. Choose an election from the sidebar to view candidate options.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ElectionsPage;
