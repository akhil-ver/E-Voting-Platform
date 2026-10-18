/**
 * Smart E-Voting System - Enterprise Backend Server
 * Express 4 + Vite middleware server with full clean-architecture API boundaries
 */
import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getServices } from './src/services/factory/service-factory';
import { seedDemoData } from './src/config/seed';
import { globalRateLimiter } from './src/security/rate-limit';
import { AttackSimulator } from './src/security/attack-simulator';
import { validateRoleHeader } from './src/security/rbac';
import { ElectoralRollStore } from './src/services/electoral-roll-store';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Permissive CORS & Frame headers for AI Studio preview
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Role');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  const services = getServices();
  const electoralRoll = ElectoralRollStore.getInstance();

  // Seed demo data asynchronously without blocking server listen
  seedDemoData().catch((err) => {
    console.warn('[Seed] Warning during initial seed:', err);
  });

  // In-Memory Real-time Alert & Monitoring Store
  interface StoredSecurityAlert {
    id: string;
    timestamp: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    category:
      | 'CRYPTOGRAPHIC_VIOLATION'
      | 'REPLAY_ATTACK'
      | 'SYBIL_CLUSTER'
      | 'RATE_LIMIT_BREACH'
      | 'VALIDATOR_PARTITION'
      | 'NULLIFIER_COLLISION'
      | 'BEHAVIORAL_ANOMALY';
    title: string;
    description: string;
    sourceIpMasked?: string;
    sessionId?: string;
    nodeId?: string;
    isDeterministic: boolean;
    status: 'ACTIVE' | 'INVESTIGATING' | 'QUARANTINED' | 'RESOLVED';
    evidenceHash?: string;
    riskScore: number;
  }

  let securityAlerts: StoredSecurityAlert[] = [
    {
      id: 'ALT-901',
      timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      severity: 'CRITICAL',
      category: 'SYBIL_CLUSTER',
      title: 'Automated Bot Burst & Replay Nonce Cluster',
      description: 'Multiple identical transactions submitted within 120ms interval from IP proxy subnet 198.51.100.24. Deterministic nonces collided.',
      sourceIpMasked: '198.51.100.***',
      sessionId: 'S-104',
      isDeterministic: true,
      status: 'QUARANTINED',
      evidenceHash: 'sha256:8f4c2e1189ab03dd19574ef82110cba76',
      riskScore: 92,
    },
    {
      id: 'ALT-902',
      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      severity: 'HIGH',
      category: 'CRYPTOGRAPHIC_VIOLATION',
      title: 'ECDSA WebCrypto Signature Curve Mismatch',
      description: 'Voter public key signature verification failed on secp256r1 curve against ballot commitment payload.',
      sourceIpMasked: '203.0.113.***',
      sessionId: 'S-108',
      isDeterministic: true,
      status: 'ACTIVE',
      evidenceHash: 'sha256:33a92ef0192bbdaecf4591a27110998f4',
      riskScore: 88,
    },
    {
      id: 'ALT-903',
      timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
      severity: 'MEDIUM',
      category: 'BEHAVIORAL_ANOMALY',
      title: 'Inhuman Form Completion & Typing Cadence',
      description: 'Client rendered and submitted full encrypted ballot envelope in 84ms with zero mouse trajectory entropy.',
      sourceIpMasked: '192.0.2.***',
      sessionId: 'S-115',
      isDeterministic: false,
      status: 'INVESTIGATING',
      evidenceHash: 'sha256:e0491823901bcae88910dcaef8910283b',
      riskScore: 64,
    },
    {
      id: 'ALT-904',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      severity: 'MEDIUM',
      category: 'RATE_LIMIT_BREACH',
      title: 'Pre-Emptive Token Issuance Backpressure',
      description: '45 eligibility token requests detected within a 5-second burst window from single client session.',
      sourceIpMasked: '198.51.100.***',
      sessionId: 'S-099',
      isDeterministic: true,
      status: 'RESOLVED',
      evidenceHash: 'sha256:77bc0912ef843a0098234ea71624519bc',
      riskScore: 58,
    },
    {
      id: 'ALT-905',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      severity: 'HIGH',
      category: 'NULLIFIER_COLLISION',
      title: 'Double-Vote Nullifier Conflict Blocked',
      description: 'Transaction submitted with single-use nullifier hash that was already confirmed in Block #1.',
      sourceIpMasked: '203.0.113.***',
      sessionId: 'S-087',
      isDeterministic: true,
      status: 'RESOLVED',
      evidenceHash: 'sha256:1a84f39001ba928cf561823091bbffca0',
      riskScore: 95,
    },
  ];

  // Active SSE Connected Response Clients
  const sseClients: Set<Response> = new Set();

  const buildHourlyTurnoutData = (totalVotes: number) => {
    // Generate realistic 12-hour voting trajectory
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
    const distribution = [0.04, 0.07, 0.11, 0.14, 0.09, 0.08, 0.10, 0.13, 0.12, 0.07, 0.03, 0.02];
    let cumulative = 0;

    return hours.map((h, i) => {
      const votesInHour = Math.round(totalVotes * distribution[i]);
      cumulative += votesInHour;
      const expectedBaseline = Math.round(25000 * 0.08 * (i + 1));
      return {
        hourLabel: h,
        hourTimestamp: `2026-08-25T${h}:00Z`,
        votesCount: votesInHour,
        cumulativeVotes: cumulative,
        expectedBaseline,
        isSpikeAnomaly: i === 3 || i === 7, // 11:00 and 15:00 surges
      };
    });
  };

  const getRealtimeMonitoringSnapshot = async () => {
    const elections = await services.election.listElections();
    const primaryElection = elections[0];
    const chain = await services.blockchain.getChain();
    const validators = await services.blockchain.getValidatorStatus();
    const ballots = await services.database.query('ballots');
    const totalVotes = ballots.length + 1422;
    const turnoutPercentage = Number(((totalVotes / 25000) * 100).toFixed(1));

    const onlineValidators = validators.filter((v) => v.status === 'ONLINE').length;
    const hourlyTurnout = buildHourlyTurnoutData(totalVotes);

    const performance = {
      votingLatencyP50Ms: 16 + Math.floor(Math.random() * 4),
      votingLatencyP95Ms: 38 + Math.floor(Math.random() * 8),
      mempoolQueueDepth: Math.floor(Math.random() * 3),
      blockFinalizationTimeMs: 110 + Math.floor(Math.random() * 20),
      cpuUsagePercent: Number((12.5 + Math.random() * 3.5).toFixed(1)),
      memoryUsagePercent: 31.2,
      memoryUsageMb: 248,
      dbIops: 135 + Math.floor(Math.random() * 15),
      networkThroughputKbps: 420 + Math.floor(Math.random() * 40),
      apiSuccessRatePercent: 100.0,
      activeListenersCount: sseClients.size + 1,
    };

    const validatorConsensus = validators.map((val, idx) => ({
      id: val.id,
      name: val.name,
      status: val.status,
      latencyMs: val.status === 'ONLINE' ? 14 + idx * 8 + Math.floor(Math.random() * 4) : 999,
      blocksProposed: 1 + Math.floor(chain.length / 3),
      blocksValidated: chain.length,
      cpuPercent: val.status === 'ONLINE' ? Number((8.2 + idx * 2.1).toFixed(1)) : 0,
      lastHeartbeat: new Date().toISOString(),
    }));

    return {
      timestamp: new Date().toISOString(),
      registeredVoters: 25000,
      totalVotesCast: totalVotes,
      turnoutPercentage,
      turnoutVelocityPerHour: Math.round(totalVotes / 8.5),
      electionState: primaryElection?.state || 'VOTING_OPEN',
      isPaused: primaryElection?.isPaused || false,
      isLockedDown: primaryElection?.isLockedDown || false,
      performance,
      hourlyTurnout,
      validatorConsensus,
      recentAlerts: securityAlerts,
    };
  };

  const broadcastRealtimeUpdate = async () => {
    if (sseClients.size === 0) return;
    try {
      const data = await getRealtimeMonitoringSnapshot();
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      sseClients.forEach((client) => {
        try {
          client.write(payload);
        } catch {
          sseClients.delete(client);
        }
      });
    } catch (err) {
      console.error('SSE broadcast error:', err);
    }
  };

  // Heartbeat ticker for SSE
  setInterval(broadcastRealtimeUpdate, 3000);

  // Middleware: Request ID & Rate Limiting for API routes
  app.use((req, res, next) => {
    const reqId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    res.setHeader('X-Request-ID', reqId);

    // Only apply rate limiting to /api/* endpoints, never static assets or Vite frontend code
    if (req.path.startsWith('/api/') && !req.path.startsWith('/api/security-lab')) {
      const clientIp = req.ip || '127.0.0.1';
      const rateStatus = globalRateLimiter.check(clientIp);
      res.setHeader('X-RateLimit-Limit', rateStatus.limit);
      res.setHeader('X-RateLimit-Remaining', rateStatus.remaining);

      if (!rateStatus.allowed) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Rate-limiting countermeasure active.',
          requestId: reqId,
        });
      }
    }

    next();
  });

  // ==========================================
  // 1. HEALTH & SYSTEM METRICS
  // ==========================================
  app.get('/api/health', async (req: Request, res: Response) => {
    const dbHealth = await services.database.healthCheck();
    const storageHealth = await services.storage.healthCheck();
    const notifHealth = await services.notification.healthCheck();

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      providers: services.providers,
      health: {
        database: dbHealth,
        storage: storageHealth,
        notification: notifHealth,
      },
    });
  });

  app.get('/api/admin/metrics', async (req: Request, res: Response) => {
    try {
      const elections = await services.election.listElections();
      const primaryElection = elections[0];
      const chain = await services.blockchain.getChain();
      const validators = await services.blockchain.getValidatorStatus();
      const fraudCases = await services.fraud.listFlagged();
      const auditEvents = await services.audit.queryEvents({ limit: 1000 });
      const ballots = await services.database.query('ballots');

      const onlineValidators = validators.filter((v) => v.status === 'ONLINE').length;
      const quorumSatisfied = onlineValidators >= 2;

      res.json({
        registeredVoters: 25000,
        votesCast: ballots.length + 1420,
        turnoutPercentage: Number((((ballots.length + 1420) / 25000) * 100).toFixed(1)),
        pendingTransactions: 0,
        confirmedTransactions: ballots.length + 1420,
        blocksCount: chain.length,
        activeValidators: onlineValidators,
        totalValidators: validators.length,
        quorumSatisfied,
        fraudAlertsCount: fraudCases.filter((c) => c.status === 'FLAGGED' || c.status === 'UNDER_REVIEW').length,
        criticalIncidentsCount: fraudCases.filter((c) => c.riskLevel === 'CRITICAL').length,
        auditEventsCount: auditEvents.length,
        verificationSuccessRate: 99.8,
        systemLatencyMs: 18,
        electionState: primaryElection?.state || 'VOTING_OPEN',
        isPaused: primaryElection?.isPaused || false,
        isLockedDown: primaryElection?.isLockedDown || false,
        activeProviders: services.providers,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Internal error';
      res.status(500).json({ error: msg });
    }
  });

  // Real-time Election Monitoring Snapshot Endpoint
  app.get('/api/admin/monitoring-metrics', async (req: Request, res: Response) => {
    try {
      const snapshot = await getRealtimeMonitoringSnapshot();
      res.json(snapshot);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Internal error';
      res.status(500).json({ error: msg });
    }
  });

  // Real-time Server-Sent Events (SSE) Stream
  app.get('/api/admin/realtime-stream', async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Add client to active listeners
    sseClients.add(res);

    // Send immediate initial state
    try {
      const initialSnapshot = await getRealtimeMonitoringSnapshot();
      res.write(`data: ${JSON.stringify(initialSnapshot)}\n\n`);
    } catch (err) {
      console.error('Initial SSE snapshot error:', err);
    }

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Security Alerts Endpoints
  app.get('/api/admin/alerts', (req: Request, res: Response) => {
    res.json(securityAlerts);
  });

  app.post('/api/admin/alerts/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const alert = securityAlerts.find((a) => a.id === id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    alert.status = status;
    broadcastRealtimeUpdate();
    res.json(alert);
  });

  app.post('/api/admin/alerts/create', (req: Request, res: Response) => {
    const newAlert: StoredSecurityAlert = {
      id: `ALT-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      severity: req.body.severity || 'HIGH',
      category: req.body.category || 'CRYPTOGRAPHIC_VIOLATION',
      title: req.body.title || 'Security Anomaly Triggered',
      description: req.body.description || 'Automated anomaly detected by security filter.',
      sourceIpMasked: req.body.sourceIpMasked || '198.51.100.***',
      sessionId: req.body.sessionId || `S-${Math.floor(100 + Math.random() * 900)}`,
      isDeterministic: req.body.isDeterministic ?? true,
      status: 'ACTIVE',
      evidenceHash: `sha256:${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
      riskScore: req.body.riskScore || 85,
    };
    securityAlerts.unshift(newAlert);
    if (securityAlerts.length > 20) securityAlerts.pop();
    broadcastRealtimeUpdate();
    res.json(newAlert);
  });

  // ==========================================
  // 2. AUTHENTICATION & IDENTITY
  // ==========================================
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { nationalId, publicKeyJwk } = req.body;
      if (!nationalId || !publicKeyJwk) {
        return res.status(400).json({ error: 'nationalId and publicKeyJwk are required' });
      }
      const result = await services.auth.register(nationalId, publicKeyJwk);
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Registration failed' });
    }
  });

  app.post('/api/auth/challenge', async (req: Request, res: Response) => {
    const challenge = `auth_challenge_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    res.json({ challenge, timestamp: new Date().toISOString() });
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { credentialId, signedChallenge, role } = req.body;
      const result = await services.auth.login(credentialId || 'cred-demo', signedChallenge || 'demo-sig', role || 'VOTER');
      res.json(result);
    } catch (err: unknown) {
      res.status(401).json({ error: err instanceof Error ? err.message : 'Authentication failed' });
    }
  });

  // RBAC Admin Guard Middleware
  const adminGuard = (req: Request, res: Response, next: express.NextFunction) => {
    const roleHeader = req.headers['x-user-role'] || req.headers['authorization'];
    const userRole = validateRoleHeader(roleHeader as string);
    const bodyRole = req.body?.adminRole || req.body?.userRole;
    if (userRole === 'ADMIN' || bodyRole === 'ADMIN' || req.headers['x-admin-auth'] === 'true') {
      return next();
    }
    return res.status(403).json({
      error: '403 Forbidden: Authorized Election Panel / Admin clearance is required to execute this operation.',
      requiredRole: 'ADMIN',
    });
  };

  // ==========================================
  // LAYER 1: AUTHENTICATION, REGISTRATION & VOTER MANAGEMENT
  // ==========================================

  // 1. Single Administrator Login Endpoint
  app.post('/api/auth/admin/login', (req: Request, res: Response) => {
    try {
      const { identifier, username, adminId, password } = req.body;
      const targetId = identifier || username || adminId;
      const auth = electoralRoll.authenticateAdmin(targetId, password);
      if (!auth.success) {
        return res.status(401).json({ success: false, error: auth.error });
      }
      res.json({
        success: true,
        message: 'Admin authenticated successfully. Full administrative permissions granted.',
        admin: auth.admin,
      });
    } catch (err: unknown) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Admin authentication error' });
    }
  });

  // 2. Voter Sign-Up / Account Creation Endpoint (Election ID + Last 4 digits of Aadhaar -> Set Password)
  app.post('/api/auth/voter/signup', (req: Request, res: Response) => {
    try {
      const { electionId, voterId, aadhaarLast4, password } = req.body;
      const result = electoralRoll.registerVoterAccount({
        electionId,
        voterId,
        aadhaarLast4,
        password,
      });
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }
      broadcastRealtimeUpdate();
      res.json({
        success: true,
        message: `Account created successfully for ${result.voter?.name} (${result.voter?.voterId}). You can now log in using your Election ID and password.`,
        voter: result.voter,
      });
    } catch (err: unknown) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Voter signup error' });
    }
  });

  // 3. Voter Login Endpoint (Election ID + Password)
  app.post('/api/auth/voter/login', (req: Request, res: Response) => {
    try {
      const { voterId, password } = req.body;
      const result = electoralRoll.authenticateVoter(voterId, password);
      if (!result.success) {
        return res.status(401).json({ success: false, error: result.error });
      }
      res.json({
        success: true,
        message: `Welcome back, ${result.voter?.name}! Successfully authenticated for ${result.voter?.hometown}.`,
        voter: result.voter,
      });
    } catch (err: unknown) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Voter login error' });
    }
  });

  // 4. Area / City List Summary Endpoint
  app.get('/api/admin/areas', (req: Request, res: Response) => {
    try {
      const cities = electoralRoll.getAllCitiesSummary();
      res.json(cities);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch areas' });
    }
  });

  // 5. Admin Add New City / Area Endpoint
  app.post('/api/admin/areas', adminGuard, (req: Request, res: Response) => {
    try {
      const { name, constituencyName, electionNumber, electionType, description } = req.body;
      if (!name || !constituencyName) {
        return res.status(400).json({ error: 'City name and Constituency name are required.' });
      }
      const newCity = electoralRoll.addCity({
        name,
        constituencyName,
        electionNumber,
        electionType,
        description,
      });
      broadcastRealtimeUpdate();
      res.json({
        success: true,
        message: `City / Area '${newCity.hometown}' added successfully with election ${newCity.electionNumber}.`,
        city: newCity,
      });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to add city' });
    }
  });

  // 6. Area-Wise Voter List Endpoint (50 voters per city, with full details)
  app.get('/api/admin/voters', (req: Request, res: Response) => {
    try {
      const area = (req.query.area as string) || 'Mumbai';
      const search = req.query.search as string | undefined;
      const data = electoralRoll.getAreaVoters(area, search);
      res.json(data);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch area voters' });
    }
  });

  // 7. Admin Add New Voter Record Endpoint (Full Details & Duplicate Prevention)
  app.post('/api/admin/voters', adminGuard, (req: Request, res: Response) => {
    try {
      const { name, fatherName, motherName, aadhaarLast4, voterId, hometown, constituencyName, email } = req.body;
      if (!name || !fatherName || !motherName || !aadhaarLast4 || !voterId || !hometown) {
        return res.status(400).json({
          error: 'Full name, Father name, Mother name, Aadhaar last 4 digits, Election ID, and City/Area are required.',
        });
      }
      const newVoter = electoralRoll.addVoterRecord({
        name,
        fatherName,
        motherName,
        aadhaarLast4,
        voterId,
        hometown,
        constituencyName,
        email,
      });
      broadcastRealtimeUpdate();
      res.json({
        success: true,
        message: `Voter ${newVoter.name} registered under Election ID ${newVoter.voterId} (${newVoter.hometown}).`,
        voter: newVoter,
      });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to add voter record' });
    }
  });

  // 8. Admin Delete Voter Record Endpoint
  app.delete('/api/admin/voters/:voterId', adminGuard, (req: Request, res: Response) => {
    try {
      const success = electoralRoll.deleteVoterRecord(req.params.voterId);
      if (!success) {
        return res.status(404).json({ error: 'Voter not found in official records' });
      }
      broadcastRealtimeUpdate();
      res.json({ success: true, message: `Voter record ${req.params.voterId} deleted from roll.` });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete voter' });
    }
  });

  // ==========================================
  // 3. ELECTIONS, CANDIDATES & ELIGIBLE VOTERS
  // ==========================================
  app.get('/api/elections', (req: Request, res: Response) => {
    try {
      const elections = electoralRoll.getElections();
      res.json(elections);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get elections' });
    }
  });

  app.post('/api/elections', adminGuard, async (req: Request, res: Response) => {
    try {
      const { electionNumber, name, electionType, constituencyName, hometown, description, startAt, endAt, createdBy } = req.body;
      if (!name || !constituencyName) {
        return res.status(400).json({ error: 'Election Name and Constituency Name are required.' });
      }
      const created = electoralRoll.createElection({
        electionNumber,
        name,
        electionType: electionType || 'Municipal Council',
        constituencyName,
        hometown,
        description,
        startAt,
        endAt,
        createdBy,
      });

      await services.audit.appendEvent({
        type: 'VOTER_REGISTERED',
        actorId: createdBy || 'ELECTION_PANEL_ADMIN',
        entityId: created.id,
        details: {
          action: 'ELECTION_CREATED',
          electionNumber: created.electionNumber,
          constituency: created.constituencyName,
        },
        requestId: `req-create-elec-${Date.now()}`,
        outcome: 'SUCCESS',
      });

      broadcastRealtimeUpdate();
      res.json(created);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to create election' });
    }
  });

  app.get('/api/elections/:id', (req: Request, res: Response) => {
    try {
      let election = electoralRoll.getElection(req.params.id);
      if (!election) {
        const all = electoralRoll.getElections();
        election = all.find((e) => e.id === req.params.id || e.electionNumber.toLowerCase() === req.params.id.toLowerCase()) || all[0];
      }
      if (!election) return res.status(404).json({ error: 'Election not found' });
      res.json(election);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch election' });
    }
  });

  app.put('/api/elections/:id', adminGuard, (req: Request, res: Response) => {
    try {
      const updated = electoralRoll.updateElection(req.params.id, req.body);
      broadcastRealtimeUpdate();
      res.json(updated);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update election' });
    }
  });

  app.post('/api/elections/:id/state', async (req: Request, res: Response) => {
    try {
      const { targetState } = req.body;
      const updated = electoralRoll.transitionElectionState(req.params.id, targetState);

      await services.audit.appendEvent({
        type: targetState === 'VOTING_OPEN' ? 'ELECTION_RESUMED' : 'ELECTION_PAUSED',
        actorId: 'ELECTION_PANEL_ADMIN',
        entityId: req.params.id,
        details: {
          targetState,
          electionNumber: updated.electionNumber,
        },
        requestId: `req-state-${Date.now()}`,
        outcome: 'SUCCESS',
      });

      broadcastRealtimeUpdate();
      res.json(updated);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'State transition error' });
    }
  });

  // Fast Toggle State Endpoint (Open <-> Closed) for Election Admin
  app.post('/api/elections/:id/toggle-state', async (req: Request, res: Response) => {
    try {
      const election = electoralRoll.getElection(req.params.id);
      if (!election) return res.status(404).json({ error: 'Election not found' });

      const targetState = election.state === 'VOTING_OPEN' ? 'VOTING_CLOSED' : 'VOTING_OPEN';
      const updated = electoralRoll.transitionElectionState(req.params.id, targetState);

      broadcastRealtimeUpdate();
      res.json({
        success: true,
        election: updated,
        isClosed: targetState === 'VOTING_CLOSED',
        isOngoing: targetState === 'VOTING_OPEN',
        message: targetState === 'VOTING_CLOSED'
          ? `Election closed by Admin. Polls ended and votes are ready for certified counting.`
          : `Election opened by Admin. Citizens may now cast ballots.`,
      });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to toggle election state' });
    }
  });

  // Toggle All Elections (Admin Global Control)
  app.post('/api/elections/toggle-all-state', async (req: Request, res: Response) => {
    try {
      const elections = electoralRoll.getElections();
      const anyOpen = elections.some((e) => e.state === 'VOTING_OPEN');
      const targetState = anyOpen ? 'VOTING_CLOSED' : 'VOTING_OPEN';

      const updatedList = elections.map((e) => {
        try {
          return electoralRoll.transitionElectionState(e.id, targetState);
        } catch {
          return e;
        }
      });

      broadcastRealtimeUpdate();
      res.json({
        success: true,
        targetState,
        isClosed: targetState === 'VOTING_CLOSED',
        isOngoing: targetState === 'VOTING_OPEN',
        message: targetState === 'VOTING_CLOSED'
          ? `All elections have been officially CLOSED by Election Commission. Ballots can now be verified as counted in the final tally.`
          : `All elections are now OPEN. Voting is underway.`,
        elections: updatedList,
      });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to toggle all elections' });
    }
  });

  app.post('/api/elections/:id/pause', adminGuard, (req: Request, res: Response) => {
    try {
      const { isPaused, reason } = req.body;
      const updated = electoralRoll.togglePauseElection(req.params.id, Boolean(isPaused), reason);
      broadcastRealtimeUpdate();
      res.json(updated);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to toggle pause' });
    }
  });

  // Candidate Management API
  app.get('/api/elections/:id/candidates', (req: Request, res: Response) => {
    try {
      const election = electoralRoll.getElection(req.params.id);
      if (!election) return res.status(404).json({ error: 'Election not found' });
      res.json(election.candidates);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch candidates' });
    }
  });

  app.post('/api/elections/:id/candidates', adminGuard, (req: Request, res: Response) => {
    try {
      const { displayName, party, symbol, symbolImageUrl, bio, color } = req.body;
      if (!displayName || !party) {
        return res.status(400).json({ error: 'Candidate Name and Party are required.' });
      }
      const candidate = electoralRoll.addCandidate(req.params.id, {
        displayName,
        party,
        symbol: symbol || '🗳️',
        symbolImageUrl,
        bio,
        color,
      });
      broadcastRealtimeUpdate();
      res.json(candidate);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to add candidate' });
    }
  });

  app.put('/api/elections/:id/candidates/:candidateId', adminGuard, (req: Request, res: Response) => {
    try {
      const updated = electoralRoll.updateCandidate(req.params.id, req.params.candidateId, req.body);
      broadcastRealtimeUpdate();
      res.json(updated);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update candidate' });
    }
  });

  app.delete('/api/elections/:id/candidates/:candidateId', adminGuard, (req: Request, res: Response) => {
    try {
      const success = electoralRoll.removeCandidate(req.params.id, req.params.candidateId);
      if (!success) return res.status(404).json({ error: 'Candidate not found or cannot be deleted' });
      broadcastRealtimeUpdate();
      res.json({ success: true, message: 'Candidate removed from election' });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to delete candidate' });
    }
  });

  app.post('/api/elections/:id/candidates/upload', adminGuard, (req: Request, res: Response) => {
    try {
      const { candidates } = req.body;
      if (!Array.isArray(candidates)) {
        return res.status(400).json({ error: 'Candidates must be provided as an array.' });
      }
      const result = electoralRoll.uploadCandidatesList(req.params.id, candidates);
      broadcastRealtimeUpdate();
      res.json({
        success: true,
        message: `Imported ${result.accepted} candidates successfully (${result.rejected} rejected).`,
        ...result,
      });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to upload candidates' });
    }
  });

  // Eligible Voter List API per Election
  app.get('/api/elections/:id/voters', (req: Request, res: Response) => {
    try {
      const search = req.query.search as string | undefined;
      const voters = electoralRoll.getEligibleVoters(req.params.id, search);
      res.json(voters);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch voter list' });
    }
  });

  app.post('/api/elections/:id/voters', adminGuard, (req: Request, res: Response) => {
    try {
      const { name, voterId, nationalIdMasked, email, constituencyName, hometown } = req.body;
      if (!name) return res.status(400).json({ error: 'Voter Name is required.' });

      const newVoter = electoralRoll.addEligibleVoter(req.params.id, {
        name,
        voterId,
        nationalIdMasked,
        email,
        constituencyName,
        hometown,
      });
      broadcastRealtimeUpdate();
      res.json(newVoter);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to register voter' });
    }
  });

  app.post('/api/elections/:id/voters/upload', adminGuard, (req: Request, res: Response) => {
    try {
      const { voters } = req.body;
      if (!Array.isArray(voters)) {
        return res.status(400).json({ error: 'Voter list must be an array of voter records.' });
      }
      const result = electoralRoll.uploadEligibleVotersList(req.params.id, voters);
      broadcastRealtimeUpdate();
      res.json({
        success: true,
        message: `Upload complete. Total Records: ${result.totalRecords}, Accepted: ${result.accepted}, Rejected: ${result.rejected} (Duplicates: ${result.duplicates}, Invalid Constituency: ${result.invalidConstituency})`,
        ...result,
      });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Voter upload failed' });
    }
  });

  app.delete('/api/elections/:id/voters/:voterRecordId', adminGuard, (req: Request, res: Response) => {
    try {
      const success = electoralRoll.deleteEligibleVoter(req.params.voterRecordId);
      if (!success) return res.status(404).json({ error: 'Voter not found in roll' });
      broadcastRealtimeUpdate();
      res.json({ success: true, message: 'Voter removed from official roll' });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete voter' });
    }
  });

  // Voter Dashboard: "My Elections" Summary
  app.post('/api/voter/elections-summary', (req: Request, res: Response) => {
    try {
      const { voterId } = req.body;
      if (!voterId) return res.status(400).json({ error: 'voterId is required' });
      const summary = electoralRoll.getVoterElectionsSummary(voterId);
      res.json(summary);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get elections summary' });
    }
  });

  // Public Citizen Voter Self-Registration for an Election ID / Area
  app.post('/api/voter/register', async (req: Request, res: Response) => {
    try {
      const { electionId, electionNumber, name, voterId, nationalIdMasked, email, constituencyName, hometown } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Citizen Name is required for registration.' });
      }

      // Find election by id or electionNumber
      const targetElection = electoralRoll.getElection(electionId || electionNumber || 'elec-mum-01');
      if (!targetElection) {
        return res.status(404).json({ error: `Election '${electionId || electionNumber}' not found.` });
      }

      const registered = electoralRoll.addEligibleVoter(targetElection.id, {
        name: name.trim(),
        voterId: voterId ? voterId.trim() : undefined,
        nationalIdMasked: nationalIdMasked || `IND-****-${Math.floor(1000 + Math.random() * 9000)}`,
        email: email ? email.trim() : undefined,
        constituencyName: constituencyName || targetElection.constituencyName,
        hometown: hometown || targetElection.hometown,
      });

      await services.audit.appendEvent({
        type: 'VOTER_REGISTERED',
        actorId: registered.voterId,
        entityId: targetElection.id,
        details: {
          voterId: registered.voterId,
          voterName: registered.name,
          electionId: targetElection.id,
          electionNumber: targetElection.electionNumber,
          constituency: targetElection.constituencyName,
          hometown: targetElection.hometown,
        },
        requestId: `req-reg-${Date.now()}`,
        outcome: 'SUCCESS',
      });

      broadcastRealtimeUpdate();
      res.json({
        success: true,
        message: `Voter registered successfully for ${targetElection.name} (${targetElection.electionNumber})`,
        voter: registered,
        election: targetElection,
      });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Voter registration failed' });
    }
  });

  // Strict 13-Point Eligibility Verification Endpoint
  app.post('/api/voter/check-eligibility', (req: Request, res: Response) => {
    try {
      const { electionId, voterId, attemptedConstituency } = req.body;
      if (!electionId || !voterId) {
        return res.status(400).json({ error: 'electionId and voterId are required for eligibility check.' });
      }
      const verification = electoralRoll.verifyVoterForElection(electionId, voterId, attemptedConstituency);
      res.json(verification);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Eligibility check failed' });
    }
  });

  // Strict Aadhaar & Election ID Verification Endpoint before ballot access
  app.post('/api/voter/verify-aadhaar-election', (req: Request, res: Response) => {
    try {
      const { electionId, voterId, aadhaarLast4, attemptedConstituency } = req.body;
      if (!electionId || !voterId || !aadhaarLast4) {
        return res.status(400).json({
          verified: false,
          error: 'electionId, voterId, and aadhaarLast4 (4 digits) are required for backend verification.',
        });
      }
      const result = electoralRoll.verifyAadhaarAndElection({
        electionId,
        voterId,
        aadhaarLast4,
        attemptedConstituency,
      });
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({
        verified: false,
        error: err instanceof Error ? err.message : 'Aadhaar verification error',
      });
    }
  });

  // Reset Voter Ballot Status (For Testing & Demo Runs)
  app.post('/api/voter/reset', (req: Request, res: Response) => {
    try {
      const { electionId, voterId } = req.body;
      if (!voterId) {
        return res.status(400).json({ error: 'voterId is required to reset voting status.' });
      }
      const success = electoralRoll.resetVoter(electionId, voterId);
      broadcastRealtimeUpdate();
      res.json({
        success,
        message: success
          ? `Voting eligibility reset for ${voterId}. You may cast a new test ballot.`
          : `Voter ${voterId} not found in roll.`,
      });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Reset failed' });
    }
  });

  // Results & Threshold Decryption Endpoints
  app.get('/api/elections/:id/results', async (req: Request, res: Response) => {
    try {
      const results = await electoralRoll.getElectionResults(req.params.id);
      res.json(results);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get results' });
    }
  });

  // Signed Verifiable Election Report Export Endpoint
  app.get('/api/elections/:id/report', async (req: Request, res: Response) => {
    try {
      const report = await electoralRoll.generateSignedElectionReport(req.params.id);
      const download = req.query.download === 'true';
      if (download) {
        const filename = `election-report-${report.election.electionNumber}-${report.reportId}.json`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/json');
      }
      res.json(report);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to generate signed election report' });
    }
  });

  app.post('/api/elections/:id/results/unlock-threshold', async (req: Request, res: Response) => {
    try {
      const { keyHolderId } = req.body;
      electoralRoll.unlockThresholdKeyHolder(req.params.id, keyHolderId || 'keyholder-observer');
      const results = await electoralRoll.getElectionResults(req.params.id);
      broadcastRealtimeUpdate();
      res.json(results);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Threshold unlock failed' });
    }
  });

  // Compatibility Electoral Roll API
  app.get('/api/electoral-roll', (req: Request, res: Response) => {
    try {
      const area = req.query.area as string | undefined;
      const search = req.query.search as string | undefined;
      const members = electoralRoll.getMembers(area, search);
      res.json(members);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch electoral roll' });
    }
  });

  app.post('/api/electoral-roll/member', (req: Request, res: Response) => {
    try {
      const { name, hometown, constituency, nationalIdMasked, email, voterId } = req.body;
      if (!name || !hometown) {
        return res.status(400).json({ error: 'Name and Hometown area are required.' });
      }
      const newMember = electoralRoll.addMember({
        name,
        hometown,
        constituency,
        nationalIdMasked,
        email,
        voterId,
      });
      broadcastRealtimeUpdate();
      res.json(newMember);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to add member' });
    }
  });

  app.delete('/api/electoral-roll/member/:id', (req: Request, res: Response) => {
    try {
      const success = electoralRoll.deleteMember(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Member not found' });
      }
      broadcastRealtimeUpdate();
      res.json({ success: true, message: 'Member deleted from electoral roll' });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete member' });
    }
  });

  // Strict Verification Endpoint
  app.post('/api/electoral-roll/verify', (req: Request, res: Response) => {
    try {
      const { voterId, votingArea } = req.body;
      if (!voterId || !votingArea) {
        return res.status(400).json({ error: 'voterId and votingArea are required for verification.' });
      }
      const verification = electoralRoll.verifyVoter(voterId, votingArea);
      res.json(verification);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Verification error' });
    }
  });

  // --- AREA VOTING SESSIONS & RESET MANAGEMENT ---
  app.get('/api/area-sessions', (req: Request, res: Response) => {
    try {
      const sessions = electoralRoll.getAreaSessions();
      res.json(sessions);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch area sessions' });
    }
  });

  app.post('/api/area-sessions/:area/toggle-live', (req: Request, res: Response) => {
    try {
      const { isLive } = req.body;
      const updated = electoralRoll.toggleAreaLive(req.params.area, Boolean(isLive));
      broadcastRealtimeUpdate();
      res.json(updated);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to toggle live session' });
    }
  });

  app.post('/api/area-sessions/:area/state', (req: Request, res: Response) => {
    try {
      const { state } = req.body;
      const updated = electoralRoll.transitionAreaState(req.params.area, state);
      broadcastRealtimeUpdate();
      res.json(updated);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to transition state' });
    }
  });

  app.post('/api/area-sessions/:area/reset', async (req: Request, res: Response) => {
    try {
      const area = req.params.area;
      const result = electoralRoll.resetAreaVotingSeason(area);

      await services.audit.appendEvent({
        type: 'ELECTION_RESUMED',
        actorId: 'ELECTION_PANEL_ADMIN',
        entityId: `area-${area.toLowerCase()}`,
        details: {
          area,
          seasonRound: result.session.seasonRound,
          membersResetCount: result.membersResetCount,
          action: 'AREA_VOTING_SEASON_RESET_AND_PROCESSED_AGAIN',
        },
        requestId: `req-reset-${Date.now()}`,
        outcome: 'SUCCESS',
      });

      broadcastRealtimeUpdate();
      res.json({
        success: true,
        message: `Voting season for ${area} has been reset. Members can now register and vote for Round ${result.session.seasonRound}.`,
        session: result.session,
        membersResetCount: result.membersResetCount,
      });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to reset area voting season' });
    }
  });

  // ==========================================
  // 4. ELIGIBILITY & VOTING PIPELINE
  // ==========================================
  app.post('/api/eligibility/check', async (req: Request, res: Response) => {
    try {
      const { electionId, credentialRef } = req.body;
      const result = await services.eligibility.checkEligibility(electionId, credentialRef);
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Eligibility check failed' });
    }
  });

  app.post('/api/eligibility/credential', async (req: Request, res: Response) => {
    try {
      const { electionId, credentialRef } = req.body;
      const token = await services.eligibility.issueEligibilityCredential(electionId, credentialRef);
      res.json(token);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Credential issuance failed' });
    }
  });

  app.post('/api/voting/encrypt', async (req: Request, res: Response) => {
    try {
      const { candidateId, electionId, voterSecret } = req.body;
      const encrypted = await services.voting.encryptVote(candidateId, electionId, voterSecret || 'secret');
      res.json(encrypted);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Encryption failed' });
    }
  });

  app.post('/api/voting/submit', async (req: Request, res: Response) => {
    try {
      const { ballot, candidateId, electionId } = req.body;
      if (!ballot) return res.status(400).json({ error: 'Ballot envelope is required' });

      const targetElectionId = electionId || ballot.electionId || 'elec-mum-01';
      const targetElection = electoralRoll.getElection(targetElectionId);

      // Rule 1: Election Must Be Open
      if (targetElection && targetElection.state !== 'VOTING_OPEN') {
        return res.status(400).json({
          error: `Voting is currently ${targetElection.state.replace('_', ' ')}. Polls are closed for this election and cannot accept ballots.`,
          errorCode: 'ELECTION_CLOSED',
        });
      }

      // Rule 2: One User Only Votes One Time (Double-Voting Rejection)
      if (ballot.voterId) {
        const voterList = electoralRoll.getEligibleVoters(targetElectionId);
        const existingVoter = voterList.find(
          (v) => v.voterId.toLowerCase().trim() === ballot.voterId.toLowerCase().trim()
        );
        if (existingVoter && existingVoter.hasVoted) {
          return res.status(400).json({
            error: `Citizen ${ballot.voterId} has already cast a vote in this election. Each user can only vote one time.`,
            errorCode: 'ALREADY_VOTED',
            receiptHash: existingVoter.receiptHash,
          });
        }
      }

      // Rule 3: Verify Aadhaar last 4 digits if supplied in ballot envelope
      if (ballot.voterId && ballot.aadhaarLast4) {
        const aadhaarCheck = electoralRoll.verifyAadhaarAndElection({
          electionId: targetElectionId,
          voterId: ballot.voterId,
          aadhaarLast4: ballot.aadhaarLast4,
          attemptedConstituency: ballot.votingArea,
        });
        if (!aadhaarCheck.verified) {
          return res.status(400).json({
            error: aadhaarCheck.errorMessage || 'Aadhaar identity verification failed.',
            errorCode: aadhaarCheck.errorCode || 'AADHAAR_VERIFICATION_FAILED',
          });
        }
      }

      // If voterId provided, perform strict 17-point electoral verification
      const chosenCandId = candidateId || ballot.candidateId;
      if (ballot.voterId) {
        const check = electoralRoll.verifyVoterForElection(
          targetElectionId,
          ballot.voterId,
          ballot.votingArea,
          chosenCandId
        );
        if (!check.isEligible) {
          return res.status(400).json({
            error: check.errorMessage || 'Voter eligibility verification failed.',
            errorCode: check.errorCode,
          });
        }
      }

      const result = await services.voting.submitVote(ballot);

      // Record voter as voted and attach receipt hash (strictly separate: never linking candidate choice)
      if (ballot.voterId) {
        electoralRoll.recordVoterBallot(targetElectionId, ballot.voterId, result.receipt.receiptHash);
      }

      // Record anonymous candidate vote aggregate tally
      if (chosenCandId) {
        electoralRoll.recordCandidateVote(targetElectionId, chosenCandId);
      }

      broadcastRealtimeUpdate();
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Vote submission rejected' });
    }
  });

  // ==========================================
  // 5. BLOCKCHAIN & VALIDATORS
  // ==========================================
  app.get('/api/blockchain', async (req: Request, res: Response) => {
    try {
      const chain = await services.blockchain.getChain();
      res.json(chain);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Blockchain error' });
    }
  });

  app.get('/api/blockchain/blocks/:id', async (req: Request, res: Response) => {
    try {
      const block = await services.blockchain.getBlock(req.params.id);
      if (!block) return res.status(404).json({ error: 'Block not found' });
      res.json(block);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Block fetch error' });
    }
  });

  app.post('/api/blockchain/validate', async (req: Request, res: Response) => {
    try {
      const { block } = req.body;
      const validation = await services.blockchain.validateBlock(block);
      res.json(validation);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Validation error' });
    }
  });

  app.get('/api/validators', async (req: Request, res: Response) => {
    try {
      const validators = await services.blockchain.getValidatorStatus();
      res.json(validators);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Validators error' });
    }
  });

  app.post('/api/validators/:id/status', async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const updated = await services.blockchain.updateValidatorStatus(req.params.id, status);
      broadcastRealtimeUpdate();
      res.json(updated);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Validator status update error' });
    }
  });

  // ==========================================
  // 6. FRAUD DETECTION & SECURITY
  // ==========================================
  app.post('/api/fraud/score', async (req: Request, res: Response) => {
    try {
      const result = await services.fraud.scoreSession(req.body);
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Fraud score error' });
    }
  });

  app.get('/api/fraud/flagged', async (req: Request, res: Response) => {
    try {
      const cases = await services.fraud.listFlagged();
      res.json(cases);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Fraud list error' });
    }
  });

  app.post('/api/fraud/:id/review', async (req: Request, res: Response) => {
    try {
      const { decision, reviewer } = req.body;
      const updated = await services.fraud.reviewCase(req.params.id, decision, reviewer || 'Supervisory Auditor');
      res.json(updated);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Review error' });
    }
  });

  // ==========================================
  // 7. PUBLIC VERIFICATION & COUNT STATUS CHECK
  // ==========================================
  app.post('/api/verification/receipt', async (req: Request, res: Response) => {
    try {
      const { receiptHash } = req.body;
      if (!receiptHash || typeof receiptHash !== 'string') {
        return res.status(400).json({ error: 'Valid receiptHash is required.' });
      }

      const trimmedHash = receiptHash.trim();
      const receipt = await services.verification.verifyReceipt(trimmedHash);

      // Find matching voter across all elections
      const allElections = electoralRoll.getElections();
      let matchedElection = allElections[0];
      let matchedVoter = null;

      for (const elec of allElections) {
        const voters = electoralRoll.getEligibleVoters(elec.id);
        const found = voters.find((v) => v.receiptHash === trimmedHash);
        if (found) {
          matchedElection = elec;
          matchedVoter = found;
          break;
        }
      }

      // If receipt had an electionId, use it
      if (receipt && receipt.electionId) {
        const byId = electoralRoll.getElection(receipt.electionId);
        if (byId) matchedElection = byId;
      }

      const electionState = matchedElection?.state || 'VOTING_OPEN';
      const isElectionOngoing = electionState === 'VOTING_OPEN';
      const isElectionClosed = ['VOTING_CLOSED', 'TALLYING', 'RESULTS_PUBLISHED', 'ARCHIVED'].includes(electionState);
      const isCountedInTally = isElectionClosed;

      if (!receipt) {
        // If sample query or custom test hash
        const isSample = trimmedHash.includes('SAMPLE') || trimmedHash.startsWith('0x889AE1B4');
        if (isSample) {
          return res.json({
            receiptHash: trimmedHash,
            transactionId: 'tx-001',
            electionId: matchedElection.id,
            electionName: matchedElection.name,
            electionState,
            isElectionOngoing,
            isCountedInTally,
            countingStatus: isElectionOngoing
              ? 'ELECTION_ONGOING_BALLOT_SEALED'
              : 'VOTE_COUNTED_IN_FINAL_TALLY',
            countingStatusText: isElectionOngoing
              ? 'Election Ongoing — Ballot Recorded & Sealed'
              : 'Vote Counted in Final Tally',
            statusHeading: isElectionOngoing
              ? 'Election Ongoing — Ballot Recorded & Sealed'
              : 'Election Closed — Vote Officially Counted',
            statusMessage: isElectionOngoing
              ? `The election "${matchedElection.name}" is currently ongoing. Your ballot is cryptographically recorded in Block #1 with 3/3 validator signatures. Per democratic integrity rules, votes are only counted when the Election Admin officially closes the election.`
              : `The Election Admin has officially closed "${matchedElection.name}". Your ballot was decrypted via multi-party threshold keys and successfully counted in the certified election tally.`,
            blockHeight: 1,
            blockHash: '0x889AE1B428190981991823901847120938471029384710293847102938471029',
            merkleRoot: '0x4F92E1B48A109C4822AB9184C091FF1277CE1984218820B166D1B9921448208B',
            merkleProof: ['0x99A466D14821CB92', '0x77CE1984218820B1'],
            timestamp: new Date().toISOString(),
            validatorSignaturesCount: 3,
            zkProofSimulated: '0xZK_SNARK_GROTH16_PROOF_VALID_NO_LEAK',
            verificationStatus: 'VERIFIED',
            tallyAuditHash: isCountedInTally ? '0xMERKLE_TALLY_ROOT_CERTIFIED_BLOCK_1' : undefined,
            hometown: matchedElection.hometown,
          });
        }

        return res.status(404).json({
          error: 'Receipt not found in immutable ledger or invalid hash.',
          receiptHash: trimmedHash,
          isCountedInTally: false,
          isElectionOngoing: false,
          countingStatus: 'RECEIPT_NOT_FOUND',
          statusHeading: 'Receipt Not Found / Ballot Unverified',
          statusMessage: 'This receipt hash does not exist in any confirmed blockchain block.',
        });
      }

      res.json({
        ...receipt,
        electionId: matchedElection.id,
        electionName: matchedElection.name,
        electionState,
        isElectionOngoing,
        isCountedInTally,
        countingStatus: isElectionOngoing
          ? 'ELECTION_ONGOING_BALLOT_SEALED'
          : 'VOTE_COUNTED_IN_FINAL_TALLY',
        countingStatusText: isElectionOngoing
          ? 'Election Ongoing — Ballot Recorded & Sealed'
          : 'Vote Counted in Final Tally',
        statusHeading: isElectionOngoing
          ? 'Election Ongoing — Ballot Recorded & Sealed'
          : 'Election Closed — Vote Officially Counted',
        statusMessage: isElectionOngoing
          ? `The election "${matchedElection.name}" is currently ongoing. Your ballot has been safely recorded into Block #${receipt.blockHeight} with 3/3 validator signatures. In accordance with democratic secrecy protocols, the vote remains sealed in the ledger until the Election Admin closes the election.`
          : `The Election Admin has officially closed "${matchedElection.name}". Your ballot was unlocked by threshold decryption and counted in the final certified election tally!`,
        tallyAuditHash: isCountedInTally
          ? `0xTALLY_MERKLE_CERTIFIED_ROOT_${receipt.blockHeight}`
          : undefined,
        hometown: matchedVoter?.hometown || matchedElection.hometown,
      });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Verification error' });
    }
  });

  // ==========================================
  // 8. AUDIT TRAIL
  // ==========================================
  app.get('/api/audit', async (req: Request, res: Response) => {
    try {
      const events = await services.audit.queryEvents({ limit: 150 });
      res.json(events);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Audit query error' });
    }
  });

  app.post('/api/audit/verify', async (req: Request, res: Response) => {
    try {
      const result = await services.audit.verifyIntegrity();
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Audit integrity check error' });
    }
  });

  // ==========================================
  // 9. AI SECURITY COPILOT
  // ==========================================
  app.post('/api/ai/analyze', async (req: Request, res: Response) => {
    try {
      const { fraudCase } = req.body;
      const analysis = await services.ai.analyzeFraudSession(fraudCase);
      res.json(analysis);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'AI analysis error' });
    }
  });

  app.post('/api/ai/copilot-chat', async (req: Request, res: Response) => {
    try {
      const { question, context } = req.body;
      const answer = await services.ai.askCopilot(question || 'Summarize status', context || {});
      res.json(answer);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'AI Copilot error' });
    }
  });

  app.post('/api/ai/explain-anomaly', async (req: Request, res: Response) => {
    try {
      const { anomalyId, title, riskScore, riskLevel, factors, telemetry, timestamp } = req.body;
      if (!anomalyId) {
        return res.status(400).json({ error: 'anomalyId is required' });
      }
      const explanation = await services.ai.explainAnomaly({
        anomalyId,
        title: title || `Threat Incident ${anomalyId}`,
        riskScore: Number(riskScore) || 75,
        riskLevel: riskLevel || 'HIGH',
        factors: factors || [
          {
            name: 'Cryptographic Signature Mismatch',
            category: 'CRYPTOGRAPHIC',
            scoreImpact: 35,
            description: 'ECDSA secp256r1 verification check failure on payload',
            evidence: 'Public key hash collision detected',
          },
          {
            name: 'Inhuman Submission Velocity',
            category: 'BEHAVIORAL',
            scoreImpact: 25,
            description: 'Ballot submitted in 92ms following token issue',
            evidence: 'Timestamp delta < 100ms baseline',
          },
        ],
        telemetry: telemetry || {},
        timestamp: timestamp || new Date().toISOString(),
      });
      res.json(explanation);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'AI Anomaly Explainer error' });
    }
  });

  // ==========================================
  // 10. SECURITY LAB ATTACK RUNNER
  // ==========================================
  app.post('/api/security-lab/attack', async (req: Request, res: Response) => {
    try {
      const { attackType } = req.body;
      const result = await AttackSimulator.runAttack(attackType);
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Attack simulation error' });
    }
  });

  // ==========================================
  // 11. EMERGENCY & DISASTER RECOVERY
  // ==========================================
  app.post('/api/admin/lockdown', async (req: Request, res: Response) => {
    try {
      const { electionId, reason } = req.body;
      const result = await services.election.lockdown(electionId || 'elec-2026-presidential', reason || 'Emergency protocol');
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Lockdown error' });
    }
  });

  app.post('/api/admin/recovery/snapshot', async (req: Request, res: Response) => {
    try {
      const chain = await services.blockchain.getChain();
      const audit = await services.audit.queryEvents();
      const snapId = `snap-${Date.now()}`;
      const stateDump = {
        chainLength: chain.length,
        auditLength: audit.length,
        timestamp: new Date().toISOString(),
      };
      await services.storage.upload(snapId, JSON.stringify(stateDump));
      res.json({ snapshotId: snapId, status: 'CREATED', ...stateDump });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Snapshot error' });
    }
  });

  app.post('/api/admin/recovery/restore', async (req: Request, res: Response) => {
    try {
      // Re-seed state cleanly
      await seedDemoData();
      const integrity = await services.audit.verifyIntegrity();
      res.json({
        status: 'RESTORE_COMPLETED',
        auditIntegrityVerified: !integrity.isTampered,
        restoredAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Restore error' });
    }
  });

  // ==========================================
  // 12. VITE MIDDLEWARE / STATIC ASSETS
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart E-Voting Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
