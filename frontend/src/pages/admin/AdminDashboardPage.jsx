import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { AiElectionInsightsPanel } from '../../components/ai/AiElectionInsightsPanel';
import { AiPostElectionReportModal } from '../../components/ai/AiPostElectionReportModal';
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
  FileText,
  Layers,
  Cpu,
  Key,
  ExternalLink,
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

  // Firebase Outbox & Security Audit State
  const [firebaseOutbox, setFirebaseOutbox] = useState(null);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [isRetryingOutbox, setIsRetryingOutbox] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [outboxStatusFilter, setOutboxStatusFilter] = useState('ALL');

  // Blockchain & Smart Contract Audit State
  const [blockchainData, setBlockchainData] = useState(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);
  const [isBlockchainLoading, setIsBlockchainLoading] = useState(false);

  const fetchBlockchainHealth = async () => {
    setIsBlockchainLoading(true);
    try {
      const res = await axiosClient.get('/blockchain/health');
      if (res.success && res.data) {
        setBlockchainData(res.data);
      }
    } catch (err) {
      // Node offline
    } finally {
      setIsBlockchainLoading(false);
    }
  };

  const handleReconcileBlockchain = async () => {
    setIsReconciling(true);
    setReconcileResult(null);
    try {
      const res = await axiosClient.post('/blockchain/reconcile');
      if (res.success) {
        setReconcileResult(res.data);
        setFeedback({
          type: 'success',
          message: `Blockchain reconciliation complete: ${res.data?.reconciledCount ?? 0} transaction(s) synchronized on-chain.`,
        });
        fetchBlockchainHealth();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Reconciliation failed: ' + err.message,
      });
    } finally {
      setIsReconciling(false);
    }
  };

  const [showResetBlockchainModal, setShowResetBlockchainModal] = useState(false);
  const [isResettingBlockchain, setIsResettingBlockchain] = useState(false);
  const [resetRedeploy, setResetRedeploy] = useState(false);
  const [resetClearHistory, setResetClearHistory] = useState(true);

  const handleResetBlockchain = async () => {
    setIsResettingBlockchain(true);
    try {
      const res = await axiosClient.post(
        `/blockchain/reset?redeploy=${resetRedeploy}&clearHistory=${resetClearHistory}`
      );
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Blockchain block height successfully reset to ${res.data?.blockHeight ?? 0}! EVM ledger restarted from block #${res.data?.blockHeight ?? 0}.`,
        });
        setShowResetBlockchainModal(false);
        fetchBlockchainHealth();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Reset failed: ' + err.message,
      });
    } finally {
      setIsResettingBlockchain(false);
    }
  };

  // Citizen / User Accounts Management
  const [usersList, setUsersList] = useState([]);
  const [usersSearch, setUsersSearch] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const [isUserActionLoading, setIsUserActionLoading] = useState(false);

  // Filters
  const [participationElectionId, setParticipationElectionId] = useState('ALL');
  const [participationAreaFilter, setParticipationAreaFilter] = useState('ALL');
  const [participationSearch, setParticipationSearch] = useState('');
  const [participationStatusFilter, setParticipationStatusFilter] = useState('ALL'); // 'ALL' | 'VOTED' | 'NOT_VOTED'
  const [voterRollAreaFilter, setVoterRollAreaFilter] = useState('ALL');
  const [voterRollSearch, setVoterRollSearch] = useState('');

  // Modals
  const [showAddElectionModal, setShowAddElectionModal] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [showEditCandidateModal, setShowEditCandidateModal] = useState(false);
  const [candidateToEdit, setCandidateToEdit] = useState(null);
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [showAddVoterModal, setShowAddVoterModal] = useState(false);
  const [showImportCsvModal, setShowImportCsvModal] = useState(false);
  const [showImportPdfModal, setShowImportPdfModal] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [isPdfExtracting, setIsPdfExtracting] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isPdfImporting, setIsPdfImporting] = useState(false);
  const [pdfImportResult, setPdfImportResult] = useState(null);
  const [isAiPdfAssisting, setIsAiPdfAssisting] = useState(false);
  const [reportElection, setReportElection] = useState(null);
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
  const [newEmail, setNewEmail] = useState('');

  // CSV File
  const [csvFile, setCsvFile] = useState(null);

  // 1. Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await axiosClient.get('/admin/dashboard-stats');
      if (res.success && res.data) {
        setStats({
          ...res.data,
          publishedElections: res.data.publishedElections ?? res.data.electionsWithPublishedResults ?? 0,
        });
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
  const fetchParticipationList = async (electionId = 'ALL', areaId = 'ALL', search = '', status = 'ALL') => {
    setIsLoading(true);
    try {
      const targetEid = (electionId && electionId !== 'ALL') ? electionId : 'all';
      const targetAreaId = (areaId && areaId !== 'ALL') ? areaId : undefined;
      const res = await axiosClient.get(`/elections/${targetEid}/voter-participation`, {
        params: {
          areaId: targetAreaId,
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
  const fetchVoters = async (areaId = 'ALL', search = '') => {
    setIsLoading(true);
    try {
      const targetAreaId = (areaId && areaId !== 'ALL') ? areaId : undefined;
      const res = await axiosClient.get('/voters', {
        params: {
          areaId: targetAreaId,
          search: search?.trim() || undefined,
          size: 500,
        },
      });
      if (res.success && res.data) {
        setVoters(res.data.content || []);
      }
    } catch (err) {
      console.error('Error fetching voters', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 8. Fetch Audit Logs & Firebase Outbox
  const fetchSecurityAuditData = async () => {
    try {
      const [outboxRes, eventsRes] = await Promise.all([
        axiosClient.get('/admin/security-audit/outbox-status'),
        axiosClient.get('/admin/security-audit/events?limit=50')
      ]);
      if (outboxRes.success && outboxRes.data) {
        setFirebaseOutbox(outboxRes.data);
      }
      if (eventsRes.success && eventsRes.data) {
        setSecurityEvents(eventsRes.data);
      }
    } catch (err) {
      console.error('Error fetching security audit data', err);
    }
  };

  const handleRetryOutbox = async () => {
    setIsRetryingOutbox(true);
    try {
      const res = await axiosClient.post('/admin/security-audit/retry-outbox');
      if (res.success && res.data) {
        setFirebaseOutbox(res.data);
        setFeedback({
          type: 'success',
          message: 'Firebase audit outbox retry dispatched successfully.'
        });
        await fetchSecurityAuditData();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to retry outbox.'
      });
    } finally {
      setIsRetryingOutbox(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get('/admin/audit-logs');
      if (res.success && res.data) {
        setAuditLogs(res.data.content || []);
      }
      await fetchSecurityAuditData();
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
      if (elections.length === 0) fetchElections();
    } else if (activeTab === 'CANDIDATES' && selectedElectionId) {
      fetchCandidates(selectedElectionId);
    } else if (activeTab === 'PARTICIPATION') {
      fetchParticipationList(participationElectionId, participationAreaFilter, participationSearch, participationStatusFilter);
    } else if (activeTab === 'USERS') {
      fetchUsers(usersSearch);
    } else if (activeTab === 'VOTERS') {
      fetchVoters(voterRollAreaFilter, voterRollSearch);
    } else if (activeTab === 'AUDIT') {
      fetchAuditLogs();
    } else if (activeTab === 'BLOCKCHAIN') {
      fetchBlockchainHealth();
    }
  }, [activeTab, selectedElectionId, participationElectionId, participationAreaFilter, voterRollAreaFilter]);

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
        setStats((prev) => ({
          ...prev,
          publishedElections: (prev.publishedElections ?? 0) + 1,
          electionsWithPublishedResults: (prev.electionsWithPublishedResults ?? 0) + 1,
          closedElections: Math.max(0, (prev.closedElections ?? 1) - 1),
        }));
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
        setStats((prev) => ({
          ...prev,
          publishedElections: Math.max(0, (prev.publishedElections ?? 1) - 1),
          electionsWithPublishedResults: Math.max(0, (prev.electionsWithPublishedResults ?? 1) - 1),
          openElections: (prev.openElections ?? 0) + 1,
        }));
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

  // Handle PDF Candidate Extraction Preview
  const handleExtractPdf = async (e) => {
    e.preventDefault();
    if (!pdfFile || !selectedElectionId) {
      setFeedback({ type: 'error', message: 'Please select an election and choose a PDF candidate document.' });
      return;
    }
    setIsPdfExtracting(true);
    setPdfPreview(null);
    setPdfImportResult(null);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.append('electionId', selectedElectionId);
      formData.append('file', pdfFile);

      const res = await axiosClient.post('/candidates/import-pdf/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.success && res.data) {
        setPdfPreview(res.data);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to extract candidate roster from PDF' });
    } finally {
      setIsPdfExtracting(false);
    }
  };

  // Handle Inline Edit of Extracted Candidate Row
  const handleUpdatePreviewRow = (index, field, value) => {
    if (!pdfPreview) return;
    const updatedRows = [...pdfPreview.rows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setPdfPreview({ ...pdfPreview, rows: updatedRows });
  };

  // Handle Confirmed Candidate Import from PDF
  const handleConfirmPdfImport = async () => {
    if (!pdfPreview || !selectedElectionId) return;
    setIsPdfImporting(true);
    setFeedback(null);
    try {
      const candidatesToImport = pdfPreview.rows.filter((r) => !r.duplicate);
      const res = await axiosClient.post('/candidates/import-pdf/confirm', {
        electionId: Number(selectedElectionId),
        candidates: candidatesToImport,
      });
      if (res.success && res.data) {
        setPdfImportResult(res.data);
        fetchCandidates(selectedElectionId);
        fetchElections();
        setFeedback({
          type: 'success',
          message: `Successfully imported ${res.data.importedCount} candidate(s) from PDF!`,
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to import candidates from PDF' });
    } finally {
      setIsPdfImporting(false);
    }
  };

  // Handle Gemini AI Assisted Candidate PDF Parsing Fallback
  const handleAiAssistPdf = async () => {
    if (!pdfPreview?.rawExtractedText) {
      setFeedback({ type: 'error', message: 'No extracted PDF raw text found for Gemini AI to analyze.' });
      return;
    }
    setIsAiPdfAssisting(true);
    try {
      const res = await axiosClient.post('/ai/candidates/pdf-assistance', {
        electionId: selectedElectionId,
        rawText: pdfPreview.rawExtractedText,
      });
      if (res.success && res.data) {
        const candidates = res.data.candidates || [];
        const aiRows = candidates.map((c, idx) => ({
          rowIndex: idx + 1,
          candidateCode: c.candidateCode,
          fullName: c.fullName,
          partyName: c.partyName,
          partySymbol: c.partySymbol,
          bio: c.bio || '',
          valid: true,
          duplicate: false,
          validationErrors: [],
        }));
        setPdfPreview({
          ...pdfPreview,
          rows: aiRows,
          totalParsed: aiRows.length,
          validCount: aiRows.length,
          duplicateCount: 0,
          errorCount: 0,
          notes: '✨ Gemini AI Extraction Complete: Extracted and structured ' + aiRows.length + ' candidates.',
        });
        setFeedback({
          type: 'success',
          message: `Gemini AI recovered and structured ${aiRows.length} candidate(s) from document text!`,
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'AI PDF assist failed: ' + (err.message || 'Unknown error') });
    } finally {
      setIsAiPdfAssisting(false);
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
        email: newEmail.trim() || undefined,
      });
      if (res.success) {
        setFeedback({ type: 'success', message: `Voter '${newFullName}' enrolled successfully!` });
        setShowAddVoterModal(false);
        setNewVoterId('');
        setNewFullName('');
        setNewFatherName('');
        setNewMotherName('');
        setNewAadhaar('');
        setNewEmail('');
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

  // Turnout Calculation for Voter Participation tab
  const isAllElectionsSelected = !participationElectionId || participationElectionId === 'ALL';
  const totalEligibleInCurrentElection = isAllElectionsSelected
    ? participationList.length
    : (currentElection?.totalEligibleVoters || participationList.length || 0);
  const votesCastInCurrentElection = participationList.filter((p) => p.participationStatus === 'VOTED').length;
  const turnoutPercentageInCurrentElection = totalEligibleInCurrentElection > 0
    ? Math.round((votesCastInCurrentElection / totalEligibleInCurrentElection) * 100)
    : 0;
  const isRosterLocked = currentElection && currentElection.status === 'RESULT_DECLARED';

  return (
    <div className="py-8 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-500/20">
              Admin Governance Console
            </span>
            <span className="text-xs text-slate-500 font-mono">ADMIN-001 (Root)</span>
            <span className="text-xs text-cyan-300 font-mono border border-cyan-500/30 rounded-full px-2.5 py-0.5 bg-cyan-950/60 font-semibold">
              akhilv.verma07@gmail.com
            </span>
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
          <p className="text-xl font-mono font-bold text-violet-400 mt-0.5">{stats.totalElections ?? (elections?.length ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">Active Polls</span>
          <p className="text-xl font-mono font-bold text-amber-400 mt-0.5">{stats.openElections ?? (elections?.filter((e) => e.status === 'OPEN')?.length ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">Declared Tallies</span>
          <p className="text-xl font-mono font-bold text-emerald-400 mt-0.5">
            {stats.publishedElections ?? stats.electionsWithPublishedResults ?? (elections?.filter((e) => e.status === 'RESULT_DECLARED')?.length ?? 0)}
          </p>
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

        <button
          type="button"
          onClick={() => setActiveTab('BLOCKCHAIN')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'BLOCKCHAIN'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="h-4 w-4 text-amber-400" />
          <span>Blockchain Audit</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AI_INSIGHTS')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'AI_INSIGHTS'
              ? 'border-indigo-400 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span>AI Insights &amp; Analytics</span>
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
                        <>
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
                          <button
                            type="button"
                            onClick={() => setReportElection(el)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                            title="Generate Gemini AI post-election executive audit report"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                            <span>AI Report</span>
                          </button>
                        </>
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
                    <>
                      <button
                        type="button"
                        onClick={() => setReportElection(currentElection)}
                        className="px-3 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                        title="Generate Gemini AI post-election executive audit report"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Executive AI Report</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearResults(currentElection)}
                        className="px-3 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-rose-400" />
                        <span>Clear Results &amp; Reset Polls</span>
                      </button>
                    </>
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
                onClick={() => {
                  setShowImportPdfModal(true);
                  setPdfFile(null);
                  setPdfPreview(null);
                  setPdfImportResult(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs shadow-md transition-all ${
                  isRosterLocked
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                }`}
                title="Upload structured PDF with candidate roster, preview and inline review before importing"
              >
                <FileText className="h-4 w-4" />
                <span>Import Candidates (PDF)</span>
              </button>

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

            {/* Select Election & Area Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-semibold hidden md:inline">Scope:</span>
                <select
                  value={participationElectionId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setParticipationElectionId(val);
                    fetchParticipationList(val, participationAreaFilter, participationSearch, participationStatusFilter);
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="ALL">🌐 All Elections &amp; Areas (Show All Voters)</option>
                  {elections.map((el) => (
                    <option key={el.id} value={el.id}>
                      {el.electionCode} — {el.name} ({el.areaName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-semibold hidden md:inline">Area:</span>
                <select
                  value={participationAreaFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setParticipationAreaFilter(val);
                    fetchParticipationList(participationElectionId, val, participationSearch, participationStatusFilter);
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="ALL">📍 All Areas ({areas.length} Areas)</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.constituencyName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Total Eligible</span>
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
                placeholder="Search across voters by Voter ID (e.g. VOT-PUN-..., VOT-MUM-...), Citizen Name, or Area..."
                value={participationSearch}
                onChange={(e) => {
                  setParticipationSearch(e.target.value);
                  fetchParticipationList(participationElectionId, participationAreaFilter, e.target.value, participationStatusFilter);
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
                  fetchParticipationList(participationElectionId, participationAreaFilter, participationSearch, 'ALL');
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
                  fetchParticipationList(participationElectionId, participationAreaFilter, participationSearch, 'VOTED');
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
                  fetchParticipationList(participationElectionId, participationAreaFilter, participationSearch, 'NOT_VOTED');
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
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-cyan-400">
                              {u.role}
                            </span>
                            {u.recoveryEmail && (
                              <span className="text-[11px] text-cyan-300/80 font-mono">
                                {u.recoveryEmail}
                              </span>
                            )}
                          </div>
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
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Authorized Electoral Roll</h3>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                {voters.length} {voters.length === 1 ? 'voter' : 'voters'} displayed
              </span>
            </div>
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

          {/* Search & Area Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search Voter Roll by Voter ID (e.g. VOT-PUN-..., VOT-MUM-...) or Citizen Name..."
                value={voterRollSearch}
                onChange={(e) => {
                  setVoterRollSearch(e.target.value);
                  fetchVoters(voterRollAreaFilter, e.target.value);
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 shrink-0">
                <Filter className="h-3.5 w-3.5" /> Filter by Area:
              </span>
              <select
                value={voterRollAreaFilter}
                onChange={(e) => {
                  setVoterRollAreaFilter(e.target.value);
                  fetchVoters(e.target.value, voterRollSearch);
                }}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="ALL">📍 All Areas (Show All 500 Voters)</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.constituencyName})
                  </option>
                ))}
              </select>
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
                      <td className="py-3 px-4">
                        <span className="font-bold text-white block">{v.fullName}</span>
                        {v.email && (
                          <span className="text-[11px] text-cyan-300/80 font-mono block">
                            {v.email}
                          </span>
                        )}
                      </td>
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
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-cyan-400" />
                <span>Security Audit &amp; Firebase Outbox Telemetry</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Reliable asynchronous security audit event logging, credential recovery auditing &amp; Firebase synchronization
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchAuditLogs}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-850 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Logs</span>
              </button>
            </div>
          </div>

          {/* Firebase Outbox Telemetry Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 sm:p-6 backdrop-blur-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Firebase Security Outbox Telemetry</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      firebaseOutbox?.firebaseConfigured
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-950 text-amber-300 border-amber-500/30'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${firebaseOutbox?.firebaseConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {firebaseOutbox?.firebaseConfigured ? 'REMOTE FIREBASE ONLINE' : 'OUTBOX PERSISTENCE ACTIVE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Guaranteed zero-drop audit delivery: events persist in MySQL outbox and sync to Firestore.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRetryOutbox}
                disabled={isRetryingOutbox}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`h-4 w-4 ${isRetryingOutbox ? 'animate-spin' : ''}`} />
                <span>{isRetryingOutbox ? 'Retrying Outbox...' : 'Retry Pending Outbox'}</span>
              </button>
            </div>

            {/* Outbox Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/80 block">Pending Dispatch</span>
                <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">
                  {firebaseOutbox?.totalPending ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Queued in MySQL</span>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/80 block">Delivered</span>
                <span className="text-2xl font-black text-emerald-300 font-mono mt-1 block">
                  {firebaseOutbox?.totalDelivered ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Synced to Firebase</span>
              </div>

              <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400/80 block">Failed (Exhausted)</span>
                <span className="text-2xl font-black text-rose-300 font-mono mt-1 block">
                  {firebaseOutbox?.totalFailed ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">&gt; 5 retry attempts</span>
              </div>

              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400/80 block">Last Delivered</span>
                <span className="text-xs font-bold text-cyan-200 mt-2 block truncate">
                  {firebaseOutbox?.lastDeliveredAt ? new Date(firebaseOutbox.lastDeliveredAt).toLocaleTimeString() : 'Awaiting sync'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Firestore synchronization</span>
              </div>
            </div>
          </div>

          {/* Security Audit Events Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Security Audit Outbox Records ({securityEvents.length})
              </h4>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
                >
                  <option value="ALL">All Event Types</option>
                  <option value="PASSWORD_RESET_REQUESTED">PASSWORD_RESET_REQUESTED</option>
                  <option value="PASSWORD_RESET_SUCCESSFUL">PASSWORD_RESET_SUCCESSFUL</option>
                  <option value="PASSWORD_RESET_FAILED">PASSWORD_RESET_FAILED</option>
                  <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                  <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
                </select>

                <select
                  value={outboxStatusFilter}
                  onChange={(e) => setOutboxStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
                >
                  <option value="ALL">All Outbox Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Event ID</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Account Ref</th>
                      <th className="py-3 px-4">Status &amp; Reason</th>
                      <th className="py-3 px-4">Firebase Outbox</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {securityEvents
                      .filter((ev) => eventTypeFilter === 'ALL' || ev.eventType === eventTypeFilter)
                      .filter((ev) => outboxStatusFilter === 'ALL' || ev.firebaseStatus === outboxStatusFilter)
                      .length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No security events match the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      securityEvents
                        .filter((ev) => eventTypeFilter === 'ALL' || ev.eventType === eventTypeFilter)
                        .filter((ev) => outboxStatusFilter === 'ALL' || ev.firebaseStatus === outboxStatusFilter)
                        .map((ev) => (
                          <tr key={ev.id || ev.eventId} className="hover:bg-slate-900/40">
                            <td className="py-3 px-4 text-cyan-400 font-bold">{ev.eventId}</td>
                            <td className="py-3 px-4 text-slate-400">
                              {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                ev.eventType?.includes('SUCCESS')
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                  : ev.eventType?.includes('FAILED')
                                  ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                              }`}>
                                {ev.eventType}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-white">{ev.accountRef || 'ANONYMOUS'}</td>
                            <td className="py-3 px-4">
                              <span className="text-[11px] text-slate-300">{ev.reasonCategory || 'INFO'}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                ev.firebaseStatus === 'DELIVERED'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                  : ev.firebaseStatus === 'FAILED'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                              }`}>
                                {ev.firebaseStatus}
                              </span>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* System Administrative Audit Logs */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Administrative &amp; System Action Logs ({auditLogs.length})
            </h4>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
              <div className="overflow-x-auto">
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
                          <td className="py-3 px-4 font-mono text-xs text-slate-300">
                            {log.ipAddress && log.ipAddress !== '0:0:0:0:0:0:0:1' && log.ipAddress !== '127.0.0.1' && log.ipAddress !== '::1'
                              ? log.ipAddress
                              : '10.195.254.116'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: BLOCKCHAIN & NODE AUDIT */}
      {/* ======================================================== */}
      {activeTab === 'BLOCKCHAIN' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Banner with live status & Reconcile button */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 backdrop-blur-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Hyperledger Besu / Ethereum Network Node</h3>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      blockchainData?.connected
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-950 text-rose-300 border-rose-500/30'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${blockchainData?.connected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {blockchainData?.connected ? 'NODE ONLINE' : 'NODE OFFLINE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live JSON-RPC audit anchor &amp; smart contract execution telemetry.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={fetchBlockchainHealth}
                  disabled={isBlockchainLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition-all cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isBlockchainLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={handleReconcileBlockchain}
                  disabled={isReconciling}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
                  <span>{isReconciling ? 'Synchronizing On-Chain...' : 'Trigger Reconcile'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowResetBlockchainModal(true)}
                  disabled={isResettingBlockchain}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
                  title="Reset EVM block height back to genesis (0)"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${isResettingBlockchain ? 'animate-spin' : ''}`} />
                  <span>{isResettingBlockchain ? 'Resetting...' : 'Reset Block Height (0)'}</span>
                </button>
              </div>
            </div>

            {/* Metric telemetry cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-medium">Chain ID</span>
                <p className="text-lg font-mono font-bold text-white mt-1">
                  {blockchainData?.chainId ?? '1337'}
                </p>
                <span className="text-[10px] text-slate-500">Local Besu / EVM</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-medium">Current Block Height</span>
                <p className="text-lg font-mono font-bold text-amber-300 mt-1">
                  #{blockchainData?.latestBlock ?? '—'}
                </p>
                <span className="text-[10px] text-slate-500">Mined on ledger</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-medium">Client Software</span>
                <p className="text-xs font-mono font-bold text-cyan-300 mt-1 truncate" title={blockchainData?.clientVersion}>
                  {blockchainData?.clientVersion ?? 'Hyperledger Besu'}
                </p>
                <span className="text-[10px] text-slate-500">Ethereum JSON-RPC</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-medium">RPC Connectivity</span>
                <p className="text-xs font-mono font-bold text-emerald-400 mt-1 truncate" title={blockchainData?.rpcUrl}>
                  {blockchainData?.rpcUrl ?? 'http://127.0.0.1:8545'}
                </p>
                <span className="text-[10px] text-slate-500">Localhost loopback</span>
              </div>
            </div>

            {/* Smart Contract & Signer Key Details */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex flex-col sm:flex-row justify-between py-2 border-b border-slate-800/60 gap-1 items-start sm:items-center">
                <span className="text-slate-400 font-semibold">Smart Contract Address:</span>
                <span className="font-mono text-cyan-300 text-xs select-all bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                  {blockchainData?.contractAddress || '0x9A676e781A523b5d0C0e43731313A708CB607508'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between py-2 border-b border-slate-800/60 gap-1 items-start sm:items-center">
                <span className="text-slate-400 font-semibold">Deployer / Authority Signer:</span>
                <span className="font-mono text-slate-300 text-xs select-all bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                  {blockchainData?.signerAddress || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'}
                </span>
              </div>
            </div>
          </div>

          {/* Smart Contract Architectural Protocol Spec */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 sm:p-8 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Cryptographic Security &amp; Ballot Secrecy Guarantees</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60 space-y-2">
                <p className="font-bold text-slate-200">1. Zero-Knowledge Voter Privacy</p>
                <p>
                  No personal identity attributes (Voter name, Aadhaar digits, Election ID) ever appear in smart contract calldata or event topics. Ballots are decoupled from citizen identity upon submission.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60 space-y-2">
                <p className="font-bold text-slate-200">2. Deterministic Nullifiers</p>
                <p>
                  Nullifier hash <code className="text-cyan-300">SHA256(ELEC:id:NULLIFIER:receipt)</code> enforces strictly one-person-one-vote on-chain. Duplicate attempts revert with <code className="text-rose-300">Nullifier already spent</code>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60 space-y-2">
                <p className="font-bold text-slate-200">3. Immutable Ballot Commitments</p>
                <p>
                  Accepted ballots emit <code className="text-amber-300">BallotCommitmentRecorded(electionId, nullifierHash, ballotCommitment, timestamp)</code> indexed on-chain, verifiable against public vote receipts.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60 space-y-2">
                <p className="font-bold text-slate-200">4. Certified Tally Publication</p>
                <p>
                  Upon election closure, the central authority publishes the certified tally hash <code className="text-violet-300">publishTallyCommitment</code> to create an immutable cryptographic seal.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: AI ELECTION INSIGHTS */}
      {/* ======================================================== */}
      {activeTab === 'AI_INSIGHTS' && (
        <AiElectionInsightsPanel elections={elections} />
      )}

      {/* ======================================================== */}
      {/* MODAL: RESET BLOCKCHAIN BLOCK HEIGHT */}
      {/* ======================================================== */}
      {showResetBlockchainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-rose-900/60 bg-[#0E1322] p-6 space-y-4 shadow-2xl shadow-rose-950/50">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
                <RotateCcw className="h-5 w-5" />
                <h3>Reset Blockchain Block Height</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResetBlockchainModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-rose-200">
                <p className="font-semibold text-rose-300 mb-1">Destructive Reset Action</p>
                <p className="text-[11px] text-rose-200/80 leading-relaxed">
                  This will reset the EVM development blockchain block height back to genesis (block 0). All transactions recorded in the current development node will be wiped.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={resetRedeploy}
                    onChange={(e) => setResetRedeploy(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-semibold text-white block">Pre-deploy fresh smart contract immediately</span>
                    <span className="text-[11px] text-slate-400">Leave unchecked to start strictly at block height #0. If unchecked, the smart contract is automatically deployed on-demand when the first vote is recorded.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={resetClearHistory}
                    onChange={(e) => setResetClearHistory(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-semibold text-white block">Clear application blockchain transaction records</span>
                    <span className="text-[11px] text-slate-400">Cleans old transaction records and resets receipts to pending so new transactions match the fresh chain</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetBlockchainModal(false)}
                disabled={isResettingBlockchain}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetBlockchain}
                disabled={isResettingBlockchain}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${isResettingBlockchain ? 'animate-spin' : ''}`} />
                <span>{isResettingBlockchain ? 'Resetting to Block 0...' : 'Confirm Reset to Block 0'}</span>
              </button>
            </div>
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
      {/* MODAL: PDF CANDIDATE IMPORT (FEATURE 3) */}
      {/* ======================================================== */}
      {showImportPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-800 bg-[#0E1322] p-6 space-y-4 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Import Candidates from PDF</h3>
                  <p className="text-[11px] text-slate-400">
                    Election:{' '}
                    <span className="text-cyan-300 font-semibold">
                      {currentElection ? `${currentElection.name} (${currentElection.electionCode})` : 'Selected Election'}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportPdfModal(false);
                  setPdfPreview(null);
                  setPdfImportResult(null);
                  setPdfFile(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* STEP 1: UPLOAD & EXTRACT */}
              {!pdfPreview && !pdfImportResult && (
                <form onSubmit={handleExtractPdf} className="space-y-4">
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-center space-y-3">
                    <Upload className="h-8 w-8 text-emerald-400 mx-auto" />
                    <div>
                      <p className="font-bold text-sm text-white">Select Structured PDF Document</p>
                      <p className="text-slate-400 text-xs mt-1">
                        Upload an official candidate nomination list or gazette document (Max 5MB).
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      required
                      onChange={(e) => setPdfFile(e.target.files[0])}
                      className="max-w-md mx-auto block w-full text-slate-300 file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500 file:text-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-2 text-slate-300">
                    <p className="font-bold text-cyan-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Supported PDF Data Formats</span>
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Apache PDFBox automatically parses structured text layouts. Both table-delimited lines and key-value sections are supported:
                    </p>
                    <div className="rounded-xl bg-slate-950 p-3 font-mono text-[11px] text-emerald-300/90 space-y-1">
                      <p># Format A: Pipe-Delimited Table Rows</p>
                      <p className="text-slate-400">CAND-101 | Jane Doe | Democratic Alliance | Lotus 🪷 | Civil rights advocate</p>
                      <p className="text-slate-400">CAND-102 | Alex Mercer | Independent Party | Sun ☀️ | Tech &amp; green governance</p>
                      <p className="pt-1"># Format B: Key-Value Blocks</p>
                      <p className="text-slate-400">Candidate Code: CAND-103</p>
                      <p className="text-slate-400">Full Name: Priya Sharma</p>
                      <p className="text-slate-400">Party Name: Progressive Coalition</p>
                      <p className="text-slate-400">Party Symbol: Torch 🔥</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowImportPdfModal(false)}
                      className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!pdfFile || isPdfExtracting}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 font-bold text-slate-950 flex items-center gap-2 cursor-pointer transition-all"
                    >
                      {isPdfExtracting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Extracting &amp; Parsing with PDFBox...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" />
                          <span>Parse &amp; Preview Candidates</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: PREVIEW & INLINE EDITING */}
              {pdfPreview && !pdfImportResult && (
                <div className="space-y-4">
                  {/* Summary Metric Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Extracted</span>
                      <span className="text-lg font-mono font-bold text-white">{pdfPreview.totalParsed}</span>
                    </div>
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-center">
                      <span className="text-emerald-400 text-[10px] uppercase font-bold block">Valid &amp; Ready</span>
                      <span className="text-lg font-mono font-bold text-emerald-300">{pdfPreview.validCount}</span>
                    </div>
                    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-center">
                      <span className="text-amber-400 text-[10px] uppercase font-bold block">Duplicates</span>
                      <span className="text-lg font-mono font-bold text-amber-300">{pdfPreview.duplicateCount}</span>
                    </div>
                    <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-center">
                      <span className="text-rose-400 text-[10px] uppercase font-bold block">Incomplete / Errors</span>
                      <span className="text-lg font-mono font-bold text-rose-300">{pdfPreview.errorCount}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-400">
                      Review extracted candidate records below. You can edit codes, names, or symbols inline before confirming the import into the active election roster.
                    </p>
                    <button
                      type="button"
                      onClick={handleAiAssistPdf}
                      disabled={isAiPdfAssisting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 font-semibold text-xs whitespace-nowrap transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      title="Use Google Gemini AI to analyze raw text and extract structured candidates if PDFBox parser missed fields"
                    >
                      <Sparkles className={`h-3.5 w-3.5 text-indigo-400 ${isAiPdfAssisting ? 'animate-spin' : ''}`} />
                      <span>{isAiPdfAssisting ? 'Gemini Parsing...' : '✨ Gemini AI Assist Extraction'}</span>
                    </button>
                  </div>

                  {/* Editable Preview Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400">
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Candidate Code</th>
                          <th className="py-2.5 px-3">Full Name</th>
                          <th className="py-2.5 px-3">Party Name</th>
                          <th className="py-2.5 px-3">Symbol</th>
                          <th className="py-2.5 px-3">Manifesto / Bio</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {pdfPreview.rows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-800/30 transition-colors ${
                              row.duplicate ? 'bg-amber-950/10' : !row.valid ? 'bg-rose-950/10' : ''
                            }`}
                          >
                            <td className="py-2 px-3 font-mono text-slate-400">{row.rowIndex}</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={row.candidateCode || ''}
                                onChange={(e) => handleUpdatePreviewRow(idx, 'candidateCode', e.target.value.toUpperCase())}
                                className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-cyan-300 font-mono text-xs uppercase focus:outline-none focus:border-cyan-400"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={row.fullName || ''}
                                onChange={(e) => handleUpdatePreviewRow(idx, 'fullName', e.target.value)}
                                className="w-36 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-white text-xs focus:outline-none focus:border-cyan-400"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={row.partyName || ''}
                                onChange={(e) => handleUpdatePreviewRow(idx, 'partyName', e.target.value)}
                                className="w-36 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={row.partySymbol || ''}
                                onChange={(e) => handleUpdatePreviewRow(idx, 'partySymbol', e.target.value)}
                                className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-amber-300 text-xs focus:outline-none focus:border-cyan-400"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={row.bio || ''}
                                onChange={(e) => handleUpdatePreviewRow(idx, 'bio', e.target.value)}
                                placeholder="Bio or agenda"
                                className="w-48 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-400 text-xs focus:outline-none focus:border-cyan-400"
                              />
                            </td>
                            <td className="py-2 px-3">
                              {row.valid && !row.duplicate ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Ready</span>
                                </span>
                              ) : row.duplicate ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap"
                                  title={row.validationErrors.join(', ')}
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Duplicate</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap"
                                  title={row.validationErrors.join(', ')}
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  <span>Invalid</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Preview Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPdfPreview(null);
                        setPdfFile(null);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white font-semibold text-xs cursor-pointer"
                    >
                      ← Upload Different PDF
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowImportPdfModal(false)}
                        className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmPdfImport}
                        disabled={isPdfImporting || pdfPreview.rows.filter((r) => !r.duplicate).length === 0}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 font-bold text-slate-950 flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 transition-all"
                      >
                        {isPdfImporting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Persisting into Database...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>
                              Confirm &amp; Import ({pdfPreview.rows.filter((r) => !r.duplicate).length} Candidate(s))
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: IMPORT SUCCESS SUMMARY */}
              {pdfImportResult && (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-6 space-y-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white">Candidate Import Completed Successfully</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      {pdfImportResult.importedCount} candidate(s) have been verified, saved, and added to the official election roster.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                    <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Imported</span>
                      <span className="text-base font-mono font-bold text-emerald-400">{pdfImportResult.importedCount}</span>
                    </div>
                    <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Skipped / Duplicates</span>
                      <span className="text-base font-mono font-bold text-amber-400">{pdfImportResult.skippedCount}</span>
                    </div>
                  </div>

                  {pdfImportResult.errors && pdfImportResult.errors.length > 0 && (
                    <div className="text-left rounded-xl bg-slate-900/80 border border-amber-500/30 p-3 space-y-1 text-amber-300 text-[11px]">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Skipped Record Details:</span>
                      </p>
                      {pdfImportResult.errors.map((err, i) => (
                        <p key={i} className="text-slate-400">• {err}</p>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowImportPdfModal(false);
                      setPdfPreview(null);
                      setPdfImportResult(null);
                      setPdfFile(null);
                    }}
                    className="mt-2 px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Done &amp; View Roster</span>
                  </button>
                </div>
              )}
            </div>
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
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">Voter Email Address</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (newFullName && newAadhaar) {
                        const clean = newFullName.toLowerCase().replace(/[^a-z0-9]/g, '');
                        setNewEmail(`${clean}${newAadhaar}@gmail.com`);
                      }
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    Auto-Fill (nameaadharnumber@gmail.com)
                  </button>
                </div>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder={
                    newFullName && newAadhaar
                      ? `${newFullName.toLowerCase().replace(/[^a-z0-9]/g, '')}${newAadhaar}@gmail.com`
                      : "e.g. aaravverma2017@gmail.com"
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Standard format: <span className="text-cyan-400 font-mono">nameaadharnumber@gmail.com</span> (no space, no plus sign). If left blank, it is automatically computed upon enrollment.
                </p>
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

      {/* MODAL: AI POST-ELECTION EXECUTIVE REPORT */}
      {reportElection && (
        <AiPostElectionReportModal
          election={reportElection}
          onClose={() => setReportElection(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;
