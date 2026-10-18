import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
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
  Lock,
  Unlock,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Ban,
  X,
} from 'lucide-react';

export const AreaVoterListPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [areas, setAreas] = useState([]);
  const [elections, setElections] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [voters, setVoters] = useState([]);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'BLOCKED' | 'UNREGISTERED'
  const [isLoading, setIsLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

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

  // Admin action: Toggle Block / Unblock Account
  const handleToggleUserStatus = async (voter) => {
    setFeedback(null);
    setIsActionLoading(true);
    try {
      const endpoint = voter.userAccountId
        ? `/admin/users/${voter.userAccountId}/toggle-status`
        : `/admin/users/by-voter/${encodeURIComponent(voter.voterId)}/toggle-status`;
      const res = await axiosClient.patch(endpoint);
      if (res.success && res.data) {
        setFeedback({
          type: 'success',
          message: `User account for ${voter.fullName} (${voter.voterId}) is now ${res.data.enabled ? 'ACTIVE (Unblocked)' : 'BLOCKED (Disabled)'}.`,
        });
        fetchVoters(selectedAreaId);
        fetchAreasAndElections();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update user status' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Admin action: Delete User Account
  const handleDeleteUserAccount = async () => {
    if (!userToDelete) return;
    setFeedback(null);
    setIsActionLoading(true);
    try {
      const endpoint = userToDelete.userAccountId
        ? `/admin/users/${userToDelete.userAccountId}`
        : `/admin/users/by-voter/${encodeURIComponent(userToDelete.voterId)}`;
      const res = await axiosClient.delete(endpoint);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Account for ${userToDelete.fullName} (${userToDelete.voterId}) permanently deleted. Login credentials revoked.`,
        });
        setUserToDelete(null);
        fetchVoters(selectedAreaId);
        fetchAreasAndElections();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete user account' });
    } finally {
      setIsActionLoading(false);
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
    if (filterMode === 'ACTIVE') return v.hasRegisteredAccount && v.accountEnabled !== false;
    if (filterMode === 'BLOCKED') return v.hasRegisteredAccount && v.accountEnabled === false;
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
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-slate-400">Chief Election Administrator:</span>
            <span className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
              akhilv.verma07@gmail.com
            </span>
          </div>
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

      {/* Global Feedback Banner */}
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
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
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
            { id: 'ACTIVE', label: 'Accounts Active' },
            { id: 'BLOCKED', label: 'Accounts Blocked' },
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
                <th className="py-3 px-4">Citizen Full Name &amp; Email</th>
                <th className="py-3 px-4">Assigned Area</th>
                <th className="py-3 px-4">Verification &amp; Aadhaar</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">{isAdmin ? 'Admin Access Controls' : 'Action'}</th>
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
                  const voterLast4 = v.aadhaarLast4 || (v.email?.split('+')[1]?.split('@')[0]) || '';
                  const voterEmail = v.email || (v.fullName ? `${v.fullName.toLowerCase().replace(/\s+/g, '')}+${voterLast4 || '••••'}@gmail.com` : '');
                  return (
                    <tr key={v.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                        {v.voterId}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        <div>{v.fullName}</div>
                        <div className="text-[11px] font-mono font-normal text-cyan-400 mt-0.5">
                          {voterEmail}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {v.areaName}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400/90 font-medium">
                          <ShieldCheck className="h-3 w-3 text-emerald-400" />
                          <span>Protected • Zero PII</span>
                        </span>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          Aadhaar: •••• •••• <span className="text-amber-300 font-bold">{voterLast4 || '••••'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {v.hasRegisteredAccount ? (
                          v.accountEnabled === false ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-950 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/40">
                              <Ban className="h-3 w-3 text-rose-400" />
                              <span>Account Blocked</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              <span>Account Active</span>
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-950 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                            <span>Ready to Sign Up</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isAdmin ? (
                          v.hasRegisteredAccount ? (
                            <div className="flex items-center justify-end gap-2">
                              {/* Block / Unblock Button */}
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => handleToggleUserStatus(v)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                                  v.accountEnabled !== false
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                }`}
                                title={v.accountEnabled !== false ? 'Block account from logging in' : 'Unblock account access'}
                              >
                                {v.accountEnabled !== false ? (
                                  <>
                                    <Lock className="h-3 w-3 text-amber-400" />
                                    <span>Block</span>
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="h-3 w-3 text-emerald-400" />
                                    <span>Unblock</span>
                                  </>
                                )}
                              </button>

                              {/* Delete Account Button */}
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => setUserToDelete(v)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-all cursor-pointer"
                                title="Permanently delete user account and revoke login"
                              >
                                <Trash2 className="h-3 w-3 text-rose-400" />
                                <span>Delete</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px] font-mono">Not Registered</span>
                          )
                        ) : !user ? (
                          v.hasRegisteredAccount ? (
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
                              onClick={() => {
                                const last4 = v.aadhaarLast4 || (v.email?.split('+')[1]?.split('@')[0]) || '';
                                navigate(`/register?voterId=${encodeURIComponent(v.voterId)}${last4 ? `&aadhaar=${encodeURIComponent(last4)}` : ''}`);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                            >
                              <UserPlus className="h-3 w-3" />
                              <span>Sign Up</span>
                            </button>
                          )
                        ) : (
                          v.hasRegisteredAccount ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Enrolled</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Unregistered</span>
                          )
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

      {/* Delete User Confirmation Modal for Admin */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#0E1322] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Delete User Account</h3>
                <p className="text-xs text-slate-400">Permanent security revocation</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-2.5">
              <p>
                Are you sure you want to permanently delete the login account for{' '}
                <strong className="text-white font-mono">{userToDelete.fullName}</strong> ({userToDelete.voterId})?
              </p>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-amber-300 space-y-1">
                <p className="font-semibold text-[11px] uppercase tracking-wider">Consequences:</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                  <li>Any future login attempt by this citizen will immediately fail.</li>
                  <li>The citizen's municipal voter roll status will be reset to unregistered.</li>
                  <li>An administrative security audit record will be logged.</li>
                  <li>Any previously recorded anonymous ballot hash receipts remain intact.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleDeleteUserAccount}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isActionLoading ? 'Deleting...' : 'Permanently Delete Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
