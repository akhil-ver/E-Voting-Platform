import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import {
  BarChart3,
  ShieldCheck,
  Trophy,
  Award,
  Calendar,
  Building2,
  RefreshCw,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const ResultsPage = () => {
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchElections = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get('/elections');
      if (res.success && res.data) {
        setElections(res.data);
        // Default select first election with declared results, or the first one
        const declared = res.data.find((e) => e.status === 'RESULT_DECLARED');
        const first = declared || res.data[0];
        if (first) {
          setSelectedElectionId(first.id);
          fetchResults(first.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResults = async (electionId) => {
    if (!electionId) return;
    try {
      const res = await axiosClient.get(`/elections/${electionId}/results`);
      if (res.success && res.data) {
        setResults(res.data);
      } else {
        setResults([]);
      }
    } catch (err) {
      setResults([]);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  const currentElection = elections.find((e) => e.id === Number(selectedElectionId));
  const isDeclared = currentElection?.status === 'RESULT_DECLARED';

  return (
    <div className="py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-bold text-violet-400 border border-violet-500/20">
              Certified Election Records
            </span>
            <span className="text-xs text-slate-500 font-mono">Public Audit Gateway</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Official Declared Election Results
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent, auditable vote tallies and certified outcomes published after official poll closure and cryptographic tallying.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchElections();
            if (selectedElectionId) fetchResults(selectedElectionId);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Results</span>
        </button>
      </div>

      {/* Election Selector Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {elections.map((el) => {
          const isSelected = selectedElectionId === el.id;
          const isDecl = el.status === 'RESULT_DECLARED';

          return (
            <button
              key={el.id}
              type="button"
              onClick={() => {
                setSelectedElectionId(el.id);
                fetchResults(el.id);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                isSelected
                  ? 'border-violet-500 bg-violet-950/40 text-violet-300 shadow-lg shadow-violet-950/40'
                  : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span>{el.areaName}</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                  isDecl ? 'bg-cyan-950 text-cyan-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {el.status}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Results Display */}
      {currentElection ? (
        <div className="space-y-6">
          {/* Election Info Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold text-violet-400 bg-violet-950/60 px-2.5 py-1 rounded border border-violet-500/20">
                  {currentElection.electionCode}
                </span>
                <h2 className="text-xl font-black text-white mt-2">{currentElection.name}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Constituency: <strong className="text-white">{currentElection.constituencyName || currentElection.areaName}</strong> | City: <strong className="text-cyan-300">{currentElection.areaName}</strong> | Type: {currentElection.electionType}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">Turnout</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">
                    {currentElection.turnoutPercentage}%
                  </span>
                </div>
                <div className="text-right pl-3 border-l border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">Votes Cast</span>
                  <span className="text-lg font-mono font-bold text-white">
                    {currentElection.votesCast}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Declared Results Breakdown */}
          {isDeclared && results.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span>Certified Candidate Tally</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Published: {new Date(results[0].publishedAt).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((res) => (
                  <div
                    key={res.candidateId}
                    className={`rounded-2xl border p-5 space-y-4 relative ${
                      res.winner
                        ? 'border-amber-500/60 bg-gradient-to-b from-amber-950/30 to-slate-950/80 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/40'
                        : 'border-slate-800 bg-slate-950/70'
                    }`}
                  >
                    {res.winner && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        <Trophy className="h-3 w-3" />
                        <span>Winner • {res.areaName || currentElection.areaName}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl shadow-inner shrink-0">
                        {res.partySymbol.split(' ').pop() || '🏛️'}
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-white">{res.candidateName}</h4>
                        <p className="text-xs font-semibold text-slate-300">{res.partyName}</p>
                        <span className="text-[11px] text-amber-300 block font-semibold mt-0.5">
                          Symbol: {res.partySymbol}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-semibold">Total Ballots:</span>
                        <span className="font-mono font-bold text-white text-sm">{res.voteCount}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-semibold">Vote Share:</span>
                        <span className="font-mono font-bold text-cyan-300 text-sm">{res.votePercentage}%</span>
                      </div>

                      {/* Visual Percentage Bar */}
                      <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            res.winner
                              ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                              : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                          }`}
                          style={{ width: `${res.votePercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center text-slate-400 space-y-3">
              <Clock className="h-10 w-10 text-amber-400 mx-auto" />
              <h3 className="font-bold text-white text-base">Results pending declaration</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {currentElection.status === 'CLOSED'
                  ? 'Voting has concluded for this election. Official ballot tallies are undergoing cryptographic auditing and certification before declaration.'
                  : `This election is currently in status ${currentElection.status}. Official results will be published after poll closure and tallying.`}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center text-slate-400 space-y-2">
          <Clock className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No election results have been declared yet.</h3>
          <p className="text-xs text-slate-500">
            Once an election concludes and the electoral administration officially tallies the ballot vault, certified results will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
