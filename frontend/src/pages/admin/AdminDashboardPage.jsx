import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import {
  Building2,
  Users,
  Vote,
  Award,
  Plus,
  Trash2,
  Edit2,
  Upload,
  History,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Lock,
  Unlock,
  ShieldCheck,
  Search,
  Filter,
  BarChart3,
  Calendar,
  Sparkles,
  UserCheck,
  Eye,
  AlertTriangle,
  ChevronRight,
  Trophy,
  RotateCcw,
  UserX,
  Ban,
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalAreas: 10,
    totalVoterRecords: 500,
    totalUserAccounts: 0,
    totalElections: 0,
    openElections: 0,
    closedElections: 0,
    publishedElections: 0,
  });

  // Active Tab: 'ELECTIONS' | 'CANDIDATES' | 'PARTICIPATION' | 'AREAS' | 'VOTERS' | 'AUDIT'
  const [activeTab, setActiveTab] = useState('ELECTIONS');
  const [areas, setAreas] = useState([]);
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [participationList, setParticipationList] = useState([]);
  const [resultsList, setResultsList] = useState([]);
  const [voters, setVoters] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Citizen / User Accounts Management
  const [usersList, setUsersList] = useState([]);
  const [usersSearch, setUsersSearch] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const [isUserActionLoading, setIsUserActionLoading] = useState(false);

  // Filters
  const [participationSearch, setParticipationSearch] = useState('');
  const [participationStatusFilter, setParticipationStatusFilter] = useState('ALL'); // 'ALL' | 'VOTED' | 'NOT_VOTED'

  // Modals
  const [showAddElectionModal, setShowAddElectionModal] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [showEditCandidateModal, setShowEditCandidateModal] = useState(false);
  const [candidateToEdit, setCandidateToEdit] = useState(null);
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [showAddVoterModal, setShowAddVoterModal] = useState(false);
  const [showImportCsvModal, setShowImportCsvModal] = useState(false);
  const [showCandidateValidationModal, setShowCandidateValidationModal] = useState(false);
  const [validationModalMessage, setValidationModalMessage] = useState('');

  // Election Form
  const [newElectionCode, setNewElectionCode] = useState('');
  const [newElectionName, setNewElectionName] = useState('');
  const [newElectionType, setNewElectionType] = useState('Municipal Corporation');
  const [newElectionAreaId, setNewElectionAreaId] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  // Candidate Form
  const [candCode, setCandCode] = useState('');
  const [candFullName, setCandFullName] = useState('');
  const [candPartyName, setCandPartyName] = useState('');
  const [candPartySymbol, setCandPartySymbol] = useState('');
  const [candSymbolImageUrl, setCandSymbolImageUrl] = useState('');
  const [candBio, setCandBio] = useState('');

  // Area Form
  const [areaCode, setAreaCode] = useState('');
  const [areaName, setAreaName] = useState('');
  const [constituencyName, setConstituencyName] = useState('');
  const [electionType, setElectionType] = useState('Municipal Corporation');
  const [areaDescription, setAreaDescription] = useState('');

  // Voter Form
  const [newVoterId, setNewVoterId] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newFatherName, setNewFatherName] = useState('');
  const [newMotherName, setNewMotherName] = useState('');
  const [newAadhaar, setNewAadhaar] = useState('');
  const [newAreaId, setNewAreaId] = useState('');

  // CSV File
  const [csvFile, setCsvFile] = useState(null);

  // 1. Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await axiosClient.get('/admin/dashboard-stats');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats', err);
    }
  };

  // 2. Fetch Areas
  const fetchAreas = async () => {
    try {
      const res = await axiosClient.get('/areas');
      if (res.success && res.data) {
        setAreas(res.data);
        if (res.data.length > 0 && !newAreaId) {
          setNewAreaId(res.data[0].id);
        }
        if (res.data.length > 0 && !newElectionAreaId) {
          setNewElectionAreaId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching areas', err);
    }
  };

  // 3. Fetch Elections
  const fetchElections = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get('/elections');
      if (res.success && res.data) {
        setElections(res.data);
        if (res.data.length > 0 && !selectedElectionId) {
          setSelectedElectionId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching elections', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Fetch Candidates for selected election
  const fetchCandidates = async (electionId) => {
    const eid = electionId || selectedElectionId;
    if (!eid) return;
    try {
      const res = await axiosClient.get(`/candidates/election/${eid}`);
      if (res.success && res.data) {
        setCandidates(res.data);
      }
    } catch (err) {
      console.error('Error fetching candidates', err);
    }
  };

  // 5. Fetch Voter Participation List (Zero vote choice leakage)
  const fetchParticipationList = async (electionId, search = '', status = 'ALL') => {
    const eid = electionId || selectedElectionId;
    if (!eid) return;
    setIsLoading(true);
    try {
      const res = await axiosClient.get(`/elections/${eid}/voter-participation`, {
        params: {
          search: search.trim() || undefined,
          status: status !== 'ALL' ? status : undefined,
        },
      });
      if (res.success && res.data) {
        setParticipationList(res.data);
      }
    } catch (err) {
      console.error('Error fetching participation list', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Fetch Results for selected election
  const fetchResults = async (electionId) => {
    const eid = electionId || selectedElectionId;
    if (!eid) return;
    try {
      const res = await axiosClient.get(`/elections/${eid}/results`);
      if (res.success && res.data) {
        setResultsList(res.data);
      } else {
        setResultsList([]);
      }
    } catch (err) {
      setResultsList([]);
    }
  };

  // 7. Fetch Voter Roll
  const fetchVoters = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get('/voters?size=100');
      if (res.success && res.data) {
        setVoters(res.data.content || []);
      }
    } catch (err) {
      console.error('Error fetching voters', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 8. Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get('/admin/audit-logs');
      if (res.success && res.data) {
        setAuditLogs(res.data.content || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 9. Fetch Citizen Accounts
  const fetchUsers = async (search = '') => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get('/admin/users', {
        params: { search: search.trim() || undefined },
      });
      if (res.success && res.data) {
        setUsersList(res.data);
      }
    } catch (err) {
      console.error('Error fetching user accounts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAreas();
    fetchElections();
  }, []);

  useEffect(() => {
    if (activeTab === 'ELECTIONS') {
      fetchElections();
    } else if (activeTab === 'CANDIDATES') {
      fetchCandidates(selectedElectionId);
    } else if (activeTab === 'PARTICIPATION') {
      fetchParticipationList(selectedElectionId, participationSearch, participationStatusFilter);
    } else if (activeTab === 'USERS') {
      fetchUsers(usersSearch);
    } else if (activeTab === 'VOTERS') {
      fetchVoters();
    } else if (activeTab === 'AUDIT') {
      fetchAuditLogs();
    }
  }, [activeTab, selectedElectionId]);

  // Selected Election Object
  const currentElection = elections.find((e) => e.id === Number(selectedElectionId)) || elections[0];

  // Helper: Open Polls with candidate validation (Requirement 6)
  const handleOpenPolls = async (election) => {
    setFeedback(null);
    try {
      const res = await axiosClient.post(`/elections/${election.id}/open`);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Election polls opened for ${election.name}. Candidate roster is now locked.`,
        });
        fetchElections();
        fetchStats();
      }
    } catch (err) {
      // Missing candidate validation triggered
      setValidationModalMessage(
        err.message || 'At least 2 candidates must be registered before opening voting polls.'
      );
      setShowCandidateValidationModal(true);
    }
  };

  // Helper: Close Polls
  const handleClosePolls = async (election) => {
    setFeedback(null);
    try {
      const res = await axiosClient.post(`/elections/${election.id}/close`);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Election polls closed for ${election.name}. Ballots are ready for tallying.`,
        });
        fetchElections();
        fetchStats();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Helper: Declare Results (Requirement 4)
  const handleDeclareResults = async (election) => {
    setFeedback(null);
    try {
      const res = await axiosClient.post(`/elections/${election.id}/declare-results`);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Results officially calculated and declared for ${election.name}!`,
        });
        setResultsList(res.data);
        fetchElections();
        fetchStats();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Helper: Clear Results / Reset Polls
  const handleClearResults = async (election) => {
    if (!window.confirm(`Are you sure you want to clear all results and ballots for '${election.name}' and reset the election to OPEN?`)) {
      return;
    }
    setFeedback(null);
    try {
      const res = await axiosClient.post(`/elections/${election.id}/clear-results`);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Results and ballots cleared for ${election.name}. Polls have been reset to OPEN.`,
        });
        setResultsList([]);
        fetchElections();
        fetchStats();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Handle Add Election
  const handleCreateElection = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await axiosClient.post('/elections', {
        electionCode: newElectionCode.trim().toUpperCase(),
        name: newElectionName.trim(),
        electionType: newElectionType.trim(),
        areaId: Number(newElectionAreaId),
        startTime: newStartTime ? new Date(newStartTime).toISOString() : null,
        endTime: newEndTime ? new Date(newEndTime).toISOString() : null,
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Election '${newElectionName}' configured successfully! You can now configure candidates.`,
        });
        setShowAddElectionModal(false);
        setNewElectionCode('');
        setNewElectionName('');
        fetchElections();
        fetchStats();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Handle Add Candidate
  const handleAddCandidate = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await axiosClient.post('/candidates', {
        electionId: Number(selectedElectionId),
        candidateCode: candCode.trim().toUpperCase(),
        fullName: candFullName.trim(),
        partyName: candPartyName.trim(),
        partySymbol: candPartySymbol.trim(),
        symbolImageUrl: candSymbolImageUrl.trim() || null,
        bio: candBio.trim() || null,
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Candidate '${candFullName}' successfully registered with symbol '${candPartySymbol}'.`,
        });
        setShowAddCandidateModal(false);
        setCandCode('');
        setCandFullName('');
        setCandPartyName('');
        setCandPartySymbol('');
        setCandSymbolImageUrl('');
        setCandBio('');
        fetchCandidates(selectedElectionId);
        fetchElections();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Handle Edit Candidate
  const handleUpdateCandidate = async (e) => {
    e.preventDefault();
    if (!candidateToEdit) return;
    setFeedback(null);
    try {
      const res = await axiosClient.put(`/candidates/${candidateToEdit.id}`, {
        fullName: candFullName.trim(),
        partyName: candPartyName.trim(),
        partySymbol: candPartySymbol.trim(),
        symbolImageUrl: candSymbolImageUrl.trim() || null,
        bio: candBio.trim() || null,
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Candidate '${candFullName}' updated successfully.`,
        });
        setShowEditCandidateModal(false);
        setCandidateToEdit(null);
        fetchCandidates(selectedElectionId);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Open Edit Modal
  const openEditCandidateModal = (cand) => {
    setCandidateToEdit(cand);
    setCandFullName(cand.fullName);
    setCandPartyName(cand.partyName);
    setCandPartySymbol(cand.partySymbol);
    setCandSymbolImageUrl(cand.symbolImageUrl || '');
    setCandBio(cand.bio || '');
    setShowEditCandidateModal(true);
  };

  // Handle Delete Candidate
  const handleDeleteCandidate = async (candId, candName) => {
    if (!window.confirm(`Are you sure you want to remove candidate '${candName}'?`)) return;
    setFeedback(null);
    try {
      const res = await axiosClient.delete(`/candidates/${candId}`);
      if (res.success) {
        setFeedback({ type: 'success', message: `Candidate '${candName}' removed.` });
        fetchCandidates(selectedElectionId);
        fetchElections();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Handle Add Area
  const handleAddArea = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await axiosClient.post('/areas', {
        areaCode: areaCode.trim().toUpperCase(),
        name: areaName.trim(),
        constituencyName: constituencyName.trim() || `${areaName.trim()} Central Ward`,
        electionType,
        description: areaDescription.trim(),
      });
      if (res.success) {
        setFeedback({ type: 'success', message: `Area '${areaName}' added successfully!` });
        setShowAddAreaModal(false);
        setAreaCode('');
        setAreaName('');
        setConstituencyName('');
        setAreaDescription('');
        fetchAreas();
        fetchStats();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Handle Add Voter
  const handleAddVoter = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await axiosClient.post('/voters', {
        voterId: newVoterId.trim().toUpperCase(),
        fullName: newFullName.trim(),
        fatherName: newFatherName.trim(),
        motherName: newMotherName.trim(),
        aadhaarLast4: newAadhaar.trim(),
        areaId: Number(newAreaId),
      });
      if (res.success) {
        setFeedback({ type: 'success', message: `Voter '${newFullName}' enrolled successfully!` });
        setShowAddVoterModal(false);
        setNewVoterId('');
        setNewFullName('');
        setNewFatherName('');
        setNewMotherName('');
        setNewAadhaar('');
        fetchVoters();
        fetchStats();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Handle Delete Voter
  const handleDeleteVoter = async (id, name, voterId) => {
    if (!window.confirm(`Are you sure you want to delete voter ${name} (${voterId})?`)) return;
    setFeedback(null);
    try {
      const res = await axiosClient.delete(`/voters/${id}`);
      if (res.success) {
        setFeedback({ type: 'success', message: `Voter record ${voterId} deleted.` });
        fetchVoters();
        fetchStats();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Handle CSV Import
  const handleImportCsv = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    setFeedback(null);
    const formData = new FormData();
    formData.append('file', csvFile);
    try {
      const res = await axiosClient.post('/voters/import-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Successfully imported ${res.data.importedCount} voter records!`,
        });
        setShowImportCsvModal(false);
        setCsvFile(null);
        fetchVoters();
        fetchStats();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Handle Toggle User Account Status (Block / Unblock)
  const handleToggleUserStatus = async (user) => {
    setFeedback(null);
    setIsUserActionLoading(true);
    try {
      const res = await axiosClient.patch(`/admin/users/${user.id}/toggle-status`);
      if (res.success && res.data) {
        const isNowActive = res.data.enabled;
        setFeedback({
          type: 'success',
          message: `Account for ${user.username} is now ${isNowActive ? 'ACTIVE (Unblocked)' : 'BLOCKED (Disabled)'}.`,
        });
        fetchUsers(usersSearch);
        fetchStats();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update user status' });
    } finally {
      setIsUserActionLoading(false);
    }
  };

  // Handle Permanently Delete User Account
  const handleDeleteUserAccount = async () => {
    if (!userToDelete) return;
    setFeedback(null);
    setIsUserActionLoading(true);
    try {
      const res = await axiosClient.delete(`/admin/users/${userToDelete.id}`);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `User account '${userToDelete.username}' deleted successfully. Login access revoked.`,
        });
        setUserToDelete(null);
        fetchUsers(usersSearch);
        fetchStats();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete user account' });
    } finally {
      setIsUserActionLoading(false);
    }
  };

  // Turnout Calculation for selected election
  const totalEligibleInCurrentElection = currentElection?.totalEligibleVoters || 0;
  const votesCastInCurrentElection = currentElection?.votesCast || 0;
  const turnoutPercentageInCurrentElection = currentElection?.turnoutPercentage || 0;
  const isRosterLocked = currentElection && currentElection.status === 'RESULT_DECLARED';

  return (
    <div className="py-8 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-500/20">
              Admin Governance Console
            </span>
            <span className="text-xs text-slate-500 font-mono">ADMIN-001 (Root)</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Electoral Authority Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Area-wise elections, candidate roster management, voter participation tracking, and certified tally results.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchStats();
              fetchElections();
              if (activeTab === 'CANDIDATES') fetchCandidates();
              if (activeTab === 'PARTICIPATION') fetchParticipationList();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh State</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">Total Areas</span>
          <p className="text-xl font-mono font-bold text-white mt-0.5">{stats.totalAreas}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">Eligible Roll</span>
          <p className="text-xl font-mono font-bold text-emerald-400 mt-0.5">{stats.totalVoterRecords}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">Registered Users</span>
          <p className="text-xl font-mono font-bold text-cyan-400 mt-0.5">{stats.totalUserAccounts}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">Total Elections</span>
          <p className="text-xl font-mono font-bold text-violet-400 mt-0.5">{stats.totalElections}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">Active Polls</span>
          <p className="text-xl font-mono font-bold text-amber-400 mt-0.5">{stats.openElections}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">Declared Tallies</span>
          <p className="text-xl font-mono font-bold text-emerald-400 mt-0.5">{stats.publishedElections}</p>
        </div>
      </div>

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

      {/* Primary Navigation Tabs */}
      <div className="border-b border-slate-800 flex items-center gap-1 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('ELECTIONS')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'ELECTIONS'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Vote className="h-4 w-4" />
          <span>Elections &amp; Results</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CANDIDATES')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'CANDIDATES'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Candidate Management</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PARTICIPATION')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'PARTICIPATION'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Voter Participation</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'USERS'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserX className="h-4 w-4" />
          <span>Citizen Accounts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AREAS')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'AREAS'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Area Management</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('VOTERS')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'VOTERS'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Voter Roll</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AUDIT')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'AUDIT'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Audit Log Trail</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ELECTIONS & RESULTS */}
      {/* ======================================================== */}
      {activeTab === 'ELECTIONS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Election Lifecycle &amp; Certified Tally</h3>
              <p className="text-xs text-slate-400">
                Configure election areas, enforce candidate readiness, control voting hours, and publish declared tallies.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddElectionModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Configure New Election</span>
            </button>
          </div>

          {/* Elections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {elections.map((el) => {
              const isOpen = el.status === 'OPEN';
              const isClosed = el.status === 'CLOSED';
              const isDeclared = el.status === 'RESULT_DECLARED';
              const isConfigured = el.status === 'CONFIGURED' || el.status === 'UPCOMING';

              return (
                <div
                  key={el.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20">
                          {el.electionCode}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{el.areaName}</span>
                      </div>
                      <h4 className="font-bold text-base text-white mt-1.5">{el.name}</h4>
                      <span className="text-xs text-slate-400 block mt-0.5 font-medium">{el.electionType}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 border ${
                        isOpen
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 animate-pulse'
                          : isDeclared
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                          : isClosed
                          ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                          : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      {el.status}
                    </span>
                  </div>

                  {/* Candidate Readiness Counter */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Candidates</span>
                      <span
                        className={`text-sm font-mono font-bold ${
                          el.candidateCount >= 2 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {el.candidateCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Eligible Voters</span>
                      <span className="text-sm font-mono font-bold text-white">{el.totalEligibleVoters}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Votes Cast</span>
                      <span className="text-sm font-mono font-bold text-cyan-400">{el.votesCast}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedElectionId(el.id);
                          setActiveTab('CANDIDATES');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Award className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Manage Candidates</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedElectionId(el.id);
                          setActiveTab('PARTICIPATION');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Participation</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {isConfigured && (
                        <button
                          type="button"
                          onClick={() => handleOpenPolls(el)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow cursor-pointer"
                        >
                          <Unlock className="h-3.5 w-3.5" />
                          <span>Open Voting Polls</span>
                        </button>
                      )}

                      {isOpen && (
                        <button
                          type="button"
                          onClick={() => handleClosePolls(el)}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow cursor-pointer"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          <span>Close Polls</span>
                        </button>
                      )}

                      {isClosed && (
                        <button
                          type="button"
                          onClick={() => handleDeclareResults(el)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow cursor-pointer"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                          <span>Tally &amp; Declare Results</span>
                        </button>
                      )}

                      {isDeclared && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedElectionId(el.id);
                            fetchResults(el.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trophy className="h-3.5 w-3.5 text-amber-400" />
                          <span>View Declared Results</span>
                        </button>
                      )}

                      {(isDeclared || isClosed) && (
                        <button
                          type="button"
                          onClick={() => handleClearResults(el)}
                          className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                          title="Wipe results and ballots, and reset election polls to OPEN"
                        >
                          <RotateCcw className="h-3.5 w-3.5 text-rose-400" />
                          <span>Clear Results / Reset Polls</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Results Panel for Declared Election */}
          {resultsList && resultsList.length > 0 && (
            <div className="rounded-3xl border border-cyan-500/40 bg-slate-950/90 p-6 space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="flex items-center gap-2.5">
                  <Trophy className="h-5 w-5 text-amber-400" />
                  <h3 className="font-bold text-base text-white">
                    Official Declared Election Results — {currentElection?.name}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    Certified: {new Date(resultsList[0]?.publishedAt).toLocaleString()}
                  </span>
                  {currentElection && (
                    <button
                      type="button"
                      onClick={() => handleClearResults(currentElection)}
                      className="px-3 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-rose-400" />
                      <span>Clear Results &amp; Reset Polls</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resultsList.map((res) => (
                  <div
                    key={res.candidateId}
                    className={`rounded-2xl border p-4 space-y-3 relative ${
                      res.winner
                        ? 'border-amber-500/60 bg-amber-950/20'
                        : 'border-slate-800 bg-slate-900/40'
                    }`}
                  >
                    {res.winner && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <Trophy className="h-3 w-3" />
                        <span>Winner</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl">
                        {res.partySymbol.split(' ').pop() || '🗳️'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{res.candidateName}</h4>
                        <p className="text-xs text-slate-400">{res.partyName}</p>
                        <span className="text-[10px] font-mono text-cyan-400">{res.candidateCode}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Votes Count:</span>
                        <span className="font-mono font-bold text-white">{res.voteCount}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Vote Share:</span>
                        <span className="font-mono font-bold text-cyan-300">{res.votePercentage}%</span>
                      </div>
                      {/* Visual Percentage Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            res.winner ? 'bg-amber-400' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${res.votePercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CANDIDATE MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'CANDIDATES' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Contesting Candidate Roster</h3>
              <p className="text-xs text-slate-400">
                Manage candidates, party affiliations, and official electoral symbols per election.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Election Selector */}
              <select
                value={selectedElectionId || ''}
                onChange={(e) => {
                  setSelectedElectionId(e.target.value);
                  fetchCandidates(e.target.value);
                }}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
              >
                {elections.map((el) => (
                  <option key={el.id} value={el.id}>
                    {el.electionCode} — {el.name} ({el.status})
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={isRosterLocked}
                onClick={() => setShowAddCandidateModal(true)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs shadow-md transition-all ${
                  isRosterLocked
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>Add Candidate</span>
              </button>
            </div>
          </div>

          {/* Roster Lock Alert Banner (Requirement 6) */}
          {isRosterLocked && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <p className="font-bold">Candidate Roster Locked (Results Officially Declared)</p>
                  <p className="text-[11px] text-amber-300/80">
                    Results are certified for this election. To register new candidates or edit details, clear results or reset the poll.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleClearResults(currentElection)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs shrink-0 cursor-pointer self-start sm:self-auto"
              >
                Clear Results &amp; Unlock
              </button>
            </div>
          )}

          {/* Candidates Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-400">
                <AlertCircle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                <p className="font-bold text-white">No Candidates Registered</p>
                <p className="text-xs text-slate-400 mt-1">
                  At least 2 candidates must be registered before you can open voting for this election.
                </p>
                {!isRosterLocked && (
                  <button
                    type="button"
                    onClick={() => setShowAddCandidateModal(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Register Candidate Now</span>
                  </button>
                )}
              </div>
            ) : (
              candidates.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-4 relative"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl shadow-inner">
                        {c.partySymbol.split(' ').pop() || '🏛️'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{c.fullName}</h4>
                        <span className="text-[10px] font-mono text-cyan-400 block">{c.candidateCode}</span>
                        <span className="text-xs text-slate-300 font-semibold">{c.partyName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Party Symbol: <strong className="text-slate-200">{c.partySymbol}</strong>
                    </span>
                    <p className="line-clamp-2 text-[11px] italic text-slate-300">
                      "{c.bio || 'Public welfare and community development representative.'}"
                    </p>
                  </div>

                  {/* Actions (disabled when roster is locked) */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                      {c.status}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isRosterLocked}
                        onClick={() => openEditCandidateModal(c)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isRosterLocked
                            ? 'text-slate-600 border-transparent cursor-not-allowed'
                            : 'text-slate-300 hover:text-white border-slate-800 hover:bg-slate-800 cursor-pointer'
                        }`}
                        title="Edit Candidate"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled={isRosterLocked}
                        onClick={() => handleDeleteCandidate(c.id, c.fullName)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isRosterLocked
                            ? 'text-slate-600 border-transparent cursor-not-allowed'
                            : 'text-slate-500 hover:text-rose-400 border-slate-800 hover:bg-rose-950/30 cursor-pointer'
                        }`}
                        title="Delete Candidate"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: VOTER PARTICIPATION LIST */}
      {/* ======================================================== */}
      {activeTab === 'PARTICIPATION' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Area-Wise Voter Participation Tracker</h3>
              <p className="text-xs text-slate-400">
                Auditable participation list showing voter enrollment and participation status without revealing ballot choices.
              </p>
            </div>

            {/* Select Election */}
            <select
              value={selectedElectionId || ''}
              onChange={(e) => {
                setSelectedElectionId(e.target.value);
                fetchParticipationList(e.target.value, participationSearch, participationStatusFilter);
              }}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
            >
              {elections.map((el) => (
                <option key={el.id} value={el.id}>
                  {el.electionCode} — {el.name} ({el.areaName})
                </option>
              ))}
            </select>
          </div>

          {/* Privacy Protection Banner (Requirements 3 & 5) */}
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-xs flex items-start gap-3 text-cyan-200">
            <ShieldCheck className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white block">
                Strict Ballot Privacy &amp; Anonymity Safeguard
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                The participation list records <strong>ONLY</strong> whether a citizen has cast their vote (<code className="text-emerald-400 font-mono">VOTED</code> vs <code className="text-slate-400 font-mono">NOT_VOTED</code>). All cast ballots are cryptographically anonymized and stored separately. Under no circumstances can the administrator or system look up candidate selections for an individual voter.
              </p>
            </div>
          </div>

          {/* Live Area Turnout Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Total Eligible in Area</span>
              <p className="text-2xl font-mono font-bold text-white mt-1">{totalEligibleInCurrentElection}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Turnout Progress</span>
              <p className="text-2xl font-mono font-bold text-cyan-400 mt-1">{turnoutPercentageInCurrentElection}%</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Votes Cast (Voted)</span>
              <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">{votesCastInCurrentElection}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Remaining (Not Voted)</span>
              <p className="text-2xl font-mono font-bold text-slate-400 mt-1">
                {Math.max(0, totalEligibleInCurrentElection - votesCastInCurrentElection)}
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by Voter ID (e.g. VOT-MUM-1001) or Citizen Name..."
                value={participationSearch}
                onChange={(e) => {
                  setParticipationSearch(e.target.value);
                  fetchParticipationList(selectedElectionId, e.target.value, participationStatusFilter);
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Filter:
              </span>
              <button
                type="button"
                onClick={() => {
                  setParticipationStatusFilter('ALL');
                  fetchParticipationList(selectedElectionId, participationSearch, 'ALL');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  participationStatusFilter === 'ALL'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                All Voters
              </button>
              <button
                type="button"
                onClick={() => {
                  setParticipationStatusFilter('VOTED');
                  fetchParticipationList(selectedElectionId, participationSearch, 'VOTED');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  participationStatusFilter === 'VOTED'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Voted
              </button>
              <button
                type="button"
                onClick={() => {
                  setParticipationStatusFilter('NOT_VOTED');
                  fetchParticipationList(selectedElectionId, participationSearch, 'NOT_VOTED');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  participationStatusFilter === 'NOT_VOTED'
                    ? 'bg-slate-700 text-white font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Not Voted
              </button>
            </div>
          </div>

          {/* Voter Participation Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Election ID</th>
                  <th className="py-3 px-4">Citizen Full Name</th>
                  <th className="py-3 px-4">Father / Mother</th>
                  <th className="py-3 px-4">Aadhaar (Last 4)</th>
                  <th className="py-3 px-4">Area</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-center">Participation Status</th>
                  <th className="py-3 px-4 text-right">Voted Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading voter participation data...
                    </td>
                  </tr>
                ) : participationList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No matching voter records found for this area.
                    </td>
                  </tr>
                ) : (
                  participationList.map((v) => {
                    const hasVoted = v.participationStatus === 'VOTED';
                    return (
                      <tr key={v.voterRecordId} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4 font-mono font-bold text-cyan-300">{v.voterId}</td>
                        <td className="py-3 px-4 font-bold text-white">{v.fullName}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {v.fatherName || v.motherName || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-amber-300">{v.aadhaarMasked}</td>
                        <td className="py-3 px-4 text-slate-300">{v.areaName}</td>
                        <td className="py-3 px-4">
                          {v.hasRegisteredAccount ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                              Active Account
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Unregistered</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {hasVoted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-500/40">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              Voted
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-semibold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-700">
                              Not Voted
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-400">
                          {hasVoted && v.votedAt ? new Date(v.votedAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: CITIZEN ACCOUNTS (BLOCK / DELETE MANAGEMENT) */}
      {/* ======================================================== */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Citizen &amp; Operator Account Access</h3>
              <p className="text-xs text-slate-400">
                Manage registered user accounts, toggle administrative access locks (Block/Unblock), or permanently revoke credentials.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchUsers(usersSearch);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  placeholder="Search username, name, voter ID..."
                  className="rounded-xl border border-slate-800 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Search
              </button>
              {usersSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setUsersSearch('');
                    fetchUsers('');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Username &amp; UID</th>
                  <th className="py-3 px-4">Citizen Name &amp; Role</th>
                  <th className="py-3 px-4">Linked Voter ID</th>
                  <th className="py-3 px-4">Assigned Area</th>
                  <th className="py-3 px-4">Registration Date</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading user accounts...
                    </td>
                  </tr>
                ) : usersList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No user accounts found matching your query.
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => {
                    const isRootAdmin = u.username?.toUpperCase() === 'ADMIN-001' || u.role === 'ROLE_ADMIN';
                    return (
                      <tr key={u.id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-white block">{u.username}</span>
                          <span className="text-[10px] text-slate-500 font-mono">UID #{u.id}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-200 block">{u.fullName || '—'}</span>
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-cyan-400">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                          {u.voterId || <span className="text-slate-500 font-normal">N/A</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {u.areaName || <span className="text-slate-500">Global Admin</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4">
                          {u.enabled ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <Ban className="h-3 w-3" />
                              Blocked
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isRootAdmin ? (
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1 rounded bg-slate-900 border border-slate-800">
                              Protected Root
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              {/* Toggle Status (Block / Unblock) */}
                              <button
                                type="button"
                                disabled={isUserActionLoading}
                                onClick={() => handleToggleUserStatus(u)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                                  u.enabled
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                }`}
                                title={u.enabled ? 'Block account from logging in' : 'Unblock account access'}
                              >
                                {u.enabled ? (
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

                              {/* Delete Account */}
                              <button
                                type="button"
                                disabled={isUserActionLoading}
                                onClick={() => setUserToDelete(u)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-all cursor-pointer"
                                title="Permanently delete user account"
                              >
                                <Trash2 className="h-3 w-3 text-rose-400" />
                                <span>Delete</span>
                              </button>
                            </div>
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
      )}

      {/* ======================================================== */}
      {/* TAB 4: AREA MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'AREAS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Configured Electoral Areas ({areas.length})</h3>
            <button
              type="button"
              onClick={() => setShowAddAreaModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add New City / Area</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((a) => (
              <div key={a.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-base text-white">{a.name}</h4>
                    <span className="text-[10px] font-mono text-cyan-400">{a.areaCode}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      a.active
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {a.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-semibold">{a.constituencyName}</p>
                <p className="text-xs text-slate-400 line-clamp-2">{a.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400">
                    Voters: <strong className="text-white font-mono">{a.totalVoterRecords}</strong>
                  </span>
                  <span className="text-slate-400">
                    Accounts: <strong className="text-emerald-400 font-mono">{a.registeredAccounts}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: VOTER ROLL MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'VOTERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white">Authorized Electoral Roll</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowImportCsvModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5 text-cyan-400" />
                <span>Import CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddVoterModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Single Voter</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Election ID</th>
                  <th className="py-3 px-4">Citizen Name</th>
                  <th className="py-3 px-4">Father's Name</th>
                  <th className="py-3 px-4">Aadhaar (Last 4)</th>
                  <th className="py-3 px-4">Area</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading voter roll...
                    </td>
                  </tr>
                ) : voters.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No voters enrolled.
                    </td>
                  </tr>
                ) : (
                  voters.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300">{v.voterId}</td>
                      <td className="py-3 px-4 font-bold text-white">{v.fullName}</td>
                      <td className="py-3 px-4 text-slate-300">{v.fatherName || '—'}</td>
                      <td className="py-3 px-4 font-mono text-amber-300">{v.aadhaarMasked}</td>
                      <td className="py-3 px-4 text-slate-300">{v.areaName}</td>
                      <td className="py-3 px-4">
                        {v.hasRegisteredAccount ? (
                          <span className="text-[10px] font-bold text-emerald-400">Active</span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Unregistered</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteVoter(v.id, v.fullName, v.voterId)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: AUDIT LOGS */}
      {/* ======================================================== */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white">Immutable Administrative &amp; Security Audit Logs</h3>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No audit records logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4 font-bold text-cyan-300">{log.actorUsername}</td>
                      <td className="py-3 px-4 text-[10px]">{log.role}</td>
                      <td className="py-3 px-4 text-amber-300">{log.action}</td>
                      <td className="py-3 px-4">{log.target}</td>
                      <td className="py-3 px-4 text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD ELECTION */}
      {/* ======================================================== */}
      {showAddElectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0E1322] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Configure New Election</h3>
              <button
                type="button"
                onClick={() => setShowAddElectionModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateElection} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Election Code *</label>
                  <input
                    type="text"
                    required
                    value={newElectionCode}
                    onChange={(e) => setNewElectionCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ELEC-2026-BLR-03"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-cyan-300 font-mono uppercase focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Election Type *</label>
                  <input
                    type="text"
                    required
                    value={newElectionType}
                    onChange={(e) => setNewElectionType(e.target.value)}
                    placeholder="e.g. Municipal Corporation"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Election Name *</label>
                <input
                  type="text"
                  required
                  value={newElectionName}
                  onChange={(e) => setNewElectionName(e.target.value)}
                  placeholder="e.g. Bengaluru South Municipal General Election 2026"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Electoral Area *</label>
                <select
                  value={newElectionAreaId}
                  onChange={(e) => setNewElectionAreaId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.areaCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Poll Start Time</label>
                  <input
                    type="datetime-local"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Poll End Time</label>
                  <input
                    type="datetime-local"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddElectionModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 font-bold text-slate-950 cursor-pointer"
                >
                  Save Election
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD CANDIDATE (Requirement 1) */}
      {/* ======================================================== */}
      {showAddCandidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0E1322] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Add Candidate to Roster</h3>
                <p className="text-[11px] text-cyan-400 font-mono">
                  Election: {currentElection?.electionCode} ({currentElection?.name})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCandidateModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCandidate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Candidate Code *</label>
                  <input
                    type="text"
                    required
                    value={candCode}
                    onChange={(e) => setCandCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CAND-MUM-04"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-cyan-300 font-mono uppercase focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Candidate Full Name *</label>
                  <input
                    type="text"
                    required
                    value={candFullName}
                    onChange={(e) => setCandFullName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Party Name *</label>
                  <input
                    type="text"
                    required
                    value={candPartyName}
                    onChange={(e) => setCandPartyName(e.target.value)}
                    placeholder="e.g. Democratic Alliance"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Party Symbol (with Emoji) *</label>
                  <input
                    type="text"
                    required
                    value={candPartySymbol}
                    onChange={(e) => setCandPartySymbol(e.target.value)}
                    placeholder="e.g. Rising Sun ☀️"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Candidate Manifesto / Bio</label>
                <textarea
                  rows={3}
                  value={candBio}
                  onChange={(e) => setCandBio(e.target.value)}
                  placeholder="Summary of public manifesto, community experience, and agenda..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCandidateModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 font-bold text-slate-950 cursor-pointer"
                >
                  Register Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT CANDIDATE (Requirement 1) */}
      {/* ======================================================== */}
      {showEditCandidateModal && candidateToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0E1322] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Edit Candidate Profile</h3>
                <p className="text-[11px] text-cyan-400 font-mono">
                  Code: {candidateToEdit.candidateCode} (Roster Editable)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditCandidateModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCandidate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={candFullName}
                  onChange={(e) => setCandFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Party Affiliation *</label>
                  <input
                    type="text"
                    required
                    value={candPartyName}
                    onChange={(e) => setCandPartyName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Party Symbol *</label>
                  <input
                    type="text"
                    required
                    value={candPartySymbol}
                    onChange={(e) => setCandPartySymbol(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Manifesto / Bio</label>
                <textarea
                  rows={3}
                  value={candBio}
                  onChange={(e) => setCandBio(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditCandidateModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 font-bold text-slate-950 cursor-pointer"
                >
                  Update Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CANDIDATE VALIDATION ERROR (Requirement 6) */}
      {/* ======================================================== */}
      {showCandidateValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/50 bg-[#160B11] p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="font-bold text-white text-base">Missing Candidate Validation</h3>
            </div>
            <p className="text-xs text-rose-200 leading-relaxed">{validationModalMessage}</p>
            <div className="rounded-xl bg-slate-950/80 p-3 text-[11px] text-slate-300 border border-slate-800">
              💡 <strong>Electoral Rule:</strong> A democratic election requires at least 2 contesting candidates registered in its candidate roster before voting polls can be unlocked.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCandidateValidationModal(false);
                  setActiveTab('CANDIDATES');
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 font-bold text-slate-950 text-xs cursor-pointer"
              >
                Go to Candidate Management
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD AREA */}
      {/* ======================================================== */}
      {showAddAreaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0E1322] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Add New City / Area</h3>
              <button
                type="button"
                onClick={() => setShowAddAreaModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddArea} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">City or Area Name *</label>
                <input
                  type="text"
                  required
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="e.g. Chandigarh"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Area Code *</label>
                <input
                  type="text"
                  required
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AREA-CHD"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-cyan-300 font-mono uppercase focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Constituency Name</label>
                <input
                  type="text"
                  value={constituencyName}
                  onChange={(e) => setConstituencyName(e.target.value)}
                  placeholder="e.g. Chandigarh Central"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Election Type</label>
                <input
                  type="text"
                  value={electionType}
                  onChange={(e) => setElectionType(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAreaModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 font-bold text-slate-950 cursor-pointer"
                >
                  Create Area
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD VOTER */}
      {/* ======================================================== */}
      {showAddVoterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0E1322] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Add Voter Record to Roll</h3>
              <button
                type="button"
                onClick={() => setShowAddVoterModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddVoter} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Election ID *</label>
                  <input
                    type="text"
                    required
                    value={newVoterId}
                    onChange={(e) => setNewVoterId(e.target.value.toUpperCase())}
                    placeholder="e.g. VOT-MUM-9999"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-cyan-300 font-mono uppercase focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Citizen Full Name"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Father's Name</label>
                  <input
                    type="text"
                    value={newFatherName}
                    onChange={(e) => setNewFatherName(e.target.value)}
                    placeholder="Father's Name"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mother's Name</label>
                  <input
                    type="text"
                    value={newMotherName}
                    onChange={(e) => setNewMotherName(e.target.value)}
                    placeholder="Mother's Name"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Last 4 Digits of Aadhaar *</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={newAadhaar}
                    onChange={(e) => setNewAadhaar(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 5678"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-amber-300 font-mono text-center focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned City / Area *</label>
                  <select
                    value={newAreaId}
                    onChange={(e) => setNewAreaId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVoterModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 font-bold text-slate-950 cursor-pointer"
                >
                  Enroll Voter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CSV IMPORT */}
      {/* ======================================================== */}
      {showImportCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0E1322] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Import Voter Records via CSV</h3>
              <button
                type="button"
                onClick={() => setShowImportCsvModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleImportCsv} className="space-y-4 text-xs">
              <p className="text-slate-400">
                Upload a CSV file formatted as:{' '}
                <code className="text-cyan-300 font-mono">
                  voterId,fullName,fatherName,motherName,aadhaarLast4,areaName
                </code>
              </p>
              <input
                type="file"
                accept=".csv"
                required
                onChange={(e) => setCsvFile(e.target.files[0])}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500 file:text-slate-950"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportCsvModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 font-bold text-slate-950 cursor-pointer"
                >
                  Upload &amp; Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE USER CONFIRMATION */}
      {/* ======================================================== */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#0E1322] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Delete User Account</h3>
                <p className="text-xs text-slate-400">Irrevocable administrative action</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-2.5">
              <p>
                Are you sure you want to permanently delete the account for{' '}
                <strong className="text-white font-mono">{userToDelete.username}</strong>{' '}
                ({userToDelete.fullName || 'Citizen Voter'})?
              </p>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-amber-300 space-y-1">
                <p className="font-semibold text-[11px] uppercase tracking-wider">Security &amp; Roll Consequences:</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                  <li>Any future login attempt by this user will fail immediately with invalid credentials.</li>
                  <li>The citizen's municipal voter roll record will be reset to unregistered status.</li>
                  <li>An immutable administrative security audit record will be logged.</li>
                  <li>Any previously recorded anonymous ballot hash receipts remain cryptographically intact.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isUserActionLoading}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUserActionLoading}
                onClick={handleDeleteUserAccount}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isUserActionLoading ? 'Deleting...' : 'Permanently Delete Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
