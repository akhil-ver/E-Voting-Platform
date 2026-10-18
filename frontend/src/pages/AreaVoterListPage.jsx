import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import {
  MapPin,
  Search,
  Filter,
  Users,
  CheckCircle2,
  UserPlus,
  LogIn,
  Key,
  ShieldCheck,
  Building2,
  RefreshCw,
  Vote,
  ArrowRight,
} from 'lucide-react';

export const AreaVoterListPage = () => {
  const navigate = useNavigate();

  const [areas, setAreas] = useState([]);
  const [elections, setElections] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [voters, setVoters] = useState([]);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'REGISTERED' | 'UNREGISTERED'
  const [isLoading, setIsLoading] = useState(true);

  const fetchAreasAndElections = async () => {
    try {
      const [areasRes, electionsRes] = await Promise.all([
        axiosClient.get('/areas'),
        axiosClient.get('/elections'),
      ]);

      if (areasRes.success && areasRes.data) {
        setAreas(areasRes.data);
        if (areasRes.data.length > 0) {
          const firstId = areasRes.data[0].id;
          if (!selectedAreaId) {
            setSelectedAreaId(firstId);
            fetchVoters(firstId);
          }
        }
      }

      if (electionsRes.success && electionsRes.data) {
        setElections(electionsRes.data);
      }
    } catch (err) {
      console.error('Failed to load areas and elections', err);
    }
  };

  const fetchVoters = async (targetAreaId) => {
    const areaIdToUse = targetAreaId || selectedAreaId;
    if (!areaIdToUse) return;
    setIsLoading(true);
    try {
      const res = await axiosClient.get('/voters', {
        params: {
          areaId: areaIdToUse,
          search: search.trim() || undefined,
          size: 100,
        },
      });
      if (res.success && res.data) {
        setVoters(res.data.content || []);
      }
    } catch (err) {
      console.error('Failed to load voters', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAreasAndElections();
  }, []);

  useEffect(() => {
    if (selectedAreaId) {
      fetchVoters(selectedAreaId);
    }
  }, [selectedAreaId, search]);

  const selectedArea = areas.find((a) => a.id === selectedAreaId) || areas[0];
  const activeElectionForArea = elections.find(
    (e) => e.areaId === selectedArea?.id || e.areaName === selectedArea?.name
  );

  const filteredVoters = voters.filter((v) => {
    if (filterMode === 'REGISTERED') return v.hasRegisteredAccount;
    if (filterMode === 'UNREGISTERED') return !v.hasRegisteredAccount;
    return true;
  });

  return (
    <div className="space-y-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">Area-Wise Authorized Voter Directory</h1>
            <span className="rounded-full bg-cyan-950 px-2.5 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-500/30">
              Layer 1: Authorized Roll
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse verified citizens enrolled by the election administration across 10 demonstration metropolitan areas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchAreasAndElections();
            fetchVoters();
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
          <span>Refresh Roll</span>
        </button>
      </div>

      {/* 10 City Selection Pills */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
          Select Area / City ({areas.length} Initial Demonstration Cities)
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {areas.map((area) => {
            const isSelected = area.id === selectedAreaId;
            const areaElection = elections.find(
              (e) => e.areaId === area.id || e.areaName === area.name
            );
            const isOpen = areaElection?.status === 'OPEN';

            return (
              <button
                key={area.id}
                type="button"
                onClick={() => setSelectedAreaId(area.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>{area.name}</span>
                {isOpen && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                      isSelected ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    Open
                  </span>
                )}
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {area.registeredAccounts}/{area.totalVoterRecords} Active
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected City Demographic Summary Card */}
      {selectedArea && (
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-950 to-[#0A0D16] p-6 shadow-xl backdrop-blur-md space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">Area Code</span>
              <h3 className="text-xl font-bold text-white mt-0.5">{selectedArea.name}</h3>
              <p className="text-xs text-cyan-400 font-mono mt-0.5">{selectedArea.areaCode} • {selectedArea.electionType}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Constituency</span>
              <p className="text-sm font-semibold text-slate-200 mt-0.5">{selectedArea.constituencyName}</p>
              <p className="text-xs text-slate-400 line-clamp-1">{selectedArea.description}</p>
            </div>

            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3 text-center">
              <span className="text-[10px] text-slate-500 uppercase block">Total Enrolled Voters</span>
              <span className="text-lg font-mono font-bold text-white">{selectedArea.totalVoterRecords}</span>
            </div>

            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3 text-center">
              <span className="text-[10px] text-slate-500 uppercase block">Active Citizen Accounts</span>
              <span className="text-lg font-mono font-bold text-emerald-400">{selectedArea.registeredAccounts}</span>
            </div>
          </div>

          {/* Active Election Banner for this Area */}
          {activeElectionForArea && (
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-cyan-950/20 -mx-6 -mb-6 p-4 rounded-b-2xl">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white">
                  Active Election: {activeElectionForArea.name}
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 uppercase font-bold">
                  {activeElectionForArea.status}
                </span>
              </div>

              <Link
                to={`/elections?area=${selectedArea.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md shadow-cyan-500/20"
              >
                <Vote className="h-3.5 w-3.5" />
                <span>View &amp; Vote in {selectedArea.name} Polls</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Voter ID or Citizen Name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {[
            { id: 'ALL', label: 'All Citizens' },
            { id: 'REGISTERED', label: 'Accounts Active' },
            { id: 'UNREGISTERED', label: 'Ready to Register' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterMode(f.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterMode === f.id
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Voter Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Election ID</th>
                <th className="py-3 px-4">Citizen Full Name</th>
                <th className="py-3 px-4">Assigned Area</th>
                <th className="py-3 px-4">Data Privacy</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="h-6 w-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading authorized electoral records...</span>
                  </td>
                </tr>
              ) : filteredVoters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No voters found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredVoters.map((v) => {
                  return (
                    <tr key={v.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                        {v.voterId}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {v.fullName}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {v.areaName}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400/90 font-medium">
                          <ShieldCheck className="h-3 w-3 text-emerald-400" />
                          <span>Protected • Zero PII Leaked</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {v.hasRegisteredAccount ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            <span>Account Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-950 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                            <span>Ready to Sign Up</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {v.hasRegisteredAccount ? (
                          <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer"
                          >
                            <LogIn className="h-3 w-3" />
                            <span>Log In</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/register?voterId=${encodeURIComponent(v.voterId)}`)
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                          >
                            <UserPlus className="h-3 w-3" />
                            <span>Sign Up</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
